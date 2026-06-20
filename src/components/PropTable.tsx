import { Table } from 'lucide-react'
import { Eyebrow } from './Eyebrow'

export interface PropRow {
  name: string
  type: string
  def?: string
  desc: string
}

/** A labelled props / options table under a "PROPS" eyebrow. */
export function PropTable({ rows, label = 'PROPS', cols = ['Name', 'Type', 'Default', ''] }: {
  rows: PropRow[]
  label?: string
  cols?: [string, string, string, string]
}) {
  const showDefault = rows.some(r => r.def !== undefined)
  return (
    <div className="export-block">
      <Eyebrow icon={<Table size={12} strokeWidth={1.75} />}>{label}</Eyebrow>
      <table className="prop-table">
        <thead>
          <tr>
            <th>{cols[0]}</th>
            <th>{cols[1]}</th>
            {showDefault ? <th>{cols[2]}</th> : null}
            <th>{cols[3] || 'Description'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.name}>
              <td className="prop-name"><code>{r.name}</code></td>
              <td><span className="prop-type">{r.type}</span></td>
              {showDefault ? <td>{r.def !== undefined ? <code>{r.def}</code> : <span style={{ opacity: 0.4 }}>—</span>}</td> : null}
              <td>{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
