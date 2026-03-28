/**
 * state.ts – Discrete game state representation.
 *
 * The board is a flat array of 9 cells. Each cell holds:
 *   0 = empty, 1 = X, 2 = O
 *
 * The state is a plain object so it can be serialized to JSON trivially.
 */

export const EMPTY = 0 as const;
export const PLAYER_X = 1 as const;
export const PLAYER_O = 2 as const;

export type CellValue = typeof EMPTY | typeof PLAYER_X | typeof PLAYER_O;
export type Player = typeof PLAYER_X | typeof PLAYER_O;

export type GameStatus = "playing" | "x_wins" | "o_wins" | "draw";

export interface GameState {
  board: CellValue[];
  currentPlayer: Player;
  status: GameStatus;
  moveCount: number;
  winningLine: number[] | null;
}

/** Create a fresh initial state. */
export function createInitialState(): GameState {
  return {
    board: Array(9).fill(EMPTY),
    currentPlayer: PLAYER_X,
    status: "playing",
    moveCount: 0,
    winningLine: null,
  };
}

/** Return the opponent of a given player. */
export function opponent(p: Player): Player {
  return p === PLAYER_X ? PLAYER_O : PLAYER_X;
}

/** Human-readable label for a player value. */
export function playerLabel(p: Player): string {
  return p === PLAYER_X ? "X" : "O";
}
