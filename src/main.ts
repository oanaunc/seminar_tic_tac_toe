/**
 * main.ts – Application bootstrap.
 *
 * Sets up the Three.js scene, creates the board, binds input/keyboard
 * events, wires up HUD buttons, and starts the render loop.
 */

import { scene, camera, renderer } from "./renderer";
import { createBoard } from "./board/boardMesh";
import { initPicker, bindInputEvents } from "./input/picker";
import {
  handleCellClick,
  updateHover,
  restart,
  setCpuMode,
} from "./game/controller";
import { setTurn } from "./ui/hud";
import {
  updateAnimations,
  updateHoverOpacity,
  updateFlash,
  updateParticles,
  updateMotes,
  createAmbientMotes,
} from "./fx/feedback";
import { PLAYER_X } from "./game/state";
import type { Difficulty } from "./game/cpu";
import * as THREE from "three";

// ── Scene setup ─────────────────────────────────────────────────────
const { group: boardGroup, cellMeshes } = createBoard();
scene.add(boardGroup);

createAmbientMotes();

// ── Input ───────────────────────────────────────────────────────────
initPicker(cellMeshes);
bindInputEvents(handleCellClick);

// ── Initial HUD state ───────────────────────────────────────────────
setTurn(PLAYER_X);

// ── Keyboard shortcuts ──────────────────────────────────────────────
window.addEventListener("keydown", (e: KeyboardEvent) => {
  switch (e.key.toLowerCase()) {
    case "r":
      restart();
      break;
    case "1":
      setActiveButton("btn-pvp");
      setCpuMode(null);
      break;
    case "2":
      setActiveButton("btn-cpu-easy");
      setCpuMode("easy");
      break;
    case "3":
      setActiveButton("btn-cpu-med");
      setCpuMode("medium");
      break;
    case "4":
      setActiveButton("btn-cpu-hard");
      setCpuMode("hard");
      break;
  }
});

// ── Button wiring ───────────────────────────────────────────────────
const modeButtons: Record<string, Difficulty | null> = {
  "btn-pvp": null,
  "btn-cpu-easy": "easy",
  "btn-cpu-med": "medium",
  "btn-cpu-hard": "hard",
};

function setActiveButton(id: string): void {
  for (const btnId of Object.keys(modeButtons)) {
    document.getElementById(btnId)!.classList.toggle("active", btnId === id);
  }
}

for (const [btnId, diff] of Object.entries(modeButtons)) {
  document.getElementById(btnId)!.addEventListener("click", (e) => {
    e.stopPropagation();
    setActiveButton(btnId);
    setCpuMode(diff);
  });
}

document.getElementById("btn-restart")!.addEventListener("click", (e) => {
  e.stopPropagation();
  restart();
});

// ── Render loop ─────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();
  const elapsed = clock.elapsedTime;

  updateAnimations(dt);
  updateHoverOpacity(dt);
  updateFlash(dt);
  updateParticles(dt);
  updateMotes(elapsed);
  updateHover();

  renderer.render(scene, camera);
}

animate();
