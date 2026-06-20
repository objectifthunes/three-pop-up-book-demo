'use client'

import { forwardRef, type ReactNode } from 'react'
import { Eye } from 'lucide-react'
import { Eyebrow } from '../Eyebrow'

/** A framed, in-page live canvas with an optional controls strip — themed to the docs. */
export const LiveStage = forwardRef<HTMLDivElement, {
  controls?: ReactNode
  hint?: string
  tall?: boolean
}>(function LiveStage({ controls, hint, tall }, ref) {
  return (
    <div className="export-block">
      <Eyebrow icon={<Eye size={12} strokeWidth={1.75} />}>LIVE</Eyebrow>
      <div className="live">
        <div ref={ref} className={`live__stage${tall ? ' live__stage--tall' : ''}`} aria-label="Interactive 3D example" />
        {hint ? <p className="live__hint">{hint}</p> : null}
        {controls ? <div className="live__controls">{controls}</div> : null}
      </div>
    </div>
  )
})
