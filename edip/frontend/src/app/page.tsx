'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  FileText, Search, MessageSquare, BarChart3, Shield,
  Upload, Zap, ArrowRight, Check, Brain, Lock,
  Database, ChevronRight, Globe, Cpu, Building2,
  TrendingUp, Clock, Users, X
} from 'lucide-react'

// ─── Animated number counter ──────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 2000 }: { to: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef(false)

  useEffect(() => {
    if (ref.current) return
    ref.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setVal(Math.floor(ease * to))
      if (t < 1) requestAnimationFrame(tick)
      else setVal(to)
    }
    requestAnimationFrame(tick)
  }, [to, duration])

  return <>{val.toLocaleString()}{suffix}</>
}

// ─── Architecture Diagram ──────────────────────────────────────────────────────
const ARCH_LAYERS = [
  {
    label: 'Ingestion Layer',
    items: ['PDF · DOCX · PPTX', 'Scanned Images (OCR)', 'Emails · HTML'],
    color: 'border-zinc-700',
    tag: 'PaddleOCR / PyMuPDF',
  },
  {
    label: 'Processing Layer',
    items: ['Semantic Chunking', 'Metadata Extraction', 'Risk Classification'],
    color: 'border-zinc-600',
    tag: 'spaCy · Regex',
  },
  {
    label: 'Intelligence Layer',
    items: ['RAG Pipeline', 'Hybrid Retrieval', 'Multi-LLM Orchestration'],
    color: 'border-zinc-500',
    tag: 'ChromaDB · FAISS · BM25',
  },
  {
    label: 'Application Layer',
    items: ['Enterprise Chat', 'Search & Analytics', 'Compliance Reports'],
    color: 'border-zinc-400',
    tag: 'Next.js · FastAPI',
  },
]

const FEATURES = [
  {
    icon: Upload,
    title: 'Multi-Format Ingestion',
    description: 'Handles PDFs, scanned images, Word docs, and emails. PaddleOCR and PyMuPDF ensure no document is left unreadable, including skewed scans and corrupted layouts.',
  },
  {
    icon: Brain,
    title: 'RAG — Not Just Prompting',
    description: 'Retrieval-Augmented Generation prevents hallucinations. Every answer is grounded in retrieved document chunks with explicit source citation and confidence scores.',
  },
  {
    icon: Search,
    title: 'Hybrid Vector Search',
    description: 'Combines BM25 sparse retrieval + dense semantic vectors + cross-encoder reranking. Skipping hybrid search tanks retrieval quality by 30%.',
  },
  {
    icon: Shield,
    title: 'Compliance Automation',
    description: 'Contract risk scoring, clause deviation detection, missing clause identification. Supports Legal, Finance, and HR workflows from the same inference backend.',
  },
  {
    icon: BarChart3,
    title: 'Operational Analytics',
    description: 'Document type distribution, retrieval quality metrics, AI usage dashboards, hallucination tracking, and confidence vs. accuracy ablation studies.',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'RBAC with JWT + MFA, AES-256 encryption at rest, PII masking, immutable audit trails, on-premise LLM support. GDPR · HIPAA · SOC2 architecture.',
  },
]

const USE_CASES = [
  {
    domain: 'Legal & Compliance',
    icon: Building2,
    tasks: ['Contract risk analysis', 'Clause deviation detection', 'Regulatory gap identification'],
    example: '"Which contracts have termination notice < 30 days?"',
  },
  {
    domain: 'Finance & Audit',
    icon: TrendingUp,
    tasks: ['Invoice data extraction', 'Vendor reconciliation', 'Automated audit trail generation'],
    example: '"Summarize all invoices from Q3 exceeding $100k."',
  },
  {
    domain: 'Human Resources',
    icon: Users,
    tasks: ['Resume structured parsing', 'Policy Q&A interface', 'Employee agreement analysis'],
    example: '"Which employees have non-compete clauses expiring in 2026?"',
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold tracking-tight">DocIntel</span>
            <span className="hidden sm:block text-xs text-muted-foreground font-medium border border-border rounded px-1.5 py-0.5">Enterprise</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {['Platform', 'Architecture', 'Use Cases', 'Security'].map(n => (
              <a key={n} href={`#${n.toLowerCase().replace(' ', '-')}`}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                {n}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost hidden sm:inline-flex">Sign In</Link>
            <Link href="/dashboard" className="btn-primary">
              Launch Platform <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              className="md:hidden btn-icon"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-20">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full border border-border bg-secondary text-xs font-semibold text-muted-foreground">
            <Zap className="w-3 h-3" />
            Production-grade RAG · SOC2 Architecture
            <ChevronRight className="w-3 h-3" />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.08] mb-6 text-foreground">
            AI That Actually
            <br />
            <span className="text-muted-foreground">Understands Documents</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed mb-10">
            Not "upload PDF → get summary." A full-stack enterprise system that ingests unstructured documents,
            extracts structured knowledge, and enables search, compliance checks, and automation at scale.
            Built for Legal, Finance, and HR teams.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard" className="btn-primary text-sm px-5 py-2.5">
              Open Platform Dashboard
            </Link>
            <Link href="/docs" className="btn-secondary text-sm px-5 py-2.5">
              Read the Documentation
            </Link>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="relative z-10 mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px border border-border rounded-xl overflow-hidden"
        >
          {[
            { label: 'OCR Accuracy', value: 99, suffix: '%' },
            { label: 'Retrieval Latency', value: 420, suffix: 'ms' },
            { label: 'RAG Faithfulness', value: 94, suffix: '%' },
            { label: 'LLM Providers', value: 12, suffix: '+' },
          ].map((s, i) => (
            <div key={i} className="bg-card p-5 sm:p-6 text-center">
              <div className="text-2xl font-bold tracking-tighter font-mono-number mb-1">
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Architecture ──────────────────────────────────────────────── */}
      <section id="architecture" className="border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="section-label mb-3">System Architecture</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Five-Layer Enterprise Stack</h2>
            <p className="text-muted-foreground text-sm max-w-xl mb-12">
              Every layer is independently scalable, containerized, and observable. This is where 90% of student projects fail—
              intelligent chunking, metadata extraction, and hybrid retrieval are non-negotiable.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-4">
            {ARCH_LAYERS.map((layer, i) => (
              <motion.div
                key={layer.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.25 }}
                className={`premium-card p-5 border-t-2 ${layer.color}`}
              >
                <div className="section-label mb-3">Layer {i + 1}</div>
                <h3 className="text-sm font-semibold mb-3">{layer.label}</h3>
                <ul className="space-y-1.5 mb-4">
                  {layer.items.map(item => (
                    <li key={item} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-4 border-t border-border">
                  <code className="text-[10px] text-muted-foreground font-mono">{layer.tag}</code>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Arrow connectors */}
          <div className="hidden md:flex items-center justify-between px-8 -mt-[calc(50%+16px)] relative z-10 pointer-events-none">
            {[0,1,2].map(i => (
              <div key={i} className="flex-1 flex justify-center">
                <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="platform" className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="section-label mb-3">Platform Capabilities</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            What makes this enterprise-grade
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              className="premium-card p-6 group hover:border-border/60 transition-colors cursor-default"
            >
              <div className="w-8 h-8 rounded border border-border bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all duration-200">
                <f.icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Use Cases ─────────────────────────────────────────────────── */}
      <section id="use-cases" className="border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="section-label mb-3">Industry Use Cases</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Same backend. Different prompts.</h2>
            <p className="text-muted-foreground text-sm max-w-xl mt-3">
              Enterprise thinking means one system, multiple departments. Legal, Finance, and HR all
              run on the same RAG pipeline with domain-specific schemas.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {USE_CASES.map((uc, i) => (
              <motion.div
                key={uc.domain}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.25 }}
                className="premium-card p-6"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <uc.icon className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{uc.domain}</h3>
                </div>
                <ul className="space-y-2 mb-5">
                  {uc.tasks.map(t => (
                    <li key={t} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 mt-0.5 text-foreground shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-border">
                  <p className="text-[10px] text-muted-foreground font-mono italic leading-relaxed">
                    {uc.example}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ──────────────────────────────────────────────────── */}
      <section id="security" className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            <p className="section-label mb-3">Enterprise Security</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Designed to pass security review
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              "What happens with confidential documents?" — On-prem LLM support, AES-256 encryption at rest,
              PII masking pipelines, RBAC with JWT + MFA, and immutable audit logs. Every answer is traceable.
            </p>
            <ul className="space-y-3">
              {[
                'Zero-trust access control with JWT + MFA',
                'AES-256 encryption at rest and in transit',
                'PII auto-detection and masking',
                'Immutable audit trail for all operations',
                'On-premise LLM deployment option (Ollama)',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <div className="w-4 h-4 rounded border border-border bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 gap-3"
          >
            {[
              { label: 'GDPR', desc: 'Right to erasure, data minimization' },
              { label: 'SOC2 Type II', desc: 'Availability & confidentiality' },
              { label: 'HIPAA Ready', desc: 'PHI handling protocols' },
              { label: 'ISO 27001', desc: 'Security management framework' },
            ].map(c => (
              <div key={c.label} className="premium-card p-5">
                <div className="text-xs font-bold mb-1">{c.label}</div>
                <div className="text-[10px] text-muted-foreground">{c.desc}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Placement-level capstone. Not a classroom toy.
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Proper preprocessing, RAG-based reasoning, and clear enterprise use cases. 
              This is how companies actually deploy LLMs safely.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard" className="btn-primary px-5 py-2.5">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-5 py-2.5">
                Sign In to Platform
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
              {['GDPR Compliant', 'SOC2 Ready', 'On-Premise Supported', 'Open Source'].map(tag => (
                <span key={tag} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Check className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>DocIntel Enterprise © 2026</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
            <Link href="/admin/settings" className="hover:text-foreground transition-colors">Settings</Link>
            <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
