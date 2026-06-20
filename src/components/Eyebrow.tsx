import type { ReactNode } from 'react'

/** A small uppercase mono label with an optional leading icon. */
export function Eyebrow({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="eyebrow">
      {icon ? <span className="eyebrow__icon" aria-hidden>{icon}</span> : null}
      <span>{children}</span>
    </div>
  )
}
