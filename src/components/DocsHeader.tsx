'use client'

import Link from 'next/link'
import { useThemeMode } from './ThemeProvider'
import { ThemeToggle } from './ThemeToggle'

export function DocsHeader() {
  const { theme, toggle } = useThemeMode()
  return (
    <header className="docs-header">
      <Link href="/" className="docs-header__crumb">@objectifthunes/three-pop-up-book</Link>
      <div className="docs-header__actions">
        <a href="https://www.npmjs.com/package/@objectifthunes/three-pop-up-book" target="_blank" rel="noopener noreferrer" className="docs-header__link">npm</a>
        <a href="https://github.com/objectifthunes/three-pop-up-book" target="_blank" rel="noopener noreferrer" className="docs-header__link">repo</a>
        <ThemeToggle theme={theme} onToggle={toggle} />
      </div>
    </header>
  )
}
