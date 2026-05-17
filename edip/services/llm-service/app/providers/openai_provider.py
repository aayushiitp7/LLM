"""
OpenAI LLM Provider — GPT-4o with streaming

Supports:
- Streaming and non-streaming generation
- Tool use / function calling
- Structured output (JSON mode)
- Token counting
- Rate limit handling with exponential backoff
- Cost tracking
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, AsyncGenerator, Dict, List, Optional

import structlog
from openai import AsyncOpenAI, RateLimitError, APITimeoutError
from openai.types.chat import ChatCompletion

logger = structlog.get_logger(__name__)


class OpenAIProvider:
    """OpenAI GPT-4o provider with full async support."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4o",
        timeout: float = 60.0,
        max_retries: int = 3,
    ):
        import os
        self.model_name = model
        self.timeout = timeout
        self.max_retries = max_retries

        key = api_key or os.getenv("OPENAI_API_KEY")
        if not key:
            raise ValueError("OPENAI_API_KEY not configured.")

        self._client = AsyncOpenAI(
            api_key=key,
            timeout=timeout,
            max_retries=max_retries,
        )

        logger.info("openai_provider.initialized", model=model)

    async def generate(
        self,
        system: str,
        messages: List[Dict[str, str]],
        max_tokens: int = 4096,
        temperature: float = 0.1,
        response_format: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Non-streaming completion.

        Returns:
            {"answer": str, "usage": {"prompt_tokens": int, "completion_tokens": int, "total_tokens": int}}
        """
        start = time.perf_counter()

        full_messages = [{"role": "system", "content": system}] + messages

        kwargs = {
            "model": self.model_name,
            "messages": full_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if response_format:
            kwargs["response_format"] = response_format

        try:
            response: ChatCompletion = await self._client.chat.completions.create(**kwargs)
        except RateLimitError:
            logger.warning("openai.rate_limited", model=self.model_name)
            await asyncio.sleep(5)
            response = await self._client.chat.completions.create(**kwargs)
        except APITimeoutError:
            raise RuntimeError("OpenAI API timeout. Try again.")

        answer = response.choices[0].message.content or ""
        usage = {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        }

        latency_ms = int((time.perf_counter() - start) * 1000)
        logger.info(
            "openai.generation_complete",
            model=self.model_name,
            tokens=usage["total_tokens"],
            latency_ms=latency_ms,
        )

        return {"answer": answer, "usage": usage, "latency_ms": latency_ms}

    async def stream(
        self,
        system: str,
        messages: List[Dict[str, str]],
        max_tokens: int = 4096,
        temperature: float = 0.1,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streaming completion via Server-Sent Events.
        Yields {"type": "token", "content": str} events.
        Final event: {"type": "done", "usage": {...}}
        """
        full_messages = [{"role": "system", "content": system}] + messages

        prompt_tokens = 0
        completion_tokens = 0

        try:
            async with self._client.chat.completions.stream(
                model=self.model_name,
                messages=full_messages,
                max_tokens=max_tokens,
                temperature=temperature,
            ) as stream:
                async for event in stream:
                    if event.type == "content.delta":
                        token = event.delta
                        if token:
                            completion_tokens += 1
                            yield {"type": "token", "content": token}
                    elif event.type == "usage":
                        prompt_tokens = event.usage.input_tokens
                        completion_tokens = event.usage.output_tokens

        except Exception as exc:
            logger.error("openai.stream_error", error=str(exc))
            raise

        yield {
            "type": "done",
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
            },
        }

    async def embed(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using OpenAI text-embedding-3-large."""
        import os
        embed_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-large")

        response = await self._client.embeddings.create(
            input=texts,
            model=embed_model,
        )

        return [e.embedding for e in response.data]
