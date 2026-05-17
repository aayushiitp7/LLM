'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  FileText,
  Search,
  MessageSquare,
  BarChart3,
  Shield,
  Upload,
  Zap,
  ChevronRight,
  ArrowRight,
  Check,
  Brain,
  Lock,
} from 'lucide-react'

// ─── Animated Counter ─────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 1500
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType
  title: string
  description: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay }}
      className="bg-card border border-border rounded-lg p-6 group cursor-default shadow-subtle hover:border-muted-foreground/30 transition-colors"
    >
      <div
        className="w-8 h-8 rounded bg-secondary border border-border flex items-center justify-center mb-4 transition-transform group-hover:bg-foreground group-hover:text-background"
      >
        <Icon className="w-4 h-4 text-inherit transition-colors" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────

function StatCard({
  value,
  suffix,
  label,
}: {
  value: number
  suffix: string
  label: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-card border border-border rounded-lg p-6 text-center shadow-subtle"
    >
      <div className="text-3xl font-bold font-mono text-foreground mb-1 tracking-tight">
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</div>
    </motion.div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────

export default function LandingPage() {
  const features = [
    {
      icon: Upload,
      title: 'Intelligent Ingestion',
      description: 'Ingest PDFs, DOCX, and 10+ formats with OCR, deduplication, and parallel processing pipelines.',
      delay: 0,
    },
    {
      icon: Brain,
      title: 'RAG-Powered AI Q&A',
      description: 'Ask questions across your document corpus. Every answer includes source citations and chunk references.',
      delay: 0.05,
    },
    {
      icon: Search,
      title: 'Hybrid Semantic Search',
      description: 'Combine BM25 sparse retrieval + dense vector search + cross-encoder reranking for unmatched precision.',
      delay: 0.1,
    },
    {
      icon: Shield,
      title: 'Risk Analysis',
      description: 'Automatic risk scoring, clause deviation detection, compliance gap identification for enterprise workflows.',
      delay: 0.15,
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Risk heatmaps, document analytics, AI usage dashboards, retrieval quality metrics, and compliance reports.',
      delay: 0.2,
    },
    {
      icon: Lock,
      title: 'Enterprise Security',
      description: 'RBAC, JWT + MFA, AES encryption, PII masking, audit trails, GDPR/HIPAA/SOC2-ready architecture.',
      delay: 0.25,
    },
  ]

  return (
    <div className="min-h-screen bg-background overflow-hidden selection:bg-foreground selection:text-background text-foreground">
      
      {/* Structural Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center bg-primary text-primary-foreground shadow-subtle">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight">
            DocIntel
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Platform</Link>
          <Link href="#architecture" className="hover:text-foreground transition-colors">Infrastructure</Link>
          <Link href="#security" className="hover:text-foreground transition-colors">Security</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary">Sign in</Link>
          <Link href="/dashboard" className="btn-primary">
            Deploy →
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-32 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-secondary border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-8"
        >
          <Zap className="w-3 h-3 text-foreground" />
          Production-Grade AI · SOC2 Ready
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight mb-6 max-w-4xl"
        >
          Enterprise Document Intelligence <br className="hidden md:block"/> at Absolute Scale
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-sm md:text-base text-muted-foreground max-w-2xl mb-10 leading-relaxed"
        >
          The definitive platform combining OCR pipelines, semantic RAG, multi-LLM orchestration,
          and zero-trust security. Built strictly for legal, finance, and compliance workflows.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/dashboard" className="btn-primary px-6 py-2.5">
            Launch Platform
          </Link>
          <Link
            href="/docs"
            className="btn-secondary px-6 py-2.5"
          >
            Read the Documentation
          </Link>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-6 py-12 border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard value={99} suffix="%" label="OCR Accuracy" />
          <StatCard value={420} suffix="ms" label="Retrieval Latency" />
          <StatCard value={94} suffix="%" label="RAG Faithfulness" />
          <StatCard value={12} suffix="+" label="LLM Integrations" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-2xl font-semibold tracking-tight mb-3">
              Platform Architecture
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Engineered for absolute reliability. Every workflow executes on isolated microservices with comprehensive audit logging and fallback mechanisms.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-xl p-12 shadow-modal"
          >
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              Deploy Your Infrastructure
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-lg mx-auto">
              Clone the repository, configure the environment,
              and execute <code className="bg-secondary px-1.5 py-0.5 rounded border border-border text-foreground font-mono mx-1">docker compose up -d</code> to launch the entire stack locally.
            </p>

            <div className="flex justify-center">
              <Link href="/dashboard" className="btn-primary">
                Open Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            <div className="flex justify-center gap-6 mt-8">
              {['GDPR Compliant', 'SOC2 Ready', 'On-premise Supported'].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Check className="w-3 h-3 text-foreground" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-card px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-foreground" />
            <span>DocIntel Enterprise © 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6 font-medium">
            <Link href="#" className="hover:text-foreground transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
