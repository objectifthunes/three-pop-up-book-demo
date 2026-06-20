import type { ReactNode } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { DocsHeader } from '@/components/DocsHeader'

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="docs-shell">
      <Sidebar />
      <div className="docs-main">
        <DocsHeader />
        <main className="docs-content">{children}</main>
      </div>
    </div>
  )
}
