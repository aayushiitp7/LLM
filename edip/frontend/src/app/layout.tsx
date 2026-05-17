import type { Metadata, Viewport } from 'next'
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from 'react-hot-toast'
import './globals.css'

// ─── Font Configuration ────────────────────────────────────────────────────

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  preload: true,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: false,
})

// ─── Metadata ──────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: 'DocIntel Enterprise — Document Intelligence Platform',
    template: '%s | DocIntel Enterprise',
  },
  description:
    'Enterprise-grade AI-powered document intelligence platform with OCR, semantic search, RAG-powered Q&A, compliance analysis, and real-time analytics.',
  keywords: [
    'enterprise document intelligence',
    'RAG',
    'retrieval augmented generation',
    'document analysis',
    'OCR',
    'compliance',
    'semantic search',
    'AI documents',
    'contract analysis',
  ],
  authors: [{ name: 'EDIP Engineering Team' }],
  creator: 'EDIP Engineering',
  robots: {
    index: false,  // Enterprise app — keep private
    follow: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f1120' },
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
  ],
}

// ─── Root Layout ──────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(228, 28%, 10%)',
                    color: 'hsl(220, 15%, 93%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-inter)',
                  },
                  success: {
                    iconTheme: { primary: '#22c55e', secondary: 'transparent' },
                  },
                  error: {
                    iconTheme: { primary: '#ef4444', secondary: 'transparent' },
                  },
                  loading: {
                    iconTheme: { primary: '#3b5fff', secondary: 'transparent' },
                  },
                }}
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
