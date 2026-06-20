/**
 * Pop-up specific state — separate from three-book demo state.
 */

import * as THREE from 'three';
import type { PopUpElement } from '@objectifthunes/three-pop-up-book';

export type PrimitiveType = 'cube' | 'cone' | 'sphere' | 'cylinder' | 'tree' | 'star';

export const PRIMITIVE_OPTIONS: { value: PrimitiveType; label: string }[] = [
  { value: 'cube', label: 'Cube' },
  { value: 'cone', label: 'Cone' },
  { value: 'sphere', label: 'Sphere' },
  { value: 'cylinder', label: 'Cylinder' },
  { value: 'tree', label: 'Tree' },
  { value: 'star', label: 'Star' },
];

export interface PopUpEntry {
  id: number;
  element: PopUpElement;
  type: PrimitiveType;
  displayName?: string;
  pageIndex: number;
}

export const allPopUps: PopUpEntry[] = [];
export let selectedId: number | null = null;
export let addType: PrimitiveType = 'cube';

let nextId = 1;
export function getNextId(): number { return nextId++; }
export function setSelectedId(id: number | null): void { selectedId = id; }
export function setAddType(t: PrimitiveType): void { addType = t; }

export function getPopUpsForPage(pageIndex: number): PopUpEntry[] {
  return allPopUps.filter((p) => p.pageIndex === pageIndex);
}

export function removePopUpEntry(id: number): PopUpEntry | undefined {
  const idx = allPopUps.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const [entry] = allPopUps.splice(idx, 1);
  if (selectedId === id) selectedId = null;
  return entry;
}

// --- Primitives ---
const COLORS = ['#e85050', '#50a0e8', '#50e870', '#e8c850', '#c050e8', '#50e8d4', '#e87850', '#78e850', '#5078e8'];
let colorIdx = 0;

function makeMesh(geo: THREE.BufferGeometry, color: string): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  return m;
}

export function createPrimitive(type: PrimitiveType): THREE.Object3D {
  const color = COLORS[colorIdx++ % COLORS.length];
  switch (type) {
    case 'cube': { const g = new THREE.BoxGeometry(0.35, 0.35, 0.35); g.translate(0, 0.175, 0); return makeMesh(g, color); }
    case 'cone': { const g = new THREE.ConeGeometry(0.2, 0.5, 8); g.translate(0, 0.25, 0); return makeMesh(g, color); }
    case 'sphere': { const g = new THREE.SphereGeometry(0.2, 16, 12); g.translate(0, 0.2, 0); return makeMesh(g, color); }
    case 'cylinder': { const g = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12); g.translate(0, 0.25, 0); return makeMesh(g, color); }
    case 'tree': {
      const group = new THREE.Group();
      const trunk = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8); trunk.translate(0, 0.15, 0);
      group.add(makeMesh(trunk, '#8B4513'));
      const foliage = new THREE.ConeGeometry(0.2, 0.4, 8); foliage.translate(0, 0.5, 0);
      group.add(makeMesh(foliage, '#228B22'));
      return group;
    }
    case 'star': {
      const shape = new THREE.Shape();
      const outerR = 0.25, innerR = 0.1;
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      shape.closePath();
      const g = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false });
      g.rotateX(-Math.PI / 2); g.translate(0, 0.08, 0);
      return makeMesh(g, color);
    }
  }
}
