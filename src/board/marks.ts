/**
 * marks.ts – Bold, colorful X and O mark geometry.
 *
 * X: two crossed rounded box prisms in vibrant pink
 * O: torus ring in vibrant cyan
 */

import * as THREE from "three";
import { CELL_UNIT } from "./boardMesh";

const MARK_SCALE = CELL_UNIT * 0.34;
const ARM_LENGTH = MARK_SCALE * 1.7;
const ARM_THICKNESS = MARK_SCALE * 0.32;
const ARM_DEPTH = MARK_SCALE * 0.32;
const RING_RADIUS = MARK_SCALE * 0.72;
const RING_TUBE = MARK_SCALE * 0.18;

export const X_COLOR = 0xff6b9d;
export const O_COLOR = 0x6bcbff;

const xBaseMat = new THREE.MeshStandardMaterial({
  color: X_COLOR,
  roughness: 0.25,
  metalness: 0.2,
  emissive: X_COLOR,
  emissiveIntensity: 0.12,
});

const oBaseMat = new THREE.MeshStandardMaterial({
  color: O_COLOR,
  roughness: 0.25,
  metalness: 0.2,
  emissive: O_COLOR,
  emissiveIntensity: 0.12,
});

export function createXMark(): THREE.Group {
  const group = new THREE.Group();
  const armGeo = new THREE.BoxGeometry(ARM_LENGTH, ARM_DEPTH, ARM_THICKNESS);

  const arm1 = new THREE.Mesh(armGeo, xBaseMat.clone());
  arm1.rotation.y = Math.PI / 4;
  arm1.castShadow = true;
  group.add(arm1);

  const arm2 = new THREE.Mesh(armGeo, xBaseMat.clone());
  arm2.rotation.y = -Math.PI / 4;
  arm2.castShadow = true;
  group.add(arm2);

  group.userData.markType = "X";
  return group;
}

export function createOMark(): THREE.Group {
  const group = new THREE.Group();
  const torusGeo = new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 28, 56);
  const mesh = new THREE.Mesh(torusGeo, oBaseMat.clone());
  mesh.rotation.x = -Math.PI / 2;
  mesh.castShadow = true;
  group.add(mesh);

  group.userData.markType = "O";
  return group;
}

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

export function resetMarkHighlight(markGroup: THREE.Group): void {
  const isX = markGroup.userData.markType === "X";
  setMarkHighlight(markGroup, isX ? X_COLOR : O_COLOR, 0.12);
}
