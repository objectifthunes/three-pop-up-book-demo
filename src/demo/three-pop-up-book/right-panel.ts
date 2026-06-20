import type { ImageFitMode, ImageSlot } from './state';
import {
  params,
  coverImageSlots,
  pageImageSlots,
  spreadPages,
  ensurePageImageSlots,
  clearImageSlot,
} from './state';
import { getSpreadPairs, computeDefaultImageRect, PX_PER_UNIT } from '@objectifthunes/three-book';
import { drawImageWithFit } from '@objectifthunes/three-book';
import { refreshContent } from './book';
import { loadImageFromFile, addSectionTitle } from '@objectifthunes/three-book/demo-kit';

let content: HTMLDivElement;

function renderThumbnail(slot: ImageSlot, color: string, aspectW: number, aspectH: number): HTMLCanvasElement {
  const thumbH = 64;
  const thumbW = Math.round(thumbH * (aspectW / aspectH));
  const canvas = document.createElement('canvas');
  canvas.width = thumbW * 2;
  canvas.height = thumbH * 2;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (slot.useImage && slot.image) {
    const margin = slot.fullBleed ? 0 : Math.round(Math.min(canvas.width, canvas.height) * 0.11);
    drawImageWithFit(ctx, slot.image, margin, margin, canvas.width - margin * 2, canvas.height - margin * 2, slot.fitMode);
  }

  canvas.className = 'demo-thumb';
  canvas.style.width = `${thumbW}px`;
  canvas.style.height = `${thumbH}px`;
  return canvas;
}

function createTextureCard(
  label: string,
  slot: ImageSlot,
  bgColor: string,
  aspectW: number,
  aspectH: number,
  onChanged: () => void,
): HTMLElement {
  const card = document.createElement('div');
  card.className = 'demo-card';

  const headerRow = document.createElement('div');
  headerRow.className = 'demo-card-row';

  headerRow.appendChild(renderThumbnail(slot, bgColor, aspectW, aspectH));

  const rightCol = document.createElement('div');
  rightCol.className = 'demo-card-body';

  const labelEl = document.createElement('div');
  labelEl.textContent = label;
  labelEl.className = 'demo-card-label';
  rightCol.appendChild(labelEl);

  // Controls row
  const controlsRow = document.createElement('div');
  controlsRow.className = 'demo-card-controls';

  // Fit mode
  const fitSelect = document.createElement('select');
  fitSelect.className = 'demo-select demo-select--mini';
  for (const opt of [
    { value: 'contain', label: 'Contain' },
    { value: 'cover', label: 'Cover' },
    { value: 'fill', label: 'Fill' },
  ]) {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.label;
    el.selected = opt.value === slot.fitMode;
    fitSelect.appendChild(el);
  }
  fitSelect.addEventListener('change', () => {
    slot.fitMode = fitSelect.value as ImageFitMode;
    if (slot.image) {
      const cw = Math.round(aspectW * PX_PER_UNIT);
      const ch = Math.round(aspectH * PX_PER_UNIT);
      slot.imageRect = computeDefaultImageRect(slot.image, cw, ch, slot.fitMode, slot.fullBleed);
    }
    onChanged();
  });
  controlsRow.appendChild(fitSelect);

  // Full bleed
  const bleedLabel = document.createElement('label');
  bleedLabel.className = 'demo-inline-label';
  const bleedCheck = document.createElement('input');
  bleedCheck.type = 'checkbox';
  bleedCheck.checked = slot.fullBleed;
  bleedCheck.className = 'demo-checkbox--sm';
  bleedCheck.addEventListener('change', () => {
    slot.fullBleed = bleedCheck.checked;
    if (slot.image) {
      const cw = Math.round(aspectW * PX_PER_UNIT);
      const ch = Math.round(aspectH * PX_PER_UNIT);
      slot.imageRect = computeDefaultImageRect(slot.image, cw, ch, slot.fitMode, slot.fullBleed);
    }
    onChanged();
  });
  bleedLabel.appendChild(bleedCheck);
  bleedLabel.appendChild(document.createTextNode('Bleed'));
  controlsRow.appendChild(bleedLabel);

  // Clear
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.textContent = 'Clear';
  clearBtn.className = 'demo-btn';
  clearBtn.addEventListener('click', () => {
    clearImageSlot(slot);
    onChanged();
  });
  controlsRow.appendChild(clearBtn);

  rightCol.appendChild(controlsRow);

  // File input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.className = 'demo-file-input';
  fileInput.addEventListener('change', () => {
    void loadImageFromFile(slot, fileInput.files?.[0] ?? null).then(() => {
      if (slot.image) {
        const cw = Math.round(aspectW * PX_PER_UNIT);
        const ch = Math.round(aspectH * PX_PER_UNIT);
        slot.imageRect = computeDefaultImageRect(slot.image, cw, ch, slot.fitMode, slot.fullBleed);
      }
      onChanged();
    });
  });
  rightCol.appendChild(fileInput);

  headerRow.appendChild(rightCol);
  card.appendChild(headerRow);
  return card;
}

export function rebuildTexturePanel(): void {
  ensurePageImageSlots();
  content.innerHTML = '';

  const onContentChanged = () => {
    rebuildTexturePanel();
    refreshContent();
  };

  // Covers
  addSectionTitle(content, 'Cover Textures');
  const coverLabels = ['Front Outer', 'Front Inner', 'Back Inner', 'Back Outer'];
  for (let i = 0; i < 4; i++) {
    content.appendChild(
      createTextureCard(coverLabels[i], coverImageSlots[i], params.coverColor, params.coverWidth, params.coverHeight, onContentChanged),
    );
  }

  // Pages
  addSectionTitle(content, 'Page Textures');
  const eligibleSpreads = new Set(getSpreadPairs(params.pageCount));
  for (let i = 0; i < params.pageCount; i++) {
    const isSpread = spreadPages.has(i);
    const isRightOfSpread = spreadPages.has(i - 1);

    // If this page is the right half of a spread, skip it (merged into left card)
    if (isRightOfSpread) continue;

    // Show spread checkbox for eligible pairs
    if (eligibleSpreads.has(i)) {
      const spreadRow = document.createElement('label');
      spreadRow.className = 'demo-spread-toggle';
      const spreadCheck = document.createElement('input');
      spreadCheck.type = 'checkbox';
      spreadCheck.checked = isSpread;
      spreadCheck.className = 'demo-spread-checkbox';
      spreadCheck.addEventListener('change', () => {
        if (spreadCheck.checked) {
          spreadPages.add(i);
        } else {
          spreadPages.delete(i);
        }
        rebuildTexturePanel();
        refreshContent();
      });
      spreadRow.appendChild(spreadCheck);
      spreadRow.appendChild(document.createTextNode(`Double-page spread: Pages ${i + 1}\u2013${i + 2}`));
      content.appendChild(spreadRow);
    }

    if (isSpread) {
      // Show a single spread card with double-width aspect ratio
      content.appendChild(
        createTextureCard(
          `Spread ${i + 1}\u2013${i + 2}`,
          pageImageSlots[i],
          params.pageColor,
          params.pageWidth * 2,
          params.pageHeight,
          onContentChanged,
        ),
      );
    } else {
      content.appendChild(
        createTextureCard(`Page ${i + 1}`, pageImageSlots[i], params.pageColor, params.pageWidth, params.pageHeight, onContentChanged),
      );
    }
  }
}

export function buildTexturesTab(container: HTMLElement): void {
  content = document.createElement('div');
  container.appendChild(content);
  rebuildTexturePanel();
}
