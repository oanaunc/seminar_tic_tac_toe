/**
 * marks.ts – Geometry builders for X and O marks.
 *
 * X: two crossed thin box prisms
 * O: torus (ring) geometry
 *
 * Each mark is returned as a Group so it can be animated (scale-in).
 */

import * as THREE from "three";
import { CELL_UNIT } from "./boardMesh";

const MARK_SCALE = CELL_UNIT * 0.33;
const ARM_LENGTH = MARK_SCALE * 1.6;
const ARM_THICKNESS = MARK_SCALE * 0.28;
const ARM_DEPTH = MARK_SCALE * 0.28;
const RING_RADIUS = MARK_SCALE * 0.7;
const RING_TUBE = MARK_SCALE * 0.16;

const X_COLOR = 0xff6b9d;
const O_COLOR = 0x4ecdc4;

const xMaterial = new THREE.MeshStandardMaterial({
  color: X_COLOR,
  roughness: 0.35,
  metalness: 0.15,
  emissive: X_COLOR,
  emissiveIntensity: 0.08,
});

const oMaterial = new THREE.MeshStandardMaterial({
  color: O_COLOR,
  roughness: 0.35,
  metalness: 0.15,
  emissive: O_COLOR,
  emissiveIntensity: 0.08,
});

export function createXMark(): THREE.Group {
  const group = new THREE.Group();
  const armGeo = new THREE.BoxGeometry(ARM_LENGTH, ARM_DEPTH, ARM_THICKNESS);

  const arm1 = new THREE.Mesh(armGeo, xMaterial.clone());
  arm1.rotation.y = Math.PI / 4;
  arm1.castShadow = true;
  group.add(arm1);

  const arm2 = new THREE.Mesh(armGeo, xMaterial.clone());
  arm2.rotation.y = -Math.PI / 4;
  arm2.castShadow = true;
  group.add(arm2);

  group.userData.markType = "X";
  return group;
}

export function createOMark(): THREE.Group {
  const group = new THREE.Group();
  const torusGeo = new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 24, 48);
  const mesh = new THREE.Mesh(torusGeo, oMaterial.clone());
  mesh.rotation.x = -Math.PI / 2;
  mesh.castShadow = true;
  group.add(mesh);

  group.userData.markType = "O";
  return group;
}

/** Apply a highlight glow to all meshes in a mark group. */
export function setMarkHighlight(
  markGroup: THREE.Group,
  emissiveColor: number,
  intensity: number
): void {
  markGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mat = child.material as THREE.MeshStandardMaterial;
      mat.emissive.setHex(emissiveColor);
      mat.emissiveIntensity = intensity;
    }
  });
}

/** Reset a mark back to its default subtle glow. */
export function resetMarkHighlight(markGroup: THREE.Group): void {
  const isX = markGroup.userData.markType === "X";
  setMarkHighlight(markGroup, isX ? X_COLOR : O_COLOR, 0.08);
}
