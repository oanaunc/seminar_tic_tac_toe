/**
 * controller.ts – Game loop orchestrator.
 *
 * Ties together state, rules, rendering (mark placement/removal),
 * input handling, CPU opponent, and HUD updates. Manages turn
 * transitions, terminal states, and restart.
 */

import * as THREE from "three";
import { scene } from "../renderer";
import {
  type GameState,
  type Player,
  PLAYER_X,
  PLAYER_O,
  createInitialState,
  playerLabel,
} from "./state";
import { isLegalMove, applyMove, getLegalMoves } from "./rules";
import { cpuChooseMove, type Difficulty } from "./cpu";
import { cellIndexToPosition } from "../board/boardMesh";
import { createXMark, createOMark } from "../board/marks";
import { getHoveredCell } from "../input/picker";
import {
  setTurn,
  setWinner,
  setDraw,
  setStatusMessage,
  clearStatus,
  addScoreX,
  addScoreO,
  addScoreDraw,
} from "../ui/hud";
import {
  showHover,
  hideHover,
  flashInvalid,
  animateMarkIn,
  showWinLine,
  clearWinLine,
  isAnimating,
} from "../fx/feedback";

// ── Dev mode toggle ─────────────────────────────────────────────────
const DEV_MODE = false;

function devLog(...args: unknown[]): void {
  if (DEV_MODE) console.log("[TTT]", ...args);
}

// ── Controller state ────────────────────────────────────────────────
let state: GameState = createInitialState();

/** Scene groups for placed marks (null = empty cell). */
const markGroups: (THREE.Group | null)[] = Array(9).fill(null);

/** CPU config. null = human vs human. */
let cpuDifficulty: Difficulty | null = null;
let cpuThinking = false;
let inputLocked = false;

// ── Public API ──────────────────────────────────────────────────────

export function getState(): GameState {
  return state;
}

export function setCpuMode(diff: Difficulty | null): void {
  cpuDifficulty = diff;
  restart();
}

export function getCpuMode(): Difficulty | null {
  return cpuDifficulty;
}

/**
 * Handle a cell click from the human player.
 * Validates the move, applies it, updates the scene, and triggers
 * CPU response if needed.
 */
export function handleCellClick(index: number): void {
  if (inputLocked || cpuThinking) return;
  if (isAnimating()) return;

  if (!isLegalMove(state, index)) {
    flashInvalid(index);
    setStatusMessage("Invalid move!", 1200);
    devLog("Illegal move attempted at", index);
    return;
  }

  placeMove(index);

  // If game is still playing and CPU is active, schedule CPU turn
  if (state.status === "playing" && cpuDifficulty !== null) {
    scheduleCpuMove();
  }
}

/** Restart the game: clear board, reset state, update HUD. */
export function restart(): void {
  // Remove all marks from the scene
  for (let i = 0; i < 9; i++) {
    removeMark(i);
  }
  clearWinLine(markGroups);
  hideHover();
  clearStatus();

  state = createInitialState();
  inputLocked = false;
  cpuThinking = false;

  setTurn(state.currentPlayer);
  devLog("Game restarted. State:", JSON.stringify(state));
}

/**
 * Per-frame update: manage hover highlight based on game status
 * and current hovered cell.
 */
export function updateHover(): void {
  if (state.status !== "playing" || cpuThinking || inputLocked) {
    hideHover();
    return;
  }

  const idx = getHoveredCell();
  if (idx !== null && isLegalMove(state, idx)) {
    showHover(idx);
  } else {
    hideHover();
  }
}

// ── Internal helpers ────────────────────────────────────────────────

function placeMove(index: number): void {
  const player = state.currentPlayer;
  state = applyMove(state, index);

  // Create and place the 3D mark
  const mark =
    player === PLAYER_X ? createXMark() : createOMark();
  const pos = cellIndexToPosition(index);
  mark.position.set(pos.x, pos.y + 0.12, pos.z);
  scene.add(mark);
  markGroups[index] = mark;
  animateMarkIn(mark);

  devLog(
    `Move: ${playerLabel(player)} → cell ${index} | Status: ${state.status} | Legal: ${getLegalMoves(state).length}`
  );

  // Update HUD after move
  if (state.status === "playing") {
    setTurn(state.currentPlayer);
    clearStatus();
  } else {
    handleTerminal();
  }
}

function handleTerminal(): void {
  inputLocked = true;

  if (state.status === "x_wins") {
    setWinner(PLAYER_X);
    addScoreX();
    setStatusMessage("Press R or click Restart to play again");
    if (state.winningLine) showWinLine(state.winningLine, markGroups);
  } else if (state.status === "o_wins") {
    setWinner(PLAYER_O);
    addScoreO();
    setStatusMessage("Press R or click Restart to play again");
    if (state.winningLine) showWinLine(state.winningLine, markGroups);
  } else if (state.status === "draw") {
    setDraw();
    addScoreDraw();
    setStatusMessage("Press R or click Restart to play again");
  }

  devLog("Terminal state:", state.status);
}

function removeMark(index: number): void {
  const group = markGroups[index];
  if (group) {
    scene.remove(group);
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    markGroups[index] = null;
  }
}

function scheduleCpuMove(): void {
  cpuThinking = true;
  setStatusMessage("CPU is thinking...");

  const delay = 250 + Math.random() * 250;
  setTimeout(() => {
    if (state.status !== "playing") {
      cpuThinking = false;
      return;
    }

    const move = cpuChooseMove(state, cpuDifficulty!);
    cpuThinking = false;

    if (move !== null) {
      placeMove(move);
    }
  }, delay);
}
