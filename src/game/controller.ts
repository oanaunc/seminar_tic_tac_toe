/**
 * controller.ts – Game loop orchestrator.
 *
 * Ties together state, rules, rendering (mark placement/removal),
 * input handling, CPU opponent, and HUD updates.
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
import { createXMark, createOMark, X_COLOR, O_COLOR } from "../board/marks";
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
  hideWinOverlay,
  nextRound,
  setPlayerOName,
  updateMoveDots,
  clearMoveDots,
} from "../ui/hud";
import {
  showHover,
  hideHover,
  flashInvalid,
  animateMarkIn,
  showWinLine,
  clearWinLine,
  isAnimating,
  spawnParticles,
} from "../fx/feedback";

const DEV_MODE = false;

function devLog(...args: unknown[]): void {
  if (DEV_MODE) console.log("[TTT]", ...args);
}

// ── Controller state ────────────────────────────────────────────────
let state: GameState = createInitialState();
const markGroups: (THREE.Group | null)[] = Array(9).fill(null);
let cpuDifficulty: Difficulty | null = null;
let cpuThinking = false;
let inputLocked = false;
let isFirstGame = true;

// ── Public API ──────────────────────────────────────────────────────

export function getState(): GameState {
  return state;
}

export function setCpuMode(diff: Difficulty | null): void {
  cpuDifficulty = diff;
  if (diff === null) {
    setPlayerOName("Player 2");
  } else {
    const labels: Record<Difficulty, string> = {
      easy: "CPU Easy",
      medium: "CPU Med",
      hard: "CPU Hard",
    };
    setPlayerOName(labels[diff]);
  }
  restart();
}

export function getCpuMode(): Difficulty | null {
  return cpuDifficulty;
}

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

  if (state.status === "playing" && cpuDifficulty !== null) {
    scheduleCpuMove();
  }
}

export function restart(): void {
  for (let i = 0; i < 9; i++) {
    removeMark(i);
  }
  clearWinLine(markGroups);
  hideHover();
  clearStatus();
  hideWinOverlay();
  clearMoveDots();

  if (!isFirstGame) {
    nextRound();
  }
  isFirstGame = false;

  state = createInitialState();
  inputLocked = false;
  cpuThinking = false;

  setTurn(state.currentPlayer);
  devLog("Game restarted. State:", JSON.stringify(state));
}

export function updateHover(): void {
  if (state.status !== "playing" || cpuThinking || inputLocked) {
    hideHover();
    return;
  }

  const idx = getHoveredCell();
  if (idx !== null && isLegalMove(state, idx)) {
    showHover(idx, state.currentPlayer);
  } else {
    hideHover();
  }
}

// ── Internal helpers ────────────────────────────────────────────────

function placeMove(index: number): void {
  const player = state.currentPlayer;
  state = applyMove(state, index);

  const mark = player === PLAYER_X ? createXMark() : createOMark();
  const pos = cellIndexToPosition(index);
  mark.position.set(pos.x, pos.y + 0.14, pos.z);
  scene.add(mark);
  markGroups[index] = mark;
  animateMarkIn(mark);

  // Burst particles at placement position
  const particleColor = player === PLAYER_X ? X_COLOR : O_COLOR;
  spawnParticles(pos, particleColor, 10);

  updateMoveDots(state.board);

  devLog(
    `Move: ${playerLabel(player)} → cell ${index} | Status: ${state.status} | Legal: ${getLegalMoves(state).length}`
  );

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
    if (state.winningLine) {
      showWinLine(state.winningLine, markGroups);
      // Extra particles on winning cells
      for (const idx of state.winningLine) {
        spawnParticles(cellIndexToPosition(idx), 0xffd93d, 6);
      }
    }
  } else if (state.status === "o_wins") {
    setWinner(PLAYER_O);
    addScoreO();
    if (state.winningLine) {
      showWinLine(state.winningLine, markGroups);
      for (const idx of state.winningLine) {
        spawnParticles(cellIndexToPosition(idx), 0xffd93d, 6);
      }
    }
  } else if (state.status === "draw") {
    setDraw();
    addScoreDraw();
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
