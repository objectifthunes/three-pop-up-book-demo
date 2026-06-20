import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { PropTable } from '@/components/PropTable'
import { findExport } from '@/components/exports'

const e = findExport('/scenes/pop-up-scene/')!

const CODE = `import * as THREE from 'three'
import { PopUpScene } from '@objectifthunes/three-pop-up-book'

// One scene holds the pop-ups for a single page side.
const scene = new PopUpScene({ pageWidth: 4, pageHeight: 6 })

// Attach it to a page side of the PopUpBook.
// pageIndex = paperIndex * 2 + side  (0 = front, 1 = back)
popUpBook.setScene(2, scene)

// Add a pop-up: any THREE.Object3D, placed in page space (x, z).
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(0.35, 0.35, 0.35),
  new THREE.MeshStandardMaterial({ color: '#e85050' }),
)
const element = scene.addPopUp({ object: cube, x: 2, z: 3 })

// Move / scale / rotate it later through the scene...
scene.updatePopUp(element, { x: 1.5, scale: 1.4 })

// ...or set the same fields on the element directly.
element.rotation = Math.PI / 4

// PopUpBook.update(dt) calls setProgress for you as pages turn,
// but you can drive it by hand: 0 = hidden, > 0 = visible.
scene.setProgress(1)

// Release every element's pivot when you tear the page down.
scene.dispose()`

export default async function Page() {
  return (
    <ExportPage group={e.group} title={e.name} lede={e.lede}>
      <Source code={CODE} lang="ts" />
      <PropTable
        label="CONSTRUCTOR — new PopUpScene(options)"
        cols={['Option', 'Type', '', 'Meaning']}
        rows={[
          { name: 'pageWidth', type: 'number', desc: 'Width of the page this scene sits on, in book units. Stored for layout; pop-up x is given in this space.' },
          { name: 'pageHeight', type: 'number', desc: 'Height of the page, in book units. Pop-up z is given in this space.' },
        ]}
      />
      <PropTable
        label="PROPERTIES"
        cols={['Property', 'Type', '', 'Meaning']}
        rows={[
          { name: 'group', type: 'THREE.Group', desc: 'The container added to the book. setScene() parents this under the Book; every pop-up pivot is a child of it.' },
          { name: 'popUps', type: 'readonly PopUpElement[]', desc: 'The live elements in this scene, in insertion order. Read-only — go through addPopUp / removePopUp to change it.' },
          { name: 'pageWidth', type: 'number (get/set)', desc: 'The page width passed at construction. Settable if the page is resized.' },
          { name: 'pageHeight', type: 'number (get/set)', desc: 'The page height passed at construction. Settable if the page is resized.' },
        ]}
      />
      <PropTable
        label="METHODS"
        cols={['Method', 'Signature', '', 'What it does']}
        rows={[
          { name: 'addPopUp', type: '(options: PopUpElementOptions) => PopUpElement', desc: 'Constructs a PopUpElement, stores it in popUps and adds its pivot to group. Returns the element so you can keep a handle on it.' },
          { name: 'removePopUp', type: '(element: PopUpElement) => void', desc: 'Drops the element from popUps and disposes it (removing its pivot). A no-op if the element is not in this scene.' },
          { name: 'updatePopUp', type: '(element, options: Partial<PopUpElementOptions>) => void', desc: 'Applies any of x / z / scale / rotation that are present. object cannot be swapped this way.' },
          { name: 'setProgress', type: '(t: number) => void', desc: 'Broadcasts a target to every element: 0 hides them, any value > 0 makes them rise. PopUpBook calls this each frame.' },
          { name: 'dispose', type: '() => void', desc: 'Disposes every element, empties popUps and removes group from its parent. Call when the scene is gone for good.' },
        ]}
      />
      <Notes>
        <p>
          A <code>PopUpScene</code> is the bag of pop-ups for one side of one page. You rarely place its{' '}
          <code>group</code> yourself — hand the scene to{' '}
          <Link href="/popupbook/pop-up-book/">PopUpBook</Link> via <code>setScene(pageIndex, scene)</code> and the
          coordinator parents the group, then positions and reveals each element as the page turns.
        </p>
        <p>
          Coordinates are page-local: <code>x</code> runs across <code>pageWidth</code>, <code>z</code> runs down{' '}
          <code>pageHeight</code>, and each <Link href="/elements/pop-up-element/">PopUpElement</Link> grows upward
          from the page surface. For a pop-up that straddles two facing pages, reach for{' '}
          <Link href="/scenes/spread-scene/">PopUpSpreadScene</Link> instead.
        </p>
      </Notes>
    </ExportPage>
  )
}
