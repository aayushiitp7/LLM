'use client'

import * as React from 'react'

// Stub auth provider — NextAuth API routes are not configured on this deployment.
// Replace with real SessionProvider once /api/auth is wired to the backend.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
