/**
 * three-pop-up-book demo — extends the three-book demo with a Pop-Ups tab.
 *
 * Ported from the original Vite demo. The top-level side effects are wrapped in
 * `mountThreePopUpBookDemo()` so the experience can be mounted in a React route
 * and torn down on unmount. `scene`, `syncLights`, `interaction` and the pop-up
 * helpers stay exported as live bindings because `./book`, `./left-panel` and
 * `./popup-tab` import them.
 */

import * as THREE from 'three';
import '@objectifthunes/three-book/demo.css';
import { Book, AutoTurnSettings } from '@objectifthunes/three-book';
import {
  createDemoScene,
  createDemoInteraction,
  createDemoPanel,
  clearImageSlot,
} from '@objectifthunes/three-book/demo-kit';
import { PopUpScene, PopUpBook } from '@objectifthunes/three-pop-up-book';
import { params, pageImageSlots, coverImageSlots } from './state';
import { buildBook, getBook, getOverlays, getCoverOverlays, getSpreads, onBookStatus } from './book';
import { buildBookTab } from './left-panel';
import { buildTexturesTab } from './right-panel';
import { buildEditorTab, tickEditor } from './editor';
import { buildPopUpTab, rebuildPopUpPanel, setVisiblePage } from './popup-tab';
import { allPopUps, createPrimitive, getNextId } from './popup-tab-state';

export let scene: THREE.Scene;
export let camera: THREE.PerspectiveCamera;
export let renderer: THREE.WebGLRenderer;
export let controls: { update: () => void; dispose: () => void };
export let interaction: { enabled: boolean } = { enabled: true };

let ds: ReturnType<typeof createDemoScene> | null = null;

export function syncLights(): void {
  ds?.syncLights(params);
}

// ── Pop-Up state ──
let popUpBook: PopUpBook | null = null;
const scenesMap = new Map<number, PopUpScene>();
const autoSettings = new AutoTurnSettings();

export function getPopUpBook(): PopUpBook | null { return popUpBook; }

export function getSceneForPage(pageIndex: number): PopUpScene {
  let s = scenesMap.get(pageIndex);
  if (!s) {
    s = new PopUpScene({ pageWidth: params.pageWidth, pageHeight: params.pageHeight });
    scenesMap.set(pageIndex, s);
    if (popUpBook) popUpBook.setScene(pageIndex, s);
  }
  return s;
}

export function getAllScenes(): IterableIterator<PopUpScene> {
  return scenesMap.values();
}

export function turnNext(): void {
  const book = getBook();
  if (book) book.startAutoTurning(0, autoSettings, 1);
}

export function turnPrev(): void {
  const book = getBook();
  if (book) book.startAutoTurning(1, autoSettings, 1);
}

let lastBookRef: Book | null = null;

function syncPopUpBook(): void {
  const book = getBook();
  if (!book || book === lastBookRef) return;
  lastBookRef = book;

  popUpBook?.dispose();
  scenesMap.clear();
  allPopUps.length = 0;

  popUpBook = new PopUpBook({ book });
  popUpBook.bindInteraction({ camera, domElement: renderer.domElement, bookInteraction: interaction });

  const p0 = popUpBook.contentPageOffset;
  const s0 = getSceneForPage(p0);
  const shapes0: [string, number, number, number?][] = [
    ['cube', 0.5, 1.0], ['tree', 1.5, 0.7, 1.3], ['cone', 1.2, 2.2],
  ];
  for (const [type, x, z, scale] of shapes0) {
    const el = s0.addPopUp({ object: createPrimitive(type as never), x, z, scale });
    allPopUps.push({ id: getNextId(), element: el, type: type as never, pageIndex: p0 });
  }

  const p1 = popUpBook.contentPageOffset + 2;
  const s1 = getSceneForPage(p1);
  const shapes1: [string, number, number, number?][] = [
    ['sphere', 0.8, 1.5, 1.5], ['star', 1.5, 0.8], ['cylinder', 0.3, 2.0],
  ];
  for (const [type, x, z, scale] of shapes1) {
    const el = s1.addPopUp({ object: createPrimitive(type as never), x, z, scale });
    allPopUps.push({ id: getNextId(), element: el, type: type as never, pageIndex: p1 });
  }

  setVisiblePage(p0);
  rebuildPopUpPanel();
}

export function mountThreePopUpBookDemo(): () => void {
  const prev = (window as unknown as { __popUpDemoCleanup?: () => void }).__popUpDemoCleanup;
  if (prev) prev();

  const prevOverflow = document.body.style.overflow;
  const prevBg = document.body.style.background;
  document.body.style.overflow = 'hidden';
  document.body.style.background = '#1a1a2e';

  // Reset per-mount state.
  popUpBook = null;
  lastBookRef = null;
  scenesMap.clear();
  allPopUps.length = 0;

  ds = createDemoScene();
  scene = ds.scene;
  camera = ds.camera as THREE.PerspectiveCamera;
  renderer = ds.renderer;
  controls = ds.controls;
  interaction = createDemoInteraction(camera, renderer.domElement, controls, params.interactive) as { enabled: boolean };

  const bookTabEl = document.createElement('div');
  const texturesTabEl = document.createElement('div');
  const editorTabEl = document.createElement('div');
  const popUpTabEl = document.createElement('div');

  buildBookTab(bookTabEl);
  buildTexturesTab(texturesTabEl);
  buildEditorTab(editorTabEl);
  buildPopUpTab(popUpTabEl);

  const panel = createDemoPanel({
    title: 'three-pop-up-book',
    subtitle: 'Drag to turn · right-click + wheel to orbit',
    tabs: [
      { key: 'book', label: 'Book', content: bookTabEl },
      { key: 'textures', label: 'Textures', content: texturesTabEl },
      { key: 'editor', label: 'Editor', content: editorTabEl },
      { key: 'popups', label: 'Pop-Ups', content: popUpTabEl },
    ],
  });

  onBookStatus((msg) => panel.setStatus(msg));

  const infoEl = document.createElement('div');
  infoEl.className = 'demo-info';
  infoEl.style.cssText = 'position:fixed;bottom:10px;left:50%;transform:translateX(-50%);';
  infoEl.textContent = 'Click + drag pages to turn | Orbit: right-click / scroll';
  document.body.appendChild(infoEl);

  const clock = new THREE.Clock();
  let hasOpened = false;
  let lastVisiblePage = -1;
  let rafId = 0;
  let running = true;

  function animate() {
    if (!running) return;
    rafId = requestAnimationFrame(animate);
    const dt = clock.getDelta();

    controls.update();
    const bookRoot = getBook();

    if (!hasOpened && bookRoot && bookRoot.isBuilt && bookRoot.isIdle && popUpBook) {
      bookRoot.startAutoTurning(0, autoSettings, popUpBook.frontCoverCount);
      hasOpened = true;
    }

    for (const overlay of getOverlays()) if (overlay) overlay.update(bookRoot ?? undefined);
    for (const overlay of getCoverOverlays()) if (overlay) overlay.update(bookRoot ?? undefined);
    for (const spread of getSpreads().values()) spread.update(bookRoot ?? undefined);

    for (const b of Book.instances) b.update(dt);

    syncPopUpBook();
    if (popUpBook) popUpBook.update(dt);

    if (bookRoot && bookRoot.isIdle) {
      const papers = bookRoot.papers;
      for (let i = 0; i < papers.length; i++) {
        if (papers[i].isOnRightStack) {
          const vp = i * 2;
          if (vp !== lastVisiblePage) { lastVisiblePage = vp; setVisiblePage(vp); }
          break;
        }
      }
    }

    tickEditor();
    renderer.render(scene, camera);
  }

  animate();
  syncLights();
  buildBook();

  const cleanup = () => {
    running = false;
    cancelAnimationFrame(rafId);
    popUpBook?.dispose();
    popUpBook = null;
    for (const b of [...Book.instances]) { try { b.dispose(); } catch { /* noop */ } }
    for (const slot of pageImageSlots) clearImageSlot(slot);
    for (const slot of coverImageSlots) clearImageSlot(slot);
    infoEl.remove();
    panel.root.remove();
    panel.toggleBtn.remove();
    renderer.domElement.remove();
    try { controls.dispose(); } catch { /* noop */ }
    try { renderer.dispose(); } catch { /* noop */ }
    document.body.style.overflow = prevOverflow;
    document.body.style.background = prevBg;
    (window as unknown as { __popUpDemoCleanup?: () => void }).__popUpDemoCleanup = undefined;
    ds = null;
  };

  (window as unknown as { __popUpDemoCleanup?: () => void }).__popUpDemoCleanup = cleanup;
  return cleanup;
}
