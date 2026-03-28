/**
 * renderer.ts – Three.js scene, camera, lights, and renderer setup.
 *
 * Provides a slightly angled perspective camera looking down at the board,
 * hemisphere + directional lighting, and proper resize handling.
 */

import * as THREE from "three";

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// ── Camera ──────────────────────────────────────────────────────────
// Perspective camera angled to give a nice 3D view of the board
export const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 7, 5.5);
camera.lookAt(0, 0, 0);

// ── Renderer ────────────────────────────────────────────────────────
export const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.prepend(renderer.domElement);

// ── Lights ──────────────────────────────────────────────────────────
const hemiLight = new THREE.HemisphereLight(0xc9d6ff, 0x3a3a5c, 0.8);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(4, 8, 4);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 20;
dirLight.shadow.camera.left = -5;
dirLight.shadow.camera.right = 5;
dirLight.shadow.camera.top = 5;
dirLight.shadow.camera.bottom = -5;
dirLight.shadow.bias = -0.002;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0x8ecae6, 0.4);
fillLight.position.set(-3, 5, -2);
scene.add(fillLight);

// ── Resize handling ─────────────────────────────────────────────────
export function handleResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", handleResize);
