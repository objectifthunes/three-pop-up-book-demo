import type { ReactNode } from 'react'
import { Eyebrow } from './Eyebrow'
import { GroupIcon } from './groupIcons'
import { groupOf, type GroupId } from './exports'

interface ExportPageProps {
  group: GroupId
  title: string
  lede: ReactNode
  children: ReactNode
}

/** The shared scaffold for every export page: eyebrow + title + lede + body. */
export function ExportPage({ group, title, lede, children }: ExportPageProps) {
  const g = groupOf(group)
  return (
    <article className="export-page">
      <header className="export-page__header">
        <Eyebrow icon={<GroupIcon group={group} />}>{g.label.toUpperCase()}</Eyebrow>
        <h1 className="export-page__title">{title}</h1>
        <p className="export-page__lede">{lede}</p>
      </header>
      <hr className="export-page__rule" />
      <div className="export-page__body">{children}</div>
    </article>
  )
}
