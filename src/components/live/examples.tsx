'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  Book,
  BookContent,
  BookDirection,
  StapleBookBinding,
  SpreadContent,
  TextOverlayContent,
  createPageTexture,
  PX_PER_UNIT,
  AutoTurnSettings,
  AutoTurnDirection,
} from '@objectifthunes/three-book'
import { PopUpBook, PopUpScene, PopUpSpreadScene } from '@objectifthunes/three-pop-up-book'
import { useBookStage } from './useBookStage'
import { LiveStage } from './LiveStage'
import { LiveRow, LiveButton, LiveSlider, LiveToggle, LiveSwatch, LiveReadout } from './controls'
import { buildBookContent, pagePaperSetup, coverPaperSetup, loadPatternImage } from './book-content'

const PAGE_W = 2
const PAGE_H = 3
const PCW = Math.round(PAGE_W * PX_PER_UNIT)
const PCH = Math.round(PAGE_H * PX_PER_UNIT)
const COVER_COLOR = '#7b3f00'
const PAGE_COLOR = '#f5efe0'

/** Jump the book to show `pageIndex` as the right-hand page once it's built. */
function makeOpenToPage(pageIndex: number) {
  let done = false
  return (book: Book) => {
    if (!done && book.isBuilt) {
      // page side index = coverPaperCount + pageIndex; the fold there shows it on the right.
      book.setOpenProgressByIndex(book.coverPaperCount + pageIndex)
      done = true
    }
  }
}

/** Four cover surfaces built from scratch (never pushed onto the default nulls). */
function makeCovers(track: (t: THREE.Texture) => THREE.Texture): THREE.Texture[] {
  const labels = ['Front Cover', '', '', 'Back Cover']
  return labels.map((label) => track(createPageTexture(COVER_COLOR, label, null, 'contain', false, PAGE_W + 0.1, PAGE_H + 0.1)))
}

/** Shared BookOptions — the library's real defaults: closed, flat on the ground. */
function baseOptions(extra?: Partial<ConstructorParameters<typeof Book>[0]>) {
  return {
    binding: new StapleBookBinding(),
    initialOpenProgress: 0,
    castShadows: true,
    alignToGround: true,
    pagePaperSetup: pagePaperSetup(PAGE_W, PAGE_H),
    coverPaperSetup: coverPaperSetup(PAGE_W, PAGE_H),
    ...extra,
  }
}

/** A draggable book, opened to its first page. */
export function LiveBook({
  pageCount = 8,
  hint = 'Drag a page to turn it · drag the background to orbit',
}: { pageCount?: number; hint?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useBookStage(ref, {
    make: () => {
      const { content, textures } = buildBookContent({ pageCount, pageColor: PAGE_COLOR, coverColor: COVER_COLOR })
      const book = new Book({ content, ...baseOptions() })
      const open = makeOpenToPage(0)
      return { book, onFrame: () => open(book), cleanup: () => textures.forEach((t) => t.dispose()) }
    },
    deps: [pageCount],
  })
  return <LiveStage ref={ref} hint={hint} />
}

/** Programmatic page turns via book.startAutoTurning(). */
export function LiveAutoTurn() {
  const ref = useRef<HTMLDivElement>(null)
  const settings = useMemo(() => new AutoTurnSettings(), [])
  const { bookRef } = useBookStage(ref, {
    make: () => {
      const { content, textures } = buildBookContent({ pageCount: 10, pageColor: PAGE_COLOR, coverColor: COVER_COLOR })
      const book = new Book({ content, ...baseOptions() })
      const open = makeOpenToPage(0)
      return { book, onFrame: () => open(book), cleanup: () => textures.forEach((t) => t.dispose()) }
    },
  })
  const turn = (dir: AutoTurnDirection, count = 1) => bookRef.current?.startAutoTurning(dir, settings, count)
  return (
    <LiveStage
      ref={ref}
      hint="Each button calls book.startAutoTurning(direction, settings, count)"
      controls={
        <LiveRow>
          <LiveButton onClick={() => turn(AutoTurnDirection.Next, 1)}>Next ▸</LiveButton>
          <LiveButton onClick={() => turn(AutoTurnDirection.Back, 1)}>◂ Prev</LiveButton>
          <LiveButton onClick={() => turn(AutoTurnDirection.Next, 99)}>Flip to end</LiveButton>
          <LiveButton onClick={() => turn(AutoTurnDirection.Back, 99)}>Back to start</LiveButton>
        </LiveRow>
      }
    />
  )
}

/** Instant jumps with book.setOpenProgress(t) — slider sweeps the whole book. */
export function LiveOpenProgress() {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(0)
  const { bookRef } = useBookStage(ref, {
    make: () => {
      const { content, textures } = buildBookContent({ pageCount: 8, pageColor: PAGE_COLOR, coverColor: COVER_COLOR })
      const book = new Book({ content, ...baseOptions() })
      return { book, cleanup: () => textures.forEach((t) => t.dispose()) }
    },
  })
  const onChange = (val: number) => { setV(val); bookRef.current?.setOpenProgress(val) }
  return (
    <LiveStage
      ref={ref}
      hint="The slider calls book.setOpenProgress(t) — 0 is closed, 1 is fully open"
      controls={<LiveSlider label="openProgress" min={0} max={1} step={0.01} value={v} onChange={onChange} format={(x) => x.toFixed(2)} />}
    />
  )
}

/** Read-only state, polled each frame off the live book. */
export function LiveBookState() {
  const ref = useRef<HTMLDivElement>(null)
  const { bookRef } = useBookStage(ref, {
    make: () => {
      const { content, textures } = buildBookContent({ pageCount: 8, pageColor: PAGE_COLOR, coverColor: COVER_COLOR })
      const book = new Book({ content, ...baseOptions() })
      const open = makeOpenToPage(0)
      return { book, onFrame: () => open(book), cleanup: () => textures.forEach((t) => t.dispose()) }
    },
  })
  const [s, setS] = useState({ turning: false, falling: false, idle: true, progress: 0, papers: 0 })
  useEffect(() => {
    const id = setInterval(() => {
      const b = bookRef.current
      if (b) setS({ turning: b.isTurning, falling: b.isFalling, idle: b.isIdle, progress: b.openProgress, papers: b.paperCount })
    }, 100)
    return () => clearInterval(id)
  }, [bookRef])
  return (
    <LiveStage
      ref={ref}
      hint="Drag a page — these getters are read off the book every frame"
      controls={
        <LiveRow>
          <LiveReadout label="isTurning" value={String(s.turning)} />
          <LiveReadout label="isFalling" value={String(s.falling)} />
          <LiveReadout label="isIdle" value={String(s.idle)} />
          <LiveReadout label="openProgress" value={s.progress.toFixed(2)} />
          <LiveReadout label="paperCount" value={s.papers} />
        </LiveRow>
      }
    />
  )
}

/** A live geometry playground — rebuilds the book (not the renderer) on change. */
export function LiveGeometry() {
  const ref = useRef<HTMLDivElement>(null)
  const params = useRef({ pageCount: 8, thickness: 0.02, stiffness: 0.2, pageColor: PAGE_COLOR, coverColor: COVER_COLOR })
  const [, force] = useState(0)
  const { rebuild } = useBookStage(ref, {
    make: () => {
      const p = params.current
      const { content, textures } = buildBookContent({ pageCount: p.pageCount, pageColor: p.pageColor, coverColor: p.coverColor })
      const book = new Book({
        content,
        ...baseOptions({ pagePaperSetup: { ...pagePaperSetup(PAGE_W, PAGE_H), thickness: p.thickness, stiffness: p.stiffness } }),
      })
      const open = makeOpenToPage(0)
      return { book, onFrame: () => open(book), cleanup: () => textures.forEach((t) => t.dispose()) }
    },
  })
  const set = <K extends keyof typeof params.current>(k: K, val: (typeof params.current)[K]) => {
    params.current = { ...params.current, [k]: val }
    force((n) => n + 1)
    rebuild()
  }
  const p = params.current
  return (
    <LiveStage
      ref={ref}
      tall
      hint="Every control rebuilds the Book with new BookOptions — drag a page to feel the change"
      controls={
        <>
          <LiveRow>
            <LiveSlider label="pages" min={2} max={20} step={2} value={p.pageCount} onChange={(v) => set('pageCount', v)} />
            <LiveSlider label="thickness" min={0.008} max={0.05} step={0.002} value={p.thickness} onChange={(v) => set('thickness', v)} format={(x) => x.toFixed(3)} />
            <LiveSlider label="stiffness" min={0.05} max={0.9} step={0.05} value={p.stiffness} onChange={(v) => set('stiffness', v)} format={(x) => x.toFixed(2)} />
          </LiveRow>
          <LiveRow>
            <LiveSwatch label="page" value={p.pageColor} onChange={(v) => set('pageColor', v)} />
            <LiveSwatch label="cover" value={p.coverColor} onChange={(v) => set('coverColor', v)} />
          </LiveRow>
        </>
      }
    />
  )
}

/** Show / hide the staple binder. */
export function LiveBinding() {
  const ref = useRef<HTMLDivElement>(null)
  const hide = useRef(false)
  const [, force] = useState(0)
  const { rebuild } = useBookStage(ref, {
    make: () => {
      const { content, textures } = buildBookContent({ pageCount: 8, pageColor: PAGE_COLOR, coverColor: COVER_COLOR })
      const book = new Book({ content, ...baseOptions({ hideBinder: hide.current }) })
      const open = makeOpenToPage(0)
      return { book, onFrame: () => open(book), cleanup: () => textures.forEach((t) => t.dispose()) }
    },
  })
  return (
    <LiveStage
      ref={ref}
      hint="StapleBookBinding draws the staples down the spine; hideBinder removes the mesh"
      controls={
        <LiveToggle
          label="hideBinder"
          checked={hide.current}
          onChange={(v) => { hide.current = v; force((n) => n + 1); rebuild() }}
        />
      }
    />
  )
}

/** Load the pattern image once, then rebuild so it draws. */
function usePatternImage(rebuild: () => void) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  useEffect(() => {
    let alive = true
    loadPatternImage((im) => { if (alive) { imgRef.current = im; rebuild() } })
    return () => { alive = false }
  }, [rebuild])
  return imgRef
}

/** An image on page 1 with the three fit modes. */
export function LiveTextures() {
  const ref = useRef<HTMLDivElement>(null)
  const cfg = useRef<{ fit: 'contain' | 'cover' | 'fill'; fullBleed: boolean }>({ fit: 'cover', fullBleed: true })
  const [, force] = useState(0)
  const { rebuild } = useBookStage(ref, {
    make: () => {
      const textures: THREE.Texture[] = []
      const track = (t: THREE.Texture) => { textures.push(t); return t }
      const content = new BookContent()
      content.direction = BookDirection.LeftToRight
      content.covers = makeCovers(track)
      const pages: THREE.Texture[] = []
      pages.push(track(createPageTexture(PAGE_COLOR, '', imgRef.current, cfg.current.fit, cfg.current.fullBleed, PAGE_W, PAGE_H)))
      for (let i = 1; i < 8; i++) pages.push(track(createPageTexture(PAGE_COLOR, `Page ${i + 1}`, null, 'contain', false, PAGE_W, PAGE_H)))
      content.pages = pages
      const book = new Book({ content, ...baseOptions() })
      const open = makeOpenToPage(0)
      return { book, onFrame: () => open(book), cleanup: () => textures.forEach((t) => t.dispose()) }
    },
  })
  const imgRef = usePatternImage(rebuild)
  const setFit = (f: 'contain' | 'cover' | 'fill') => { cfg.current = { ...cfg.current, fit: f }; force((n) => n + 1); rebuild() }
  return (
    <LiveStage
      ref={ref}
      hint="createPageTexture draws the image onto page 1 with the chosen fit mode"
      controls={
        <LiveRow>
          {(['contain', 'cover', 'fill'] as const).map((f) => (
            <LiveButton key={f} active={cfg.current.fit === f} onClick={() => setFit(f)}>{f}</LiveButton>
          ))}
          <LiveToggle label="fullBleed" checked={cfg.current.fullBleed} onChange={(v) => { cfg.current = { ...cfg.current, fullBleed: v }; force((n) => n + 1); rebuild() }} />
        </LiveRow>
      }
    />
  )
}

/** Styled text overlaid on page 1 with TextOverlayContent. */
export function LiveTextOverlay() {
  const ref = useRef<HTMLDivElement>(null)
  const text = useRef('Chapter One')
  const [, force] = useState(0)
  const { rebuild } = useBookStage(ref, {
    make: () => {
      const textures: THREE.Texture[] = []
      const track = (t: THREE.Texture) => { textures.push(t); return t }
      const content = new BookContent()
      content.direction = BookDirection.LeftToRight
      content.covers = makeCovers(track)
      const base = track(createPageTexture(PAGE_COLOR, '', null, 'contain', false, PAGE_W, PAGE_H))
      const overlay = new TextOverlayContent({ width: PCW, height: PCH, source: (base as THREE.CanvasTexture).image as HTMLCanvasElement })
      overlay.addText({ text: text.current, x: 60, y: 150, width: 392, fontSize: 44, fontFamily: 'Georgia', fontStyle: 'italic', color: '#1a1a1a', textAlign: 'center', shadowColor: 'rgba(0,0,0,0.25)', shadowBlur: 6 })
      const pages: (THREE.Texture | TextOverlayContent)[] = [overlay]
      for (let i = 1; i < 8; i++) pages.push(track(createPageTexture(PAGE_COLOR, `Page ${i + 1}`, null, 'contain', false, PAGE_W, PAGE_H)))
      content.pages = pages
      const book = new Book({ content, ...baseOptions() })
      const open = makeOpenToPage(0)
      return {
        book,
        onFrame: () => { overlay.update(book); open(book) },
        cleanup: () => { overlay.dispose(); textures.forEach((t) => t.dispose()) },
      }
    },
  })
  const pick = (t: string) => { text.current = t; force((n) => n + 1); rebuild() }
  return (
    <LiveStage
      ref={ref}
      hint="A TextOverlayContent composites a styled TextBlock onto page 1"
      controls={
        <LiveRow>
          {['Chapter One', 'Once upon a time', 'The End'].map((t) => (
            <LiveButton key={t} active={text.current === t} onClick={() => pick(t)}>{t}</LiveButton>
          ))}
        </LiveRow>
      }
    />
  )
}

/** A double-page spread — one image across the two facing pages 2–3. */
export function LiveSpread() {
  const ref = useRef<HTMLDivElement>(null)
  const { rebuild } = useBookStage(ref, {
    make: () => {
      const textures: THREE.Texture[] = []
      const track = (t: THREE.Texture) => { textures.push(t); return t }
      const content = new BookContent()
      content.direction = BookDirection.LeftToRight
      content.covers = makeCovers(track)

      // page 0 normal; pages 1–2 are one spread (odd start index); rest normal.
      const wide = track(createPageTexture('#0b1020', '', imgRef.current, 'cover', true, PAGE_W * 2, PAGE_H))
      const spread = new SpreadContent({ pageWidth: PCW, pageHeight: PCH })
      spread.source = (wide as THREE.CanvasTexture).image as HTMLCanvasElement
      spread.addText({ text: 'One image, two pages', x: 120, y: 90, width: 780, fontSize: 54, fontFamily: 'Georgia', color: '#ffffff', textAlign: 'center' })
      spread.markDirty()

      const pages: (THREE.Texture | object)[] = []
      pages.push(track(createPageTexture(PAGE_COLOR, 'Page 1', null, 'contain', false, PAGE_W, PAGE_H)))
      pages.push(spread.left)
      pages.push(spread.right)
      for (let i = 3; i < 8; i++) pages.push(track(createPageTexture(PAGE_COLOR, `Page ${i + 1}`, null, 'contain', false, PAGE_W, PAGE_H)))
      content.pages = pages as THREE.Texture[]

      const book = new Book({ content, ...baseOptions() })
      const open = makeOpenToPage(2) // show pages 1–2 (the spread) as the facing pair
      return {
        book,
        onFrame: () => { spread.update(book); open(book) },
        cleanup: () => { spread.dispose(); textures.forEach((t) => t.dispose()) },
      }
    },
  })
  const imgRef = usePatternImage(rebuild)
  return <LiveStage ref={ref} hint="A SpreadContent puts one image across the two facing pages — drag to leaf through" />
}

// ── Pop-up examples ─────────────────────────────────────────────────────────

const SHAPE_PALETTE = [0xff5a5f, 0x4cc38a, 0x5b8def, 0xf2c14e, 0xa66cff, 0xff9f43]

type ShapeKind = 'cube' | 'cone' | 'sphere' | 'cylinder' | 'star'

function makeShape(kind: ShapeKind, color: number): THREE.Object3D {
  let geo: THREE.BufferGeometry
  if (kind === 'cube') geo = new THREE.BoxGeometry(0.35, 0.35, 0.35)
  else if (kind === 'cone') geo = new THREE.ConeGeometry(0.22, 0.5, 24)
  else if (kind === 'sphere') geo = new THREE.SphereGeometry(0.22, 24, 16)
  else if (kind === 'cylinder') geo = new THREE.CylinderGeometry(0.18, 0.18, 0.45, 24)
  else {
    // simple extruded star
    const shape = new THREE.Shape()
    const spikes = 5, outer = 0.26, inner = 0.12
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
      const x = Math.cos(a) * r, y = Math.sin(a) * r
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y)
    }
    geo = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false })
    geo.rotateX(-Math.PI / 2)
  }
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }))
  mesh.castShadow = true
  if (kind !== 'star') mesh.position.y = 0.22
  return mesh
}

/**
 * Build a pop-up stage. The PopUpBook must be created AFTER the book is built,
 * so we defer it (and the scene setup) to the first frame where book.isBuilt.
 */
function popUpBuild(
  ctx: { camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer },
  content: BookContent,
  textures: THREE.Texture[],
  setup: (popUpBook: PopUpBook) => void,
  extraOpen = 0,
) {
  const book = new Book({ content, ...baseOptions({ alignToGround: false }) })
  let popUpBook: PopUpBook | null = null
  const settings = new AutoTurnSettings()
  let opened = false
  return {
    book,
    onFrame: (dt: number) => {
      if (!popUpBook && book.isBuilt) {
        popUpBook = new PopUpBook({ book })
        popUpBook.bindInteraction({ camera: ctx.camera, domElement: ctx.renderer.domElement, bookInteraction: { enabled: true } })
        setup(popUpBook)
      }
      if (popUpBook) {
        if (!opened && book.isIdle) {
          book.startAutoTurning(AutoTurnDirection.Next, settings, popUpBook.frontCoverCount + extraOpen)
          opened = true
        }
        popUpBook.update(dt)
      }
    },
    cleanup: () => { popUpBook?.dispose(); textures.forEach((t) => t.dispose()) },
  }
}

/** A book with 3D pop-ups that rise off the first content page. */
export function LivePopUp() {
  const ref = useRef<HTMLDivElement>(null)
  useBookStage(ref, {
    make: (ctx) => {
      const { content, textures } = buildBookContent({ pageCount: 8, pageColor: PAGE_COLOR, coverColor: '#3a6ea5' })
      return popUpBuild(ctx, content, textures, (popUpBook) => {
        const scene = new PopUpScene({ pageWidth: PAGE_W, pageHeight: PAGE_H })
        popUpBook.setScene(popUpBook.contentPageOffset, scene)
        scene.addPopUp({ object: makeShape('cube', SHAPE_PALETTE[0]), x: 0.5, z: 1.0 })
        scene.addPopUp({ object: makeShape('cone', SHAPE_PALETTE[1]), x: 1.3, z: 0.7, scale: 1.2 })
        scene.addPopUp({ object: makeShape('sphere', SHAPE_PALETTE[2]), x: 0.9, z: 2.0 })
      })
    },
  })
  return <LiveStage ref={ref} tall hint="Shapes rise off the page as it settles — drag the page to fold them away" />
}

/** Pop-ups across a two-page spread via PopUpSpreadScene. */
export function LivePopUpSpread() {
  const ref = useRef<HTMLDivElement>(null)
  useBookStage(ref, {
    make: (ctx) => {
      const { content, textures } = buildBookContent({ pageCount: 8, pageColor: PAGE_COLOR, coverColor: '#3a6ea5' })
      // Open to a content↔content spread (one page past the covers) and put a
      // PopUpScene on each of the two facing pages: the back side of the left
      // paper (contentPageOffset+1) and the front side of the right (+2).
      return popUpBuild(ctx, content, textures, (popUpBook) => {
        const left = new PopUpScene({ pageWidth: PAGE_W, pageHeight: PAGE_H })
        popUpBook.setScene(popUpBook.contentPageOffset + 1, left)
        left.addPopUp({ object: makeShape('cube', SHAPE_PALETTE[0]), x: 0.6, z: 1.2 })
        left.addPopUp({ object: makeShape('star', SHAPE_PALETTE[3]), x: 1.4, z: 0.8, scale: 1.3 })
        const right = new PopUpScene({ pageWidth: PAGE_W, pageHeight: PAGE_H })
        popUpBook.setScene(popUpBook.contentPageOffset + 2, right)
        right.addPopUp({ object: makeShape('cylinder', SHAPE_PALETTE[4]), x: 0.6, z: 1.4 })
        right.addPopUp({ object: makeShape('cone', SHAPE_PALETTE[1]), x: 1.4, z: 0.9, scale: 1.2 })
      }, 1)
    },
  })
  return <LiveStage ref={ref} tall hint="Pop-ups on both facing pages of the open spread" />
}

/** A single pop-up with the spring animation toggle. */
export function LiveAnimation() {
  const ref = useRef<HTMLDivElement>(null)
  const animated = useRef(true)
  const [, force] = useState(0)
  const { rebuild } = useBookStage(ref, {
    make: (ctx) => {
      const { content, textures } = buildBookContent({ pageCount: 8, pageColor: PAGE_COLOR, coverColor: '#3a6ea5' })
      return popUpBuild(ctx, content, textures, (popUpBook) => {
        const scene = new PopUpScene({ pageWidth: PAGE_W, pageHeight: PAGE_H })
        popUpBook.setScene(popUpBook.contentPageOffset, scene)
        const el = scene.addPopUp({ object: makeShape('cone', SHAPE_PALETTE[1]), x: 1.0, z: 1.5, scale: 1.4 })
        el.animated = animated.current
      })
    },
  })
  return (
    <LiveStage
      ref={ref}
      tall
      hint="element.animated toggles the spring bounce on pop / collapse"
      controls={
        <LiveToggle
          label="animated"
          checked={animated.current}
          onChange={(v) => { animated.current = v; force((n) => n + 1); rebuild() }}
        />
      }
    />
  )
}
