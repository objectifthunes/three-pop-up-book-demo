import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { PropTable } from '@/components/PropTable'
import { findExport } from '@/components/exports'
import { LivePopUp } from '@/components/live/examples'

const e = findExport('/start/concepts/')!

const CODE = `// pageIndex addresses one SIDE of one sheet of paper:
//   pageIndex = paperIndex * 2 + side    (side: 0 = front, 1 = back)

const front = popUpBook.contentPageOffset       // first content page, front side
const back  = popUpBook.contentPageOffset + 1   // same sheet, back side

popUpBook.setScene(front, new PopUpScene({ pageWidth, pageHeight }))
popUpBook.setScene(back,  new PopUpScene({ pageWidth, pageHeight }))`

export default async function Page() {
  return (
    <ExportPage group={e.group} title={e.name} lede={e.lede}>
      <LivePopUp />
      <Notes>
        <p>
          The library is three small pieces stacked on top of a{' '}
          <Link href="/popupbook/pop-up-book/">three-book</Link>. A <code>PopUpBook</code> is a coordinator:
          it wraps a <code>Book</code> but draws nothing of its own. Every frame, after the book has moved,
          it reads each sheet&apos;s transform and decides which pop-ups should be standing.
        </p>
        <p>
          Pop-ups are grouped per page side. A <code>PopUpScene</code> holds the pop-ups for one side of one
          sheet, keyed by a <code>pageIndex</code> of <code>paperIndex * 2 + side</code> (side 0 = front,
          1 = back). Each pop-up inside is a <code>PopUpElement</code> wrapping any{' '}
          <code>THREE.Object3D</code>, placed at an <code>(x, z)</code> position measured across the page.
        </p>
      </Notes>
      <Source code={CODE} lang="ts" />
      <PropTable
        label="THE PIECES"
        cols={['Piece', 'Type', '', 'Role']}
        rows={[
          { name: 'PopUpBook', type: 'class', desc: 'The coordinator. Wraps one Book, owns the scenes, and on every update(dt) positions and animates the visible pop-ups so they ride the page as it curls.' },
          { name: 'PopUpScene', type: 'class', desc: 'The pop-ups for a single page side, keyed by pageIndex. Add / update / remove elements and broadcast a 0…1 visibility progress to all of them.' },
          { name: 'PopUpSpreadScene', type: 'class', desc: 'A convenience that splits one logical spread into left and right THREE.Group nodes — for pop-ups that straddle two facing pages.' },
          { name: 'PopUpElement', type: 'class', desc: 'One pop-up: a THREE.Object3D placed at (x, z), with scale and rotation, that springs up from height 0 to full and collapses again.' },
          { name: 'springProgress', type: '(t: number) => number', desc: 'The elastic ease-out powering the pop bounce — overshoots past 1 then settles. The shared easing behind every animated element.' },
        ]}
      />
      <Notes>
        <p>
          Because the coordinator drives positioning from the live paper transforms, pop-ups follow the page
          as it curls during a turn and snap flat (progress 0) the instant a sheet is lifted, then spring back
          up when it settles face-up. You never set their world position by hand — you give an{' '}
          <code>(x, z)</code> on the page and <code>PopUpBook.update(dt)</code> does the rest.
        </p>
        <p>
          From here: <Link href="/popupbook/pop-up-book/">PopUpBook</Link> covers the coordinator&apos;s
          properties and method ordering, <Link href="/popupbook/interaction/">Interaction</Link> covers
          pointer picking, and <Link href="/reference/types/">Types</Link> lists every option shape.
        </p>
      </Notes>
    </ExportPage>
  )
}
