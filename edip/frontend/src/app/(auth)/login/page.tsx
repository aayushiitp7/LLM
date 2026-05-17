'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Mail, Lock, ArrowRight, ShieldCheck, Fingerprint } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials')
  const [mfaCode, setMfaCode] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setStep('mfa')
    }, 800)
  }

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      router.push('/dashboard')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[380px] relative z-10"
      >
        <div className="bg-popover border border-border p-8 rounded-xl shadow-modal">
          
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary text-primary-foreground shadow-subtle">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-foreground mb-2">
              {step === 'credentials' ? 'Sign in to DocIntel' : 'Two-Factor Authentication'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 'credentials' 
                ? 'Enter your enterprise credentials.' 
                : 'Enter the 6-digit authenticator code.'}
            </p>
          </div>

          {step === 'credentials' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-0.5">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-ring transition-colors shadow-subtle"
                    placeholder="name@enterprise.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-0.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                  <Link href="#" className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-all">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-ring transition-colors shadow-subtle"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="btn-primary w-full mt-6 py-2.5"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfa} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-0.5">Authentication Code</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-3 text-center tracking-[0.5em] text-lg font-mono text-foreground focus:outline-none focus:border-ring transition-colors shadow-subtle"
                    placeholder="000000"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || mfaCode.length !== 6}
                className="btn-primary w-full mt-6 py-2.5"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    Verify Identity
                    <Fingerprint className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="w-full text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors"
              >
                Back to login
              </button>
            </form>
          )}

        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6 uppercase tracking-wider font-semibold">
          Secured by DocIntel Enterprise
        </p>
      </motion.div>
    </div>
  )
}
