/**
 * The smallest three-pop-up-book setup: a plain three-book, a PopUpBook
 * coordinator, and a couple of shapes that rise off the first content page.
 * Self-contained — shares no module state with the full editor demo.
 */

import * as THREE from 'three';
import '@objectifthunes/three-book/demo.css';
import { Book, BookContent, StapleBookBinding, createPageTexture, AutoTurnSettings } from '@objectifthunes/three-book';
import { createDemoScene, createDemoInteraction } from '@objectifthunes/three-book/demo-kit';
import { PopUpBook, PopUpScene } from '@objectifthunes/three-pop-up-book';

const PAGE_W = 2;
const PAGE_H = 3;
const PAGE_COUNT = 8;

const PALETTE = [0xff5a5f, 0x4cc38a, 0x5b8def, 0xf2c14e, 0xa66cff];

function makeShape(kind: 'cube' | 'cone' | 'sphere' | 'cylinder', color: number): THREE.Mesh {
  let geo: THREE.BufferGeometry;
  if (kind === 'cube') geo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
  else if (kind === 'cone') geo = new THREE.ConeGeometry(0.22, 0.5, 24);
  else if (kind === 'sphere') geo = new THREE.SphereGeometry(0.22, 24, 16);
  else geo = new THREE.CylinderGeometry(0.18, 0.18, 0.45, 24);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
  mesh.castShadow = true;
  mesh.position.y = 0.22;
  return mesh;
}

export function mountMinimalPopUp(): () => void {
  const prev = (window as unknown as { __minimalPopUpCleanup?: () => void }).__minimalPopUpCleanup;
  if (prev) prev();

  const prevOverflow = document.body.style.overflow;
  const prevBg = document.body.style.background;
  document.body.style.overflow = 'hidden';
  document.body.style.background = '#1a1a2e';

  const ds = createDemoScene();
  const { scene, camera, renderer, controls } = ds;
  const interaction = createDemoInteraction(camera, renderer.domElement, controls, true) as { enabled: boolean };

  const textures: THREE.Texture[] = [];
  const track = (t: THREE.Texture) => { textures.push(t); return t; };
  const content = new BookContent();
  for (let i = 0; i < 4; i++) content.covers.push(track(createPageTexture('#3a6ea5', '', null, 'contain', false, PAGE_W, PAGE_H)));
  for (let i = 0; i < PAGE_COUNT; i++) content.pages.push(track(createPageTexture('#f5efe0', `Page ${i + 1}`, null, 'contain', false, PAGE_W, PAGE_H)));

  const book = new Book({
    content,
    binding: new StapleBookBinding(),
    initialOpenProgress: 0,
    castShadows: true,
    pagePaperSetup: { width: PAGE_W, height: PAGE_H, thickness: 0.02, stiffness: 0.2, color: new THREE.Color(1, 1, 1), material: null },
    coverPaperSetup: { width: PAGE_W + 0.1, height: PAGE_H + 0.1, thickness: 0.04, stiffness: 0.5, color: new THREE.Color(1, 1, 1), material: null },
  });
  book.init();
  scene.add(book);

  const popUpBook = new PopUpBook({ book });
  popUpBook.bindInteraction({ camera, domElement: renderer.domElement, bookInteraction: interaction });

  const popScene = new PopUpScene({ pageWidth: PAGE_W, pageHeight: PAGE_H });
  popUpBook.setScene(popUpBook.contentPageOffset, popScene);
  popScene.addPopUp({ object: makeShape('cube', PALETTE[0]), x: 0.5, z: 1.0, scale: 1 });
  popScene.addPopUp({ object: makeShape('cone', PALETTE[1]), x: 1.3, z: 0.7, scale: 1.2 });
  popScene.addPopUp({ object: makeShape('sphere', PALETTE[2]), x: 0.9, z: 2.0, scale: 1 });

  const autoSettings = new AutoTurnSettings();
  const clock = new THREE.Clock();
  let rafId = 0;
  let running = true;
  let opened = false;

  function animate() {
    if (!running) return;
    rafId = requestAnimationFrame(animate);
    const dt = clock.getDelta();
    controls.update();
    if (!opened && book.isBuilt && book.isIdle) {
      book.startAutoTurning(0, autoSettings, popUpBook.frontCoverCount);
      opened = true;
    }
    for (const b of Book.instances) b.update(dt);
    popUpBook.update(dt);
    renderer.render(scene, camera);
  }
  animate();

  const cleanup = () => {
    running = false;
    cancelAnimationFrame(rafId);
    try { popUpBook.dispose(); } catch { /* noop */ }
    try { book.dispose(); } catch { /* noop */ }
    scene.remove(book);
    for (const t of textures) t.dispose();
    renderer.domElement.remove();
    try { controls.dispose(); } catch { /* noop */ }
    try { renderer.dispose(); } catch { /* noop */ }
    document.body.style.overflow = prevOverflow;
    document.body.style.background = prevBg;
    (window as unknown as { __minimalPopUpCleanup?: () => void }).__minimalPopUpCleanup = undefined;
  };

  (window as unknown as { __minimalPopUpCleanup?: () => void }).__minimalPopUpCleanup = cleanup;
  return cleanup;
}
