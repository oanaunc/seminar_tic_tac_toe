/**
 * renderer.ts – Three.js scene, camera, lights, and renderer setup.
 *
 * Rich purple-blue gradient background, warm hemisphere lighting,
 * and soft directional shadows for a vibrant, polished feel.
 */

import * as THREE from "three";

export const scene = new THREE.Scene();

// Gradient background via a large backdrop plane
scene.background = new THREE.Color(0x1a0e35);
scene.fog = new THREE.Fog(0x1a0e35, 12, 25);

// ── Camera ──────────────────────────────────────────────────────────
export const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 7.5, 5.8);
camera.lookAt(0, 0, 0.2);

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
renderer.toneMappingExposure = 1.2;
document.body.prepend(renderer.domElement);

// ── Lights ──────────────────────────────────────────────────────────
// Warm hemisphere for ambient fill
const hemiLight = new THREE.HemisphereLight(0xd4b8ff, 0x1a0e35, 0.7);
scene.add(hemiLight);

// Key light – warm white from above-right
const keyLight = new THREE.DirectionalLight(0xfff0e6, 1.4);
keyLight.position.set(3, 9, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 20;
keyLight.shadow.camera.left = -5;
keyLight.shadow.camera.right = 5;
keyLight.shadow.camera.top = 5;
keyLight.shadow.camera.bottom = -5;
keyLight.shadow.bias = -0.002;
scene.add(keyLight);

// Pink rim light from left
const rimPink = new THREE.DirectionalLight(0xff6b9d, 0.35);
rimPink.position.set(-5, 4, -2);
scene.add(rimPink);

// Cyan fill from right
const rimCyan = new THREE.DirectionalLight(0x6bcbff, 0.35);
rimCyan.position.set(5, 3, -1);
scene.add(rimCyan);

// Soft underlight for depth
const underLight = new THREE.PointLight(0xa078ff, 0.4, 12);
underLight.position.set(0, -2, 0);
scene.add(underLight);

// ── Ambient ground plane ────────────────────────────────────────────
const groundGeo = new THREE.PlaneGeometry(30, 30);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x120a28,
  roughness: 0.95,
  metalness: 0,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.25;
ground.receiveShadow = true;
scene.add(ground);

// ── Resize handling ─────────────────────────────────────────────────
export function handleResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", handleResize);
