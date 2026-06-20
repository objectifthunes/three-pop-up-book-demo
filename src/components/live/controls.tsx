'use client'

import type { ReactNode } from 'react'

/** A horizontal strip of live controls. */
export function LiveRow({ children }: { children: ReactNode }) {
  return <div className="live-row">{children}</div>
}

export function LiveButton({ onClick, children, active, disabled }: {
  onClick?: () => void
  children: ReactNode
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button type="button" className={`live-btn${active ? ' is-active' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export function LiveSlider({ label, min, max, step = 1, value, onChange, format }: {
  label: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <label className="live-slider">
      <span className="live-slider__label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="live-slider__value">{format ? format(value) : value}</span>
    </label>
  )
}

export function LiveToggle({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="live-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export function LiveSwatch({ label, value, onChange }: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="live-swatch">
      <span className="live-swatch__label">{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function LiveReadout({ label, value }: { label: string; value: ReactNode }) {
  return (
    <span className="live-readout">
      <span className="live-readout__label">{label}</span>
      <span className="live-readout__value">{value}</span>
    </span>
  )
}
