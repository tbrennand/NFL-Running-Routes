# NFL Route Runner

A puzzle game inspired by classic "Train Tracks" logic puzzles, reimagined with an NFL theme. Build wide receiver routes on a football field to move the chains and score a touchdown.

## How to Play

1. **Pick a route piece** from the palette (stems, crosses, curls, posts)
2. **Click cells** on the field to place pieces and build the WR's route from start to target
3. **Place all available pieces** — as soon as the inventory hits zero, the game auto-snaps and runs the route animation

### The Drive

The game simulates an NFL drive with **3 plays** and up to **4 downs** per play, progressing up the field:

| Play | Type        | Field segment                 | Objective                        |
|------|-------------|------------------------------|----------------------------------|
| 1    | Short Rush  | Own 10 → Own 30              | Quick gain — move the chains     |
| 2    | Screen Pass | Own 30 → Opponent's 40       | Mid-field — get past midfield    |
| 3    | Deep Ball   | Opponent's 30 → End Zone     | Final shot — score the touchdown |

- **Success** (route reaches the target): Advance to the next play with a fresh set of downs
- **Failure** (incomplete route or sacked by a defender on downs 1–3): Down increments and the current puzzle resets
- **4th down failure** (sacked or incomplete on 4th): Immediately triggers a **Turnover on Downs** animation and ends the drive

### Clues

- Numbers on the edges of the grid indicate how many route segments belong in that row or column
- Numbers turn **green** when the count is correct
- Each puzzle has a **limited inventory** of route pieces — shown as count badges on each piece. There is exactly **one** valid way to use all the pieces without hitting a defender.

### Field & Presentation

- **WR (blue)**: Your wide receiver at the line of scrimmage
- **1ST marker (orange)**: First-down target — get the route there
- **Star (gold)**: Touchdown target in the end zone
- **Defenders (red)**: Hit one and you're sacked — route around them
- **Field markings**: Full NFL-style grid with yard lines, rotated yard numbers by the sidelines, and hash marks
- **Result animations**: Custom MP4 clips for **First Down**, **Touchdown**, **Incomplete**, **Sacked**, and **Turnover on Downs** play first; then a result box appears underneath with the call and next action.

## Tech Stack

- **Vue 3** (Composition API with `<script setup>`)
- **Vite** for build and dev server
- **Pure CSS** animations and SVG graphics — no external asset dependencies

## Project Structure

```
src/
├── App.vue                    # Root component — drive state, scoreboard, overlays
├── main.js                    # Vue app entry point
├── assets/
│   └── main.css               # Global styles and CSS custom properties
├── components/
│   ├── Grid.vue               # Football field grid with SVG field markings
│   ├── TrackCell.vue          # Individual cell — WR, defenders, route segments
│   └── PiecePalette.vue       # Route piece selector with inventory counts
├── composables/
│   ├── usePuzzle.js           # Puzzle logic — placement, tracing, inventory
│   └── useRouteAnimation.js   # WR animation and play outcome detection
└── data/
    └── puzzles.js             # Puzzle definitions (grid, clues, solution, defenders)
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

Static output goes to `dist/`.

## License

MIT
