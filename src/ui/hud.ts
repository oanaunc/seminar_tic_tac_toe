/**
 * hud.ts – Drives all HTML overlay elements: turn indicator, status,
 * scores, round counter, player cards, move dots, and win overlay.
 */

import { type Player, PLAYER_X, PLAYER_O, playerLabel } from "../game/state";

const turnLabel = document.getElementById("turn-label")!;
const statusMsg = document.getElementById("status-msg")!;
const roundLabel = document.getElementById("round-label")!;
const scoreX = document.getElementById("score-x")!;
const scoreDraw = document.getElementById("score-draw")!;
const scoreO = document.getElementById("score-o")!;
const playerXCard = document.getElementById("player-x-card")!;
const playerOCard = document.getElementById("player-o-card")!;
const playerOName = document.getElementById("player-o-name")!;
const winOverlay = document.getElementById("win-overlay")!;
const winText = document.getElementById("win-text")!;
const moveDots = document.querySelectorAll<HTMLElement>(".move-dot");

let transientTimer: ReturnType<typeof setTimeout> | null = null;

// ── Turn ────────────────────────────────────────────────────────────

export function setTurn(player: Player): void {
  const label = playerLabel(player);
  turnLabel.textContent = `Turn: ${label}`;
  turnLabel.style.color = player === PLAYER_X ? "#ff6b9d" : "#6bcbff";

  playerXCard.classList.toggle("active-turn", player === PLAYER_X);
  playerOCard.classList.toggle("active-turn", player === PLAYER_O);
}

// ── Terminal states ─────────────────────────────────────────────────

export function setWinner(player: Player): void {
  const label = playerLabel(player);
  const color = player === PLAYER_X ? "#ff6b9d" : "#6bcbff";
  turnLabel.textContent = `${label} Wins!`;
  turnLabel.style.color = color;

  winText.textContent = `${label} Wins!`;
  winText.style.color = color;
  winOverlay.classList.add("show");

  playerXCard.classList.remove("active-turn");
  playerOCard.classList.remove("active-turn");
}

export function setDraw(): void {
  turnLabel.textContent = "Draw!";
  turnLabel.style.color = "#ffd93d";

  winText.textContent = "Draw!";
  winText.style.color = "#ffd93d";
  winOverlay.classList.add("show");

  playerXCard.classList.remove("active-turn");
  playerOCard.classList.remove("active-turn");
}

export function hideWinOverlay(): void {
  winOverlay.classList.remove("show");
}

// ── Status messages ─────────────────────────────────────────────────

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
let roundNumber = 1;

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

export function nextRound(): void {
  roundNumber++;
  roundLabel.textContent = `Round ${roundNumber}`;
}

export function resetRound(): void {
  roundNumber = 1;
  roundLabel.textContent = `Round 1`;
}

export function resetScores(): void {
  scores = { x: 0, o: 0, draw: 0 };
  scoreX.textContent = "0";
  scoreO.textContent = "0";
  scoreDraw.textContent = "0";
  resetRound();
}

// ── Player O name (changes for CPU) ─────────────────────────────────

export function setPlayerOName(name: string): void {
  playerOName.textContent = name;
}

// ── Move dots ───────────────────────────────────────────────────────

export function updateMoveDots(board: readonly number[]): void {
  for (let i = 0; i < 9; i++) {
    const dot = moveDots[i];
    if (!dot) continue;
    dot.classList.remove("x", "o");
    if (board[i] === 1) dot.classList.add("x");
    else if (board[i] === 2) dot.classList.add("o");
  }
}

export function clearMoveDots(): void {
  moveDots.forEach((dot) => dot.classList.remove("x", "o"));
}
