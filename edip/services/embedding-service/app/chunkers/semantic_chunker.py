"""
Semantic Chunker — Structure-preserving document chunking

Implements:
- Semantic chunking (sentence boundary + topic coherence)
- Header-aware chunking (preserves hierarchy)
- Clause-aware chunking (for legal documents)
- Recursive chunking (hierarchical splitting)
- Table-aware chunking (keeps tables intact)
- Context-preserving overlap

Unlike naive fixed-length splitting, this chunker:
1. Respects sentence boundaries
2. Preserves heading context in each chunk
3. Detects and preserves table structures
4. Maintains parent-child relationships between chunks
5. Annotates chunks with structural metadata
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import spacy
import structlog
from langchain.text_splitter import RecursiveCharacterTextSplitter

logger = structlog.get_logger(__name__)


@dataclass
class ChunkMetadata:
    chunk_index: int
    chunk_type: str  # paragraph | heading | clause | table | list_item
    heading_context: Optional[str]
    section_title: Optional[str]
    hierarchy_path: List[str]
    page_number: Optional[int]
    page_range: Optional[Dict[str, int]]
    token_count: int
    char_count: int
    content_hash: str
    chunking_strategy: str
    overlap_with_prev: bool
    overlap_with_next: bool


@dataclass
class DocumentChunk:
    content: str
    metadata: ChunkMetadata


class SemanticChunker:
    """
    Production-grade semantic chunker for enterprise documents.

    Strategy:
    1. Parse document structure (headings, sections, paragraphs)
    2. Split at natural semantic boundaries
    3. Maintain parent context in each chunk
    4. Handle tables as atomic units
    5. Apply configurable overlap
    """

    # Heading patterns
    HEADING_PATTERNS = [
        r"^(#{1,6})\s+(.+)$",                          # Markdown headers
        r"^([A-Z][A-Z\s]{2,50})$",                      # ALL CAPS headings
        r"^(\d+\.)+\s+[A-Z]",                           # 1.2.3 Numbered sections
        r"^(Article|Section|Chapter|Clause|Exhibit)\s+\d+",  # Legal sections
        r"^[IVX]+\.\s+[A-Z]",                           # Roman numeral sections
    ]

    TABLE_PATTERN = re.compile(
        r"(\|.*\|.*\n)+", re.MULTILINE
    )

    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 64,
        min_chunk_size: int = 50,
        strategy: str = "semantic",
        spacy_model: str = "en_core_web_sm",
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        self.strategy = strategy

        # Load spaCy for sentence boundary detection
        try:
            self.nlp = spacy.load(spacy_model)
            # Disable unused pipeline components for speed
            self.nlp.disable_pipes(["ner", "parser"])
            self.nlp.enable_pipe("senter")  # Sentence boundary detector
        except OSError:
            logger.warning(
                "spacy.model_not_found",
                model=spacy_model,
                msg="Run: python -m spacy download en_core_web_sm",
            )
            self.nlp = None

        # Fallback recursive splitter
        self._recursive_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
            keep_separator=True,
        )

        logger.info(
            "semantic_chunker.initialized",
            chunk_size=chunk_size,
            overlap=chunk_overlap,
            strategy=strategy,
        )

    def chunk(
        self,
        text: str,
        document_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[DocumentChunk]:
        """
        Main entry point. Chunks text according to configured strategy.

        Args:
            text: Full document text
            document_metadata: Doc-level metadata (document_type, etc.)

        Returns:
            List of DocumentChunk objects with full metadata
        """
        if not text or not text.strip():
            return []

        doc_meta = document_metadata or {}

        if self.strategy == "semantic":
            return self._semantic_chunk(text, doc_meta)
        elif self.strategy == "clause":
            return self._clause_chunk(text, doc_meta)
        elif self.strategy == "recursive":
            return self._recursive_chunk(text, doc_meta)
        else:
            return self._semantic_chunk(text, doc_meta)

    def _semantic_chunk(
        self,
        text: str,
        doc_meta: Dict[str, Any],
    ) -> List[DocumentChunk]:
        """
        Semantic chunking:
        1. Parse structure (headings, tables, paragraphs)
        2. Split paragraphs at sentence boundaries
        3. Group into chunks respecting max size
        4. Add heading context to each chunk
        """
        # First pass: extract structure
        structural_units = self._parse_structure(text)

        # Second pass: split large units into sentence-boundary chunks
        chunks: List[DocumentChunk] = []
        chunk_index = 0
        current_heading_path: List[str] = []
        current_section: Optional[str] = None

        for unit in structural_units:
            unit_type = unit["type"]
            unit_text = unit["text"]
            unit_page = unit.get("page")

            # Update heading context
            if unit_type == "heading":
                level = unit.get("level", 1)
                # Maintain hierarchy stack
                if level <= len(current_heading_path):
                    current_heading_path = current_heading_path[: level - 1]
                current_heading_path.append(unit_text.strip())
                current_section = unit_text.strip()

                # Include short headings as their own chunk
                if len(unit_text) > self.min_chunk_size:
                    chunk = self._make_chunk(
                        content=unit_text,
                        chunk_type="heading",
                        chunk_index=chunk_index,
                        heading_context=None,
                        section_title=current_section,
                        hierarchy_path=list(current_heading_path),
                        page_number=unit_page,
                        strategy="semantic",
                    )
                    chunks.append(chunk)
                    chunk_index += 1
                continue

            elif unit_type == "table":
                # Tables are kept as atomic chunks
                chunk = self._make_chunk(
                    content=unit_text,
                    chunk_type="table",
                    chunk_index=chunk_index,
                    heading_context=current_heading_path[-1] if current_heading_path else None,
                    section_title=current_section,
                    hierarchy_path=list(current_heading_path),
                    page_number=unit_page,
                    strategy="semantic",
                )
                chunks.append(chunk)
                chunk_index += 1
                continue

            # Paragraph: split at sentence boundaries
            sentences = self._split_sentences(unit_text)
            current_chunk_sentences = []
            current_size = 0

            for i, sentence in enumerate(sentences):
                sentence_len = len(sentence)

                if current_size + sentence_len > self.chunk_size and current_chunk_sentences:
                    # Emit current chunk
                    chunk_text = " ".join(current_chunk_sentences)
                    chunk = self._make_chunk(
                        content=chunk_text,
                        chunk_type=unit_type,
                        chunk_index=chunk_index,
                        heading_context=current_heading_path[-1] if current_heading_path else None,
                        section_title=current_section,
                        hierarchy_path=list(current_heading_path),
                        page_number=unit_page,
                        strategy="semantic",
                        overlap_with_next=self.chunk_overlap > 0,
                    )
                    chunks.append(chunk)
                    chunk_index += 1

                    # Start new chunk with overlap
                    overlap_sentences = self._get_overlap_sentences(
                        current_chunk_sentences, self.chunk_overlap
                    )
                    current_chunk_sentences = overlap_sentences + [sentence]
                    current_size = sum(len(s) for s in current_chunk_sentences)
                else:
                    current_chunk_sentences.append(sentence)
                    current_size += sentence_len

            # Emit remaining sentences
            if current_chunk_sentences:
                chunk_text = " ".join(current_chunk_sentences)
                if len(chunk_text.strip()) >= self.min_chunk_size:
                    chunk = self._make_chunk(
                        content=chunk_text,
                        chunk_type=unit_type,
                        chunk_index=chunk_index,
                        heading_context=current_heading_path[-1] if current_heading_path else None,
                        section_title=current_section,
                        hierarchy_path=list(current_heading_path),
                        page_number=unit_page,
                        strategy="semantic",
                    )
                    chunks.append(chunk)
                    chunk_index += 1

        # Mark overlap relationships
        for i, chunk in enumerate(chunks):
            if i > 0 and chunks[i - 1].metadata.overlap_with_next:
                chunk.metadata.overlap_with_prev = True

        logger.info(
            "semantic_chunker.complete",
            total_chunks=len(chunks),
            strategy="semantic",
        )

        return chunks

    def _clause_chunk(
        self,
        text: str,
        doc_meta: Dict[str, Any],
    ) -> List[DocumentChunk]:
        """
        Clause-aware chunking for legal documents.
        Splits on numbered clauses, articles, sections.
        """
        CLAUSE_PATTERN = re.compile(
            r"(?=\n(?:(?:\d+\.)+\d*|[A-Z]\.|Article\s+\d+|Section\s+\d+|Clause\s+\d+)[\s:])",
            re.IGNORECASE,
        )

        segments = CLAUSE_PATTERN.split(text)
        chunks = []

        for i, segment in enumerate(segments):
            segment = segment.strip()
            if not segment or len(segment) < self.min_chunk_size:
                continue

            # If segment is too large, sub-split at sentence level
            if len(segment) > self.chunk_size * 2:
                sub_chunks = self._recursive_splitter.split_text(segment)
                for j, sub in enumerate(sub_chunks):
                    chunk = self._make_chunk(
                        content=sub,
                        chunk_type="clause",
                        chunk_index=len(chunks),
                        heading_context=None,
                        section_title=self._extract_clause_title(segment),
                        hierarchy_path=[],
                        page_number=None,
                        strategy="clause",
                    )
                    chunks.append(chunk)
            else:
                chunk = self._make_chunk(
                    content=segment,
                    chunk_type="clause",
                    chunk_index=len(chunks),
                    heading_context=None,
                    section_title=self._extract_clause_title(segment),
                    hierarchy_path=[],
                    page_number=None,
                    strategy="clause",
                )
                chunks.append(chunk)

        return chunks

    def _recursive_chunk(
        self,
        text: str,
        doc_meta: Dict[str, Any],
    ) -> List[DocumentChunk]:
        """Langchain-style recursive character splitting as fallback."""
        raw_chunks = self._recursive_splitter.split_text(text)
        chunks = []

        for i, raw in enumerate(raw_chunks):
            if len(raw.strip()) < self.min_chunk_size:
                continue
            chunk = self._make_chunk(
                content=raw,
                chunk_type="paragraph",
                chunk_index=i,
                heading_context=None,
                section_title=None,
                hierarchy_path=[],
                page_number=None,
                strategy="recursive",
            )
            chunks.append(chunk)

        return chunks

    def _parse_structure(self, text: str) -> List[Dict[str, Any]]:
        """
        Parse document into structural units:
        headings, paragraphs, tables, lists.
        """
        units = []
        lines = text.split("\n")
        current_para_lines = []

        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()

            # Skip empty lines (paragraph separator)
            if not stripped:
                if current_para_lines:
                    para_text = " ".join(current_para_lines).strip()
                    if para_text:
                        units.append({"type": "paragraph", "text": para_text})
                    current_para_lines = []
                i += 1
                continue

            # Detect table (markdown-style or ASCII)
            if "|" in stripped and stripped.count("|") >= 2:
                if current_para_lines:
                    units.append({"type": "paragraph", "text": " ".join(current_para_lines)})
                    current_para_lines = []

                table_lines = []
                while i < len(lines) and ("|" in lines[i] or lines[i].strip().startswith("-")):
                    table_lines.append(lines[i])
                    i += 1
                units.append({"type": "table", "text": "\n".join(table_lines)})
                continue

            # Detect headings
            heading_match = self._detect_heading(stripped)
            if heading_match:
                if current_para_lines:
                    units.append({"type": "paragraph", "text": " ".join(current_para_lines)})
                    current_para_lines = []
                units.append({
                    "type": "heading",
                    "text": stripped,
                    "level": heading_match["level"],
                })
            else:
                current_para_lines.append(stripped)

            i += 1

        # Flush remaining paragraph
        if current_para_lines:
            units.append({"type": "paragraph", "text": " ".join(current_para_lines)})

        return units

    def _detect_heading(self, text: str) -> Optional[Dict[str, Any]]:
        """Check if a line is a heading. Returns {level, text} or None."""
        # Markdown
        md_match = re.match(r"^(#{1,6})\s+(.+)$", text)
        if md_match:
            return {"level": len(md_match.group(1)), "text": md_match.group(2)}

        # Numbered section (1.2.3)
        if re.match(r"^(\d+\.){1,4}\d*\s+[A-Z]", text) and len(text) < 150:
            return {"level": text.count(".") + 1, "text": text}

        # Legal article/section
        legal = re.match(r"^(Article|Section|Chapter|Clause)\s+\d+", text, re.IGNORECASE)
        if legal and len(text) < 150:
            return {"level": 1, "text": text}

        # ALL CAPS heading
        if text.isupper() and 10 < len(text) < 100 and not text[-1].isdigit():
            return {"level": 1, "text": text}

        return None

    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences using spaCy or regex fallback."""
        if self.nlp:
            doc = self.nlp(text[:100000])  # Cap at 100K chars for speed
            return [sent.text.strip() for sent in doc.sents if sent.text.strip()]

        # Regex fallback
        sentences = re.split(r"(?<=[.!?])\s+", text)
        return [s.strip() for s in sentences if s.strip()]

    def _get_overlap_sentences(
        self, sentences: List[str], max_overlap_chars: int
    ) -> List[str]:
        """Get trailing sentences that fit within overlap budget."""
        overlap = []
        total = 0
        for sent in reversed(sentences):
            if total + len(sent) > max_overlap_chars:
                break
            overlap.insert(0, sent)
            total += len(sent)
        return overlap

    def _extract_clause_title(self, text: str) -> Optional[str]:
        """Extract the title/number from the first line of a clause."""
        first_line = text.split("\n")[0].strip()
        if len(first_line) < 200:
            return first_line
        return first_line[:100]

    def _make_chunk(
        self,
        content: str,
        chunk_type: str,
        chunk_index: int,
        heading_context: Optional[str],
        section_title: Optional[str],
        hierarchy_path: List[str],
        page_number: Optional[int],
        strategy: str,
        overlap_with_next: bool = False,
    ) -> DocumentChunk:
        """Create a DocumentChunk with full metadata."""
        content = content.strip()
        token_count = len(content.split())  # Simple approximation

        return DocumentChunk(
            content=content,
            metadata=ChunkMetadata(
                chunk_index=chunk_index,
                chunk_type=chunk_type,
                heading_context=heading_context,
                section_title=section_title,
                hierarchy_path=hierarchy_path,
                page_number=page_number,
                page_range=None,
                token_count=token_count,
                char_count=len(content),
                content_hash=hashlib.sha256(content.encode()).hexdigest()[:16],
                chunking_strategy=strategy,
                overlap_with_prev=False,
                overlap_with_next=overlap_with_next,
            ),
        )
