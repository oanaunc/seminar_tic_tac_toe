/**
 * rules.ts – Pure functions for legal-move validation, win/draw evaluation.
 *
 * All 8 possible winning lines are enumerated explicitly. Functions here
 * are deterministic and side-effect-free, making them easy to test.
 */

import {
  type GameState,
  type GameStatus,
  type CellValue,
  EMPTY,
  PLAYER_X,
  PLAYER_O,
} from "./state";

/** The 8 lines that can produce a win (indices into the 9-cell board). */
export const WIN_LINES: readonly number[][] = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left col
  [1, 4, 7], // middle col
  [2, 5, 8], // right col
  [0, 4, 8], // main diagonal
  [2, 4, 6], // anti-diagonal
];

/** Return indices of all empty cells (legal placement targets). */
export function getLegalMoves(state: GameState): number[] {
  if (state.status !== "playing") return [];
  const moves: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (state.board[i] === EMPTY) moves.push(i);
  }
  return moves;
}

/** Check whether a specific move is legal. */
export function isLegalMove(state: GameState, index: number): boolean {
  return (
    state.status === "playing" &&
    index >= 0 &&
    index < 9 &&
    state.board[index] === EMPTY
  );
}

export interface TerminalResult {
  status: GameStatus;
  winningLine: number[] | null;
}

/**
 * Evaluate the board for terminal conditions.
 * Returns the resulting status and, if a win, the winning line indices.
 */
export function checkTerminal(board: readonly CellValue[]): TerminalResult {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] !== EMPTY && board[a] === board[b] && board[b] === board[c]) {
      const status: GameStatus =
        board[a] === PLAYER_X ? "x_wins" : "o_wins";
      return { status, winningLine: line };
    }
  }

  const isFull = board.every((cell) => cell !== EMPTY);
  if (isFull) return { status: "draw", winningLine: null };

  return { status: "playing", winningLine: null };
}

/**
 * Apply a move to the state, returning a new state object (immutable update).
 * Does NOT validate the move – caller should check isLegalMove first.
 */
export function applyMove(state: GameState, index: number): GameState {
  const newBoard = [...state.board];
  newBoard[index] = state.currentPlayer;

  const terminal = checkTerminal(newBoard);
  const nextPlayer =
    terminal.status === "playing"
      ? state.currentPlayer === PLAYER_X
        ? PLAYER_O
        : PLAYER_X
      : state.currentPlayer;

  return {
    board: newBoard,
    currentPlayer: nextPlayer,
    status: terminal.status,
    moveCount: state.moveCount + 1,
    winningLine: terminal.winningLine,
  };
}
