# Enterprise Document Intelligence Platform (EDIP)

> **Production-grade AI-powered document intelligence system** with OCR pipelines, semantic RAG, multi-LLM orchestration, enterprise security, and real-time analytics.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://docker.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg)](https://fastapi.tiangolo.com)

---

## ✨ What Is This?

EDIP is a **full-stack, microservices-based enterprise SaaS platform** designed for organizations that need to:

- **Ingest & process** thousands of PDFs, scanned documents, contracts, invoices, and HR records
- **Ask questions** across their entire document corpus with source-cited, hallucination-guarded AI answers
- **Detect risks** in contracts, compliance gaps in policies, and anomalies in financial documents
- **Search semantically** using hybrid BM25 + dense vector retrieval with cross-encoder reranking
- **Analyze AI quality** with built-in RAG evaluation (faithfulness, relevancy, hallucination rate)
- **Maintain compliance** with full audit trails, RBAC, MFA, and PII masking

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EDIP Platform                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐  │
│  │ Next.js   │───▶│ FastAPI   │───▶│   OCR     │───▶│ Embedding │  │
│  │ Frontend  │    │ Gateway   │    │ Service   │    │ Service   │  │
│  │   :3000   │    │  :8000    │    │  :8001    │    │  :8002    │  │
│  └───────────┘    └───────────┘    └───────────┘    └───────────┘  │
│                         │               │                 │         │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐  │
│  │ Analytics │◀───│ Retrieval │───▶│   LLM     │◀───│  Celery   │  │
│  │ Service   │    │ Service   │    │ Service   │    │ Workers   │  │
│  │  :8005    │    │  :8003    │    │  :8004    │    │           │  │
│  └───────────┘    └───────────┘    └───────────┘    └───────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                          Data Layer                                 │
│                                                                     │
│  PostgreSQL 16    Redis 7    RabbitMQ 3    MinIO    ChromaDB        │
│  (Primary DB)    (Cache)     (Queue)     (Storage) (Vectors)        │
│                                                                     │
│  Elasticsearch 8    Prometheus    Grafana    OpenTelemetry           │
│  (Full-Text Search)  (Metrics)  (Dashboards)  (Tracing)            │
└─────────────────────────────────────────────────────────────────────┘
```

### Microservices

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| API Gateway | 8000 | FastAPI, Gunicorn | Auth, routing, rate limiting |
| OCR Service | 8001 | PaddleOCR, Tesseract | Document OCR, layout analysis |
| Embedding Service | 8002 | BGE, Sentence-Transformers | Vectorization, chunking |
| Retrieval Service | 8003 | FAISS, ChromaDB, BM25 | Hybrid retrieval, reranking |
| LLM Service | 8004 | OpenAI, Anthropic, Ollama | Generation, hallucination guard |
| Analytics Service | 8005 | FastAPI, Elasticsearch | Metrics, reporting |
| Frontend | 3000 | Next.js 14, Tailwind CSS | Enterprise UI |

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- 16GB RAM (recommended for local OCR models)
- API keys: OpenAI, Anthropic (optional — Ollama works offline)

### 1. Clone and Configure

```bash
git clone https://github.com/your-org/edip.git
cd edip

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys and secrets
```

### 2. Launch All Services

```bash
# Start everything (first run downloads models — takes ~5 min)
docker compose up -d

# Monitor startup
docker compose logs -f

# Check health
docker compose ps
```

### 3. Access the Platform

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **API Docs** | http://localhost:8000/docs |
| **Grafana** | http://localhost:3001 |
| **RabbitMQ** | http://localhost:15672 |
| **Flower (Celery)** | http://localhost:5555 |
| **MinIO Console** | http://localhost:9001 |

### 4. First Login

Default admin credentials (change immediately):
```
Email:    admin@edip.enterprise
Password: ChangeMe123!
```

---

## 📁 Project Structure

```
edip/
├── backend/                    # FastAPI API Gateway
│   ├── app/
│   │   ├── api/v1/             # REST API endpoints
│   │   │   ├── auth.py         # Authentication (JWT, MFA, RBAC)
│   │   │   ├── ingestion.py    # Document upload pipeline
│   │   │   ├── chat.py         # RAG query with SSE streaming
│   │   │   ├── search.py       # Hybrid semantic search
│   │   │   └── analytics.py    # Metrics and reporting
│   │   ├── core/
│   │   │   └── security.py     # JWT, RBAC, MFA, encryption
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── workers/            # Celery async tasks
│   │   │   ├── celery_app.py   # Queue configuration
│   │   │   └── ingestion_worker.py  # Processing pipeline
│   │   ├── config.py           # Pydantic settings
│   │   ├── database.py         # Async SQLAlchemy setup
│   │   └── main.py             # FastAPI app + middleware
│   ├── Dockerfile
│   └── requirements.txt
│
├── services/
│   ├── ocr-service/            # OCR microservice
│   │   └── app/
│   │       ├── main.py         # FastAPI endpoints
│   │       ├── engines/        # PaddleOCR, Tesseract, Ensemble
│   │       ├── preprocessing/  # Deskew, denoise, contrast
│   │       └── extractors/     # Tables, forms, signatures
│   │
│   ├── embedding-service/      # Embedding microservice
│   │   └── app/
│   │       ├── chunkers/       # Semantic, clause, recursive chunkers
│   │       ├── embedders/      # BGE, OpenAI, local models
│   │       └── stores/         # FAISS, ChromaDB, Qdrant adapters
│   │
│   ├── retrieval-service/      # Retrieval microservice
│   │   └── app/
│   │       └── retrievers/     # Hybrid retriever, RRF, reranker
│   │
│   ├── llm-service/            # LLM orchestration
│   │   └── app/
│   │       ├── orchestrator.py # Multi-provider orchestration
│   │       └── providers/      # OpenAI, Anthropic, Ollama
│   │
│   └── analytics-service/      # Analytics microservice
│
├── frontend/                   # Next.js 14 Frontend
│   └── src/
│       ├── app/                # App Router
│       │   ├── page.tsx        # Landing page
│       │   ├── (dashboard)/    # Protected dashboard routes
│       │   │   ├── dashboard/  # Analytics overview
│       │   │   ├── chat/       # AI document chat
│       │   │   ├── documents/  # Document management
│       │   │   ├── search/     # Semantic search
│       │   │   ├── analytics/  # Full analytics dashboard
│       │   │   └── admin/      # User/tenant management
│       │   └── (auth)/         # Login, MFA
│       └── components/         # Reusable UI components
│
├── evaluation/                 # RAG Evaluation Framework
│   └── framework/
│       └── rag_evaluator.py    # Faithfulness, precision, BLEU, ROUGE
│
├── infrastructure/
│   ├── nginx/                  # Reverse proxy config
│   ├── postgres/               # DB init scripts
│   └── rabbitmq/               # Queue configuration
│
├── monitoring/
│   ├── prometheus/             # Metrics scraping
│   ├── grafana/                # Dashboards
│   └── opentelemetry/          # Distributed tracing
│
├── docker-compose.yml          # Full stack orchestration
└── .env.example                # Environment template
```

---

## 🔐 Security Architecture

### Authentication Flow
```
User → Login → JWT Access Token (60min) + Refresh Token (30d)
             → Optional: TOTP MFA verification
             → RBAC: Role → Permissions matrix check
             → Tenant isolation: Row-Level Security (PostgreSQL RLS)
```

### Security Features

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT (RS256) + Opaque refresh tokens |
| Multi-Factor Auth | TOTP (RFC 6238) via PyOTP |
| Authorization | RBAC with fine-grained permission matrix |
| Tenant Isolation | PostgreSQL Row-Level Security |
| Data Encryption | AES-256-GCM for sensitive fields |
| API Security | HMAC-SHA256 signed API keys |
| PII Protection | Automatic masking in audit logs |
| Rate Limiting | Per-IP + per-tenant limits |
| Audit Logging | Immutable, append-only audit trail |

### RBAC Roles

| Role | Capabilities |
|------|-------------|
| `super_admin` | Full platform access |
| `tenant_admin` | Tenant-level administration |
| `document_manager` | Upload, delete, manage documents |
| `analyst` | Query, search, view analytics |
| `viewer` | Read-only document access |
| `api_client` | API-key-based service access |

---

## 🤖 RAG Pipeline

### Retrieval Pipeline

```
Query
  │
  ├── Query Expansion (HyDE + synonym variants)
  │
  ├── Dense Retrieval (BGE embedding → ChromaDB similarity search)
  │                            +
  ├── Sparse Retrieval (BM25 lexical search)
  │
  └── Reciprocal Rank Fusion (RRF merging)
          │
          └── Cross-Encoder Reranking (ms-marco-MiniLM)
                  │
                  └── Metadata Filtering (department, date, risk)
                          │
                          └── Context Compression → LLM Generation
```

### LLM Providers

| Provider | Model | Use Case |
|----------|-------|----------|
| OpenAI | GPT-4o | Primary (best quality) |
| Anthropic | Claude 3.5 Sonnet | Fallback / long context |
| Google | Gemini 1.5 Pro | Alternative |
| Ollama | Llama 3.1 8B | Local / private |

### Hallucination Guard

Every LLM response is validated:
1. **Citation check**: Answer must include `[1]` style references
2. **Grounding check**: Citations verified against retrieved chunks
3. **Confidence threshold**: Responses below 65% confidence refused
4. **Self-reference detection**: "As an AI..." phrases trigger refusal

---

## 📊 RAG Evaluation Metrics

Run evaluation against your test dataset:

```bash
python -m evaluation.run_experiment \
  --dataset evaluation/datasets/qa_pairs.json \
  --strategy hybrid \
  --top-k 5 \
  --output evaluation/reports/
```

| Metric | Description | Target |
|--------|-------------|--------|
| Faithfulness | Answer grounded in context | > 0.90 |
| Answer Relevancy | Answer addresses question | > 0.85 |
| Context Precision | Retrieved chunks are relevant | > 0.88 |
| Context Recall | Correct chunks retrieved | > 0.80 |
| Hallucination Rate | Ungrounded answers | < 0.05 |
| BLEU-4 | Text similarity to reference | > 0.40 |
| ROUGE-L | Longest common subsequence | > 0.55 |
| Retrieval P95 | 95th percentile latency | < 1000ms |

---

## ⚡ Performance

| Operation | Target | Notes |
|-----------|--------|-------|
| Document ingestion | < 30s per page | OCR-intensive |
| Semantic retrieval | < 500ms | Hybrid, 20K chunks |
| LLM generation | < 5s (streaming) | GPT-4o, 1K tokens |
| E2E RAG query | < 6s first token | Includes retrieval |
| OCR (scanned PDF) | < 15s per page | PaddleOCR ensemble |
| Embedding (1K chunks) | < 30s | BGE large |
| API throughput | 100 req/s | With 2 gateway replicas |

---

## 🐳 Docker Services Reference

```bash
# Start all services
docker compose up -d

# Start only infrastructure (no app services)
docker compose up -d postgres redis rabbitmq minio chroma

# Rebuild a specific service
docker compose build api-gateway && docker compose up -d api-gateway

# View logs
docker compose logs -f ocr-service
docker compose logs -f api-gateway

# Scale workers
docker compose up -d --scale celery-worker-ingestion=4

# Stop and clean (WARNING: deletes all data)
docker compose down -v
```

---

## 🔧 Environment Configuration

Key variables in `.env`:

```bash
# Required
SECRET_KEY=your-256-bit-secret-key
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/edip
OPENAI_API_KEY=sk-...

# LLM
LLM_PRIMARY_PROVIDER=openai
LLM_FALLBACK_PROVIDER=ollama
OLLAMA_MODEL=llama3.1:8b

# OCR
OCR_ENGINE=ensemble          # paddleocr | tesseract | ensemble
OCR_CONFIDENCE_THRESHOLD=0.7

# Retrieval
RETRIEVAL_TOP_K=20
RERANK_TOP_K=5
EMBEDDING_MODEL=BAAI/bge-large-en-v1.5

# Security
CONFIDENCE_THRESHOLD=0.7
ENABLE_MFA=true
```

---

## 🧪 Testing

```bash
# Unit tests
cd backend
pytest tests/ -v --cov=app --cov-report=html

# Integration tests
pytest tests/integration/ -v -m integration

# RAG evaluation
python -m evaluation.run_experiment --dataset tests/eval/qa_pairs.json

# Load testing
locust -f tests/load/locustfile.py --host http://localhost:8000
```

---

## 📈 Monitoring

Access monitoring stack:

| Tool | URL | Credentials |
|------|-----|-------------|
| Grafana | http://localhost:3001 | admin / see .env |
| Prometheus | http://localhost:9090 | - |
| Flower | http://localhost:5555 | admin / see .env |

### Key Dashboards
- **Platform Overview**: Request rates, error rates, latency percentiles
- **RAG Quality**: Faithfulness trends, hallucination rate, citation accuracy
- **Document Pipeline**: Processing queue depth, OCR success rate
- **Cost Tracking**: Token usage per provider, cost per query

---

## 📋 Development Roadmap

- [x] Phase 1: Foundation — FastAPI gateway, auth, database models
- [x] Phase 2: OCR Microservice — PaddleOCR + Tesseract ensemble
- [x] Phase 3: Embedding Service — BGE + ChromaDB indexing
- [x] Phase 4: Hybrid Retrieval — RRF + cross-encoder reranking
- [x] Phase 5: LLM Orchestration — Multi-provider + hallucination guard
- [x] Phase 6: Frontend — Next.js 14 + dark enterprise UI
- [x] Phase 7: Analytics Dashboard — Real-time metrics + evaluation
- [x] Phase 8: Task Queue — Celery ingestion pipeline
- [x] Phase 9: Evaluation Framework — RAGAS-compatible metrics
- [ ] Phase 10: Kubernetes — Helm charts for K8s deployment
- [ ] Phase 11: Multi-Language — OCR in 80+ languages
- [ ] Phase 12: Document Comparison — Side-by-side analysis

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

*Built with ❤️ for enterprise document intelligence at scale.*
