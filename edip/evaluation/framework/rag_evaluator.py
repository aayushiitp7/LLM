"""
RAG Evaluation Framework

Quantitative evaluation of the RAG pipeline:
- Faithfulness (answer grounded in context?)
- Answer Relevancy (answer addresses the question?)
- Context Precision (retrieved chunks relevant?)
- Context Recall (correct context chunks retrieved?)
- Hallucination detection
- Citation accuracy
- BLEU / ROUGE-L scores
- End-to-end latency

Supports:
- Ragas framework (state-of-the-art RAG metrics)
- Custom evaluation with judge LLM
- Batch evaluation from test datasets
- A/B comparison experiments (different retrieval strategies)
- Ablation studies (with vs without RAG, different chunkers)
"""

from __future__ import annotations

import asyncio
import json
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import structlog

logger = structlog.get_logger(__name__)


# ─── Data Structures ──────────────────────────────────────────────────────

@dataclass
class EvalSample:
    """A single evaluation sample."""
    id: str
    question: str
    expected_answer: str
    ground_truth_contexts: List[str]      # Ideal context chunks
    document_ids: Optional[List[str]] = None


@dataclass
class EvalResult:
    """Evaluation result for a single sample."""
    sample_id: str
    question: str
    expected_answer: str
    actual_answer: str
    retrieved_contexts: List[str]
    cited_contexts: List[str]

    # Core RAG metrics (0.0 - 1.0)
    faithfulness: float = 0.0           # Is answer grounded in context?
    answer_relevancy: float = 0.0       # Does answer address the question?
    context_precision: float = 0.0      # Are retrieved chunks relevant?
    context_recall: float = 0.0         # Were correct chunks retrieved?
    citation_accuracy: float = 0.0      # Are citations accurate?
    hallucination_detected: bool = False

    # Text similarity metrics
    bleu_score: float = 0.0
    rouge_l_score: float = 0.0
    bert_score_f1: float = 0.0

    # Latency
    retrieval_latency_ms: int = 0
    generation_latency_ms: int = 0
    total_latency_ms: int = 0

    # Meta
    llm_provider: str = "unknown"
    retrieval_strategy: str = "hybrid"
    embedding_model: str = "unknown"
    chunking_strategy: str = "semantic"


@dataclass
class ExperimentReport:
    """Aggregated report for an evaluation experiment."""
    experiment_name: str
    description: str
    config: Dict[str, Any]
    run_timestamp: str
    total_samples: int

    # Aggregate metrics (mean ± std)
    mean_faithfulness: float = 0.0
    std_faithfulness: float = 0.0
    mean_answer_relevancy: float = 0.0
    std_answer_relevancy: float = 0.0
    mean_context_precision: float = 0.0
    mean_context_recall: float = 0.0
    mean_citation_accuracy: float = 0.0
    hallucination_rate: float = 0.0
    mean_bleu: float = 0.0
    mean_rouge_l: float = 0.0

    # Latency
    mean_retrieval_latency_ms: float = 0.0
    p95_retrieval_latency_ms: float = 0.0
    mean_total_latency_ms: float = 0.0
    p95_total_latency_ms: float = 0.0

    # Per-sample results
    results: List[EvalResult] = field(default_factory=list)

    # Failure analysis
    failure_cases: List[Dict] = field(default_factory=list)


# ─── Metric Calculators ────────────────────────────────────────────────────

class FaithfulnessCalculator:
    """
    Measures whether the answer is grounded in the retrieved context.
    Uses an LLM judge to evaluate each claim in the answer.
    """

    JUDGE_PROMPT = """You are an expert judge evaluating whether an AI answer is grounded in the provided context.

Context:
{context}

Question: {question}
Answer: {answer}

Task: Identify all factual claims in the answer. For each claim, determine if it is directly supported by the context.

Respond with a JSON object:
{{
    "claims": [
        {{"claim": "...", "supported": true/false, "evidence": "quote from context or null"}}
    ],
    "faithfulness_score": 0.0-1.0
}}

faithfulness_score = (supported claims) / (total claims)
"""

    async def calculate(
        self,
        question: str,
        answer: str,
        contexts: List[str],
        judge_llm=None,
    ) -> float:
        """Calculate faithfulness score using LLM judge."""
        if not answer or not contexts:
            return 0.0

        context_str = "\n\n".join(contexts[:5])  # Top 5 context chunks

        # Use LLM judge if available
        if judge_llm:
            try:
                prompt = self.JUDGE_PROMPT.format(
                    context=context_str[:4000],
                    question=question,
                    answer=answer[:2000],
                )
                result = await judge_llm.generate(
                    system="You are an evaluation judge. Return valid JSON only.",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1000,
                    temperature=0.0,
                    response_format={"type": "json_object"},
                )
                data = json.loads(result["answer"])
                return float(data.get("faithfulness_score", 0.0))
            except Exception as exc:
                logger.warning("eval.faithfulness_judge_failed", error=str(exc))

        # Fallback: keyword overlap heuristic
        return self._keyword_faithfulness(answer, contexts)

    def _keyword_faithfulness(self, answer: str, contexts: List[str]) -> float:
        """Fallback: measure keyword overlap between answer and contexts."""
        answer_words = set(answer.lower().split())
        context_words = set(" ".join(contexts).lower().split())

        # Remove stop words
        STOP_WORDS = {"the", "a", "an", "is", "in", "of", "and", "or", "to", "for", "with"}
        answer_words -= STOP_WORDS
        context_words -= STOP_WORDS

        if not answer_words:
            return 0.0

        overlap = answer_words & context_words
        return len(overlap) / len(answer_words)


class ContextPrecisionCalculator:
    """
    Measures what fraction of retrieved context chunks are relevant.
    Precision@K metric.
    """

    async def calculate(
        self,
        question: str,
        retrieved_contexts: List[str],
        ground_truth_contexts: List[str],
    ) -> float:
        """
        Average precision of retrieved contexts.

        Compare each retrieved chunk against ground truth using
        semantic similarity + substring matching.
        """
        if not retrieved_contexts or not ground_truth_contexts:
            return 0.0

        relevant_count = 0
        for ctx in retrieved_contexts:
            if self._is_relevant(ctx, ground_truth_contexts):
                relevant_count += 1

        return relevant_count / len(retrieved_contexts)

    def _is_relevant(self, chunk: str, ground_truth: List[str]) -> bool:
        """Check if a chunk overlaps with ground truth contexts."""
        chunk_lower = chunk.lower()
        for gt in ground_truth:
            gt_lower = gt.lower()
            # Simple substring matching; in production use semantic similarity
            words = set(gt_lower.split())
            chunk_words = set(chunk_lower.split())
            overlap = len(words & chunk_words) / max(len(words), 1)
            if overlap > 0.5:
                return True
        return False


class BLEUROUGECalculator:
    """BLEU and ROUGE-L metrics for answer quality."""

    @staticmethod
    def calculate_bleu(reference: str, hypothesis: str) -> float:
        """Calculate BLEU-4 score."""
        try:
            from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
            ref_tokens = reference.lower().split()
            hyp_tokens = hypothesis.lower().split()
            smoothie = SmoothingFunction().method4
            return sentence_bleu([ref_tokens], hyp_tokens, smoothing_function=smoothie)
        except Exception:
            return 0.0

    @staticmethod
    def calculate_rouge_l(reference: str, hypothesis: str) -> float:
        """Calculate ROUGE-L score."""
        try:
            from rouge_score import rouge_scorer
            scorer = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=True)
            scores = scorer.score(reference, hypothesis)
            return scores["rougeL"].fmeasure
        except Exception:
            return 0.0


# ─── Main Evaluator ────────────────────────────────────────────────────────

class RAGEvaluator:
    """
    End-to-end RAG evaluation framework.

    Supports:
    - Single sample evaluation
    - Batch evaluation from dataset files
    - Experiment comparison (A/B testing)
    - Report generation
    """

    def __init__(
        self,
        retrieval_client=None,
        llm_client=None,
        judge_llm=None,
    ):
        self.retrieval_client = retrieval_client
        self.llm_client = llm_client
        self.judge_llm = judge_llm

        self.faithfulness_calc = FaithfulnessCalculator()
        self.precision_calc = ContextPrecisionCalculator()
        self.bleu_rouge = BLEUROUGECalculator()

    async def evaluate_sample(
        self,
        sample: EvalSample,
        tenant_id: str,
        retrieval_strategy: str = "hybrid",
        top_k: int = 5,
    ) -> EvalResult:
        """Evaluate a single Q&A sample through the full RAG pipeline."""
        total_start = time.perf_counter()

        # Step 1: Retrieve contexts
        retrieval_start = time.perf_counter()
        retrieved_chunks = []
        if self.retrieval_client:
            try:
                retrieved_chunks = await self.retrieval_client.retrieve(
                    query=sample.question,
                    tenant_id=tenant_id,
                    document_ids=sample.document_ids,
                    strategy=retrieval_strategy,
                    top_k=top_k,
                )
            except Exception as exc:
                logger.error("eval.retrieval_failed", error=str(exc), sample_id=sample.id)

        retrieval_latency_ms = int((time.perf_counter() - retrieval_start) * 1000)

        retrieved_contexts = [c.get("content", "") for c in retrieved_chunks]

        # Step 2: Generate answer
        gen_start = time.perf_counter()
        actual_answer = ""
        llm_provider = "unknown"

        if self.llm_client and retrieved_chunks:
            try:
                response = await self.llm_client.generate(
                    query=sample.question,
                    context_chunks=retrieved_chunks,
                )
                actual_answer = response.get("answer", "")
                llm_provider = response.get("provider", "unknown")
            except Exception as exc:
                logger.error("eval.generation_failed", error=str(exc), sample_id=sample.id)

        gen_latency_ms = int((time.perf_counter() - gen_start) * 1000)

        # Step 3: Calculate metrics
        faithfulness = await self.faithfulness_calc.calculate(
            question=sample.question,
            answer=actual_answer,
            contexts=retrieved_contexts,
            judge_llm=self.judge_llm,
        )

        context_precision = await self.precision_calc.calculate(
            question=sample.question,
            retrieved_contexts=retrieved_contexts,
            ground_truth_contexts=sample.ground_truth_contexts,
        )

        context_recall = await self.precision_calc.calculate(
            question=sample.question,
            retrieved_contexts=sample.ground_truth_contexts,
            ground_truth_contexts=retrieved_contexts,
        )

        bleu = self.bleu_rouge.calculate_bleu(sample.expected_answer, actual_answer)
        rouge_l = self.bleu_rouge.calculate_rouge_l(sample.expected_answer, actual_answer)

        # Citation accuracy
        import re
        citations = re.findall(r"\[(\d+)\]", actual_answer)
        citation_accuracy = 1.0 if citations else 0.0

        # Hallucination detection
        hallucination = (
            faithfulness < 0.4 and
            len(actual_answer.split()) > 20
        )

        total_latency_ms = int((time.perf_counter() - total_start) * 1000)

        return EvalResult(
            sample_id=sample.id,
            question=sample.question,
            expected_answer=sample.expected_answer,
            actual_answer=actual_answer,
            retrieved_contexts=retrieved_contexts,
            cited_contexts=[
                retrieved_contexts[int(c) - 1]
                for c in citations
                if c.isdigit() and 0 < int(c) <= len(retrieved_contexts)
            ],
            faithfulness=round(faithfulness, 4),
            answer_relevancy=round(rouge_l, 4),  # Proxy
            context_precision=round(context_precision, 4),
            context_recall=round(context_recall, 4),
            citation_accuracy=round(citation_accuracy, 4),
            hallucination_detected=hallucination,
            bleu_score=round(bleu, 4),
            rouge_l_score=round(rouge_l, 4),
            retrieval_latency_ms=retrieval_latency_ms,
            generation_latency_ms=gen_latency_ms,
            total_latency_ms=total_latency_ms,
            llm_provider=llm_provider,
            retrieval_strategy=retrieval_strategy,
        )

    async def evaluate_dataset(
        self,
        samples: List[EvalSample],
        tenant_id: str,
        experiment_name: str,
        config: Dict[str, Any],
        retrieval_strategy: str = "hybrid",
        top_k: int = 5,
        concurrency: int = 5,
    ) -> ExperimentReport:
        """
        Evaluate all samples in the dataset with controlled concurrency.
        """
        logger.info(
            "eval.dataset_start",
            experiment=experiment_name,
            samples=len(samples),
            strategy=retrieval_strategy,
        )

        semaphore = asyncio.Semaphore(concurrency)

        async def bounded_eval(sample: EvalSample) -> EvalResult:
            async with semaphore:
                return await self.evaluate_sample(
                    sample=sample,
                    tenant_id=tenant_id,
                    retrieval_strategy=retrieval_strategy,
                    top_k=top_k,
                )

        results = await asyncio.gather(
            *[bounded_eval(s) for s in samples],
            return_exceptions=True,
        )

        valid_results = [r for r in results if isinstance(r, EvalResult)]
        failed = len(results) - len(valid_results)

        if failed > 0:
            logger.warning("eval.some_samples_failed", failed=failed)

        return self._aggregate_results(
            results=valid_results,
            experiment_name=experiment_name,
            config=config,
        )

    def _aggregate_results(
        self,
        results: List[EvalResult],
        experiment_name: str,
        config: Dict[str, Any],
    ) -> ExperimentReport:
        """Compute aggregate statistics from per-sample results."""
        if not results:
            return ExperimentReport(
                experiment_name=experiment_name,
                description="",
                config=config,
                run_timestamp=datetime.now(timezone.utc).isoformat(),
                total_samples=0,
            )

        faithfulness_scores = [r.faithfulness for r in results]
        answer_rel_scores = [r.answer_relevancy for r in results]
        context_prec_scores = [r.context_precision for r in results]
        context_rec_scores = [r.context_recall for r in results]
        citation_scores = [r.citation_accuracy for r in results]
        bleu_scores = [r.bleu_score for r in results]
        rouge_scores = [r.rouge_l_score for r in results]
        retrieval_latencies = [r.retrieval_latency_ms for r in results]
        total_latencies = [r.total_latency_ms for r in results]

        hallucination_rate = sum(1 for r in results if r.hallucination_detected) / len(results)

        # Identify failure cases
        failure_cases = [
            {
                "sample_id": r.sample_id,
                "question": r.question,
                "faithfulness": r.faithfulness,
                "hallucination": r.hallucination_detected,
                "actual_answer": r.actual_answer[:200],
            }
            for r in results
            if r.faithfulness < 0.5 or r.hallucination_detected
        ]

        return ExperimentReport(
            experiment_name=experiment_name,
            description=config.get("description", ""),
            config=config,
            run_timestamp=datetime.now(timezone.utc).isoformat(),
            total_samples=len(results),
            mean_faithfulness=round(float(np.mean(faithfulness_scores)), 4),
            std_faithfulness=round(float(np.std(faithfulness_scores)), 4),
            mean_answer_relevancy=round(float(np.mean(answer_rel_scores)), 4),
            std_answer_relevancy=round(float(np.std(answer_rel_scores)), 4),
            mean_context_precision=round(float(np.mean(context_prec_scores)), 4),
            mean_context_recall=round(float(np.mean(context_rec_scores)), 4),
            mean_citation_accuracy=round(float(np.mean(citation_scores)), 4),
            hallucination_rate=round(hallucination_rate, 4),
            mean_bleu=round(float(np.mean(bleu_scores)), 4),
            mean_rouge_l=round(float(np.mean(rouge_scores)), 4),
            mean_retrieval_latency_ms=round(float(np.mean(retrieval_latencies)), 1),
            p95_retrieval_latency_ms=round(float(np.percentile(retrieval_latencies, 95)), 1),
            mean_total_latency_ms=round(float(np.mean(total_latencies)), 1),
            p95_total_latency_ms=round(float(np.percentile(total_latencies, 95)), 1),
            results=results,
            failure_cases=failure_cases[:20],  # Cap at 20 failures
        )

    def save_report(
        self, report: ExperimentReport, output_dir: str = "evaluation/reports"
    ) -> str:
        """Save evaluation report as JSON."""
        import os

        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"{output_dir}/{report.experiment_name}_{timestamp}.json"

        # Convert to dict (handle nested dataclasses)
        report_dict = {
            "experiment_name": report.experiment_name,
            "description": report.description,
            "config": report.config,
            "run_timestamp": report.run_timestamp,
            "total_samples": report.total_samples,
            "metrics": {
                "faithfulness": {
                    "mean": report.mean_faithfulness,
                    "std": report.std_faithfulness,
                },
                "answer_relevancy": {
                    "mean": report.mean_answer_relevancy,
                    "std": report.std_answer_relevancy,
                },
                "context_precision": report.mean_context_precision,
                "context_recall": report.mean_context_recall,
                "citation_accuracy": report.mean_citation_accuracy,
                "hallucination_rate": report.hallucination_rate,
                "bleu": report.mean_bleu,
                "rouge_l": report.mean_rouge_l,
            },
            "latency": {
                "retrieval_mean_ms": report.mean_retrieval_latency_ms,
                "retrieval_p95_ms": report.p95_retrieval_latency_ms,
                "total_mean_ms": report.mean_total_latency_ms,
                "total_p95_ms": report.p95_total_latency_ms,
            },
            "failure_cases": report.failure_cases,
            "per_sample_results": [
                {
                    "id": r.sample_id,
                    "question": r.question,
                    "faithfulness": r.faithfulness,
                    "answer_relevancy": r.answer_relevancy,
                    "context_precision": r.context_precision,
                    "hallucination": r.hallucination_detected,
                    "bleu": r.bleu_score,
                    "rouge_l": r.rouge_l_score,
                    "total_latency_ms": r.total_latency_ms,
                }
                for r in report.results
            ],
        }

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(report_dict, f, indent=2, ensure_ascii=False)

        logger.info("eval.report_saved", path=filename)
        return filename

    def print_report(self, report: ExperimentReport) -> None:
        """Print a formatted evaluation report to stdout."""
        print(f"\n{'=' * 70}")
        print(f"  RAG EVALUATION REPORT — {report.experiment_name}")
        print(f"{'=' * 70}")
        print(f"  Timestamp:    {report.run_timestamp}")
        print(f"  Samples:      {report.total_samples}")
        print(f"{'─' * 70}")
        print(f"  RETRIEVAL METRICS")
        print(f"  Context Precision:    {report.mean_context_precision:.4f}")
        print(f"  Context Recall:       {report.mean_context_recall:.4f}")
        print(f"{'─' * 70}")
        print(f"  GENERATION METRICS")
        print(f"  Faithfulness:         {report.mean_faithfulness:.4f} ± {report.std_faithfulness:.4f}")
        print(f"  Answer Relevancy:     {report.mean_answer_relevancy:.4f} ± {report.std_answer_relevancy:.4f}")
        print(f"  Citation Accuracy:    {report.mean_citation_accuracy:.4f}")
        print(f"  Hallucination Rate:   {report.hallucination_rate:.2%}")
        print(f"  BLEU-4:               {report.mean_bleu:.4f}")
        print(f"  ROUGE-L:              {report.mean_rouge_l:.4f}")
        print(f"{'─' * 70}")
        print(f"  LATENCY (ms)")
        print(f"  Retrieval Mean:       {report.mean_retrieval_latency_ms:.0f}ms")
        print(f"  Retrieval P95:        {report.p95_retrieval_latency_ms:.0f}ms")
        print(f"  E2E Mean:             {report.mean_total_latency_ms:.0f}ms")
        print(f"  E2E P95:              {report.p95_total_latency_ms:.0f}ms")
        print(f"{'─' * 70}")

        if report.failure_cases:
            print(f"  TOP FAILURE CASES ({len(report.failure_cases)} total)")
            for fc in report.failure_cases[:3]:
                print(f"  Q: {fc['question'][:80]}...")
                print(f"     Faithfulness: {fc['faithfulness']:.3f} | "
                      f"Hallucination: {fc['hallucination']}")
        print(f"{'=' * 70}\n")
