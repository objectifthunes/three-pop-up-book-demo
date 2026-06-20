import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { PropTable } from '@/components/PropTable'
import { findExport } from '@/components/exports'

const e = findExport('/reference/types/')!

const CODE = `import type {
  PopUpBookOptions,
  PopUpSceneOptions,
  PopUpSpreadSceneOptions,
  PopUpElementOptions,
  PopUpInteractionOptions,
} from '@objectifthunes/three-pop-up-book'`

export default async function Page() {
  return (
    <ExportPage group={e.group} title={e.name} lede={e.lede}>
      <Source code={CODE} lang="ts" />
      <PropTable
        label="TYPES"
        cols={['Type', 'Shape', '', 'Used by']}
        rows={[
          { name: 'PopUpBookOptions', type: '{ book: Book }', desc: 'new PopUpBook(...) — see PopUpBook.' },
          { name: 'PopUpSceneOptions', type: '{ pageWidth: number; pageHeight: number }', desc: 'new PopUpScene(...) — see PopUpScene.' },
          { name: 'PopUpSpreadSceneOptions', type: '{ pageWidth: number; pageHeight: number }', desc: 'new PopUpSpreadScene(...) — see PopUpSpreadScene.' },
          { name: 'PopUpElementOptions', type: '{ object: THREE.Object3D; x: number; z: number; scale?: number; rotation?: number }', desc: 'scene.addPopUp(...) / new PopUpElement(...) — see PopUpElement.' },
          { name: 'PopUpInteractionOptions', type: '{ camera: THREE.Camera; domElement: HTMLElement; bookInteraction: { enabled: boolean } }', desc: 'popUpBook.bindInteraction(...) — see Interaction.' },
        ]}
      />
      <Notes>
        <p>
          Every public entry point takes a single options object, so these five interfaces are the whole
          input surface. <code>scale</code> and <code>rotation</code> on{' '}
          <Link href="/elements/pop-up-element/">PopUpElementOptions</Link> are optional (default{' '}
          <code>1</code> and <code>0</code>); <code>rotation</code> is in radians about the page-up axis.
          For the spread variant, <code>pageWidth</code> is the width of one page — pop-ups with an{' '}
          <code>x</code> past it land on the right group.
        </p>
        <p>
          Follow a row to the class that consumes it:{' '}
          <Link href="/popupbook/pop-up-book/">PopUpBook</Link>,{' '}
          <Link href="/scenes/pop-up-scene/">PopUpScene</Link>,{' '}
          <Link href="/scenes/spread-scene/">PopUpSpreadScene</Link>,{' '}
          <Link href="/elements/pop-up-element/">PopUpElement</Link>, and{' '}
          <Link href="/popupbook/interaction/">Interaction</Link>.
        </p>
      </Notes>
    </ExportPage>
  )
}
