import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { PropTable } from '@/components/PropTable'
import { findExport } from '@/components/exports'

const e = findExport('/popupbook/pop-up-book/')!

const CODE = `import { PopUpBook, PopUpScene } from '@objectifthunes/three-pop-up-book'

// \`book\` is an already-built three-book (book.init() has run).
const popUpBook = new PopUpBook({ book })

// Attach a scene to the first content page (past the front covers).
const scene = new PopUpScene({ pageWidth: 6, pageHeight: 8 })
popUpBook.setScene(popUpBook.contentPageOffset, scene)

// Render loop — ALWAYS after book.update(dt).
function animate(dt: number) {
  book.update(dt)
  popUpBook.update(dt)
}

// Detach a page's pop-ups, or tear the whole thing down.
popUpBook.removeScene(popUpBook.contentPageOffset)
popUpBook.dispose()`

export default async function Page() {
  return (
    <ExportPage group={e.group} title={e.name} lede={e.lede}>
      <Source code={CODE} lang="ts" />
      <PropTable
        label="CONSTRUCTOR"
        cols={['Option', 'Type', '', 'Meaning']}
        rows={[
          { name: 'book', type: 'Book', desc: 'The three-book to wrap. It must be built (init() called) before update() does anything — a not-yet-built book makes update() a no-op.' },
        ]}
      />
      <PropTable
        label="PROPERTIES"
        cols={['Property', 'Type', '', 'Meaning']}
        rows={[
          { name: 'book', type: 'Book (readonly)', desc: 'The wrapped book, the same instance you passed in.' },
          { name: 'contentPageOffset', type: 'number (readonly)', desc: 'Absolute page index where content begins, past the front cover papers. The natural place to attach your first scene.' },
          { name: 'frontCoverCount', type: 'number (readonly)', desc: 'How many front-cover papers to turn past when opening — pass it to book.startAutoTurning(0, settings, popUpBook.frontCoverCount).' },
          { name: 'onPopUpDown', type: '(element, event) => void', desc: 'Optional. Fired when a visible pop-up is clicked. See Interaction.' },
          { name: 'onPopUpEnter / onPopUpLeave', type: '(element) => void / () => void', desc: 'Optional hover callbacks. See Interaction.' },
        ]}
      />
      <PropTable
        label="METHODS"
        cols={['Method', 'Signature', '', 'What it does']}
        rows={[
          { name: 'setScene', type: '(pageIndex: number, scene: PopUpScene) => void', desc: 'Bind a scene to a page side (pageIndex = paperIndex * 2 + side). Adds the scene group to the book if it is not already parented.' },
          { name: 'removeScene', type: '(pageIndex: number) => void', desc: 'Detach the scene at that page index and remove its group from the book.' },
          { name: 'update', type: '(dt: number) => void', desc: 'Read the live paper transforms and position / animate every visible pop-up. Call once per frame, AFTER book.update(dt), with the same dt.' },
          { name: 'bindInteraction / unbindInteraction', type: '(options) => void / () => void', desc: 'Wire or remove pointer picking. See Interaction.' },
          { name: 'hitTest', type: '(raycaster) => PopUpElement | null', desc: 'Raycast against the visible pop-ups. See Interaction.' },
          { name: 'dispose', type: '() => void', desc: 'Unbind interaction and detach every scene group from the book. Does not dispose the book itself.' },
        ]}
      />
      <Notes>
        <p>
          <code>PopUpBook</code> draws nothing — it is a positioner. Each frame{' '}
          <code>update(dt)</code> inspects which sheets are face-up, sets each scene&apos;s visibility
          progress, and writes a world transform onto every standing pop-up so it tracks the page surface,
          even mid-curl. That only works if the book has already moved this frame, so the call order is
          fixed: <code>book.update(dt)</code> first, then <code>popUpBook.update(dt)</code>. If the book is
          not built yet, <code>update()</code> returns immediately.
        </p>
        <p>
          Attach pop-ups with <Link href="/scenes/pop-up-scene/">PopUpScene</Link> via{' '}
          <code>setScene</code>, and add pointer behaviour through{' '}
          <Link href="/popupbook/interaction/">Interaction &amp; hit-testing</Link>.
        </p>
      </Notes>
    </ExportPage>
  )
}
