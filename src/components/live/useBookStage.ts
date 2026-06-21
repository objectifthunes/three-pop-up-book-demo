'use client'

/**
 * A self-contained Three.js stage that lives *inside* a docs page element.
 *
 * One renderer per example, sized to its own container (not the window, not
 * document.body). The render loop pauses while the example is scrolled out of
 * view — purely a perf nicety — and everything disposes on unmount. Examples
 * are composed from the real @objectifthunes/three-book exports; this hook only
 * owns the scene, camera, controls, lights and the loop.
 */

import { useCallback, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Book, BookPointerInteraction } from '@objectifthunes/three-book'

export interface StageBuild {
  /** The book to mount (already constructed; the hook calls init() + adds it). */
  book: Book
  /** Optional per-frame hook (e.g. to update text overlays). */
  onFrame?: (dt: number) => void
  /** Optional extra teardown. */
  cleanup?: () => void
}

export interface StageContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
}

export interface StageOptions {
  /** Build the book (and any extras) against the provided scene/camera/renderer. */
  make: (ctx: StageContext) => StageBuild
  /** Allow pointer drag-to-turn (default true). */
  interactive?: boolean
  /** Camera position / target overrides. */
  camera?: { position?: [number, number, number]; target?: [number, number, number] }
  /** Re-run make() when any of these change. */
  deps?: unknown[]
}

export interface StageHandle {
  /** The live book, once built. */
  bookRef: React.RefObject<Book | null>
  /** The interaction, so examples can flip `enabled`. */
  interactionRef: React.RefObject<BookPointerInteraction | null>
  /** Rebuild just the book (re-runs make()) without recreating the renderer. */
  rebuild: () => void
}

export function useBookStage(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: StageOptions,
): StageHandle {
  const bookRef = useRef<Book | null>(null)
  const interactionRef = useRef<BookPointerInteraction | null>(null)
  const rebuildRef = useRef<() => void>(() => {})
  const rebuild = useCallback(() => rebuildRef.current(), [])
  // Keep latest make() without retriggering the heavy effect every render.
  const makeRef = useRef(options.make)
  makeRef.current = options.make

  const interactive = options.interactive ?? true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deps = options.deps ?? []

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    // A warm dusk sky — vertical gradient from deep indigo to a peach horizon.
    const sky = (() => {
      const c = document.createElement('canvas')
      c.width = 8; c.height = 256
      const g = c.getContext('2d')!.createLinearGradient(0, 0, 0, 256)
      g.addColorStop(0, '#221a3a'); g.addColorStop(0.55, '#5b3f63'); g.addColorStop(0.82, '#c9706a'); g.addColorStop(1, '#f0a574')
      const ctx2d = c.getContext('2d')!; ctx2d.fillStyle = g; ctx2d.fillRect(0, 0, 8, 256)
      const tex = new THREE.CanvasTexture(c)
      tex.colorSpace = THREE.SRGBColorSpace
      return tex
    })()
    scene.background = sky
    scene.fog = new THREE.Fog(0x6a4a5e, 9, 22)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    const camPos = options.camera?.position ?? [0, 3.7, 4.4]
    camera.position.set(...camPos)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.touchAction = 'none'
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enablePan = false
    controls.minDistance = 2.5
    controls.maxDistance = 12
    controls.target.set(...(options.camera?.target ?? [0, 0, 0]))

    // Dusk lighting: warm sky / cool ground bounce, a low golden key that casts
    // long soft shadows, and a cool indigo rim to lift the shadow side.
    scene.add(new THREE.HemisphereLight(0xffd9b0, 0x2b2440, 0.7))
    scene.add(new THREE.AmbientLight(0xffffff, 0.25))
    const sun = new THREE.DirectionalLight(0xffd9a0, 2.1)
    sun.position.set(5, 7, 4)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 40
    sun.shadow.bias = -0.0004
    sun.shadow.radius = 4
    scene.add(sun)
    const rim = new THREE.DirectionalLight(0x6f7bd6, 0.6)
    rim.position.set(-6, 4, -5)
    scene.add(rim)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x2a2336, roughness: 1 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.02
    ground.receiveShadow = true
    scene.add(ground)

    const ctx: StageContext = { scene, camera, renderer }
    let built = makeRef.current(ctx)
    const mount = (b: StageBuild) => {
      b.book.init()
      scene.add(b.book)
      bookRef.current = b.book
    }
    mount(built)

    rebuildRef.current = () => {
      const old = built
      scene.remove(old.book)
      old.cleanup?.()
      try { old.book.dispose() } catch { /* noop */ }
      built = makeRef.current(ctx)
      mount(built)
    }

    let interaction: BookPointerInteraction | null = null
    if (interactive) {
      interaction = new BookPointerInteraction(camera, renderer.domElement)
      interaction.enabled = true
      interaction.onTurnStart = () => { controls.enabled = false }
      interaction.onTurnEnd = () => { controls.enabled = true }
      interactionRef.current = interaction
    }

    // Size to the container.
    const resize = () => {
      const w = container.clientWidth || 1
      const h = container.clientHeight || 1
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    // Only run the loop while on-screen (perf, not a context-count workaround).
    let visible = true
    const io = new IntersectionObserver(
      (entries) => { visible = entries[0]?.isIntersecting ?? true },
      { rootMargin: '120px' },
    )
    io.observe(container)

    const clock = new THREE.Clock()
    let raf = 0
    let running = true
    const tick = () => {
      if (!running) return
      raf = requestAnimationFrame(tick)
      const dt = clock.getDelta()
      if (!visible) return
      controls.update()
      for (const b of Book.instances) b.update(dt)
      built.onFrame?.(dt) // after book.update — pop-ups read the page's settled transform
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      interaction?.dispose?.()
      built.cleanup?.()
      try { built.book.dispose() } catch { /* noop */ }
      rebuildRef.current = () => {}
      controls.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      bookRef.current = null
      interactionRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { bookRef, interactionRef, rebuild }
}
