# Tic-Tac-Toe 3D

A polished, browser-based **3D Tic-Tac-Toe** built with **Three.js** and **TypeScript**, demonstrating core game mechanics: discrete state, decision loops, legal-move validation, and terminal conditions.

![Tic-Tac-Toe](assets/tic-tac-toe-ui-with-arow-cursor-board-logic-game-for-your-game-development-ui-strategy-game-noughts-and-crosses-vector-38a435dd-5798-4118-9903-b8a2ffb9c773.png)

## Quick Start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build for Production

```bash
npm run build
npm run preview
```

## Controls

| Input | Action |
|-------|--------|
| **Mouse hover** | Highlights empty cells |
| **Click / Tap** | Place mark on the hovered cell |
| **R** | Restart the game |
| **1** | Human vs Human mode |
| **2** | Human vs CPU (Easy – random) |
| **3** | Human vs CPU (Medium – rule-based) |
| **4** | Human vs CPU (Hard – minimax, unbeatable) |

## Architecture

```
src/
├── main.ts              App bootstrap, scene setup, render loop
├── renderer.ts          Three.js renderer, camera, lights, resize
├── board/
│   ├── boardMesh.ts     Board geometry, grid lines, cell picker meshes
│   └── marks.ts         X (crossed prisms) and O (torus) geometry
├── input/
│   └── picker.ts        Raycaster mouse/touch → cell index
├── game/
│   ├── state.ts         GameState type, factory, helpers
│   ├── rules.ts         Legal moves, win/draw evaluation, applyMove
│   ├── cpu.ts           AI opponents (easy/medium/hard)
│   └── controller.ts    Turn loop, transitions, restart orchestration
├── ui/
│   └── hud.ts           HTML overlay: turn, status, scores
└── fx/
    └── feedback.ts      Hover glow, invalid flash, pop-in animation, win beam
```

### State Representation

The game state is a plain serializable object:

```typescript
interface GameState {
  board: CellValue[];      // 9 cells: 0=empty, 1=X, 2=O
  currentPlayer: Player;   // 1 (X) or 2 (O)
  status: GameStatus;      // 'playing' | 'x_wins' | 'o_wins' | 'draw'
  moveCount: number;
  winningLine: number[] | null;
}
```

### Rule Evaluation

All 8 win lines are checked after every move. Functions `getLegalMoves`, `isLegalMove`, `applyMove`, and `checkTerminal` are **pure** – no side effects, easy to unit test.

### CPU Opponent

Three difficulty levels:

- **Easy** – picks a random legal cell
- **Medium** – rule-based: win → block → center → corner → side
- **Hard** – minimax with alpha-beta pruning (optimal, never loses)

### Rendering Pipeline

State changes flow one-way: `state → controller → scene + HUD`. The render loop runs at 60fps, updating hover highlights and mark pop-in animations each frame.

## Dev Mode

Set `DEV_MODE = true` in `src/game/controller.ts` to enable console logging of every move and state transition.
