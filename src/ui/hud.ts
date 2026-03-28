/**
 * hud.ts – Minimal HTML overlay: turn indicator, status messages, scores.
 *
 * This module reads/writes DOM elements defined in index.html.
 */

import { type Player, PLAYER_X, playerLabel } from "../game/state";

const turnLabel = document.getElementById("turn-label")!;
const statusMsg = document.getElementById("status-msg")!;
const scoreX = document.getElementById("score-x")!;
const scoreDraw = document.getElementById("score-draw")!;
const scoreO = document.getElementById("score-o")!;

let transientTimer: ReturnType<typeof setTimeout> | null = null;

export function setTurn(player: Player): void {
  const label = playerLabel(player);
  turnLabel.textContent = `Turn: ${label}`;
  turnLabel.style.color = player === PLAYER_X ? "#ff6b9d" : "#4ecdc4";
}

export function setWinner(player: Player): void {
  const label = playerLabel(player);
  turnLabel.textContent = `${label} Wins!`;
  turnLabel.style.color = player === PLAYER_X ? "#ff6b9d" : "#4ecdc4";
}

export function setDraw(): void {
  turnLabel.textContent = "Draw!";
  turnLabel.style.color = "#f7dc6f";
}

export function setStatusMessage(msg: string, durationMs = 0): void {
  if (transientTimer) clearTimeout(transientTimer);
  statusMsg.textContent = msg;
  if (durationMs > 0) {
    transientTimer = setTimeout(() => {
      statusMsg.textContent = "";
      transientTimer = null;
    }, durationMs);
  }
}

export function clearStatus(): void {
  if (transientTimer) clearTimeout(transientTimer);
  statusMsg.textContent = "";
}

// ── Scores ──────────────────────────────────────────────────────────

let scores = { x: 0, o: 0, draw: 0 };

export function addScoreX(): void {
  scores.x++;
  scoreX.textContent = String(scores.x);
}

export function addScoreO(): void {
  scores.o++;
  scoreO.textContent = String(scores.o);
}

export function addScoreDraw(): void {
  scores.draw++;
  scoreDraw.textContent = String(scores.draw);
}

export function resetScores(): void {
  scores = { x: 0, o: 0, draw: 0 };
  scoreX.textContent = "0";
  scoreO.textContent = "0";
  scoreDraw.textContent = "0";
}
