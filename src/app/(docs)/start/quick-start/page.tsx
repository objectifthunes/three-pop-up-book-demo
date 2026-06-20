import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { PropTable } from '@/components/PropTable'
import { FullScreenPreview } from '@/components/Preview'
import { findExport } from '@/components/exports'

const e = findExport('/start/quick-start/')!

const CODE = `import * as THREE from 'three'
import { AutoTurnSettings } from '@objectifthunes/three-book'
import { PopUpBook, PopUpScene } from '@objectifthunes/three-pop-up-book'

// You already have a built three-book \`book\` (book.init() called) added to
// your scene, plus the pointer interaction object that turns its pages.
const popUpBook = new PopUpBook({ book })
popUpBook.bindInteraction({ camera, domElement: renderer.domElement, bookInteraction: interaction })

// One scene per page side. Place pop-ups on the first content page.
const scene = new PopUpScene({ pageWidth: params.pageWidth, pageHeight: params.pageHeight })
popUpBook.setScene(popUpBook.contentPageOffset, scene)

const cube = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial())
scene.addPopUp({ object: cube, x: 1, z: 1.5, scale: 1 })

// Open past the front covers so the content page is face-up.
const settings = new AutoTurnSettings()
book.startAutoTurning(0, settings, popUpBook.frontCoverCount)

// Render loop — update the pop-ups AFTER the book each frame.
const clock = new THREE.Clock()
function animate() {
  requestAnimationFrame(animate)
  const dt = clock.getDelta()
  book.update(dt)
  popUpBook.update(dt)
  renderer.render(scene3d, camera)
}
animate()`

export default async function Page() {
  return (
    <ExportPage group={e.group} title={e.name} lede={e.lede}>
      <Source code="pnpm add @objectifthunes/three-pop-up-book @objectifthunes/three-book three" lang="bash" />
      <Source code={CODE} lang="ts" />
      <PropTable
        label="THE FIVE STEPS"
        cols={['Step', 'Call', '', 'Why']}
        rows={[
          { name: 'wrap', type: 'new PopUpBook({ book })', desc: 'Create the coordinator around a built Book.' },
          { name: 'wire', type: 'bindInteraction({ camera, domElement, bookInteraction })', desc: 'Pointer picking, and pause page-turning while hovering a pop-up.' },
          { name: 'scene', type: 'new PopUpScene({ pageWidth, pageHeight })', desc: 'A container for the pop-ups on one page side.' },
          { name: 'attach', type: 'setScene(pageIndex, scene)', desc: 'Bind that scene to a page index — start at contentPageOffset.' },
          { name: 'add', type: 'scene.addPopUp({ object, x, z, scale })', desc: 'Place any THREE.Object3D at (x, z) on the page.' },
        ]}
      />
      <Notes>
        <p>
          A pop-up is only visible when its page is face-up on the open stack. A freshly built book is closed
          on its front cover, so open past the covers first — <code>book.startAutoTurning(0, settings,
          popUpBook.frontCoverCount)</code> turns exactly the front-cover papers and leaves the first content
          page showing. Place your first scene at <code>popUpBook.contentPageOffset</code> to land on it.
        </p>
        <p>
          Ordering matters in the loop: <code>book.update(dt)</code> advances the page physics, then{' '}
          <code>popUpBook.update(dt)</code> reads the resulting paper transforms and re-positions every visible
          pop-up. See <Link href="/popupbook/pop-up-book/">PopUpBook</Link> for the full surface and{' '}
          <Link href="/scenes/pop-up-scene/">PopUpScene</Link> for managing the pop-ups on a page.
        </p>
      </Notes>
      <FullScreenPreview href="/full/editor/" illustration={null} />
    </ExportPage>
  )
}
