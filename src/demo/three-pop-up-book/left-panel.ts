import type { DirectionOption } from './state';
import { params } from './state';
import { syncLights, interaction } from './main';
import * as THREE from 'three';
import { getBook, refreshContent, buildBook } from './book';
import { rebuildTexturePanel } from './right-panel';
import {
  addSectionTitle,
  addSlider,
  addColor,
  addCheckbox,
  addSelect,
  FONT_OPTIONS,
} from '@objectifthunes/three-book/demo-kit';

export function buildBookTab(container: HTMLElement): void {
  // ── Page Paper ──

  addSectionTitle(container, 'Page Paper');

  addSlider(container, 'Width', 1, 5, 0.1, params.pageWidth, (v) => {
    params.pageWidth = v;
    const b = getBook();
    if (b) b.pagePaperSetup = { width: v, height: params.pageHeight, thickness: params.pageThickness, stiffness: params.pageStiffness, color: new THREE.Color(1, 1, 1), material: null };
    refreshContent();
  });
  addSlider(container, 'Height', 1, 5, 0.1, params.pageHeight, (v) => {
    params.pageHeight = v;
    const b = getBook();
    if (b) b.pagePaperSetup = { width: params.pageWidth, height: v, thickness: params.pageThickness, stiffness: params.pageStiffness, color: new THREE.Color(1, 1, 1), material: null };
    refreshContent();
  });
  addSlider(container, 'Thickness', 0.005, 0.1, 0.001, params.pageThickness, (v) => {
    params.pageThickness = v;
    const b = getBook();
    if (b) b.pagePaperSetup = { width: params.pageWidth, height: params.pageHeight, thickness: v, stiffness: params.pageStiffness, color: new THREE.Color(1, 1, 1), material: null };
  });
  addSlider(container, 'Stiffness', 0, 1, 0.01, params.pageStiffness, (v) => {
    params.pageStiffness = v;
    const b = getBook();
    if (b) b.pagePaperSetup = { width: params.pageWidth, height: params.pageHeight, thickness: params.pageThickness, stiffness: v, color: new THREE.Color(1, 1, 1), material: null };
  });
  addSlider(container, 'Count', 2, 40, 1, params.pageCount, (v) => {
    params.pageCount = Math.max(2, Math.floor(v));
    rebuildTexturePanel();
    refreshContent();
  });
  addColor(container, 'Page Color', params.pageColor, (v) => {
    params.pageColor = v;
    refreshContent();
  });

  addSelect(
    container,
    'Book Font',
    params.bookFont,
    FONT_OPTIONS.map((f) => ({ value: f, label: f })),
    (v) => {
      params.bookFont = v;
      refreshContent();
    },
  );

  // ── Cover Paper ──

  addSectionTitle(container, 'Cover Paper');

  addSlider(container, 'Width', 1, 5, 0.1, params.coverWidth, (v) => {
    params.coverWidth = v;
    const b = getBook();
    if (b) b.coverPaperSetup = { width: v, height: params.coverHeight, thickness: params.coverThickness, stiffness: params.coverStiffness, color: new THREE.Color(1, 1, 1), material: null };
    refreshContent();
  });
  addSlider(container, 'Height', 1, 5, 0.1, params.coverHeight, (v) => {
    params.coverHeight = v;
    const b = getBook();
    if (b) b.coverPaperSetup = { width: params.coverWidth, height: v, thickness: params.coverThickness, stiffness: params.coverStiffness, color: new THREE.Color(1, 1, 1), material: null };
    refreshContent();
  });
  addSlider(
    container,
    'Thickness',
    0.005,
    0.15,
    0.001,
    params.coverThickness,
    (v) => {
      params.coverThickness = v;
      const b = getBook();
      if (b) b.coverPaperSetup = { width: params.coverWidth, height: params.coverHeight, thickness: v, stiffness: params.coverStiffness, color: new THREE.Color(1, 1, 1), material: null };
    },
  );
  addSlider(container, 'Stiffness', 0, 1, 0.01, params.coverStiffness, (v) => {
    params.coverStiffness = v;
    const b = getBook();
    if (b) b.coverPaperSetup = { width: params.coverWidth, height: params.coverHeight, thickness: params.coverThickness, stiffness: v, color: new THREE.Color(1, 1, 1), material: null };
  });
  addColor(container, 'Cover Color', params.coverColor, (v) => {
    params.coverColor = v;
    refreshContent();
  });

  // ── Book ──

  addSectionTitle(container, 'Book');

  addSelect(
    container,
    'Direction',
    params.direction,
    [
      { value: 'left-to-right', label: 'Left to Right' },
      { value: 'right-to-left', label: 'Right to Left' },
      { value: 'up-to-down', label: 'Up to Down' },
      { value: 'down-to-up', label: 'Down to Up' },
    ],
    (v) => {
      params.direction = v as DirectionOption;
      refreshContent();
    },
  );

  addSlider(container, 'Open Progress', 0, 1, 0.01, params.openProgress, (v) => {
    params.openProgress = v;
    const b = getBook();
    if (b && b.isBuilt) b.setOpenProgress(v);
  });

  addCheckbox(container, 'Cast Shadows', params.castShadows, (v) => {
    params.castShadows = v;
    const b = getBook();
    if (b) b.castShadows = v;
  });
  addCheckbox(container, 'Align To Ground', params.alignToGround, (v) => {
    params.alignToGround = v;
    const b = getBook();
    if (b) b.alignToGround = v;
  });
  addCheckbox(container, 'Hide Binder', params.hideBinder, (v) => {
    params.hideBinder = v;
    const b = getBook();
    if (b) b.hideBinder = v;
  });
  addCheckbox(container, 'Reduce Shadows', params.reduceShadows, (v) => {
    params.reduceShadows = v;
    const b = getBook();
    if (b) b.reduceShadows = v;
  });
  addCheckbox(container, 'Reduce Sub Meshes', params.reduceSubMeshes, (v) => {
    params.reduceSubMeshes = v;
    const b = getBook();
    if (b) b.reduceSubMeshes = v;
  });
  addCheckbox(container, 'Reduce Overdraw', params.reduceOverdraw, (v) => {
    params.reduceOverdraw = v;
    const b = getBook();
    if (b) b.reduceOverdraw = v;
  });
  addCheckbox(container, 'Interactive Turning', params.interactive, (v) => {
    params.interactive = v;
    interaction.enabled = v;
  });

  const rebuildBtn = document.createElement('button');
  rebuildBtn.textContent = 'Force Rebuild';
  rebuildBtn.className = 'demo-btn--rebuild';
  rebuildBtn.addEventListener('click', buildBook);
  container.appendChild(rebuildBtn);

  // ── Lighting ──

  addSectionTitle(container, 'Lighting');

  addSlider(container, 'Sun Intensity', 0, 6, 0.1, params.sunIntensity, (v) => {
    params.sunIntensity = v;
    syncLights();
  });
  addSlider(
    container,
    'Ambient Intensity',
    0,
    2,
    0.05,
    params.ambientIntensity,
    (v) => {
      params.ambientIntensity = v;
      syncLights();
    },
  );
  addSlider(container, 'Sun X', -12, 12, 0.1, params.sunX, (v) => {
    params.sunX = v;
    syncLights();
  });
  addSlider(container, 'Sun Y', 1, 20, 0.1, params.sunY, (v) => {
    params.sunY = v;
    syncLights();
  });
  addSlider(container, 'Sun Z', -12, 12, 0.1, params.sunZ, (v) => {
    params.sunZ = v;
    syncLights();
  });
}
