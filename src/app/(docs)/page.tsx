import Link from 'next/link'
import { ArrowDownToLine, Code2, PlayCircle, Sparkles } from 'lucide-react'
import { CodeBlock } from '@/components/CodeBlock'
import { Eyebrow } from '@/components/Eyebrow'
import { GROUPS, exportsByGroup, LIB_VERSION, NPM_URL } from '@/components/exports'

const INSTALL = `pnpm add @objectifthunes/three-pop-up-book @objectifthunes/three-book three`

const WIRE_UP = `import { PopUpBook, PopUpScene } from '@objectifthunes/three-pop-up-book'

// you already have a built three-book \`book\`
const popUpBook = new PopUpBook({ book })
popUpBook.bindInteraction({ camera, domElement: renderer.domElement, bookInteraction })

const scene0 = new PopUpScene({ pageWidth: 2, pageHeight: 3 })
popUpBook.setScene(popUpBook.contentPageOffset, scene0)
scene0.addPopUp({ object: myCubeMesh, x: 0.5, z: 1.0, scale: 1 })

// every frame, AFTER book.update(dt):
popUpBook.update(dt)`

const CATEGORY_BLURB: Record<string, string> = {
  start:     'Install, the few-line quick start, and how pop-ups ride along with the turning page.',
  popupbook: 'PopUpBook — the coordinator that wraps a Book, plus interaction and hit-testing.',
  scenes:    'PopUpScene for one page, PopUpSpreadScene for facing pages.',
  elements:  'PopUpElement — any 3D object placed on the page — and the spring animation.',
  reference: 'Every option type in one place.',
  live:      'The full editor with a Pop-Ups tab, and a minimal book with shapes that rise.',
}

export default async function HomePage() {
  return (
    <div className="landing">
      <section className="landing__hero">
        <Eyebrow icon={<Sparkles size={12} strokeWidth={1.75} />}>@OBJECTIFTHUNES/THREE-POP-UP-BOOK · DEMO</Eyebrow>
        <h1 className="landing__title">Pop-ups that rise off the page.</h1>
        <p className="landing__lede">
          A live, source-paired reference for <code>@objectifthunes/three-pop-up-book</code> — 3D objects that
          spring up from the pages of a <Link href="https://objectifthunes.github.io/three-book-demo/">three-book</Link>{' '}
          and fold away as you turn them. Anchor any <code>THREE.Object3D</code> to a page; the library follows the
          paper as it curls. Every export documented, with working examples.
        </p>
        <div className="landing__hero-actions">
          <Link className="landing__cta landing__cta--primary" href="/full/editor/">Open the live editor ↗</Link>
          <Link className="landing__cta" href="/start/quick-start/">Quick start</Link>
          <a className="landing__cta" href={NPM_URL} target="_blank" rel="noopener noreferrer">npm</a>
        </div>
      </section>

      <section>
        <div className="landing__grid">
          {GROUPS.map(g => {
            const items = exportsByGroup(g.id)
            if (items.length === 0) return null
            const first = items[0]
            return (
              <Link key={g.id} href={first.href} className="landing__card">
                <div className="landing__card-row">
                  <span className="landing__card-title">{g.label}</span>
                  <span className="landing__card-count">{items.length} {items.length === 1 ? 'page' : 'pages'}</span>
                </div>
                <p className="landing__card-blurb">{CATEGORY_BLURB[g.id]}</p>
                <span className="landing__card-open">Open →</span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="landing__block">
        <Eyebrow icon={<ArrowDownToLine size={12} strokeWidth={1.75} />}>INSTALL</Eyebrow>
        <CodeBlock code={INSTALL} lang="bash" />
        <Eyebrow icon={<Code2 size={12} strokeWidth={1.75} />}>WIRE-UP</Eyebrow>
        <CodeBlock code={WIRE_UP} lang="ts" />
      </section>

      <section className="landing__skill">
        <div className="landing__skill-header">
          <div>
            <Eyebrow icon={<PlayCircle size={12} strokeWidth={1.75} />}>SEE IT MOVE</Eyebrow>
            <h2 className="landing__skill-title">Two live demos, no install.</h2>
          </div>
          <Link className="landing__skill-cta" href="/full/editor/">Open editor</Link>
        </div>
        <p style={{ color: 'var(--ot-text-secondary)', fontSize: 14 }}>
          The <strong>Interactive editor</strong> is the full three-book studio with an extra <strong>Pop-Ups</strong>{' '}
          tab — add cubes, trees, cones and more, drag them around the page, scale and rotate, even load a GLTF
          model. The <strong>Minimal pop-up</strong> shows the bare mechanism: a couple of shapes that rise as the
          page settles and fold flat as it lifts.
        </p>
        <ul className="landing__skill-bullets">
          <li>Anchor any THREE.Object3D to a page by (x, z)</li>
          <li>Spring pop / collapse synced to the page turn</li>
          <li>Facing-page spreads via PopUpSpreadScene</li>
          <li>Pointer hit-testing + click callbacks</li>
          <li>v{LIB_VERSION} · builds on three-book</li>
          <li>Everything here is on the published package</li>
        </ul>
      </section>
    </div>
  )
}
