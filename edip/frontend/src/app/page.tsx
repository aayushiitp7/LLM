'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Star,
  Check,
  Brain,
  Lock,
  Globe,
  TrendingUp,
} from 'lucide-react'

// ─── Animated Counter ─────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
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
  gradient,
  delay,
}: {
  icon: React.ElementType
  title: string
  description: string
  gradient: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card rounded-2xl p-6 group cursor-default"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ background: gradient }}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────

function StatCard({
  value,
  suffix,
  label,
  color,
}: {
  value: number
  suffix: string
  label: string
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="glass-card rounded-2xl p-6 text-center"
    >
      <div className={`text-4xl font-bold font-display mb-1 ${color}`}>
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
    </motion.div>
  )
}

// ─── Floating Particle ────────────────────────────────────────────────────

function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-brand-500/30"
      style={style}
      animate={{
        y: [0, -100, 0],
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
      }}
      transition={{
        duration: Math.random() * 4 + 3,
        repeat: Infinity,
        delay: Math.random() * 5,
        ease: 'easeInOut',
      }}
    />
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────

export default function LandingPage() {
  const features = [
    {
      icon: Upload,
      title: 'Intelligent Document Ingestion',
      description: 'Ingest PDFs, DOCX, scanned images, and 10+ formats with OCR, deduplication, and parallel processing pipelines.',
      gradient: 'linear-gradient(135deg, #3b5fff 0%, #6040d0 100%)',
      delay: 0,
    },
    {
      icon: Brain,
      title: 'RAG-Powered AI Q&A',
      description: 'Ask questions across your document corpus. Every answer includes source citations, confidence scores, and chunk references.',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      delay: 0.1,
    },
    {
      icon: Search,
      title: 'Hybrid Semantic Search',
      description: 'Combine BM25 sparse retrieval + dense vector search + cross-encoder reranking for unmatched retrieval precision.',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #3b5fff 100%)',
      delay: 0.2,
    },
    {
      icon: Shield,
      title: 'Compliance & Risk Analysis',
      description: 'Automatic risk scoring, clause deviation detection, compliance gap identification for legal, finance, and HR workflows.',
      gradient: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)',
      delay: 0.3,
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Risk heatmaps, document analytics, AI usage dashboards, retrieval quality metrics, and compliance reports.',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      delay: 0.4,
    },
    {
      icon: Lock,
      title: 'Enterprise Security',
      description: 'RBAC, JWT + MFA, AES encryption, PII masking, audit trails, GDPR/HIPAA/SOC2-ready architecture.',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #8b5cf6 100%)',
      delay: 0.5,
    },
  ]

  return (
    <div className="min-h-screen bg-surface-300 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-15"
          style={{ background: 'radial-gradient(circle, #3b5fff, transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-[120px] opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full blur-[100px] opacity-8"
          style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />

        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <Particle
            key={i}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 95, 255, 1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 95, 255, 1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b5fff 0%, #8b5cf6 100%)' }}>
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-bold font-display text-foreground">
            DocIntel <span className="text-brand-400">Enterprise</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#architecture" className="hover:text-foreground transition-colors">Architecture</Link>
          <Link href="#security" className="hover:text-foreground transition-colors">Security</Link>
          <Link href="#evaluation" className="hover:text-foreground transition-colors">Evaluation</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
          <Link href="/dashboard" className="btn-primary text-sm">
            Open Platform →
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
          style={{
            background: 'rgba(59, 95, 255, 0.1)',
            border: '1px solid rgba(59, 95, 255, 0.2)',
            color: '#94b4ff',
          }}
        >
          <Zap className="w-3 h-3" />
          Enterprise AI · Production-Grade · SOC2 Ready
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold font-display leading-tight mb-6 max-w-5xl"
        >
          <span className="text-foreground">Enterprise</span>
          {' '}
          <span className="text-gradient">Document Intelligence</span>
          {' '}
          <span className="text-foreground">at Scale</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed"
        >
          The only platform combining OCR pipelines, semantic RAG, multi-LLM orchestration,
          and enterprise-grade security in a single production-ready system.
          Built for legal, finance, HR, and compliance workflows.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/dashboard" className="btn-primary flex items-center gap-2 text-base px-8 py-3">
            Launch Platform
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/docs/architecture"
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            View Architecture
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Hero Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative mt-16 w-full max-w-5xl mx-auto"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 rounded-3xl opacity-20 blur-xl"
            style={{ background: 'linear-gradient(135deg, #3b5fff, #8b5cf6)' }} />

          {/* Dashboard preview */}
          <div className="relative glass-card rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(59, 95, 255, 0.15)' }}>
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 mx-4 px-3 py-1 rounded-md text-xs text-muted-foreground text-center"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                app.docintel.enterprise / dashboard
              </div>
            </div>

            {/* Mock Dashboard UI */}
            <div className="p-6 flex gap-4">
              {/* Sidebar */}
              <div className="w-48 space-y-1">
                {['Dashboard', 'Documents', 'AI Chat', 'Search', 'Analytics', 'Admin'].map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${i === 0 ? 'bg-brand-500/15 text-brand-400' : 'text-muted-foreground'}`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Documents', value: '24,891', color: 'text-brand-400' },
                    { label: 'Queries Today', value: '1,247', color: 'text-purple-400' },
                    { label: 'Avg Faithfulness', value: '94.3%', color: 'text-green-400' },
                    { label: 'Risk Alerts', value: '3', color: 'text-red-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="glass-card rounded-lg p-3">
                      <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Chart mock */}
                <div className="glass-card rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-3">Document Processing Pipeline</div>
                  <div className="flex items-end gap-2 h-16">
                    {[40, 65, 55, 80, 70, 90, 75, 85, 95, 88, 92, 98].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-all"
                        style={{
                          height: `${h}%`,
                          background: `linear-gradient(135deg, #3b5fff ${100 - h}%, #8b5cf6 100%)`,
                          opacity: 0.6 + (h / 300),
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-6 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value={99} suffix="%" label="OCR Accuracy" color="text-gradient-blue" />
          <StatCard value={500} suffix="ms" label="Avg Retrieval Latency" color="text-gradient-green" />
          <StatCard value={94} suffix="%" label="RAG Faithfulness Score" color="text-gradient" />
          <StatCard value={10} suffix="+" label="LLM Providers Supported" color="text-gradient-blue" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="badge badge-blue mx-auto mb-4">Platform Capabilities</div>
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Enterprise-Grade AI for <span className="text-gradient">Every Document Workflow</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From legal contract analysis to insurance claim processing — every workflow
              runs on production-grade AI pipelines with full audit trails.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 md:p-12"
          >
            <div className="text-center mb-10">
              <div className="badge badge-blue mx-auto mb-4">System Architecture</div>
              <h2 className="text-3xl font-bold font-display mb-3">
                Microservices at <span className="text-gradient">Enterprise Scale</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { name: 'API Gateway', desc: 'FastAPI + Auth + RBAC', color: '#3b5fff' },
                { name: 'OCR Service', desc: 'PaddleOCR + Tesseract', color: '#8b5cf6' },
                { name: 'Embed Service', desc: 'BGE + FAISS + Chroma', color: '#0ea5e9' },
                { name: 'RAG Retrieval', desc: 'Hybrid + Reranking', color: '#22c55e' },
                { name: 'LLM Service', desc: 'GPT-4o + Claude + Ollama', color: '#f59e0b' },
              ].map((svc) => (
                <motion.div
                  key={svc.name}
                  whileHover={{ scale: 1.03 }}
                  className="glass-card rounded-xl p-4 text-center cursor-default"
                  style={{ borderColor: `${svc.color}20` }}
                >
                  <div
                    className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center"
                    style={{ background: `${svc.color}20` }}
                  >
                    <div className="w-4 h-4 rounded-sm" style={{ background: svc.color }} />
                  </div>
                  <div className="text-xs font-semibold text-foreground mb-1">{svc.name}</div>
                  <div className="text-[10px] text-muted-foreground">{svc.desc}</div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mt-6 text-xs text-muted-foreground">
              {['PostgreSQL', 'Redis', 'RabbitMQ', 'MinIO', 'Elasticsearch', 'Prometheus', 'Docker/K8s'].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 rounded-full text-xs"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-12"
            style={{ border: '1px solid rgba(59, 95, 255, 0.15)' }}
          >
            {/* Glow */}
            <div className="absolute inset-0 rounded-3xl opacity-10 blur-2xl -z-10"
              style={{ background: 'linear-gradient(135deg, #3b5fff, #8b5cf6)' }} />

            <div className="badge badge-blue mx-auto mb-6">Get Started Now</div>
            <h2 className="text-3xl font-bold font-display mb-4">
              Deploy Your Enterprise AI Stack <br />
              <span className="text-gradient">in Under 5 Minutes</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Clone the repository, configure your environment variables,
              and run <code className="text-brand-400 font-mono">docker compose up</code> to launch all services.
            </p>

            <div className="flex justify-center gap-4">
              <Link href="/dashboard" className="btn-primary flex items-center gap-2 text-base px-8 py-3">
                Launch Platform
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex justify-center gap-6 mt-8 text-xs text-muted-foreground">
              {['GDPR Compliant', 'SOC2 Ready', 'HIPAA Compatible', 'On-premise Supported'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-success" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] px-8 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-500" />
            <span>DocIntel Enterprise © 2025. Production-grade AI Document Intelligence.</span>
          </div>
          <div className="flex gap-4">
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/security" className="hover:text-foreground transition-colors">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
