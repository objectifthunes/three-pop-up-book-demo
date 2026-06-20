import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { PropTable } from '@/components/PropTable'
import { findExport } from '@/components/exports'

const e = findExport('/scenes/spread-scene/')!

const CODE = `import * as THREE from 'three'
import { PopUpSpreadScene } from '@objectifthunes/three-pop-up-book'

// A spread covers two facing pages. pageWidth is the width of ONE page.
const spread = new PopUpSpreadScene({ pageWidth: 4, pageHeight: 6 })

// Add the spread's two halves to your scene graph (or to a book group).
parent.add(spread.left, spread.right)

// x < pageWidth lands on the left half; x >= pageWidth lands on the right
// half (and is re-based to that group's local origin automatically).
const arch = new THREE.Mesh(/* ...tall arch mesh... */)
spread.addPopUp({ object: arch, x: 4, z: 3 })   // straddles the gutter

// Same surface as PopUpScene: update / remove / broadcast progress.
spread.setProgress(1)

// Re-flow when the page size changes (pageWidth is per page).
spread.resize(5, 7)

spread.dispose()`

export default async function Page() {
  return (
    <ExportPage group={e.group} title={e.name} lede={e.lede}>
      <Source code={CODE} lang="ts" />
      <PropTable
        label="CONSTRUCTOR — new PopUpSpreadScene(options)"
        cols={['Option', 'Type', '', 'Meaning']}
        rows={[
          { name: 'pageWidth', type: 'number', desc: 'Width of a SINGLE page. The internal scene spans pageWidth * 2; x < pageWidth is the left page, x >= pageWidth the right.' },
          { name: 'pageHeight', type: 'number', desc: 'Height of the spread, in book units. Pop-up z is given in this space.' },
        ]}
      />
      <PropTable
        label="PROPERTIES"
        cols={['Property', 'Type', '', 'Meaning']}
        rows={[
          { name: 'left', type: 'THREE.Group', desc: 'Container for pop-ups on the left page. Add it to your scene graph or book group.' },
          { name: 'right', type: 'THREE.Group', desc: 'Container for pop-ups on the right page. Elements placed at x >= pageWidth are re-based into this group.' },
          { name: 'popUps', type: 'readonly PopUpElement[]', desc: 'Every element across both halves, in insertion order. Read-only.' },
          { name: 'pageWidth', type: 'number (get)', desc: 'The per-page width last set via the constructor or resize().' },
          { name: 'pageHeight', type: 'number (get)', desc: 'The spread height last set via the constructor or resize().' },
        ]}
      />
      <PropTable
        label="METHODS"
        cols={['Method', 'Signature', '', 'What it does']}
        rows={[
          { name: 'addPopUp', type: '(options: PopUpElementOptions) => PopUpElement', desc: 'Adds a pop-up, then routes its pivot to left or right based on x and re-bases right-side x to the right group. Returns the element.' },
          { name: 'removePopUp', type: '(element: PopUpElement) => void', desc: 'Removes and disposes the element. Delegates to the inner PopUpScene.' },
          { name: 'updatePopUp', type: '(element, options: Partial<PopUpElementOptions>) => void', desc: 'Applies any of x / z / scale / rotation present in options.' },
          { name: 'setProgress', type: '(t: number) => void', desc: 'Broadcasts a target to every element across both halves: 0 hides, > 0 reveals.' },
          { name: 'resize', type: '(pageWidth: number, pageHeight: number) => void', desc: 'Updates the per-page width (internal span becomes pageWidth * 2) and the height.' },
          { name: 'dispose', type: '() => void', desc: 'Disposes the inner scene and detaches both left and right groups.' },
        ]}
      />
      <Notes>
        <p>
          <code>PopUpSpreadScene</code> is a convenience wrapper around a double-width{' '}
          <Link href="/scenes/pop-up-scene/">PopUpScene</Link>, built for pop-ups that sit across — or span — a
          two-page spread: a bridge over the gutter, a single tall structure rising from both leaves, a banner
          stretched between the pages.
        </p>
        <p>
          The split point is <code>pageWidth</code>. Place an element at <code>x &lt; pageWidth</code> and its pivot
          joins <code>left</code>; place it at <code>x &gt;= pageWidth</code> and it joins <code>right</code>, with
          its x re-based to that group&apos;s local origin. The rest of the surface — <code>popUps</code>,{' '}
          <code>addPopUp</code>, <code>removePopUp</code>, <code>updatePopUp</code>, <code>setProgress</code>,{' '}
          <code>dispose</code> — mirrors <code>PopUpScene</code>, so anything you know there carries straight over.
        </p>
      </Notes>
    </ExportPage>
  )
}
