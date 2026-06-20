/**
 * Demo state — re-exports shared types from demo-kit,
 * adds book-demo-specific mutable state (params, slots, text blocks).
 */

export type {
  ImageSlot,
  ImageFitMode,
  ImageRect,
  PageTextBlock,
  DirectionOption,
} from '@objectifthunes/three-book/demo-kit';

export {
  createImageSlot,
  clearImageSlot,
  createDefaultTextBlock,
  toBookDirection,
  FONT_OPTIONS,
  DEMO_SHADOW_COLOR,
  DEMO_SHADOW_BLUR,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
} from '@objectifthunes/three-book/demo-kit';

import type { DirectionOption, ImageSlot, PageTextBlock } from '@objectifthunes/three-book/demo-kit';
import { createImageSlot } from '@objectifthunes/three-book/demo-kit';

export const params = {
  pageWidth: 2,
  pageHeight: 3,
  pageThickness: 0.02,
  pageStiffness: 0.2,
  pageCount: 8,
  pageColor: '#f5f5dc',
  coverWidth: 2.1,
  coverHeight: 3.1,
  coverThickness: 0.04,
  coverStiffness: 0.5,
  coverColor: '#ff0000',
  direction: 'left-to-right' as DirectionOption,
  openProgress: 0,
  castShadows: true,
  alignToGround: true,
  hideBinder: false,
  reduceShadows: false,
  reduceSubMeshes: false,
  reduceOverdraw: false,
  interactive: true,
  sunIntensity: 1.2,
  ambientIntensity: 0.6,
  sunX: 5,
  sunY: 10,
  sunZ: 5,
  bookFont: 'Georgia',
};

export const coverImageSlots: ImageSlot[] = [
  createImageSlot(),
  createImageSlot(),
  createImageSlot(),
  createImageSlot(),
];

export const pageImageSlots: ImageSlot[] = [];

export const pageTextBlocks: PageTextBlock[][] = [];

export const coverTextBlocks: PageTextBlock[][] = [[], [], [], []];

export const spreadPages: Set<number> = new Set();

export function ensurePageImageSlots(): void {
  while (pageImageSlots.length < params.pageCount) {
    pageImageSlots.push(createImageSlot());
  }
}

export function ensurePageTextBlocks(): void {
  while (pageTextBlocks.length < params.pageCount) {
    pageTextBlocks.push([]);
  }
}
