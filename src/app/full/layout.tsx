import Link from 'next/link'
import type { ReactNode } from 'react'

export default function FullScreenLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Link href="/" className="full-back" aria-label="Back to docs">← Back to docs</Link>
      {children}
    </>
  )
}
