import { Sparkles } from 'lucide-react'
import { ExportPage } from '@/components/ExportPage'
import { FullScreenPreview } from '@/components/Preview'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/live/editor/')!

const CODE = `// The studio is the three-book editor + a Pop-Ups tab that drives a PopUpBook.
const popUpBook = new PopUpBook({ book })
popUpBook.bindInteraction({ camera, domElement: renderer.domElement, bookInteraction })

const scene = new PopUpScene({ pageWidth, pageHeight })
popUpBook.setScene(popUpBook.contentPageOffset, scene)
scene.addPopUp({ object: createPrimitive('tree'), x: 1.5, z: 0.7, scale: 1.3 })

// every frame, after book.update(dt):
popUpBook.update(dt)`

export default async function Page() {
  return (
    <ExportPage group={e.group} title={e.name} lede={e.lede}>
      <FullScreenPreview href="/full/editor/" illustration={<Sparkles size={40} strokeWidth={1.25} />} />
      <Source code={CODE} lang="ts" />
      <Notes>
        <p>
          The editor is the library&apos;s full Vite demo, ported verbatim. It is the entire three-book studio —
          <strong> Book</strong>, <strong>Textures</strong> and <strong>Editor</strong> tabs — plus a fourth{' '}
          <strong>Pop-Ups</strong> tab: pick a page, add primitives (cube, tree, cone, sphere, star, cylinder) or
          load a GLTF model, then drag to place, scale and rotate them.
        </p>
        <p>
          The book auto-opens past its covers so the first content page&apos;s pop-ups rise into view. Everything
          maps onto the real API — <code>PopUpBook</code>, <code>PopUpScene</code> and <code>PopUpElement</code> —
          and runs entirely client-side.
        </p>
      </Notes>
    </ExportPage>
  )
}
