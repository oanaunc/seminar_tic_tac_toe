/**
 * picker.ts – Raycasting input: converts mouse position to hovered cell index.
 *
 * Uses Three.js Raycaster against the 9 invisible cell planes.
 * Exposes the currently hovered cell and handles mouse/touch events.
 */

import * as THREE from "three";
import { camera } from "../renderer";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let cellMeshes: THREE.Mesh[] = [];
let hoveredIndex: number | null = null;

/** Called once to register the cell meshes to pick against. */
export function initPicker(cells: THREE.Mesh[]): void {
  cellMeshes = cells;
}

/** Update mouse coordinates from a DOM event. */
function updateMouse(event: MouseEvent | Touch): void {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

/** Perform a raycast and return the cell index under the cursor, or null. */
function pickCell(): number | null {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(cellMeshes, false);
  if (hits.length > 0) {
    return hits[0].object.userData.index as number;
  }
  return null;
}

// ── Public API ──────────────────────────────────────────────────────

export function getHoveredCell(): number | null {
  return hoveredIndex;
}

type CellClickHandler = (index: number) => void;

/**
 * Bind mouse/touch listeners. Returns a cleanup function.
 * `onClick` is called when the user clicks/taps a cell.
 */
export function bindInputEvents(onClick: CellClickHandler): () => void {
  function onMouseMove(e: MouseEvent): void {
    updateMouse(e);
    hoveredIndex = pickCell();
  }

  function onMouseClick(e: MouseEvent): void {
    updateMouse(e);
    const idx = pickCell();
    if (idx !== null) onClick(idx);
  }

  function onTouchStart(e: TouchEvent): void {
    if (e.touches.length > 0) {
      updateMouse(e.touches[0]);
      hoveredIndex = pickCell();
      const idx = pickCell();
      if (idx !== null) onClick(idx);
    }
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("click", onMouseClick);
  window.addEventListener("touchstart", onTouchStart, { passive: true });

  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("click", onMouseClick);
    window.removeEventListener("touchstart", onTouchStart);
  };
}
