import Link from 'next/link'
import type { ReactNode } from 'react'
import { Eye } from 'lucide-react'
import { Eyebrow } from './Eyebrow'

/** A bordered surface that frames a live component example, with a "PREVIEW" eyebrow. */
export function Preview({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  return (
    <div className="export-block">
      <Eyebrow icon={<Eye size={12} strokeWidth={1.75} />}>PREVIEW</Eyebrow>
      <div className={`preview${padded ? '' : ' preview--bare'}`}>{children}</div>
    </div>
  )
}

/** A preview block for FULL-SCREEN exports — shows a still + a link to the live demo. */
export function FullScreenPreview({
  href,
  illustration,
}: {
  href: string
  illustration: ReactNode
}) {
  return (
    <div className="export-block">
      <Eyebrow icon={<Eye size={12} strokeWidth={1.75} />}>PREVIEW</Eyebrow>
      <div className="preview preview--fullscreen">
        <div className="preview__illustration">{illustration}</div>
        <Link className="preview__open" href={href}>Open full-screen demo ↗</Link>
      </div>
    </div>
  )
}
