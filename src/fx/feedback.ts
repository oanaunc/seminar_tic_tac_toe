/**
 * feedback.ts – Visual feedback: hover highlights, win glow, invalid-move
 * flash, mark placement animation, and winning-line beam.
 */

import * as THREE from "three";
import { scene } from "../renderer";
import { cellIndexToPosition, CELL_UNIT } from "../board/boardMesh";
import { setMarkHighlight, resetMarkHighlight } from "../board/marks";

// ── Hover highlight ─────────────────────────────────────────────────

const hoverMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.12,
  roughness: 1,
  depthWrite: false,
});

const hoverPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(CELL_UNIT * 0.88, CELL_UNIT * 0.88),
  hoverMaterial
);
hoverPlane.rotation.x = -Math.PI / 2;
hoverPlane.position.y = 0.02;
hoverPlane.visible = false;
scene.add(hoverPlane);

let currentHover: number | null = null;

export function showHover(cellIndex: number): void {
  if (currentHover === cellIndex) return;
  currentHover = cellIndex;
  const pos = cellIndexToPosition(cellIndex);
  hoverPlane.position.x = pos.x;
  hoverPlane.position.z = pos.z;
  hoverPlane.visible = true;
}

export function hideHover(): void {
  currentHover = null;
  hoverPlane.visible = false;
}

// ── Invalid move flash ──────────────────────────────────────────────

const flashMaterial = new THREE.MeshStandardMaterial({
  color: 0xff3333,
  transparent: true,
  opacity: 0.35,
  roughness: 1,
  depthWrite: false,
});

const flashPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(CELL_UNIT * 0.88, CELL_UNIT * 0.88),
  flashMaterial
);
flashPlane.rotation.x = -Math.PI / 2;
flashPlane.position.y = 0.03;
flashPlane.visible = false;
scene.add(flashPlane);

let flashTimer: ReturnType<typeof setTimeout> | null = null;

export function flashInvalid(cellIndex: number): void {
  if (flashTimer) clearTimeout(flashTimer);
  const pos = cellIndexToPosition(cellIndex);
  flashPlane.position.x = pos.x;
  flashPlane.position.z = pos.z;
  flashPlane.visible = true;
  flashMaterial.opacity = 0.35;

  flashTimer = setTimeout(() => {
    flashPlane.visible = false;
    flashTimer = null;
  }, 250);
}

// ── Mark pop-in animation ───────────────────────────────────────────

interface PopAnim {
  group: THREE.Group;
  elapsed: number;
  duration: number;
}

const activeAnims: PopAnim[] = [];

export function animateMarkIn(group: THREE.Group, durationMs = 180): void {
  group.scale.set(0.01, 0.01, 0.01);
  activeAnims.push({ group, elapsed: 0, duration: durationMs / 1000 });
}

/** Call every frame with delta in seconds. */
export function updateAnimations(dt: number): void {
  for (let i = activeAnims.length - 1; i >= 0; i--) {
    const a = activeAnims[i];
    a.elapsed += dt;
    const t = Math.min(a.elapsed / a.duration, 1);
    // ease-out back for a slight overshoot feel
    const s = 1 - Math.pow(1 - t, 3);
    const scale = s * (1 + 0.08 * Math.sin(t * Math.PI));
    a.group.scale.set(scale, scale, scale);
    if (t >= 1) {
      a.group.scale.set(1, 1, 1);
      activeAnims.splice(i, 1);
    }
  }
}

export function isAnimating(): boolean {
  return activeAnims.length > 0;
}

// ── Winning line highlight ──────────────────────────────────────────

let winBeam: THREE.Mesh | null = null;
const WIN_GLOW_COLOR = 0x00ff88;

export function showWinLine(
  line: number[],
  markGroups: (THREE.Group | null)[]
): void {
  // Glow the winning marks
  for (const idx of line) {
    const mg = markGroups[idx];
    if (mg) setMarkHighlight(mg, WIN_GLOW_COLOR, 0.6);
  }

  // Draw a beam across the winning cells
  const start = cellIndexToPosition(line[0]);
  const end = cellIndexToPosition(line[2]);
  const mid = new THREE.Vector3()
    .addVectors(start, end)
    .multiplyScalar(0.5);
  const length = start.distanceTo(end) + CELL_UNIT * 0.5;
  const angle = Math.atan2(end.x - start.x, end.z - start.z);

  const beamGeo = new THREE.BoxGeometry(0.08, 0.06, length);
  const beamMat = new THREE.MeshStandardMaterial({
    color: WIN_GLOW_COLOR,
    emissive: WIN_GLOW_COLOR,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.7,
  });
  winBeam = new THREE.Mesh(beamGeo, beamMat);
  winBeam.position.set(mid.x, 0.25, mid.z);
  winBeam.rotation.y = angle;
  scene.add(winBeam);
}

export function clearWinLine(markGroups: (THREE.Group | null)[]): void {
  if (winBeam) {
    scene.remove(winBeam);
    winBeam.geometry.dispose();
    (winBeam.material as THREE.Material).dispose();
    winBeam = null;
  }
  for (const mg of markGroups) {
    if (mg) resetMarkHighlight(mg);
  }
}
