import { Sparkles } from 'lucide-react'
import { ExportPage } from '@/components/ExportPage'
import { FullScreenPreview } from '@/components/Preview'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/live/minimal/')!

const CODE = `import { PopUpBook, PopUpScene } from '@objectifthunes/three-pop-up-book'

// 'book' is a built three-book; 'interaction' is its BookPointerInteraction
const popUpBook = new PopUpBook({ book })
popUpBook.bindInteraction({ camera, domElement: renderer.domElement, bookInteraction: interaction })

const scene = new PopUpScene({ pageWidth: 2, pageHeight: 3 })
popUpBook.setScene(popUpBook.contentPageOffset, scene)
scene.addPopUp({ object: makeShape('cube'),   x: 0.5, z: 1.0, scale: 1 })
scene.addPopUp({ object: makeShape('cone'),   x: 1.3, z: 0.7, scale: 1.2 })
scene.addPopUp({ object: makeShape('sphere'), x: 0.9, z: 2.0, scale: 1 })

// open past the covers, then drive the coordinator each frame
book.startAutoTurning(0, settings, popUpBook.frontCoverCount)
function animate() {
  requestAnimationFrame(animate)
  for (const b of Book.instances) b.update(dt)
  popUpBook.update(dt)            // positions + animates every pop-up
  renderer.render(scene3d, camera)
}`

export default async function Page() {
  return (
    <ExportPage group={e.group} title={e.name} lede={e.lede}>
      <FullScreenPreview href="/full/minimal/" illustration={<Sparkles size={40} strokeWidth={1.25} />} />
      <Source code={CODE} lang="ts" />
      <Notes>
        <p>
          One <code>PopUpScene</code> attached to the first content page, three meshes added with{' '}
          <code>addPopUp(&#123; object, x, z, scale &#125;)</code>. The book auto-opens past its covers; as the page
          settles flat, the shapes spring up — and they fold away again the moment you start to turn it.
        </p>
        <p>
          The one rule: call <code>popUpBook.update(dt)</code> every frame <em>after</em> <code>book.update(dt)</code>,
          so the pop-ups read the page&apos;s final transform for that frame.
        </p>
      </Notes>
    </ExportPage>
  )
}
