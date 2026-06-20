import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { PropTable } from '@/components/PropTable'
import { findExport } from '@/components/exports'
import { LivePopUp } from '@/components/live/examples'

const e = findExport('/popupbook/interaction/')!

const CODE = `import * as THREE from 'three'
import { PopUpBook } from '@objectifthunes/three-pop-up-book'

const popUpBook = new PopUpBook({ book })

// \`interaction\` is the three-book pointer object that turns pages.
// While the pointer is over a pop-up, page-turning is suppressed.
popUpBook.bindInteraction({
  camera,
  domElement: renderer.domElement,
  bookInteraction: interaction, // { enabled: boolean }
})

// React to a click on a standing pop-up.
popUpBook.onPopUpDown = (element, event) => {
  console.log('clicked pop-up at', element.x, element.z, event.button)
}
popUpBook.onPopUpEnter = (element) => { /* highlight */ }
popUpBook.onPopUpLeave = () => { /* clear highlight */ }

// Manual picking, e.g. from your own raycaster:
const raycaster = new THREE.Raycaster()
raycaster.setFromCamera(pointerNdc, camera)
const hit = popUpBook.hitTest(raycaster) // PopUpElement | null

// Stop listening when you're done.
popUpBook.unbindInteraction()`

export default async function Page() {
  return (
    <ExportPage group={e.group} title={e.name} lede={e.lede}>
      <LivePopUp />
      <Source code={CODE} lang="ts" />
      <PropTable
        label="bindInteraction(options)"
        cols={['Option', 'Type', '', 'Meaning']}
        rows={[
          { name: 'camera', type: 'THREE.Camera', desc: 'The camera used to build the picking ray from pointer coordinates.' },
          { name: 'domElement', type: 'HTMLElement', desc: 'The canvas (or its container). Pointer events are attached here and its getBoundingClientRect drives normalisation.' },
          { name: 'bookInteraction', type: '{ enabled: boolean }', desc: 'The three-book interaction object. It is flipped to false while the pointer hovers a pop-up so a click drags the object, not the page, and restored on leave.' },
        ]}
      />
      <PropTable
        label="CALLBACKS"
        cols={['Callback', 'Signature', '', 'Fires when']}
        rows={[
          { name: 'onPopUpDown', type: '(element: PopUpElement, event: PointerEvent) => void', desc: 'A left-button pointerdown lands on the currently hovered pop-up.' },
          { name: 'onPopUpEnter', type: '(element: PopUpElement) => void', desc: 'The pointer moves onto a pop-up (a new element becomes hovered).' },
          { name: 'onPopUpLeave', type: '() => void', desc: 'The pointer moves off the last hovered pop-up onto nothing.' },
        ]}
      />
      <PropTable
        label="hitTest(raycaster)"
        cols={['Param', 'Type', '', 'Returns']}
        rows={[
          { name: 'raycaster', type: 'THREE.Raycaster', desc: 'A raycaster you have already aimed (setFromCamera). Returns the closest standing pop-up under the ray, or null. Only elements with progress > 0 and a visible pivot are tested.' },
        ]}
      />
      <Notes>
        <p>
          <code>bindInteraction</code> attaches its own <code>pointermove</code> /{' '}
          <code>pointerdown</code> listeners and is the easy path: it drives the hover state, toggles{' '}
          <code>bookInteraction.enabled</code>, sets a pointer cursor, and dispatches the three callbacks.
          Calling it again first unbinds the previous wiring, and{' '}
          <code>unbindInteraction()</code> (also called by <Link href="/popupbook/pop-up-book/">dispose()</Link>)
          removes the listeners and restores page-turning.
        </p>
        <p>
          If you already run a raycaster, skip the listeners and call <code>hitTest(raycaster)</code> yourself
          — it returns the <Link href="/elements/pop-up-element/">PopUpElement</Link> under the ray (or{' '}
          <code>null</code>), walking up from the hit mesh to its owning pivot. Only pop-ups that are actually
          standing are candidates, so hidden ones never intercept clicks.
        </p>
      </Notes>
    </ExportPage>
  )
}
