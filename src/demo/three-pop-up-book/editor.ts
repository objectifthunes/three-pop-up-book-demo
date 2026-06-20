/**
 * editor.ts — WYSIWYG editor for book surfaces (covers + pages).
 *
 * Unified linear navigation through all surfaces:
 *   Surface 0: Front Cover Outer
 *   Surface 1: Front Cover Inner
 *   Surface 2..N+1: Page 1..N
 *   Surface N+2: Back Cover Inner
 *   Surface N+3: Back Cover Outer
 *
 * Text blocks are only available on page surfaces, not covers.
 * Image pan/zoom works on both covers and pages — no selection needed.
 *
 * Interaction model:
 *   - selectedBlockIndex: -1 = nothing, 0+ = text block index (NEVER -2)
 *   - dragType: 'text' | 'image' | null
 *   - Scroll zoom is cursor-centric, works whenever the slot has an imageRect
 */

import {
  params,
  pageTextBlocks,
  coverTextBlocks,
  pageImageSlots,
  coverImageSlots,
  spreadPages,
  ensurePageTextBlocks,
  createDefaultTextBlock,
  FONT_OPTIONS,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
  type PageTextBlock,
  type ImageSlot,
} from './state';
import { PX_PER_UNIT, TextBlock } from '@objectifthunes/three-book';
import { getOverlays, getCoverOverlays, getSpreads, refreshContent } from './book';

// Offscreen context used only for TextBlock measurement (font metrics).
const _measureCanvas = document.createElement('canvas');
_measureCanvas.width = 1;
_measureCanvas.height = 1;
const measureCtx = _measureCanvas.getContext('2d')!;

/** Compute the pixel-accurate height of a state text block. */
function blockHeight(b: PageTextBlock): number {
  const tb = new TextBlock({
    text: b.text,
    x: b.x,
    y: b.y,
    width: b.width,
    fontFamily: b.fontFamily || params.bookFont,
    fontSize: b.fontSize,
    fontWeight: b.fontWeight,
    fontStyle: b.fontStyle,
    lineHeight: DEFAULT_LINE_HEIGHT,
  });
  const h = tb.measureHeight(measureCtx);
  return Math.max(h, b.fontSize * DEFAULT_LINE_HEIGHT); // at least one line
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DISPLAY_MAX = 360;

const COVER_LABELS = [
  'Front Cover Outer',
  'Front Cover Inner',
  'Back Cover Inner',
  'Back Cover Outer',
];

// ── Dynamic dimensions ───────────────────────────────────────────────────────

let canvasW = 512;
let canvasH = 768;
let displayW = DISPLAY_MAX;
let displayH = DISPLAY_MAX;
let scale = 1;

// ── State ────────────────────────────────────────────────────────────────────

let currentSurface = 0;
let selectedBlockIndex = -1; // -1 = nothing, 0+ = text block index

let dragging = false;
let dragType: 'text' | 'image' | null = null;
let pointerOrigin = { x: 0, y: 0 };
let blockOrigin = { x: 0, y: 0 };
let imageOrigin = { x: 0, y: 0 };

// ── DOM references (set once in buildEditorTab) ──────────────────────────────

let editorCanvas: HTMLCanvasElement;
let edCtx: CanvasRenderingContext2D;
let pageLabel: HTMLSpanElement;
let fontSelect: HTMLSelectElement;
let sizeInput: HTMLInputElement;
let boldBtn: HTMLButtonElement;
let italicBtn: HTMLButtonElement;
let colorInput: HTMLInputElement;
let textarea: HTMLTextAreaElement;
let addBtn: HTMLButtonElement;
let removeBtn: HTMLButtonElement;
let alignBtns: HTMLButtonElement[] = [];

// ── Surface helpers ──────────────────────────────────────────────────────────

/** Total number of navigable surfaces: 4 covers + N pages. */
function totalSurfaces(): number {
  return 4 + params.pageCount;
}

/** Whether a surface index is a cover (front/back, inner/outer). */
function isCoverSurface(idx: number): boolean {
  const total = totalSurfaces();
  return idx === 0 || idx === 1 || idx === total - 2 || idx === total - 1;
}

/** Map surface index to cover slot index (0-3). Only valid when isCoverSurface. */
function coverIndex(surfaceIdx: number): number {
  const total = totalSurfaces();
  if (surfaceIdx === 0) return 0;
  if (surfaceIdx === 1) return 1;
  if (surfaceIdx === total - 2) return 2;
  return 3; // total - 1
}

/** Map surface index to page index (0-based). Only valid for page surfaces. */
function pageIndex(surfaceIdx: number): number {
  return surfaceIdx - 2;
}

/** Human-readable label for the given surface. */
function surfaceLabel(idx: number): string {
  if (isCoverSurface(idx)) return COVER_LABELS[coverIndex(idx)];
  const pi = pageIndex(idx);
  return `Page ${pi + 1}`;
}

/** Get the current ImageSlot for the active surface (cover or page). */
function getCurrentSlot(): ImageSlot | undefined {
  if (isCoverSurface(currentSurface)) {
    return coverImageSlots[coverIndex(currentSurface)];
  }
  const ep = effectivePage();
  if (ep < 0) return undefined;
  return pageImageSlots[ep];
}

// ── Spread helpers ───────────────────────────────────────────────────────────

/** Whether the current page surface is the start of a spread. */
function isCurrentSpread(): boolean {
  if (isCoverSurface(currentSurface)) return false;
  return spreadPages.has(pageIndex(currentSurface));
}

/** Whether the current page surface is the right half of a spread. */
function isCurrentRightOfSpread(): boolean {
  if (isCoverSurface(currentSurface)) return false;
  return spreadPages.has(pageIndex(currentSurface) - 1);
}

/**
 * Effective edit page (redirects right-of-spread to the spread start).
 * Returns -1 for cover surfaces.
 */
function effectivePage(): number {
  if (isCoverSurface(currentSurface)) return -1;
  const pi = pageIndex(currentSurface);
  if (isCurrentRightOfSpread()) return pi - 1;
  return pi;
}

function updateDisplaySize(): void {
  if (isCoverSurface(currentSurface)) {
    canvasW = Math.round(params.coverWidth * PX_PER_UNIT);
    canvasH = Math.round(params.coverHeight * PX_PER_UNIT);
  } else {
    const widthMultiplier = isCurrentSpread() || isCurrentRightOfSpread() ? 2 : 1;
    canvasW = Math.round(params.pageWidth * PX_PER_UNIT) * widthMultiplier;
    canvasH = Math.round(params.pageHeight * PX_PER_UNIT);
  }
  scale = DISPLAY_MAX / Math.max(canvasW, canvasH);
  displayW = Math.round(canvasW * scale);
  displayH = Math.round(canvasH * scale);
  editorCanvas.width = displayW;
  editorCanvas.height = displayH;
}

/** Get the text blocks array for the current surface (cover or page). */
function getCurrentBlocks(): PageTextBlock[] {
  if (isCoverSurface(currentSurface)) {
    return coverTextBlocks[coverIndex(currentSurface)];
  }
  const ep = effectivePage();
  if (ep < 0) return [];
  ensurePageTextBlocks();
  return pageTextBlocks[ep] ?? [];
}

function selectedBlock(): PageTextBlock | null {
  const blocks = getCurrentBlocks();
  if (selectedBlockIndex < 0 || selectedBlockIndex >= blocks.length) return null;
  return blocks[selectedBlockIndex];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function displayToCanvas(clientX: number, clientY: number): { x: number; y: number } {
  const rect = editorCanvas.getBoundingClientRect();
  return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
}

function hitTestBlock(cx: number, cy: number): number {
  const blocks = getCurrentBlocks();
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    const bw = b.width > 0 ? b.width : 200;
    const bh = blockHeight(b);
    if (cx >= b.x && cx <= b.x + bw && cy >= b.y && cy <= b.y + bh) return i;
  }
  return -1;
}

/** Whether the current slot has a visible image with an imageRect. */
function slotHasImage(): boolean {
  const slot = getCurrentSlot();
  return !!(slot?.imageRect && slot.useImage && slot.image);
}

/** Update the disabled state of text-related controls. */
function updateTextControlsDisabled(): void {
  textarea.disabled = !selectedBlock();
}

function refreshToolbar(): void {
  const b = selectedBlock();
  fontSelect.value = b?.fontFamily ?? '';
  sizeInput.value = String(b?.fontSize ?? DEFAULT_FONT_SIZE);
  colorInput.value = b?.color ?? DEFAULT_TEXT_COLOR;
  boldBtn.style.background = b?.fontWeight === 'bold' ? 'rgba(137,216,176,0.3)' : 'rgba(255,255,255,0.08)';
  italicBtn.style.background = b?.fontStyle === 'italic' ? 'rgba(137,216,176,0.3)' : 'rgba(255,255,255,0.08)';
  textarea.value = b?.text ?? '';
  updateTextControlsDisabled();
}

function onSurfaceChange(): void {
  ensurePageTextBlocks();
  selectedBlockIndex = -1;
  updateDisplaySize();
  refreshToolbar();
}

// ── Render ───────────────────────────────────────────────────────────────────

function renderEditor(): void {
  updateDisplaySize();
  edCtx.clearRect(0, 0, displayW, displayH);

  const ep = effectivePage();
  const onCover = isCoverSurface(currentSurface);
  const isSpread = isCurrentSpread() || isCurrentRightOfSpread();

  if (onCover) {
    // Cover surface: draw overlay canvas if available, else color + image
    const ci = coverIndex(currentSurface);
    const coverOv = getCoverOverlays()[ci];
    if (coverOv) {
      edCtx.drawImage(coverOv.canvas, 0, 0, displayW, displayH);
    } else {
      edCtx.fillStyle = params.coverColor;
      edCtx.fillRect(0, 0, displayW, displayH);

      const slot = coverImageSlots[ci];
      if (slot.useImage && slot.image) {
        if (slot.imageRect) {
          const ir = slot.imageRect;
          edCtx.drawImage(slot.image, ir.x * scale, ir.y * scale, ir.width * scale, ir.height * scale);
        } else {
          edCtx.drawImage(slot.image, 0, 0, displayW, displayH);
        }
      }
    }
  } else if (isSpread) {
    // Draw the spread canvas if available
    const spread = getSpreads().get(ep);
    if (spread) {
      edCtx.drawImage(spread.canvas, 0, 0, displayW, displayH);
    } else {
      edCtx.fillStyle = params.pageColor;
      edCtx.fillRect(0, 0, displayW, displayH);
    }
    // Draw center fold line
    edCtx.save();
    edCtx.strokeStyle = 'rgba(236,242,255,0.25)';
    edCtx.lineWidth = 1;
    edCtx.setLineDash([4, 4]);
    edCtx.beginPath();
    edCtx.moveTo(displayW / 2, 0);
    edCtx.lineTo(displayW / 2, displayH);
    edCtx.stroke();
    edCtx.restore();
  } else {
    // Normal page surface
    const overlays = getOverlays();
    const overlay = overlays[ep];
    if (overlay) {
      edCtx.drawImage(overlay.canvas, 0, 0, displayW, displayH);
    } else {
      edCtx.fillStyle = params.pageColor;
      edCtx.fillRect(0, 0, displayW, displayH);
    }
  }

  // Draw image pan outline — only while actively panning
  if (dragging && dragType === 'image') {
    const slot = getCurrentSlot();
    if (slot?.imageRect && slot.useImage && slot.image) {
      const ir = slot.imageRect;
      edCtx.save();
      edCtx.strokeStyle = 'rgba(137,216,176,0.4)';
      edCtx.lineWidth = 1;
      edCtx.setLineDash([4, 4]);
      edCtx.strokeRect(ir.x * scale, ir.y * scale, ir.width * scale, ir.height * scale);
      edCtx.restore();
    }
  }

  // Draw selection/hover outlines for text blocks (covers and pages)
  {
    const blocks = getCurrentBlocks();
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const bw = b.width > 0 ? b.width : 200;
      const bh = blockHeight(b);
      const sx = b.x * scale;
      const sy = b.y * scale;
      const sw = bw * scale;
      const sh = bh * scale;

      edCtx.save();
      const active = i === selectedBlockIndex;
      edCtx.strokeStyle = active ? '#89d8b0' : 'rgba(236,242,255,0.4)';
      edCtx.lineWidth = active ? 2 : 1;
      if (!active) edCtx.setLineDash([3, 3]);
      edCtx.strokeRect(sx, sy, sw, sh);
      edCtx.restore();

      // Index badge
      edCtx.save();
      edCtx.font = 'bold 9px sans-serif';
      edCtx.fillStyle = active ? '#89d8b0' : 'rgba(236,242,255,0.5)';
      edCtx.fillText(`T${i + 1}`, sx + 3, sy + 10);
      edCtx.restore();
    }
  }

  // Surface label
  const total = totalSurfaces();
  if (isSpread) {
    pageLabel.textContent = `Spread ${ep + 1}\u2013${ep + 2} of ${params.pageCount}`;
  } else {
    pageLabel.textContent = `${surfaceLabel(currentSurface)} (${currentSurface + 1}/${total})`;
  }
}

// ── Build tab ────────────────────────────────────────────────────────────────

export function buildEditorTab(container: HTMLElement): void {

  // ── Surface selector row ──────────────────────────────────────────────────

  const pageRow = document.createElement('div');
  pageRow.className = 'demo-page-nav';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '\u25C0';
  prevBtn.className = 'demo-btn';
  prevBtn.addEventListener('click', () => {
    if (currentSurface > 0) { currentSurface--; onSurfaceChange(); }
  });

  const nextBtn = document.createElement('button');
  nextBtn.textContent = '\u25B6';
  nextBtn.className = 'demo-btn';
  nextBtn.addEventListener('click', () => {
    if (currentSurface < totalSurfaces() - 1) { currentSurface++; onSurfaceChange(); }
  });

  pageLabel = document.createElement('span');
  pageLabel.className = 'demo-card-label';
  pageLabel.style.flex = '1';
  pageLabel.style.textAlign = 'center';
  pageLabel.style.marginBottom = '0';

  pageRow.appendChild(prevBtn);
  pageRow.appendChild(pageLabel);
  pageRow.appendChild(nextBtn);
  container.appendChild(pageRow);

  // ── Toolbar row 1: font family + size ─────────────────────────────────────

  const fontRow = document.createElement('div');
  fontRow.style.display = 'flex';
  fontRow.style.gap = '4px';
  fontRow.style.alignItems = 'center';
  fontRow.style.marginBottom = '4px';

  fontSelect = document.createElement('select');
  fontSelect.className = 'demo-select demo-select--mini';
  fontSelect.style.flex = '1';
  fontSelect.style.minWidth = '0';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Book default';
  fontSelect.appendChild(defaultOpt);
  for (const f of FONT_OPTIONS) {
    const el = document.createElement('option');
    el.value = f;
    el.textContent = f;
    fontSelect.appendChild(el);
  }
  fontSelect.addEventListener('change', () => {
    const b = selectedBlock();
    if (b) { b.fontFamily = fontSelect.value; refreshContent(); }
  });
  fontRow.appendChild(fontSelect);

  sizeInput = document.createElement('input');
  sizeInput.type = 'number';
  sizeInput.min = '8';
  sizeInput.max = '120';
  sizeInput.value = String(DEFAULT_FONT_SIZE);
  sizeInput.className = 'demo-select demo-select--mini';
  sizeInput.style.width = '52px';
  sizeInput.addEventListener('input', () => {
    const b = selectedBlock();
    if (b) { b.fontSize = parseInt(sizeInput.value, 10) || DEFAULT_FONT_SIZE; refreshContent(); }
  });
  fontRow.appendChild(sizeInput);

  container.appendChild(fontRow);

  // ── Toolbar row 2: style + alignment ────────────────────────────────────

  const styleRow = document.createElement('div');
  styleRow.style.display = 'flex';
  styleRow.style.gap = '4px';
  styleRow.style.alignItems = 'center';
  styleRow.style.marginBottom = '8px';

  boldBtn = document.createElement('button');
  boldBtn.textContent = 'B';
  boldBtn.className = 'demo-btn';
  boldBtn.style.fontWeight = 'bold';
  boldBtn.style.width = '32px';
  boldBtn.style.padding = '4px 0';
  boldBtn.addEventListener('click', () => {
    const b = selectedBlock();
    if (b) { b.fontWeight = b.fontWeight === 'bold' ? 'normal' : 'bold'; refreshToolbar(); refreshContent(); }
  });
  styleRow.appendChild(boldBtn);

  italicBtn = document.createElement('button');
  italicBtn.textContent = 'I';
  italicBtn.className = 'demo-btn';
  italicBtn.style.fontStyle = 'italic';
  italicBtn.style.width = '32px';
  italicBtn.style.padding = '4px 0';
  italicBtn.addEventListener('click', () => {
    const b = selectedBlock();
    if (b) { b.fontStyle = b.fontStyle === 'italic' ? 'normal' : 'italic'; refreshToolbar(); refreshContent(); }
  });
  styleRow.appendChild(italicBtn);

  const colorWrap = document.createElement('div');
  colorWrap.style.cssText = 'width:32px; height:28px; border-radius:6px; border:1px solid rgba(236,242,255,0.22); overflow:hidden; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.08);';
  colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = DEFAULT_TEXT_COLOR;
  colorInput.style.cssText = 'width:40px; height:40px; border:none; background:none; cursor:pointer; margin:-6px;';
  colorInput.addEventListener('input', () => {
    const b = selectedBlock();
    if (b) { b.color = colorInput.value; refreshContent(); }
  });
  colorWrap.appendChild(colorInput);
  styleRow.appendChild(colorWrap);

  // Separator
  const sep = document.createElement('div');
  sep.style.cssText = 'width:1px; height:20px; background:rgba(236,242,255,0.12); margin:0 2px;';
  styleRow.appendChild(sep);

  alignBtns = [];
  for (const align of ['left', 'center', 'right'] as const) {
    const btn = document.createElement('button');
    btn.textContent = align === 'left' ? '\u2190' : align === 'center' ? '\u2194' : '\u2192';
    btn.title = align;
    btn.className = 'demo-btn';
    btn.style.width = '32px';
    btn.style.padding = '4px 0';
    btn.addEventListener('click', () => {
      const b = selectedBlock();
      if (b) { b.textAlign = align; refreshToolbar(); refreshContent(); }
    });
    styleRow.appendChild(btn);
    alignBtns.push(btn);
  }

  // Spacer
  const spacer = document.createElement('div');
  spacer.style.flex = '1';
  styleRow.appendChild(spacer);

  removeBtn = document.createElement('button');
  removeBtn.textContent = '\u2715';
  removeBtn.className = 'demo-btn demo-btn--danger';
  removeBtn.style.padding = '4px 8px';
  removeBtn.style.fontSize = '11px';
  removeBtn.addEventListener('click', () => {
    const blocks = getCurrentBlocks();
    if (selectedBlockIndex < 0 || selectedBlockIndex >= blocks.length) return;
    blocks.splice(selectedBlockIndex, 1);
    selectedBlockIndex = Math.min(selectedBlockIndex, blocks.length - 1);
    refreshToolbar();
    refreshContent();
  });
  styleRow.appendChild(removeBtn);

  container.appendChild(styleRow);

  // ── Preview canvas (centered) ──────────────────────────────────────────────

  const canvasWrap = document.createElement('div');
  canvasWrap.style.display = 'flex';
  canvasWrap.style.justifyContent = 'center';
  canvasWrap.style.marginBottom = '8px';

  editorCanvas = document.createElement('canvas');
  editorCanvas.className = 'demo-editor-canvas';
  canvasWrap.appendChild(editorCanvas);
  container.appendChild(canvasWrap);

  // ── Action row ─────────────────────────────────────────────────────────────

  const actionRow = document.createElement('div');
  actionRow.style.display = 'flex';
  actionRow.style.gap = '6px';
  actionRow.style.marginBottom = '8px';

  addBtn = document.createElement('button');
  addBtn.textContent = '+ Add Text';
  addBtn.className = 'demo-btn demo-btn--block';
  addBtn.style.flex = '1';
  addBtn.addEventListener('click', () => {
    const blocks = getCurrentBlocks();
    blocks.push(createDefaultTextBlock(canvasW, canvasH));
    selectedBlockIndex = blocks.length - 1;
    refreshToolbar();
    refreshContent();
  });
  actionRow.appendChild(addBtn);

  container.appendChild(actionRow);

  edCtx = editorCanvas.getContext('2d')!;

  // ── Textarea ───────────────────────────────────────────────────────────────

  textarea = document.createElement('textarea');
  textarea.rows = 3;
  textarea.placeholder = 'Select a text block, then type here\u2026';
  textarea.style.cssText = `
    width: 100%;
    box-sizing: border-box;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid rgba(236,242,255,0.18);
    background: rgba(255,255,255,0.06);
    color: #eef4ff;
    font-family: inherit;
    font-size: 12px;
    resize: vertical;
  `;
  textarea.addEventListener('input', () => {
    const b = selectedBlock();
    if (b) {
      b.text = textarea.value;
      refreshContent();
    }
  });
  container.appendChild(textarea);

  // ── Pointer events ─────────────────────────────────────────────────────────

  editorCanvas.addEventListener('pointerdown', (e) => {
    const cv = displayToCanvas(e.clientX, e.clientY);

    const hit = hitTestBlock(cv.x, cv.y);

    if (hit >= 0) {
      // Hit a text block — select it and begin text drag
      selectedBlockIndex = hit;
      refreshToolbar();
      dragging = true;
      dragType = 'text';
      pointerOrigin = cv;
      const b = getCurrentBlocks()[hit];
      blockOrigin = { x: b.x, y: b.y };
      editorCanvas.setPointerCapture(e.pointerId);
      editorCanvas.style.cursor = 'grabbing';
    } else {
      // No text hit — deselect any selected text block
      selectedBlockIndex = -1;
      refreshToolbar();

      // If the current slot has an image with imageRect, begin image pan
      const slot = getCurrentSlot();
      const ir = slot?.imageRect;
      if (ir && slot!.useImage && slot!.image) {
        dragging = true;
        dragType = 'image';
        pointerOrigin = cv;
        imageOrigin = { x: ir.x, y: ir.y };
        editorCanvas.setPointerCapture(e.pointerId);
        editorCanvas.style.cursor = 'grabbing';
      }
    }
    e.stopPropagation();
  });

  editorCanvas.addEventListener('pointermove', (e) => {
    const cv = displayToCanvas(e.clientX, e.clientY);

    if (dragging && dragType === 'text') {
      // Text block drag
      const b = getCurrentBlocks()[selectedBlockIndex];
      b.x = blockOrigin.x + (cv.x - pointerOrigin.x);
      b.y = blockOrigin.y + (cv.y - pointerOrigin.y);
      editorCanvas.style.cursor = 'grabbing';
      refreshContent();
    } else if (dragging && dragType === 'image') {
      // Image pan drag — free positioning, no constraints
      const slot = getCurrentSlot();
      const ir = slot?.imageRect;
      if (ir) {
        ir.x = imageOrigin.x + (cv.x - pointerOrigin.x);
        ir.y = imageOrigin.y + (cv.y - pointerOrigin.y);
        editorCanvas.style.cursor = 'grabbing';
        refreshContent();
      }
    } else {
      // Not dragging — update hover cursor
      const hit = hitTestBlock(cv.x, cv.y);
      if (hit >= 0) {
        editorCanvas.style.cursor = 'grab';
      } else if (slotHasImage()) {
        editorCanvas.style.cursor = 'move';
      } else {
        editorCanvas.style.cursor = 'default';
      }
    }
  });

  editorCanvas.addEventListener('pointerup', () => {
    dragging = false;
    dragType = null;
    editorCanvas.style.cursor = 'default';
  });

  // ── Scroll-to-zoom for image (cursor-centric, no selection needed) ─────────

  editorCanvas.addEventListener('wheel', (e) => {
    const slot = getCurrentSlot();
    const ir = slot?.imageRect;
    if (!ir || !slot!.useImage || !slot!.image) return;

    e.preventDefault();

    const rect = editorCanvas.getBoundingClientRect();
    const cursorX = (e.clientX - rect.left) / scale;
    const cursorY = (e.clientY - rect.top) / scale;

    const oldX = ir.x;
    const oldY = ir.y;
    const factor = e.deltaY > 0 ? 0.90 : 1.10;

    ir.width *= factor;
    ir.height *= factor;
    ir.x = cursorX - (cursorX - oldX) * factor;
    ir.y = cursorY - (cursorY - oldY) * factor;

    refreshContent();
  }, { passive: false });

  // Initial setup
  updateDisplaySize();
  refreshToolbar();
}

// ── Public API ───────────────────────────────────────────────────────────────

export function tickEditor(): void {
  renderEditor();
}
