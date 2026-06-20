import Link from 'next/link'
import { LIB_VERSION, TOTAL_EXPORTS } from './exports'

/** Sidebar brand block — small mark, "LIBRARY" eyebrow, name, version + page count. */
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="@objectifthunes/three-pop-up-book home">
      <span className="brand__mark" aria-hidden>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 8C13.5 6.4 8.5 6.4 6 7.4V25c2.5-1 7.5-1 10 .6 2.5-1.6 7.5-1.6 10-.6V7.4C23.5 6.4 18.5 6.4 16 8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M16 8v17.6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M13 17l3-4 3 4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </span>
      <span className="brand__text">
        <span className="brand__eyebrow">LIBRARY · POP-UP</span>
        <span className="brand__name">@objectifthunes/three-pop-up-book</span>
        <span className="brand__meta">v{LIB_VERSION} · {TOTAL_EXPORTS} pages</span>
      </span>
    </Link>
  )
}
