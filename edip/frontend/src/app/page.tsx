'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  FileText, Search, BarChart3, Shield, Upload, Zap, ArrowRight,
  Check, Brain, Lock, ChevronRight, Building2, TrendingUp, Users,
  Database, Cpu, GitBranch, Activity
} from 'lucide-react'

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const dur = 1800
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setVal(Math.floor(ease * to))
      if (t < 1) requestAnimationFrame(tick)
      else setVal(to)
    }
    requestAnimationFrame(tick)
  }, [to])
  return <>{val.toLocaleString()}{suffix}</>
}

const fadeIn = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }

const ARCH = [
  { n: '01', label: 'Ingestion', tech: 'PaddleOCR · PyMuPDF', desc: 'PDF, DOCX, scanned images with full OCR preprocessing pipeline', icon: Upload },
  { n: '02', label: 'Structuring', tech: 'spaCy · Regex', desc: 'Semantic chunking, metadata extraction, section hierarchy preservation', icon: GitBranch },
  { n: '03', label: 'Intelligence', tech: 'ChromaDB · FAISS · BM25', desc: 'RAG pipeline with hybrid retrieval and cross-encoder reranking', icon: Brain },
  { n: '04', label: 'Application', tech: 'FastAPI · Next.js', desc: 'Enterprise chat, analytics dashboards, compliance automation', icon: BarChart3 },
]

const FEATURES = [
  { icon: Upload, title: 'Multi-Format OCR Ingestion', desc: 'PDFs, DOCX, scanned images, emails. PaddleOCR handles skewed, noisy, and low-quality scans that destroy naive parsers.' },
  { icon: Brain, title: 'RAG — Source-Cited Answers', desc: 'Every answer cites the exact chunk it came from. Enterprises cannot accept black-box hallucinations in legal or financial workflows.' },
  { icon: Search, title: 'Hybrid Vector Search', desc: 'BM25 sparse + dense semantic vectors + cross-encoder reranking. Pure semantic-only search misses 30% of relevant documents.' },
  { icon: Shield, title: 'Compliance Automation', desc: 'Contract risk scoring, clause deviation detection, missing clause flags. Same inference backend — different schemas per department.' },
  { icon: BarChart3, title: 'Operational Analytics', desc: 'Retrieval quality metrics, confidence distribution, hallucination tracking, ablation studies. Evaluation is a first-class citizen.' },
  { icon: Lock, title: 'Zero-Trust Security', desc: 'RBAC + JWT + MFA, AES-256 at rest, PII masking, immutable audit logs, on-prem Ollama support. GDPR · HIPAA · SOC2.' },
]

const USE_CASES = [
  {
    domain: 'Legal & Compliance',
    icon: Building2,
    tasks: ['Contract risk scoring (§-level)', 'Clause deviation detection', 'Regulatory gap identification'],
    query: '"Which contracts have termination notice < 30 days?"',
  },
  {
    domain: 'Finance & Audit',
    icon: TrendingUp,
    tasks: ['Invoice data extraction', 'Vendor reconciliation', 'Audit trail automation'],
    query: '"Summarize all invoices from Q3 exceeding $100k."',
  },
  {
    domain: 'Human Resources',
    icon: Users,
    tasks: ['Resume structured parsing', 'Policy Q&A interface', 'Agreement analysis'],
    query: '"Which employees have non-compete clauses expiring in 2026?"',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto h-14 flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold tracking-tight">DocIntel</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 border border-border rounded text-muted-foreground">Enterprise</span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {[['Platform','#platform'],['Architecture','#arch'],['Use Cases','#usecases'],['Security','#security']].map(([n,h]) => (
              <a key={n} href={h} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                {n}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost text-sm hidden sm:inline-flex">Sign In</Link>
            <Link href="/dashboard" className="btn-primary text-sm">
              Launch Platform <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: 'radial-gradient(circle, hsl(0 0% 50%) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16">
          <motion.div {...fadeIn} transition={{ duration: 0.4 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-secondary text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-8">
              <Zap className="w-3 h-3 text-amber-400" />
              Production-grade RAG · SOC2 Architecture
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter leading-[1.06] mb-6">
              AI That Actually<br />
              <span className="text-muted-foreground">Understands Documents</span>
            </h1>

            <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-2xl">
              Not "upload PDF → get summary." A full-stack enterprise system with OCR pipelines,
              semantic RAG, hybrid vector search, compliance automation, and zero-trust security.
              Built for Legal, Finance, and HR at scale.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="btn-primary px-5 py-2.5 text-sm">
                Open Platform Dashboard
              </Link>
              <Link href="/docs" className="btn-secondary px-5 py-2.5 text-sm">
                Read the Documentation
              </Link>
            </div>
          </motion.div>

          {/* ── Terminal preview widget ── */}
          <motion.div
            {...fadeIn}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-14 premium-card overflow-hidden max-w-3xl"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono ml-2">DocIntel RAG Pipeline — Live Query</span>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Connected</span>
              </div>
            </div>
            <div className="p-5 font-mono text-xs space-y-3 bg-background">
              <div className="text-muted-foreground">$ query --corpus legal_contracts --type RAG</div>
              <div className="text-foreground">
                <span className="text-muted-foreground">&gt; </span>
                <span className="text-amber-300">Q:</span>
                <span> Which contracts have termination notice &lt; 30 days?</span>
              </div>
              <div className="border-l-2 border-border pl-3 space-y-1.5 text-muted-foreground">
                <div className="flex gap-2">
                  <span className="text-blue-400 shrink-0">→ Retrieval:</span>
                  <span>BM25 + semantic hybrid · 4,218 chunks indexed · 23ms</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400 shrink-0">→ Reranking:</span>
                  <span>Cross-encoder · Top 8 chunks selected · 94ms</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400 shrink-0">→ Generation:</span>
                  <span>GPT-4o · Source-cited · 303ms</span>
                </div>
              </div>
              <div className="pt-1">
                <span className="text-muted-foreground">&gt; </span>
                <span className="text-emerald-400">A:</span>
                <span className="text-foreground"> 3 contracts flagged · Acme Corp (14d), DataSync (7d), CloudHost (21d)</span>
              </div>
              <div className="flex gap-4 pt-1 border-t border-border">
                <span className="text-[10px] text-muted-foreground">Sources: <span className="text-foreground">3 docs cited</span></span>
                <span className="text-[10px] text-muted-foreground">Confidence: <span className="text-emerald-400">94.2%</span></span>
                <span className="text-[10px] text-muted-foreground">Total latency: <span className="text-foreground">420ms</span></span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────── */}
      <div className="border-y border-border bg-card">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            {[
              { label: 'OCR Accuracy', v: 99, s: '%' },
              { label: 'Retrieval Latency', v: 420, s: 'ms' },
              { label: 'RAG Faithfulness', v: 94, s: '%' },
              { label: 'LLM Providers', v: 12, s: '+' },
            ].map((st) => (
              <div key={st.label} className="py-6 px-6 text-center">
                <div className="text-3xl font-bold font-mono-number tracking-tight mb-1">
                  <Counter to={st.v} suffix={st.s} />
                </div>
                <div className="section-label">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Architecture ────────────────────────────────────────────────── */}
      <section id="arch" className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-10">
          <p className="section-label mb-2">System Architecture</p>
          <h2 className="text-3xl font-bold tracking-tight">Four-Layer Enterprise Stack</h2>
          <p className="text-muted-foreground text-sm mt-3 max-w-xl">
            Every layer is independently scalable, containerized, and observable.
            This is where 90% of student projects fail.
          </p>
        </div>

        <div className="relative">
          {/* Flow line */}
          <div className="hidden md:block absolute top-8 left-[calc(25%-1px)] right-[calc(25%-1px)] h-px bg-border" />

          <div className="grid md:grid-cols-4 gap-4">
            {ARCH.map((layer, i) => (
              <div key={layer.n} className="premium-card p-5 relative group hover:border-muted-foreground/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-muted-foreground font-mono">{layer.n}</span>
                  <div className="w-7 h-7 rounded border border-border bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all duration-200">
                    <layer.icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-1">{layer.label}</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">{layer.desc}</p>
                <code className="text-[9px] text-muted-foreground font-mono border border-border rounded px-1.5 py-0.5 bg-secondary">
                  {layer.tech}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="platform" className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-10">
            <p className="section-label mb-2">Platform Capabilities</p>
            <h2 className="text-3xl font-bold tracking-tight">What makes this enterprise-grade</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-lg border border-border bg-background group hover:border-muted-foreground/30 transition-colors cursor-default">
                <div className="w-8 h-8 rounded border border-border bg-card flex items-center justify-center mb-4 group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all duration-200">
                  <f.icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ───────────────────────────────────────────────────── */}
      <section id="usecases" className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-10">
          <p className="section-label mb-2">Industry Use Cases</p>
          <h2 className="text-3xl font-bold tracking-tight">Same backend. Different prompts.</h2>
          <p className="text-muted-foreground text-sm mt-3 max-w-xl">
            Enterprise thinking: one RAG pipeline, domain-specific schemas. Legal, Finance, HR —
            all configured from the same inference layer.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {USE_CASES.map((uc) => (
            <div key={uc.domain} className="premium-card p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded border border-border bg-secondary flex items-center justify-center">
                  <uc.icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
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
                <p className="text-[10px] font-mono text-muted-foreground italic leading-relaxed">{uc.query}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Security ────────────────────────────────────────────────────── */}
      <section id="security" className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="section-label mb-2">Enterprise Security</p>
              <h2 className="text-3xl font-bold tracking-tight mb-4">Designed to pass security review</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                "What happens with confidential documents?" — On-prem LLM support, AES-256 encryption,
                PII masking, RBAC + JWT + MFA, and immutable audit logs. Every answer is fully traceable.
              </p>

              <ul className="space-y-3">
                {[
                  'Zero-trust access control (RBAC + JWT + MFA)',
                  'AES-256 encryption at rest and in transit',
                  'Automated PII detection and masking',
                  'Immutable audit trail for every operation',
                  'On-premise LLM deployment via Ollama',
                  'GDPR right-to-erasure & data minimization',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <div className="w-4 h-4 rounded border border-border bg-secondary flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: 'GDPR', desc: 'Right to erasure, data minimization' },
                  { label: 'SOC2 Type II', desc: 'Availability & confidentiality' },
                  { label: 'HIPAA Ready', desc: 'PHI handling protocols' },
                  { label: 'ISO 27001', desc: 'Security management framework' },
                ].map(c => (
                  <div key={c.label} className="premium-card p-4">
                    <div className="text-xs font-bold mb-1">{c.label}</div>
                    <div className="text-[10px] text-muted-foreground">{c.desc}</div>
                  </div>
                ))}
              </div>

              {/* Stress test questions panel */}
              <div className="premium-card p-4">
                <p className="section-label mb-3">Stress-Test Ready</p>
                <div className="space-y-2.5">
                  {[
                    { q: 'How do you reduce hallucinations?', a: 'RAG, confidence thresholds, source citation' },
                    { q: 'What happens with confidential data?', a: 'On-prem models, encryption, access control' },
                    { q: 'How does it scale?', a: 'Async ingestion, batching, vector sharding' },
                    { q: 'What if documents change?', a: 'Versioning + re-embedding pipeline' },
                  ].map(item => (
                    <div key={item.q} className="text-xs">
                      <span className="text-muted-foreground">{item.q}</span>
                      <span className="text-muted-foreground/50 mx-1">→</span>
                      <span className="text-foreground font-medium">{item.a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Placement-level capstone. Not a classroom toy.
        </h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-xl mx-auto">
          Proper preprocessing, RAG reasoning, and clear enterprise use cases.
          This is how companies actually deploy LLMs safely.
        </p>
        <div className="flex gap-3 justify-center mb-10">
          <Link href="/dashboard" className="btn-primary px-6 py-2.5">
            Open Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-secondary px-6 py-2.5">Sign In</Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {['GDPR Compliant','SOC2 Ready','On-Premise Supported','Open Source'].map(tag => (
            <span key={tag} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Check className="w-3 h-3" /> {tag}
            </span>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            DocIntel Enterprise © 2026
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
