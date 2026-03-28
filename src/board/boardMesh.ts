/**
 * boardMesh.ts – Creates the 3D board geometry and 9 invisible cell
 * meshes used for raycast picking.
 *
 * Board layout (top-down view, indices 0-8):
 *
 *   0 | 1 | 2
 *   ---------
 *   3 | 4 | 5
 *   ---------
 *   6 | 7 | 8
 *
 * The board is centered at the origin on the XZ plane.
 */

import * as THREE from "three";

const BOARD_SIZE = 4.2;
const CELL_SIZE = BOARD_SIZE / 3;
const LINE_THICKNESS = 0.06;
const LINE_HEIGHT = 0.08;
const BOARD_THICKNESS = 0.15;

const boardMaterial = new THREE.MeshStandardMaterial({
  color: 0x16213e,
  roughness: 0.7,
  metalness: 0.1,
});

const lineMaterial = new THREE.MeshStandardMaterial({
  color: 0x0f3460,
  roughness: 0.5,
  metalness: 0.2,
});

/**
 * Convert a cell index (0-8) to world-space XZ center position.
 * Row 0 is at +Z (top of screen), row 2 at -Z.
 */
export function cellIndexToPosition(index: number): THREE.Vector3 {
  const col = index % 3;
  const row = Math.floor(index / 3);
  const x = (col - 1) * CELL_SIZE;
  const z = (row - 1) * CELL_SIZE;
  return new THREE.Vector3(x, BOARD_THICKNESS / 2 + 0.01, z);
}

export interface BoardObjects {
  group: THREE.Group;
  cellMeshes: THREE.Mesh[]; // 9 invisible meshes for picking
}

export function createBoard(): BoardObjects {
  const group = new THREE.Group();

  // ── Base slab ─────────────────────────────────────────────────
  const baseGeo = new THREE.BoxGeometry(BOARD_SIZE + 0.3, BOARD_THICKNESS, BOARD_SIZE + 0.3);
  const base = new THREE.Mesh(baseGeo, boardMaterial);
  base.position.y = -BOARD_THICKNESS / 2;
  base.receiveShadow = true;
  group.add(base);

  // ── Grid lines (2 horizontal + 2 vertical) ───────────────────
  const lineGeoH = new THREE.BoxGeometry(BOARD_SIZE, LINE_HEIGHT, LINE_THICKNESS);
  const lineGeoV = new THREE.BoxGeometry(LINE_THICKNESS, LINE_HEIGHT, BOARD_SIZE);

  for (let i = -1; i <= 1; i += 2) {
    const offset = (i * CELL_SIZE) / 2;

    const hLine = new THREE.Mesh(lineGeoH, lineMaterial);
    hLine.position.set(0, LINE_HEIGHT / 2, offset);
    hLine.castShadow = true;
    group.add(hLine);

    const vLine = new THREE.Mesh(lineGeoV, lineMaterial);
    vLine.position.set(offset, LINE_HEIGHT / 2, 0);
    vLine.castShadow = true;
    group.add(vLine);
  }

  // ── Invisible cell planes for picking ─────────────────────────
  const cellGeo = new THREE.PlaneGeometry(CELL_SIZE * 0.92, CELL_SIZE * 0.92);
  const cellMat = new THREE.MeshBasicMaterial({
    visible: false,
    side: THREE.DoubleSide,
  });

  const cellMeshes: THREE.Mesh[] = [];

  for (let i = 0; i < 9; i++) {
    const mesh = new THREE.Mesh(cellGeo, cellMat.clone());
    const pos = cellIndexToPosition(i);
    mesh.position.copy(pos);
    mesh.position.y = 0.01;
    mesh.rotation.x = -Math.PI / 2;
    mesh.userData = { index: i };
    group.add(mesh);
    cellMeshes.push(mesh);
  }

  return { group, cellMeshes };
}

/** Size of one cell (used by mark geometry to scale properly). */
export const CELL_UNIT = CELL_SIZE;
