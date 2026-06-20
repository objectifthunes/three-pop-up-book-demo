'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brand } from './Brand'
import { GROUPS, exportsByGroup } from './exports'
import { GroupIcon } from './groupIcons'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar" aria-label="Component navigation">
      <div className="sidebar__brand">
        <Brand />
      </div>
      <nav className="sidebar__nav">
        {GROUPS.map(g => {
          const items = exportsByGroup(g.id)
          if (items.length === 0) return null
          return (
            <section key={g.id} className="sidebar__group">
              <div className="sidebar__group-heading">
                <span className="sidebar__group-icon" aria-hidden><GroupIcon group={g.id} size={11} /></span>
                {g.label}
              </div>
              <ul className="sidebar__list">
                {items.map(item => {
                  const active = pathname === item.href || pathname === item.href.replace(/\/$/, '')
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`sidebar__link${active ? ' is-active' : ''}`}
                      >
                        <span className="sidebar__link-name">{item.name}</span>
                        {item.badge ? <span className={`sidebar__badge sidebar__badge--${item.badge.toLowerCase().replace('-', '')}`}>{item.badge}</span> : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </nav>
    </aside>
  )
}
