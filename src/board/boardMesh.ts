/**
 * boardMesh.ts – Rich 3D board with colored cell tiles, glowing grid
 * lines, and invisible picker meshes.
 *
 * Board layout (top-down, indices 0-8):
 *
 *   0 | 1 | 2
 *   ---------
 *   3 | 4 | 5
 *   ---------
 *   6 | 7 | 8
 */

import * as THREE from "three";

const BOARD_SIZE = 4.2;
const CELL_SIZE = BOARD_SIZE / 3;
const LINE_THICKNESS = 0.05;
const LINE_HEIGHT = 0.1;
const BOARD_THICKNESS = 0.18;
const CELL_GAP = 0.06;

// ── Materials ───────────────────────────────────────────────────────

const boardMaterial = new THREE.MeshStandardMaterial({
  color: 0x1e1245,
  roughness: 0.6,
  metalness: 0.15,
});

const lineMaterial = new THREE.MeshStandardMaterial({
  color: 0xa078ff,
  emissive: 0xa078ff,
  emissiveIntensity: 0.15,
  roughness: 0.3,
  metalness: 0.3,
});

const cellMaterial = new THREE.MeshStandardMaterial({
  color: 0x251660,
  roughness: 0.55,
  metalness: 0.1,
});

// Alternate cell shade for a subtle checkerboard
const cellMaterialAlt = new THREE.MeshStandardMaterial({
  color: 0x2a1a6e,
  roughness: 0.55,
  metalness: 0.1,
});

/**
 * Convert a cell index (0-8) to world-space XZ center.
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
  cellMeshes: THREE.Mesh[];
}

export function createBoard(): BoardObjects {
  const group = new THREE.Group();

  // ── Base slab ─────────────────────────────────────────────────
  const baseGeo = new THREE.BoxGeometry(
    BOARD_SIZE + 0.5,
    BOARD_THICKNESS,
    BOARD_SIZE + 0.5
  );
  const base = new THREE.Mesh(baseGeo, boardMaterial);
  base.position.y = -BOARD_THICKNESS / 2;
  base.receiveShadow = true;
  base.castShadow = true;
  group.add(base);

  // ── Decorative edge trim ──────────────────────────────────────
  const edgeGeo = new THREE.BoxGeometry(
    BOARD_SIZE + 0.54,
    0.03,
    BOARD_SIZE + 0.54
  );
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0xa078ff,
    emissive: 0xa078ff,
    emissiveIntensity: 0.2,
    roughness: 0.3,
    metalness: 0.4,
  });
  const edge = new THREE.Mesh(edgeGeo, edgeMat);
  edge.position.y = 0.005;
  group.add(edge);

  // ── Visible cell tiles ────────────────────────────────────────
  const tileSize = CELL_SIZE - CELL_GAP * 2;
  const tileGeo = new THREE.BoxGeometry(tileSize, 0.06, tileSize);

  for (let i = 0; i < 9; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const isAlt = (col + row) % 2 === 1;
    const tile = new THREE.Mesh(tileGeo, isAlt ? cellMaterialAlt : cellMaterial);
    const pos = cellIndexToPosition(i);
    tile.position.set(pos.x, 0.03, pos.z);
    tile.receiveShadow = true;
    group.add(tile);
  }

  // ── Grid lines (2 horizontal + 2 vertical) ───────────────────
  const lineGeoH = new THREE.BoxGeometry(BOARD_SIZE + 0.12, LINE_HEIGHT, LINE_THICKNESS);
  const lineGeoV = new THREE.BoxGeometry(LINE_THICKNESS, LINE_HEIGHT, BOARD_SIZE + 0.12);

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

  // ── Small corner spheres for polish ───────────────────────────
  const dotGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const dotMat = new THREE.MeshStandardMaterial({
    color: 0xa078ff,
    emissive: 0xa078ff,
    emissiveIntensity: 0.4,
    roughness: 0.2,
    metalness: 0.5,
  });
  const halfCell = CELL_SIZE / 2;
  for (const dx of [-1, 1]) {
    for (const dz of [-1, 1]) {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(dx * halfCell, LINE_HEIGHT + 0.02, dz * halfCell);
      group.add(dot);
    }
  }

  // ── Invisible cell planes for picking ─────────────────────────
  const cellGeo = new THREE.PlaneGeometry(CELL_SIZE * 0.92, CELL_SIZE * 0.92);
  const cellPickMat = new THREE.MeshBasicMaterial({
    visible: false,
    side: THREE.DoubleSide,
  });

  const cellMeshes: THREE.Mesh[] = [];

  for (let i = 0; i < 9; i++) {
    const mesh = new THREE.Mesh(cellGeo, cellPickMat.clone());
    const pos = cellIndexToPosition(i);
    mesh.position.copy(pos);
    mesh.position.y = 0.08;
    mesh.rotation.x = -Math.PI / 2;
    mesh.userData = { index: i };
    group.add(mesh);
    cellMeshes.push(mesh);
  }

  return { group, cellMeshes };
}

export const CELL_UNIT = CELL_SIZE;
