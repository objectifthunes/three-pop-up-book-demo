import * as THREE from 'three'

/**
 * A little storybook diorama kit — composed THREE.Group "props" (castle, pines,
 * cottage, dragon, …) built from many meshes. These are handed straight to
 * PopUpScene.addPopUp(): the library reads each group's bounding box and plants
 * its base on the page, so a whole multi-mesh scene rises as the page settles.
 * Pure three.js (no React), so the vanilla and R3F demos share it verbatim.
 */

const PALETTE = {
  stone: 0x9c958a,
  stoneDark: 0x7c766c,
  roofRed: 0xb1473b,
  roofBlue: 0x3f6fb0,
  wood: 0x6d4a2f,
  woodDark: 0x4d3320,
  leaf: [0x3f7d4f, 0x356b43, 0x2c5a39],
  wallCream: 0xe8d9b5,
  wallTan: 0xd7bf8b,
  door: 0x593a22,
  dragonBody: 0x2f8f7a,
  dragonBelly: 0xa6e3cc,
  dragonWing: 0x256f5f,
  flag: 0xd0533f,
  white: 0xf4f1e8,
  grass: 0x55924d,
  petalPink: 0xe88bb0,
  petalGold: 0xf2c14e,
  pollen: 0xf6b73c,
  capRed: 0xc84a3a,
  gold: 0xeec64a,
} as const

/** Flat-shaded matte material — the low-poly storybook look. */
function mat(color: number, opts: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, metalness: 0, ...opts })
}

function mesh(geo: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, material)
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

// ── Trees ────────────────────────────────────────────────────────────────────

/** A tiered conifer: a trunk and three stacked cones. */
export function makePine(height = 1, leaf = PALETTE.leaf[0]): THREE.Group {
  const g = new THREE.Group()
  const trunk = mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.22 * height, 6), mat(PALETTE.woodDark), 0, 0.11 * height, 0)
  g.add(trunk)
  const tiers = 3
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers
    const r = (0.32 - i * 0.07) * height
    const h = (0.34 - i * 0.04) * height
    const y = (0.2 + i * 0.26) * height
    g.add(mesh(new THREE.ConeGeometry(r, h, 7), mat(leaf), 0, y + h / 2, 0))
  }
  return g
}

/** A round-canopy tree: trunk + a chunky icosahedron of leaves. */
export function makeRoundTree(height = 1, leaf = PALETTE.leaf[1]): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.32 * height, 6), mat(PALETTE.wood), 0, 0.16 * height, 0))
  const r = 0.27 * height
  g.add(mesh(new THREE.IcosahedronGeometry(r, 0), mat(leaf), 0, 0.32 * height + r * 0.7, 0))
  g.add(mesh(new THREE.IcosahedronGeometry(r * 0.7, 0), mat(PALETTE.leaf[2]), r * 0.5, 0.32 * height + r * 1.2, 0.1))
  return g
}

/** A small cluster of pines of varied height. */
export function makeForest(): THREE.Group {
  const g = new THREE.Group()
  const spots: [number, number, number, number][] = [
    [0, 0, 1.05, PALETTE.leaf[0]],
    [-0.34, 0.18, 0.8, PALETTE.leaf[1]],
    [0.32, -0.12, 0.9, PALETTE.leaf[2]],
    [0.05, -0.34, 0.7, PALETTE.leaf[1]],
  ]
  for (const [x, z, h, leaf] of spots) {
    const p = makePine(h, leaf)
    p.position.set(x, 0, z)
    g.add(p)
  }
  return g
}

// ── Buildings ──────────────────────────────────────────────────────────────

/** A turreted castle: keep, four corner towers with conical roofs, gate, flag. */
export function makeCastle(): THREE.Group {
  const g = new THREE.Group()
  const stone = mat(PALETTE.stone)
  const stoneDark = mat(PALETTE.stoneDark)

  // Keep.
  const kw = 0.5, kh = 0.62
  g.add(mesh(new THREE.BoxGeometry(kw, kh, kw), stone, 0, kh / 2, 0))
  // Crenellations along the keep's top edges.
  const merlon = new THREE.BoxGeometry(0.08, 0.1, 0.08)
  for (let i = -1; i <= 1; i++) {
    for (const s of [-1, 1]) {
      g.add(mesh(merlon, stoneDark, i * 0.18, kh + 0.05, s * (kw / 2)))
      g.add(mesh(merlon, stoneDark, s * (kw / 2), kh + 0.05, i * 0.18))
    }
  }

  // Four corner towers.
  const towerH = 0.82
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = sx * 0.32, z = sz * 0.32
      g.add(mesh(new THREE.CylinderGeometry(0.13, 0.15, towerH, 10), stone, x, towerH / 2, z))
      g.add(mesh(new THREE.ConeGeometry(0.18, 0.3, 10), mat(PALETTE.roofRed), x, towerH + 0.15, z))
    }
  }

  // Gate.
  g.add(mesh(new THREE.BoxGeometry(0.18, 0.26, 0.06), mat(PALETTE.door), 0, 0.13, kw / 2 + 0.01))

  // Central flag.
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 5), mat(PALETTE.woodDark), 0, kh + 0.2, 0))
  const flag = mesh(new THREE.PlaneGeometry(0.18, 0.1), mat(PALETTE.flag, { side: THREE.DoubleSide }), 0.09, kh + 0.33, 0)
  g.add(flag)
  return g
}

/** A cosy cottage: walls, hipped roof, door, windows, smoking chimney. */
export function makeCottage(wall = PALETTE.wallCream): THREE.Group {
  const g = new THREE.Group()
  const bw = 0.44, bh = 0.32
  g.add(mesh(new THREE.BoxGeometry(bw, bh, bw), mat(wall), 0, bh / 2, 0))
  // Hipped (pyramidal) roof.
  const roof = mesh(new THREE.ConeGeometry(0.38, 0.26, 4), mat(PALETTE.roofRed), 0, bh + 0.13, 0)
  roof.rotation.y = Math.PI / 4
  g.add(roof)
  // Door + windows on the front (+z) face.
  g.add(mesh(new THREE.BoxGeometry(0.1, 0.18, 0.04), mat(PALETTE.door), 0, 0.09, bw / 2 + 0.01))
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), mat(0xbfe0ec), sx * 0.13, 0.2, bw / 2 + 0.01))
  // Chimney + smoke.
  g.add(mesh(new THREE.BoxGeometry(0.07, 0.16, 0.07), mat(PALETTE.stoneDark), 0.13, bh + 0.16, -0.08))
  const smoke = mat(PALETTE.white, { transparent: true, opacity: 0.7 })
  g.add(mesh(new THREE.SphereGeometry(0.05, 6, 6), smoke, 0.14, bh + 0.3, -0.08))
  g.add(mesh(new THREE.SphereGeometry(0.06, 6, 6), smoke, 0.17, bh + 0.42, -0.07))
  return g
}

// ── Creatures & flora ─────────────────────────────────────────────────────

/** A friendly rearing dragon: body, neck, head with horns, wings, tail. */
export function makeDragon(): THREE.Group {
  const g = new THREE.Group()
  const body = mat(PALETTE.dragonBody)
  const belly = mat(PALETTE.dragonBelly)
  const wingMat = mat(PALETTE.dragonWing, { side: THREE.DoubleSide })

  // Body & neck rising in an arc.
  const spine: [number, number, number, number][] = [
    [0, 0.2, -0.04, 0.22],
    [0, 0.46, 0.04, 0.2],
    [0.02, 0.69, 0.12, 0.16],
    [0.03, 0.88, 0.2, 0.12],
  ]
  for (const [x, y, z, r] of spine) g.add(mesh(new THREE.SphereGeometry(r, 10, 8), body, x, y, z))
  g.add(mesh(new THREE.SphereGeometry(0.12, 8, 8), belly, 0.0, 0.4, 0.16))

  // Head.
  const head = mesh(new THREE.SphereGeometry(0.16, 10, 8), body, 0.04, 1.04, 0.26)
  g.add(head)
  g.add(mesh(new THREE.ConeGeometry(0.05, 0.16, 8), body, 0.04, 1.0, 0.42)) // snout
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.ConeGeometry(0.03, 0.12, 6), mat(PALETTE.white), 0.04 + sx * 0.06, 1.16, 0.2)) // horns
    g.add(mesh(new THREE.SphereGeometry(0.03, 6, 6), mat(0x101418), 0.04 + sx * 0.07, 1.07, 0.36)) // eyes
  }

  // Wings — flat extruded triangles fanning up and out from the chest.
  const wing = new THREE.Shape()
  wing.moveTo(0, 0); wing.lineTo(0.46, 0.12); wing.lineTo(0.2, 0.5); wing.closePath()
  const wingGeo = new THREE.ExtrudeGeometry(wing, { depth: 0.02, bevelEnabled: false })
  for (const sx of [-1, 1]) {
    const w = mesh(wingGeo, wingMat, sx * 0.08, 0.6, 0.02)
    w.scale.x = sx
    w.rotation.y = sx * -0.5
    g.add(w)
  }

  // Tail curving back down to a point.
  const tail: [number, number, number, number][] = [
    [-0.02, 0.16, -0.22, 0.12],
    [-0.04, 0.1, -0.4, 0.08],
    [-0.05, 0.06, -0.54, 0.05],
  ]
  for (const [x, y, z, r] of tail) g.add(mesh(new THREE.SphereGeometry(r, 8, 6), body, x, y, z))
  g.add(mesh(new THREE.ConeGeometry(0.05, 0.16, 6), body, -0.06, 0.04, -0.64))
  return g
}

/** A single flower: stem, petals, pollen centre. */
export function makeFlower(petal = PALETTE.petalPink): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.34, 5), mat(PALETTE.leaf[1]), 0, 0.17, 0))
  const petalGeo = new THREE.SphereGeometry(0.07, 8, 6)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const p = mesh(petalGeo, mat(petal), Math.cos(a) * 0.09, 0.36, Math.sin(a) * 0.09)
    p.scale.set(1, 0.5, 1)
    g.add(p)
  }
  g.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(PALETTE.pollen), 0, 0.37, 0))
  return g
}

/** A toadstool: stem and a red, white-spotted cap. */
export function makeMushroom(): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.18, 7), mat(PALETTE.white), 0, 0.09, 0))
  g.add(mesh(new THREE.SphereGeometry(0.13, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(PALETTE.capRed), 0, 0.18, 0))
  const dot = mat(PALETTE.white)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    g.add(mesh(new THREE.SphereGeometry(0.022, 6, 6), dot, Math.cos(a) * 0.07, 0.22, Math.sin(a) * 0.07))
  }
  return g
}

/** A rounded grassy mound to lift a hero prop. */
export function makeHill(radius = 0.6, color = PALETTE.grass): THREE.Group {
  const g = new THREE.Group()
  const dome = mesh(new THREE.SphereGeometry(radius, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(color), 0, 0, 0)
  dome.scale.y = 0.5
  g.add(dome)
  return g
}

/** A signpost — pole and a little board. */
export function makeSignpost(): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), mat(PALETTE.wood), 0, 0.25, 0))
  const board = mesh(new THREE.BoxGeometry(0.26, 0.12, 0.03), mat(PALETTE.wallTan), 0.04, 0.42, 0)
  g.add(board)
  return g
}

export { PALETTE as STORYBOOK_PALETTE }

// ── Page art ─────────────────────────────────────────────────────────────────
//
// createPageTexture only draws its auto "Page N" / cover label when a surface
// has NO image — so handing pages a real image both removes the label and lets
// us paint proper storybook paper. These return data URLs; load via loadImage.

/** Warm, softly-vignetted aged paper. */
export function parchmentDataUrl(w = 512, h = 768): string {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#efe3c6'; ctx.fillRect(0, 0, w, h)
  const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75)
  g.addColorStop(0, 'rgba(255,250,235,0.5)'); g.addColorStop(1, 'rgba(120,95,55,0.28)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
  // Faint fibre speckle.
  ctx.fillStyle = 'rgba(120,90,50,0.06)'
  for (let i = 0; i < 700; i++) {
    const x = (i * 97.13) % w, y = (i * 53.77) % h
    ctx.fillRect(x, y, 1.4, 1.4)
  }
  return c.toDataURL('image/png')
}

/** A bound storybook cover: deep cloth, gold border, serif title, little stars. */
export function coverArtDataUrl(title = 'A Pop-Up Tale', base = '#5a3b8c', w = 512, h = 768): string {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, base); g.addColorStop(1, shade(base, -0.35))
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
  // Gold double border.
  ctx.strokeStyle = '#eec64a'; ctx.lineWidth = 6
  ctx.strokeRect(28, 28, w - 56, h - 56)
  ctx.lineWidth = 2
  ctx.strokeRect(42, 42, w - 84, h - 84)
  // Title.
  ctx.fillStyle = '#f4e6b8'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.font = `bold ${Math.round(w * 0.11)}px Georgia, "Times New Roman", serif`
  const words = title.split(' ')
  const mid = Math.ceil(words.length / 2)
  const l1 = words.slice(0, mid).join(' '), l2 = words.slice(mid).join(' ')
  ctx.fillText(l1, w / 2, h * 0.42)
  if (l2) ctx.fillText(l2, w / 2, h * 0.42 + w * 0.13)
  // Star flourishes.
  ctx.fillStyle = '#eec64a'
  for (const [sx, sy, r] of [[w / 2, h * 0.2, w * 0.04], [w / 2 - w * 0.18, h * 0.66, w * 0.025], [w / 2 + w * 0.18, h * 0.66, w * 0.025]] as const) {
    drawStar(ctx, sx, sy, r)
  }
  return c.toDataURL('image/png')
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath(); ctx.fill()
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + Math.round(255 * amt)))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + Math.round(255 * amt)))
  const b = Math.max(0, Math.min(255, (n & 255) + Math.round(255 * amt)))
  return `rgb(${r},${g},${b})`
}

/** A hand-drawn storybook landscape plate — sun, layered hills, trees, birds.
 *  Deterministic per `seed`, so a book's pages each look distinct but stable. */
export function illustratedPageDataUrl(seed = 0, title?: string, w = 512, h = 768): string {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  const rnd = mulberry32(seed * 2654435761 + 7)

  // Parchment margin, then the framed illustration.
  ctx.fillStyle = '#efe3c6'; ctx.fillRect(0, 0, w, h)
  const m = Math.round(w * 0.06)
  const iw = w - m * 2, ih = h - m * 2
  ctx.save()
  ctx.beginPath(); ctx.rect(m, m, iw, ih); ctx.clip()

  // Sky.
  const sky = ctx.createLinearGradient(0, m, 0, m + ih)
  sky.addColorStop(0, '#aebfe0'); sky.addColorStop(0.5, '#d9c2dd'); sky.addColorStop(1, '#ffd9ad')
  ctx.fillStyle = sky; ctx.fillRect(m, m, iw, ih)

  // Sun with halo.
  const sx = m + iw * (0.2 + rnd() * 0.6), sy = m + ih * 0.2
  const halo = ctx.createRadialGradient(sx, sy, 2, sx, sy, iw * 0.22)
  halo.addColorStop(0, 'rgba(255,243,200,0.9)'); halo.addColorStop(1, 'rgba(255,243,200,0)')
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sx, sy, iw * 0.22, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#fbe9a8'; ctx.beginPath(); ctx.arc(sx, sy, iw * 0.07, 0, Math.PI * 2); ctx.fill()

  // Birds.
  ctx.strokeStyle = 'rgba(60,50,70,0.5)'; ctx.lineWidth = 2
  for (let i = 0; i < 3; i++) {
    const bx = m + iw * (0.15 + rnd() * 0.7), by = m + ih * (0.18 + rnd() * 0.15), r = 8
    ctx.beginPath(); ctx.moveTo(bx - r, by); ctx.quadraticCurveTo(bx, by - r * 0.7, bx + r * 0.1, by)
    ctx.quadraticCurveTo(bx + r * 0.2, by - r * 0.7, bx + r * 1.2, by); ctx.stroke()
  }

  // Rolling hills, back to front.
  const greens = ['#7fae5e', '#5f9a4c', '#477f3c']
  for (let b = 0; b < 3; b++) {
    const baseY = m + ih * (0.55 + b * 0.16)
    const amp = ih * (0.06 + rnd() * 0.05)
    ctx.fillStyle = greens[b]
    ctx.beginPath(); ctx.moveTo(m, baseY)
    for (let x = 0; x <= iw; x += iw / 6) {
      ctx.quadraticCurveTo(m + x + iw / 12, baseY + (rnd() - 0.5) * amp * 2, m + x + iw / 6, baseY)
    }
    ctx.lineTo(m + iw, m + ih); ctx.lineTo(m, m + ih); ctx.closePath(); ctx.fill()
  }

  // A few tree silhouettes on the middle hill.
  const treeY = m + ih * 0.72
  const trees = 2 + Math.floor(rnd() * 3)
  for (let i = 0; i < trees; i++) {
    const tx = m + iw * (0.1 + rnd() * 0.8), s = iw * (0.05 + rnd() * 0.03)
    ctx.fillStyle = '#3c6b34'
    ctx.beginPath(); ctx.moveTo(tx, treeY - s * 2.4); ctx.lineTo(tx - s, treeY); ctx.lineTo(tx + s, treeY); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(tx - s * 0.12, treeY, s * 0.24, s * 0.5)
  }

  ctx.restore()

  // Illustration frame.
  ctx.strokeStyle = 'rgba(90,70,40,0.55)'; ctx.lineWidth = 3
  ctx.strokeRect(m, m, iw, ih)

  // Optional title banner.
  if (title) {
    ctx.fillStyle = 'rgba(40,30,20,0.85)'
    ctx.font = `italic ${Math.round(w * 0.075)}px Georgia, serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(title, w / 2, m + ih * 0.12)
  }
  return c.toDataURL('image/png')
}

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Decode a data URL into an HTMLImageElement (createPageTexture needs naturalWidth). */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = src
  })
}
