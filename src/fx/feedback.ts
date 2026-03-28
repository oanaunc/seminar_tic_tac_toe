/**
 * feedback.ts – Visual feedback: hover highlights, win glow, invalid-move
 * flash, mark placement animation, winning-line beam, and floating particles.
 */

import * as THREE from "three";
import { scene } from "../renderer";
import { cellIndexToPosition, CELL_UNIT } from "../board/boardMesh";
import { setMarkHighlight, resetMarkHighlight, X_COLOR, O_COLOR } from "../board/marks";
import { PLAYER_X, type Player } from "../game/state";

// ── Hover highlight ─────────────────────────────────────────────────

const hoverMaterial = new THREE.MeshStandardMaterial({
  color: 0xa078ff,
  transparent: true,
  opacity: 0.0,
  roughness: 1,
  depthWrite: false,
  emissive: 0xa078ff,
  emissiveIntensity: 0.3,
});

const hoverPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(CELL_UNIT * 0.86, CELL_UNIT * 0.86),
  hoverMaterial
);
hoverPlane.rotation.x = -Math.PI / 2;
hoverPlane.position.y = 0.07;
hoverPlane.visible = false;
scene.add(hoverPlane);

let currentHover: number | null = null;
let hoverOpacityTarget = 0;

export function showHover(cellIndex: number, player: Player): void {
  currentHover = cellIndex;
  const pos = cellIndexToPosition(cellIndex);
  hoverPlane.position.x = pos.x;
  hoverPlane.position.z = pos.z;
  hoverPlane.visible = true;
  hoverOpacityTarget = 0.18;

  const col = player === PLAYER_X ? X_COLOR : O_COLOR;
  hoverMaterial.color.setHex(col);
  hoverMaterial.emissive.setHex(col);
}

export function hideHover(): void {
  currentHover = null;
  hoverOpacityTarget = 0;
}

/** Smoothly animate hover opacity each frame. */
export function updateHoverOpacity(dt: number): void {
  const speed = 8;
  hoverMaterial.opacity += (hoverOpacityTarget - hoverMaterial.opacity) * Math.min(dt * speed, 1);
  if (hoverMaterial.opacity < 0.005 && hoverOpacityTarget === 0) {
    hoverPlane.visible = false;
  }
}

// ── Invalid move flash ──────────────────────────────────────────────

const flashMaterial = new THREE.MeshStandardMaterial({
  color: 0xff3333,
  emissive: 0xff3333,
  emissiveIntensity: 0.5,
  transparent: true,
  opacity: 0.0,
  roughness: 1,
  depthWrite: false,
});

const flashPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(CELL_UNIT * 0.86, CELL_UNIT * 0.86),
  flashMaterial
);
flashPlane.rotation.x = -Math.PI / 2;
flashPlane.position.y = 0.075;
flashPlane.visible = false;
scene.add(flashPlane);

let flashAlpha = 0;

export function flashInvalid(cellIndex: number): void {
  const pos = cellIndexToPosition(cellIndex);
  flashPlane.position.x = pos.x;
  flashPlane.position.z = pos.z;
  flashPlane.visible = true;
  flashAlpha = 1;
}

export function updateFlash(dt: number): void {
  if (flashAlpha > 0) {
    flashAlpha = Math.max(0, flashAlpha - dt * 4);
    flashMaterial.opacity = flashAlpha * 0.4;
    if (flashAlpha <= 0) flashPlane.visible = false;
  }
}

// ── Mark pop-in animation ───────────────────────────────────────────

interface PopAnim {
  group: THREE.Group;
  elapsed: number;
  duration: number;
}

const activeAnims: PopAnim[] = [];

export function animateMarkIn(group: THREE.Group, durationMs = 200): void {
  group.scale.set(0.01, 0.01, 0.01);
  activeAnims.push({ group, elapsed: 0, duration: durationMs / 1000 });
}

export function updateAnimations(dt: number): void {
  for (let i = activeAnims.length - 1; i >= 0; i--) {
    const a = activeAnims[i];
    a.elapsed += dt;
    const t = Math.min(a.elapsed / a.duration, 1);
    // Elastic ease-out for a bouncy pop feel
    const p = 1 - Math.pow(1 - t, 3);
    const overshoot = 1 + 0.12 * Math.sin(t * Math.PI);
    const scale = p * overshoot;
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
const WIN_GLOW_COLOR = 0xffd93d;

export function showWinLine(
  line: number[],
  markGroups: (THREE.Group | null)[]
): void {
  for (const idx of line) {
    const mg = markGroups[idx];
    if (mg) setMarkHighlight(mg, WIN_GLOW_COLOR, 0.8);
  }

  const start = cellIndexToPosition(line[0]);
  const end = cellIndexToPosition(line[2]);
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const length = start.distanceTo(end) + CELL_UNIT * 0.5;
  const angle = Math.atan2(end.x - start.x, end.z - start.z);

  const beamGeo = new THREE.BoxGeometry(0.09, 0.07, length);
  const beamMat = new THREE.MeshStandardMaterial({
    color: WIN_GLOW_COLOR,
    emissive: WIN_GLOW_COLOR,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.8,
    roughness: 0.2,
    metalness: 0.5,
  });
  winBeam = new THREE.Mesh(beamGeo, beamMat);
  winBeam.position.set(mid.x, 0.28, mid.z);
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

// ── Floating particles (ambient decoration) ─────────────────────────

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

const particles: Particle[] = [];
const particleGeo = new THREE.SphereGeometry(0.035, 8, 8);
const PARTICLE_COLORS = [0xff6b9d, 0x6bcbff, 0xa078ff, 0xffd93d];

/** Spawn a burst of particles at a world position (e.g. on mark placement). */
export function spawnParticles(
  position: THREE.Vector3,
  color: number,
  count = 8
): void {
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
    });
    const mesh = new THREE.Mesh(particleGeo, mat);
    mesh.position.copy(position);
    mesh.position.y += 0.15;
    scene.add(mesh);

    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2;
    const vy = 2 + Math.random() * 2;
    particles.push({
      mesh,
      velocity: new THREE.Vector3(
        Math.cos(angle) * speed,
        vy,
        Math.sin(angle) * speed
      ),
      life: 0,
      maxLife: 0.6 + Math.random() * 0.4,
    });
  }
}

export function updateParticles(dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    const t = p.life / p.maxLife;

    if (t >= 1) {
      scene.remove(p.mesh);
      (p.mesh.material as THREE.Material).dispose();
      particles.splice(i, 1);
      continue;
    }

    p.velocity.y -= 6 * dt; // gravity
    p.mesh.position.addScaledVector(p.velocity, dt);

    const mat = p.mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = (1 - t) * 0.8;
    const s = 1 - t * 0.5;
    p.mesh.scale.set(s, s, s);
  }
}

// ── Ambient floating motes ──────────────────────────────────────────

interface Mote {
  mesh: THREE.Mesh;
  baseY: number;
  speed: number;
  phase: number;
}

const motes: Mote[] = [];

export function createAmbientMotes(): void {
  const moteGeo = new THREE.SphereGeometry(0.025, 6, 6);

  for (let i = 0; i < 20; i++) {
    const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15 + Math.random() * 0.15,
    });
    const mesh = new THREE.Mesh(moteGeo, mat);
    const x = (Math.random() - 0.5) * 8;
    const y = 0.5 + Math.random() * 3;
    const z = (Math.random() - 0.5) * 8;
    mesh.position.set(x, y, z);
    scene.add(mesh);

    motes.push({
      mesh,
      baseY: y,
      speed: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

export function updateMotes(time: number): void {
  for (const m of motes) {
    m.mesh.position.y = m.baseY + Math.sin(time * m.speed + m.phase) * 0.3;
  }
}
