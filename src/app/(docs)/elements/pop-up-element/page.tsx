import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { PropTable } from '@/components/PropTable'
import { findExport } from '@/components/exports'

const e = findExport('/elements/pop-up-element/')!

const CODE = `import * as THREE from 'three'
import { PopUpElement } from '@objectifthunes/three-pop-up-book'

// Build the object you want to rise off the page. The model should sit ON
// the page plane (y = 0) and grow upward — pop-up height scales along +Y.
const mesh = new THREE.Mesh(
  new THREE.ConeGeometry(0.2, 0.5, 8).translate(0, 0.25, 0),
  new THREE.MeshStandardMaterial({ color: '#50a0e8' }),
)

// Usually you create elements through a scene...
const element = scene.addPopUp({ object: mesh, x: 2, z: 3, scale: 1.2 })

// ...but the constructor is public if you manage pivots yourself:
const custom = new PopUpElement({ object: mesh, x: 2, z: 3, rotation: Math.PI / 6 })
parent.add(custom.pivot)   // the pivot, not the object, goes in the graph

// Move it around at any time (page-local coordinates).
element.x = 1.5
element.scale = 1.6
element.rotation = Math.PI / 4

// Drive the pop yourself: > 0 rises, 0 collapses.
element.setProgress(1)

// PopUpBook.update(dt) advances the animation each frame.
element.update(dt)

element.dispose()`

export default async function Page() {
  return (
    <ExportPage group={e.group} title={e.name} lede={e.lede}>
      <Source code={CODE} lang="ts" />
      <PropTable
        label="CONSTRUCTOR — new PopUpElement(options)"
        cols={['Option', 'Type', '', 'Meaning']}
        rows={[
          { name: 'object', type: 'THREE.Object3D', desc: 'Your mesh, group or loaded GLTF scene. Becomes a child of pivot; should rest on y = 0 and rise along +Y.' },
          { name: 'x', type: 'number', desc: 'Position across the page (page-local).' },
          { name: 'z', type: 'number', desc: 'Position down the page (page-local).' },
          { name: 'scale', type: 'number', def: '1', desc: 'Uniform footprint scale. Height is this scale multiplied by the current pop progress.' },
          { name: 'rotation', type: 'number', def: '0', desc: 'Yaw in radians, applied to object.rotation.y.' },
        ]}
      />
      <PropTable
        label="PROPERTIES"
        cols={['Property', 'Type', '', 'Meaning']}
        rows={[
          { name: 'object', type: 'THREE.Object3D (readonly)', desc: 'The user object you passed in. Its scale is driven by the pop animation — set scale / rotation through the element instead.' },
          { name: 'pivot', type: 'THREE.Group (readonly)', desc: 'The transform target the book positions on the page surface. This — not object — is what belongs in the scene graph.' },
          { name: 'animated', type: 'boolean', def: 'true', desc: 'true = spring bounce on pop / quick collapse; false = snap instantly to the target. See Animation.' },
          { name: 'x', type: 'number (get/set)', desc: 'Page-local x. Setting it stores the value; PopUpBook re-positions the pivot next frame.' },
          { name: 'z', type: 'number (get/set)', desc: 'Page-local z.' },
          { name: 'scale', type: 'number (get/set)', desc: 'Uniform footprint scale. Re-applies the current height immediately.' },
          { name: 'rotation', type: 'number (get/set)', desc: 'Yaw in radians; writes object.rotation.y.' },
          { name: 'progress', type: 'number (readonly)', desc: 'Current rendered height factor, 0 (flat / hidden) … 1 (fully risen). Driven by setProgress + update.' },
        ]}
      />
      <PropTable
        label="METHODS"
        cols={['Method', 'Signature', '', 'What it does']}
        rows={[
          { name: 'setProgress', type: '(t: number) => void', desc: 'Sets the target: t > 0 pops the element up, t = 0 collapses it. Starts the spring (or snaps if animated is false). A no-op if the target is unchanged.' },
          { name: 'update', type: '(dt: number) => void', desc: 'Advances the pop / collapse animation by dt seconds and re-applies the height. Called for you by PopUpBook.update.' },
          { name: 'applyTransform', type: '(pos: THREE.Vector3, quat: THREE.Quaternion) => void', desc: 'Copies a world pose onto the pivot. Called by PopUpBook to glue the element to the curving page surface — you rarely call this.' },
          { name: 'dispose', type: '() => void', desc: 'Detaches the pivot from its parent. Does not dispose the underlying geometry / material — you own those.' },
        ]}
      />
      <Notes>
        <p>
          A <code>PopUpElement</code> wraps any <code>THREE.Object3D</code> and makes it rise off the page. The key
          split is <code>object</code> vs <code>pivot</code>: the pivot is what the book moves and orients on the
          page surface, while the object is your content, parented inside it. Add the <code>pivot</code> to the
          graph — never the bare object — or let <Link href="/scenes/pop-up-scene/">PopUpScene</Link> do it via{' '}
          <code>addPopUp</code>.
        </p>
        <p>
          The pop is a vertical scale: at <code>progress = 0</code> the object is flattened and hidden, at{' '}
          <code>1</code> it stands full height. How it travels between the two — spring bounce or instant — is the{' '}
          <code>animated</code> flag, covered under <Link href="/elements/animation/">Animation</Link>.
        </p>
      </Notes>
    </ExportPage>
  )
}
