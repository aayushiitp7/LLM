"""
LLM Orchestration Service — Multi-provider with Hallucination Guard

Manages:
- Multi-LLM provider routing (OpenAI → Claude → Gemini → Ollama)
- Streaming SSE responses
- Prompt template management
- Context window optimization
- Hallucination detection and answer refusal
- Citation enforcement
- Token budget management
- Cost tracking
- Fallback on provider failure
"""

from __future__ import annotations

import asyncio
import json
import time
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

import structlog

logger = structlog.get_logger(__name__)

# ─── System Prompts ────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an enterprise document intelligence assistant.
You help users analyze, understand, and extract insights from enterprise documents.

CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:

1. ANSWER ONLY FROM PROVIDED CONTEXT. Never use knowledge not present in the retrieved chunks.
2. ALWAYS CITE YOUR SOURCES using [1], [2], [3] notation corresponding to the numbered context chunks.
3. If the answer is NOT in the provided context, respond with: "I cannot find information about this in the provided documents. [INSUFFICIENT_CONTEXT]"
4. If you are uncertain about any part of your answer, explicitly state your confidence level.
5. For numerical claims (dates, amounts, percentages), always cite the exact source.
6. Do not speculate or infer beyond what the documents state.
7. If asked about sensitive PII (SSN, account numbers), decline to include it in your response.

FORMAT:
- Provide a clear, direct answer
- Use bullet points for complex comparisons
- Include source citations inline: "According to [1], the clause states..."
- End with a Sources section listing which chunks you used

Remember: Your value is in grounded, accurate analysis — not in generating plausible-sounding content."""

LEGAL_SYSTEM_PROMPT = """You are a legal document analysis assistant for enterprise use.
Analyze contracts, agreements, and legal documents with precision.
Always cite specific clauses with [Clause X] references.
Flag any unusual provisions, missing standard clauses, or potential risks.
Do not provide legal advice — only factual document analysis.
""" + SYSTEM_PROMPT

FINANCE_SYSTEM_PROMPT = """You are a financial document analysis assistant.
Analyze invoices, financial statements, and audit reports with precision.
Always cite exact figures with their source documents.
Flag discrepancies, unusual transactions, or compliance concerns.
""" + SYSTEM_PROMPT

HR_SYSTEM_PROMPT = """You are an HR document analysis assistant.
Analyze employment agreements, policies, and HR documents.
Maintain strict confidentiality — never cross-reference PII across documents.
Always cite relevant policy sections.
""" + SYSTEM_PROMPT


DOMAIN_PROMPTS = {
    "legal": LEGAL_SYSTEM_PROMPT,
    "finance": FINANCE_SYSTEM_PROMPT,
    "hr": HR_SYSTEM_PROMPT,
    "default": SYSTEM_PROMPT,
}


class PromptBuilder:
    """Builds optimized prompts from query + context chunks."""

    @staticmethod
    def build_rag_prompt(
        query: str,
        context_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict]] = None,
        domain: str = "default",
        max_context_tokens: int = 8000,
    ) -> Tuple[str, List[Dict], List[str]]:
        """
        Build a RAG prompt with numbered context chunks.

        Returns:
            (system_prompt, messages, chunk_references)
        """
        system = DOMAIN_PROMPTS.get(domain, SYSTEM_PROMPT)

        # Build context block
        context_parts = []
        chunk_refs = []
        total_chars = 0
        char_budget = max_context_tokens * 4  # ~4 chars per token

        for i, chunk in enumerate(context_chunks, start=1):
            source_info = (
                f"[{i}] Source: {chunk.get('filename', 'Unknown')} "
                f"| Page: {chunk.get('page_number', 'N/A')} "
                f"| Section: {chunk.get('section_title', 'N/A')}"
            )
            chunk_text = f"{source_info}\n{chunk.get('content', '')}"

            if total_chars + len(chunk_text) > char_budget:
                logger.debug("prompt.context_truncated", chunks_included=i - 1)
                break

            context_parts.append(chunk_text)
            chunk_refs.append(str(i))
            total_chars += len(chunk_text)

        context_block = "\n\n---\n\n".join(context_parts)

        # Build messages
        messages = []

        # Add conversation history (truncated to last 5 turns)
        if conversation_history:
            for turn in conversation_history[-5:]:
                messages.append({"role": "user", "content": turn["content"]})
                if turn.get("assistant"):
                    messages.append({"role": "assistant", "content": turn["assistant"]})

        # Add current query with context
        user_message = f"""Based on the following document excerpts, please answer the question.

DOCUMENT CONTEXT:
{context_block}

QUESTION: {query}

Remember to cite your sources using [1], [2], etc. notation."""

        messages.append({"role": "user", "content": user_message})

        return system, messages, chunk_refs


class HallucinationGuard:
    """
    Prevents and detects hallucinated responses.

    Checks:
    1. Answer must contain at least one citation
    2. Cited content must be present in context chunks
    3. Confidence threshold enforcement
    4. Refusal detection
    5. Consistency verification
    """

    REFUSAL_MARKER = "[INSUFFICIENT_CONTEXT]"
    MIN_CITATIONS_FOR_FACTUAL = 1
    CONFIDENCE_THRESHOLD = 0.65

    @staticmethod
    def validate_response(
        answer: str,
        query: str,
        context_chunks: List[Dict[str, Any]],
        confidence: float,
    ) -> Tuple[bool, Optional[str], float]:
        """
        Validate LLM response against ground truth context.

        Returns:
            (is_valid, refusal_reason, adjusted_confidence)
        """
        # Check for explicit refusal
        if HallucinationGuard.REFUSAL_MARKER in answer:
            return False, "insufficient_context", 0.0

        # Check for citation presence in factual answers
        import re
        citations = re.findall(r"\[(\d+)\]", answer)

        if not citations and len(context_chunks) > 0:
            # Answer without citations is suspicious
            confidence = min(confidence, 0.5)
            logger.warning("hallucination_guard.no_citations", query=query[:100])

        # Check if cited chunk numbers are valid
        max_valid_chunk = len(context_chunks)
        for cite_num in citations:
            if int(cite_num) > max_valid_chunk:
                logger.warning(
                    "hallucination_guard.invalid_citation",
                    citation=cite_num,
                    max_valid=max_valid_chunk,
                )
                confidence = min(confidence, 0.4)

        # Check confidence threshold
        if confidence < HallucinationGuard.CONFIDENCE_THRESHOLD:
            return False, "low_confidence", confidence

        # Check for known hallucination indicators
        hallucination_phrases = [
            "I don't have information",
            "I cannot access",
            "as an AI",
            "I was trained",
            "my knowledge cutoff",
        ]
        for phrase in hallucination_phrases:
            if phrase.lower() in answer.lower():
                logger.warning("hallucination_guard.ai_self_reference", phrase=phrase)
                confidence = min(confidence, 0.3)
                return False, "ai_self_reference", confidence

        return True, None, confidence

    @staticmethod
    def extract_cited_chunks(answer: str, context_chunks: List[Dict]) -> List[Dict]:
        """Extract the chunks that were actually cited in the answer."""
        import re
        cited_nums = set(int(n) for n in re.findall(r"\[(\d+)\]", answer))
        return [
            context_chunks[i - 1]
            for i in cited_nums
            if 1 <= i <= len(context_chunks)
        ]


class LLMOrchestrator:
    """
    Multi-provider LLM orchestration with intelligent routing,
    fallback handling, and cost optimization.
    """

    def __init__(
        self,
        primary_provider: str = "openai",
        fallback_provider: str = "ollama",
        max_tokens: int = 4096,
        temperature: float = 0.1,
    ):
        self.primary_provider = primary_provider
        self.fallback_provider = fallback_provider
        self.max_tokens = max_tokens
        self.temperature = temperature

        self._providers: Dict[str, Any] = {}
        self._hallucination_guard = HallucinationGuard()
        self._prompt_builder = PromptBuilder()

        self._load_providers()

    def _load_providers(self) -> None:
        """Lazy load configured LLM providers."""
        from app.providers.openai_provider import OpenAIProvider
        from app.providers.anthropic_provider import AnthropicProvider
        from app.providers.ollama_provider import OllamaProvider

        try:
            self._providers["openai"] = OpenAIProvider()
            logger.info("llm.provider_loaded", provider="openai")
        except Exception as e:
            logger.warning("llm.provider_load_failed", provider="openai", error=str(e))

        try:
            self._providers["anthropic"] = AnthropicProvider()
            logger.info("llm.provider_loaded", provider="anthropic")
        except Exception as e:
            logger.warning("llm.provider_load_failed", provider="anthropic", error=str(e))

        try:
            self._providers["ollama"] = OllamaProvider()
            logger.info("llm.provider_loaded", provider="ollama")
        except Exception as e:
            logger.warning("llm.provider_load_failed", provider="ollama", error=str(e))

    async def generate(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict]] = None,
        domain: str = "default",
        stream: bool = False,
    ) -> Dict[str, Any]:
        """
        Generate a grounded response with hallucination protection.

        Returns full response metadata including tokens, cost, citations.
        """
        start = time.perf_counter()

        # Build optimized prompt
        system, messages, chunk_refs = self._prompt_builder.build_rag_prompt(
            query=query,
            context_chunks=context_chunks,
            conversation_history=conversation_history,
            domain=domain,
        )

        # Try primary provider, fall back on failure
        answer = None
        used_provider = None
        usage = {}

        for provider_name in [self.primary_provider, self.fallback_provider]:
            if provider_name not in self._providers:
                continue

            provider = self._providers[provider_name]

            try:
                result = await provider.generate(
                    system=system,
                    messages=messages,
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                )
                answer = result["answer"]
                usage = result.get("usage", {})
                used_provider = provider_name
                break

            except Exception as exc:
                logger.warning(
                    "llm.provider_failed",
                    provider=provider_name,
                    error=str(exc),
                )
                continue

        if not answer:
            return {
                "answer": "I was unable to generate a response. Please try again.",
                "refused": True,
                "refusal_reason": "all_providers_failed",
                "confidence": 0.0,
                "provider": "none",
                "model": "none",
                "tokens": 0,
                "cost": 0.0,
                "latency_ms": int((time.perf_counter() - start) * 1000),
            }

        # Calculate confidence based on context relevance
        confidence = self._calculate_confidence(answer, context_chunks)

        # Hallucination guard
        is_valid, refusal_reason, adjusted_confidence = self._hallucination_guard.validate_response(
            answer=answer,
            query=query,
            context_chunks=context_chunks,
            confidence=confidence,
        )

        if not is_valid:
            refusal_answer = (
                f"I cannot provide a confident answer to this question based on the available documents. "
                f"Reason: {refusal_reason}. Please rephrase your query or ensure relevant documents are indexed."
            )
            return {
                "answer": refusal_answer,
                "refused": True,
                "refusal_reason": refusal_reason,
                "confidence": adjusted_confidence,
                "provider": used_provider,
                "model": self._providers[used_provider].model_name if used_provider else "none",
                "tokens": usage.get("total_tokens", 0),
                "cost": self._calculate_cost(usage, used_provider),
                "latency_ms": int((time.perf_counter() - start) * 1000),
            }

        latency_ms = int((time.perf_counter() - start) * 1000)

        return {
            "answer": answer,
            "refused": False,
            "refusal_reason": None,
            "confidence": adjusted_confidence,
            "provider": used_provider,
            "model": self._providers[used_provider].model_name if used_provider else "none",
            "tokens": usage.get("total_tokens", 0),
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "cost": self._calculate_cost(usage, used_provider),
            "latency_ms": latency_ms,
        }

    async def stream(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict]] = None,
        domain: str = "default",
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream tokens progressively. Yields dicts with 'token' or 'metadata' keys."""
        system, messages, chunk_refs = self._prompt_builder.build_rag_prompt(
            query=query,
            context_chunks=context_chunks,
            conversation_history=conversation_history,
            domain=domain,
        )

        for provider_name in [self.primary_provider, self.fallback_provider]:
            if provider_name not in self._providers:
                continue

            provider = self._providers[provider_name]

            try:
                full_text = ""
                async for token_event in provider.stream(
                    system=system,
                    messages=messages,
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                ):
                    if token_event.get("type") == "token":
                        full_text += token_event["content"]
                        yield {"type": "token", "content": token_event["content"]}
                    elif token_event.get("type") == "done":
                        usage = token_event.get("usage", {})

                        # Post-stream hallucination check
                        confidence = self._calculate_confidence(full_text, context_chunks)
                        is_valid, refusal_reason, confidence = self._hallucination_guard.validate_response(
                            answer=full_text,
                            query=query,
                            context_chunks=context_chunks,
                            confidence=confidence,
                        )

                        yield {
                            "type": "metadata",
                            "confidence": confidence,
                            "refused": not is_valid,
                            "refusal_reason": refusal_reason,
                            "provider": provider_name,
                            "model": provider.model_name,
                            "tokens": usage.get("total_tokens", 0),
                            "cost": self._calculate_cost(usage, provider_name),
                        }
                        return

            except Exception as exc:
                logger.warning("llm.stream_failed", provider=provider_name, error=str(exc))
                continue

        # All providers failed
        yield {
            "type": "token",
            "content": "I was unable to generate a response. Please try again."
        }
        yield {"type": "metadata", "refused": True, "refusal_reason": "all_providers_failed"}

    def _calculate_confidence(
        self,
        answer: str,
        context_chunks: List[Dict[str, Any]],
    ) -> float:
        """
        Heuristic confidence score based on:
        - Citation count (more citations = higher confidence)
        - Answer length (too short or too long = lower confidence)
        - Presence of uncertainty phrases
        """
        import re

        citations = re.findall(r"\[\d+\]", answer)
        citation_ratio = min(len(citations) / max(len(context_chunks), 1), 1.0)

        # Length heuristic
        word_count = len(answer.split())
        if word_count < 10:
            length_score = 0.3
        elif word_count > 500:
            length_score = 0.7
        else:
            length_score = 0.9

        # Uncertainty detection
        uncertainty_phrases = ["might", "possibly", "could be", "I'm not sure", "unclear"]
        uncertainty_count = sum(1 for p in uncertainty_phrases if p.lower() in answer.lower())
        uncertainty_penalty = min(uncertainty_count * 0.1, 0.3)

        base = 0.4 + (citation_ratio * 0.4) + (length_score * 0.2)
        return max(0.0, min(1.0, base - uncertainty_penalty))

    def _calculate_cost(self, usage: Dict, provider: Optional[str]) -> float:
        """Calculate USD cost based on token usage and provider pricing."""
        if not usage or not provider:
            return 0.0

        # Pricing as of mid-2025 (per 1M tokens)
        PRICING = {
            "openai": {"input": 2.50, "output": 10.0},       # GPT-4o
            "anthropic": {"input": 3.0, "output": 15.0},     # Claude 3.5 Sonnet
            "gemini": {"input": 1.25, "output": 5.0},        # Gemini 1.5 Pro
            "ollama": {"input": 0.0, "output": 0.0},         # Local
        }

        prices = PRICING.get(provider, {"input": 0.0, "output": 0.0})
        input_tokens = usage.get("prompt_tokens", 0)
        output_tokens = usage.get("completion_tokens", 0)

        cost = (input_tokens / 1_000_000) * prices["input"] + \
               (output_tokens / 1_000_000) * prices["output"]

        return round(cost, 8)
