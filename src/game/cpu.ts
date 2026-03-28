/**
 * cpu.ts – Simple AI opponents for the O player.
 *
 * Three difficulty levels, each implemented as a pure function that
 * selects a move index from the legal moves.
 *
 *  Easy   – random legal move
 *  Medium – rule-based: win > block > center > corner > side
 *  Hard   – minimax (optimal play, never loses)
 */

import {
  type GameState,
  type Player,
  type CellValue,
  EMPTY,
  PLAYER_X,
  PLAYER_O,
  opponent,
} from "./state";
import { getLegalMoves, WIN_LINES, checkTerminal } from "./rules";

export type Difficulty = "easy" | "medium" | "hard";

export function cpuChooseMove(
  state: GameState,
  difficulty: Difficulty
): number | null {
  const legal = getLegalMoves(state);
  if (legal.length === 0) return null;

  switch (difficulty) {
    case "easy":
      return pickRandom(legal);
    case "medium":
      return pickMedium(state, legal);
    case "hard":
      return pickHard(state);
  }
}

function pickRandom(moves: number[]): number {
  return moves[Math.floor(Math.random() * moves.length)];
}

/**
 * Rule-based medium AI:
 *  1) Win if possible
 *  2) Block opponent's winning move
 *  3) Take center
 *  4) Take a corner
 *  5) Take any side
 */
function pickMedium(state: GameState, legal: number[]): number {
  const me = state.currentPlayer;
  const opp = opponent(me);

  const winning = findWinningMove(state.board, me, legal);
  if (winning !== null) return winning;

  const blocking = findWinningMove(state.board, opp, legal);
  if (blocking !== null) return blocking;

  if (legal.includes(4)) return 4;

  const corners = [0, 2, 6, 8].filter((i) => legal.includes(i));
  if (corners.length > 0) return pickRandom(corners);

  return pickRandom(legal);
}

/** Check if `player` can win in one move; return that cell index. */
function findWinningMove(
  board: readonly CellValue[],
  player: Player,
  legal: number[]
): number | null {
  for (const move of legal) {
    const testBoard = [...board];
    testBoard[move] = player;
    const result = checkTerminal(testBoard);
    if (
      result.status === (player === PLAYER_X ? "x_wins" : "o_wins")
    ) {
      return move;
    }
  }
  return null;
}

/** Minimax with alpha-beta pruning for optimal play. */
function pickHard(state: GameState): number {
  const legal = getLegalMoves(state);
  let bestScore = -Infinity;
  let bestMove = legal[0];

  for (const move of legal) {
    const newBoard = [...state.board];
    newBoard[move] = state.currentPlayer;
    const score = minimax(
      newBoard,
      opponent(state.currentPlayer),
      false,
      state.currentPlayer,
      -Infinity,
      Infinity
    );
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function minimax(
  board: CellValue[],
  current: Player,
  isMaximizing: boolean,
  cpuPlayer: Player,
  alpha: number,
  beta: number
): number {
  const result = checkTerminal(board);

  if (result.status !== "playing") {
    if (result.status === "draw") return 0;
    const winner = result.status === "x_wins" ? PLAYER_X : PLAYER_O;
    return winner === cpuPlayer ? 10 : -10;
  }

  const empties: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === EMPTY) empties.push(i);
  }

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of empties) {
      board[move] = current;
      const score = minimax(
        board,
        opponent(current),
        false,
        cpuPlayer,
        alpha,
        beta
      );
      board[move] = EMPTY;
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of empties) {
      board[move] = current;
      const score = minimax(
        board,
        opponent(current),
        true,
        cpuPlayer,
        alpha,
        beta
      );
      board[move] = EMPTY;
      best = Math.min(best, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return best;
  }
}
