import { params } from './state';
import {
  allPopUps, selectedId, setSelectedId, getNextId, addType, setAddType,
  getPopUpsForPage, removePopUpEntry, createPrimitive,
  PRIMITIVE_OPTIONS, type PrimitiveType, type PopUpEntry,
} from './popup-tab-state';
import { getPopUpBook, getSceneForPage, getAllScenes, turnNext, turnPrev } from './main';
import { getBook } from './book';
import { addSectionTitle, addSlider, addCheckbox } from '@objectifthunes/three-book/demo-kit';

let contentArea: HTMLElement;
let visiblePageIndex = 0;
let springEnabled = true;

export function setVisiblePage(pageIndex: number): void {
  visiblePageIndex = pageIndex;
  rebuildPopUpPanel();
}

export function getVisiblePage(): number {
  return visiblePageIndex;
}

export function rebuildPopUpPanel(): void {
  if (!contentArea) return;
  contentArea.innerHTML = '';

  // ── Navigation ──
  addSectionTitle(contentArea, 'Page Navigation');
  const navRow = document.createElement('div');
  navRow.className = 'demo-page-nav';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '← Prev';
  prevBtn.className = 'demo-btn';
  prevBtn.addEventListener('click', () => turnPrev());
  navRow.appendChild(prevBtn);

  const pageLabel = document.createElement('span');
  pageLabel.style.cssText = 'flex:1;text-align:center;font-size:13px;';
  const book = getBook();
  pageLabel.textContent = book ? `Page ${visiblePageIndex} / ${book.paperCount * 2}` : 'No book';
  navRow.appendChild(pageLabel);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next →';
  nextBtn.className = 'demo-btn';
  nextBtn.addEventListener('click', () => turnNext());
  navRow.appendChild(nextBtn);
  contentArea.appendChild(navRow);

  // ── Spring Animation toggle ──
  addCheckbox(contentArea, 'Spring Animation', springEnabled, (v) => {
    springEnabled = v;
    for (const entry of allPopUps) entry.element.animated = v;
  });

  // ── Add Pop-Up ──
  addSectionTitle(contentArea, 'Add Pop-Up');
  const addRow = document.createElement('div');
  addRow.style.cssText = 'display:flex;gap:8px;margin:4px 0 8px;';

  const typeSelect = document.createElement('select');
  typeSelect.className = 'demo-select';
  typeSelect.style.flex = '1';
  for (const opt of PRIMITIVE_OPTIONS) {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.label;
    el.selected = opt.value === addType;
    typeSelect.appendChild(el);
  }
  typeSelect.addEventListener('change', () => { setAddType(typeSelect.value as PrimitiveType); });
  addRow.appendChild(typeSelect);

  const addBtn = document.createElement('button');
  addBtn.textContent = '+ Add';
  addBtn.className = 'demo-btn';
  addBtn.style.cssText = 'background:rgba(137,216,176,0.2);border-color:rgba(137,216,176,0.4);';
  addBtn.addEventListener('click', () => {
    const popUpBook = getPopUpBook();
    if (!popUpBook) return;
    const scene = getSceneForPage(visiblePageIndex);
    const obj = createPrimitive(addType);
    const element = scene.addPopUp({ object: obj, x: params.pageWidth / 2, z: params.pageHeight / 2 });
    element.animated = springEnabled;
    allPopUps.push({ id: getNextId(), element, type: addType, pageIndex: visiblePageIndex });
    setSelectedId(allPopUps[allPopUps.length - 1].id);
    rebuildPopUpPanel();
  });
  addRow.appendChild(addBtn);
  contentArea.appendChild(addRow);

  // ── Load 3D Model ──
  addSectionTitle(contentArea, 'Or Load 3D Model');
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.glb,.gltf';
  fileInput.className = 'demo-file-input';
  fileInput.style.display = 'block';
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file || !getPopUpBook()) return;
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    const url = URL.createObjectURL(file);
    try {
      const gltf = await loader.loadAsync(url);
      const model = gltf.scene;
      model.traverse((c: any) => { if (c.isMesh) c.castShadow = true; });
      const scene = getSceneForPage(visiblePageIndex);
      const element = scene.addPopUp({ object: model, x: params.pageWidth / 2, z: params.pageHeight / 2 });
      const name = file.name.replace(/\.(glb|gltf)$/i, '');
      element.animated = springEnabled;
      allPopUps.push({ id: getNextId(), element, type: 'cube', displayName: name, pageIndex: visiblePageIndex });
      setSelectedId(allPopUps[allPopUps.length - 1].id);
      rebuildPopUpPanel();
    } catch (err) { console.error('GLTF load failed:', err); }
    finally { URL.revokeObjectURL(url); fileInput.value = ''; }
  });
  contentArea.appendChild(fileInput);

  // ── Pop-Up List ──
  const pagePopUps = getPopUpsForPage(visiblePageIndex);
  addSectionTitle(contentArea, `Pop-Ups on This Page (${pagePopUps.length})`);

  if (pagePopUps.length === 0) {
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:12px;color:#666;padding:4px 0;';
    hint.textContent = 'No pop-ups on this page. Add one above.';
    contentArea.appendChild(hint);
  }

  for (const entry of pagePopUps) {
    const row = document.createElement('div');
    const isSelected = entry.id === selectedId;
    row.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:6px 8px;margin:2px 0;border-radius:4px;cursor:pointer;background:${isSelected ? 'rgba(137,216,176,0.15)' : 'rgba(255,255,255,0.04)'};border:1px solid ${isSelected ? 'rgba(137,216,176,0.3)' : 'transparent'};`;
    row.addEventListener('click', () => { setSelectedId(isSelected ? null : entry.id); rebuildPopUpPanel(); });

    const label = document.createElement('span');
    label.style.fontSize = '13px';
    label.textContent = `${entry.displayName || entry.type} #${entry.id}`;
    row.appendChild(label);

    const rmBtn = document.createElement('span');
    rmBtn.textContent = '×';
    rmBtn.style.cssText = 'cursor:pointer;color:#888;font-size:16px;padding:0 4px;';
    rmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const removed = removePopUpEntry(entry.id);
      if (removed) {
        for (const s of getAllScenes()) {
          if (s.popUps.includes(removed.element)) { s.removePopUp(removed.element); break; }
        }
      }
      rebuildPopUpPanel();
    });
    row.appendChild(rmBtn);
    contentArea.appendChild(row);
  }

  // ── Selected Properties ──
  const selected = allPopUps.find((p) => p.id === selectedId);
  if (selected) {
    addSectionTitle(contentArea, `Selected: ${selected.displayName || selected.type} #${selected.id}`);
    addSlider(contentArea, 'X Position', 0, params.pageWidth, 0.01, selected.element.x, (v) => { selected.element.x = v; });
    addSlider(contentArea, 'Z Position', 0, params.pageHeight, 0.01, selected.element.z, (v) => { selected.element.z = v; });
    addSlider(contentArea, 'Scale', 0.1, 3, 0.05, selected.element.scale, (v) => { selected.element.scale = v; });
    addSlider(contentArea, 'Rotation (°)', 0, 360, 1, Math.round((selected.element.rotation * 180) / Math.PI), (v) => { selected.element.rotation = (v * Math.PI) / 180; });

    const rmSelectedBtn = document.createElement('button');
    rmSelectedBtn.textContent = 'Remove Selected';
    rmSelectedBtn.className = 'demo-btn';
    rmSelectedBtn.style.cssText = 'margin-top:8px;width:100%;background:rgba(200,50,50,0.2);border-color:rgba(200,50,50,0.4);';
    rmSelectedBtn.addEventListener('click', () => {
      const removed = removePopUpEntry(selected.id);
      if (removed) {
        for (const s of getAllScenes()) {
          if (s.popUps.includes(removed.element)) { s.removePopUp(removed.element); break; }
        }
      }
      rebuildPopUpPanel();
    });
    contentArea.appendChild(rmSelectedBtn);
  }
}

export function buildPopUpTab(el: HTMLElement): void {
  contentArea = document.createElement('div');
  el.appendChild(contentArea);
  rebuildPopUpPanel();
}
