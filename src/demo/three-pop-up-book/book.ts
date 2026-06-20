import * as THREE from 'three';
import { Book, BookContent, StapleBookBinding, TextOverlayContent, SpreadContent, createPageTexture, PX_PER_UNIT, type ImageRect } from '@objectifthunes/three-book';
import { scene } from './main';
import {
  params,
  toBookDirection,
  coverImageSlots,
  pageImageSlots,
  pageTextBlocks,
  coverTextBlocks,
  spreadPages,
  ensurePageImageSlots,
  ensurePageTextBlocks,
  DEMO_SHADOW_COLOR,
  DEMO_SHADOW_BLUR,
} from './state';

let book: Book | null = null;
let generatedTextures: THREE.Texture[] = [];
let statusCallback: ((msg: string) => void) | null = null;

/** Active TextOverlayContent instances — one per non-spread page (null for spread pages). */
const overlays: (TextOverlayContent | null)[] = [];

/** Active TextOverlayContent instances — one per cover surface (null if no text). */
const coverOverlays: (TextOverlayContent | null)[] = [null, null, null, null];

/** Active SpreadContent instances — keyed by spread start index. */
const spreads: Map<number, SpreadContent> = new Map();

export function getBook(): Book | null {
  return book;
}

export function getOverlays(): (TextOverlayContent | null)[] {
  return overlays;
}

export function getCoverOverlays(): (TextOverlayContent | null)[] {
  return coverOverlays;
}

export function getSpreads(): Map<number, SpreadContent> {
  return spreads;
}

export function onBookStatus(cb: (msg: string) => void): void {
  statusCallback = cb;
}

function createTrackedTexture(
  color: string,
  text: string,
  image: HTMLImageElement | null,
  fitMode: 'contain' | 'cover' | 'fill',
  fullBleed: boolean,
  pageW?: number,
  pageH?: number,
  imageRect?: ImageRect | null,
): THREE.Texture {
  const texture = createPageTexture(color, text, image, fitMode, fullBleed, pageW, pageH, imageRect);
  generatedTextures.push(texture);
  return texture;
}

function disposeGeneratedTextures(): void {
  for (const t of generatedTextures) t.dispose();
  generatedTextures = [];
}

function buildBookContent(): BookContent {
  disposeGeneratedTextures();

  const content = new BookContent();
  content.direction = toBookDirection(params.direction);

  // Cover content — use cover dimensions for correct aspect ratio
  content.covers.length = 0;
  const coverCW = Math.round(params.coverWidth * PX_PER_UNIT);
  const coverCH = Math.round(params.coverHeight * PX_PER_UNIT);
  const coverLabels = [
    'Front Cover Outer',
    'Front Cover Inner',
    'Back Cover Inner',
    'Back Cover Outer',
  ];
  for (let i = 0; i < 4; i++) {
    // Dispose previous cover overlay
    coverOverlays[i]?.dispose();
    coverOverlays[i] = null;

    const s = coverImageSlots[i];
    const blocks = coverTextBlocks[i] ?? [];
    const hasText = blocks.some((b) => b.text);

    if (hasText) {
      const baseTex = createTrackedTexture(
        params.coverColor,
        coverLabels[i],
        s.useImage ? s.image : null,
        s.fitMode,
        s.fullBleed,
        params.coverWidth,
        params.coverHeight,
        s.imageRect,
      );
      const overlay = new TextOverlayContent({
        width: coverCW,
        height: coverCH,
        source: (baseTex as THREE.CanvasTexture).image as HTMLCanvasElement,
      });
      for (const b of blocks) {
        if (!b.text) continue;
        overlay.addText({
          text: b.text,
          x: b.x,
          y: b.y,
          width: b.width,
          fontFamily: b.fontFamily || params.bookFont,
          fontSize: b.fontSize,
          fontWeight: b.fontWeight,
          fontStyle: b.fontStyle,
          color: b.color,
          textAlign: b.textAlign,
          shadowColor: DEMO_SHADOW_COLOR,
          shadowBlur: DEMO_SHADOW_BLUR,
        });
      }
      coverOverlays[i] = overlay;
      content.covers.push(overlay);
    } else {
      content.covers.push(
        createTrackedTexture(
          params.coverColor,
          coverLabels[i],
          s.useImage ? s.image : null,
          s.fitMode,
          s.fullBleed,
          params.coverWidth,
          params.coverHeight,
          s.imageRect,
        ),
      );
    }
  }

  // Page textures — use page dimensions for correct aspect ratio
  const pageCW = Math.round(params.pageWidth * PX_PER_UNIT);
  const pageCH = Math.round(params.pageHeight * PX_PER_UNIT);

  content.pages.length = 0;
  for (const o of overlays) o?.dispose();
  overlays.length = 0;
  for (const s of spreads.values()) s.dispose();
  spreads.clear();
  ensurePageImageSlots();
  ensurePageTextBlocks();

  for (let i = 0; i < params.pageCount; i++) {
    // Check if this page is part of a spread
    if (spreadPages.has(i)) {
      // This is the left page of a spread — create SpreadContent
      const s = pageImageSlots[i];
      const spreadBaseTex = createTrackedTexture(
        params.pageColor,
        `Spread ${i + 1}-${i + 2}`,
        s.useImage ? s.image : null,
        s.fitMode,
        s.fullBleed,
        params.pageWidth * 2,
        params.pageHeight,
        s.imageRect,
      );
      const spread = new SpreadContent({
        pageWidth: pageCW,
        pageHeight: pageCH,
        source: (spreadBaseTex as THREE.CanvasTexture).image as HTMLCanvasElement,
      });

      // Add text blocks from the left page's text block array (spread coordinates)
      const blocks = pageTextBlocks[i] ?? [];
      for (const b of blocks) {
        if (!b.text) continue;
        spread.addText({
          text: b.text,
          x: b.x,
          y: b.y,
          width: b.width,
          fontFamily: b.fontFamily || params.bookFont,
          fontSize: b.fontSize,
          fontWeight: b.fontWeight,
          fontStyle: b.fontStyle,
          color: b.color,
          textAlign: b.textAlign,
          shadowColor: DEMO_SHADOW_COLOR,
          shadowBlur: DEMO_SHADOW_BLUR,
        });
      }

      spreads.set(i, spread);
      overlays.push(null); // left page — no individual overlay
      content.pages.push(spread.left);
      continue;
    }

    // Check if this page is the right half of a spread
    if (spreadPages.has(i - 1)) {
      const spread = spreads.get(i - 1)!;
      overlays.push(null); // right page — no individual overlay
      content.pages.push(spread.right);
      continue;
    }

    // Normal single page
    const s = pageImageSlots[i];
    const baseTex = createTrackedTexture(
      params.pageColor,
      `Page ${i + 1}`,
      s.useImage ? s.image : null,
      s.fitMode,
      s.fullBleed,
      params.pageWidth,
      params.pageHeight,
      s.imageRect,
    );
    const overlay = new TextOverlayContent({
      width: pageCW,
      height: pageCH,
      source: (baseTex as THREE.CanvasTexture).image as HTMLCanvasElement,
    });

    // Add text blocks from state
    const blocks = pageTextBlocks[i] ?? [];
    for (const b of blocks) {
      if (!b.text) continue;
      overlay.addText({
        text: b.text,
        x: b.x,
        y: b.y,
        width: b.width,
        fontFamily: b.fontFamily || params.bookFont,
        fontSize: b.fontSize,
        fontWeight: b.fontWeight,
        fontStyle: b.fontStyle,
        color: b.color,
        textAlign: b.textAlign,
        shadowColor: DEMO_SHADOW_COLOR,
        shadowBlur: DEMO_SHADOW_BLUR,
      });
    }

    overlays.push(overlay);
    content.pages.push(overlay);
  }

  return content;
}

export function refreshContent(): void {
  if (!book) return;
  book.content = buildBookContent();
}

export function buildBook(): void {
  const savedProgress = book ? book.openProgress : params.openProgress;

  if (book) {
    book.dispose();
    scene.remove(book);
    book = null;
  }
  // Note: generated textures, overlays, spreads are disposed inside buildBookContent

  const content = buildBookContent();
  const binding = new StapleBookBinding();

  try {
    book = new Book({
      content,
      binding,
      initialOpenProgress: savedProgress,
      castShadows: params.castShadows,
      alignToGround: params.alignToGround,
      hideBinder: params.hideBinder,
      reduceShadows: params.reduceShadows,
      reduceSubMeshes: params.reduceSubMeshes,
      reduceOverdraw: params.reduceOverdraw,
      pagePaperSetup: {
        width: params.pageWidth,
        height: params.pageHeight,
        thickness: params.pageThickness,
        stiffness: params.pageStiffness,
        color: new THREE.Color(1, 1, 1),
        material: null,
      },
      coverPaperSetup: {
        width: params.coverWidth,
        height: params.coverHeight,
        thickness: params.coverThickness,
        stiffness: params.coverStiffness,
        color: new THREE.Color(1, 1, 1),
        material: null,
      },
    });
    book.init();
    scene.add(book);
    statusCallback?.(`Book built: ${book.paperCount} papers`);
  } catch (err) {
    statusCallback?.(`Error: ${(err as Error).message}`);
    console.error(err);
  }
}
