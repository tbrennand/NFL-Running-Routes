// Route Runner — Puzzle Definitions
// 10x10 grid: row 0 = opponent's end zone, row 9 = own territory
// Field position = 100 - (row * 10), so row 9 = own 10, row 5 = midfield, row 0 = TD
// Each play starts near where the previous first-down was gained.

export const PUZZLES = [
  // ─── PLAY 1: Short Rush (own 10 → own 30) ───
  // Congested short play, lots of defenders in a small area
  // 8 cells, 6 route pieces. Visible: rows 5–9 (5 rows)
  {
    id: 'short-rush',
    name: 'SHORT RUSH',
    description: 'Quick rush up the gut — move the chains!',
    gridSize: 10,
    start: [9, 4],
    end:   [7, 7],
    visibleFrom: 5,
    solution: [
      [9,4], [8,4], [7,4], [7,5], [6,5], [6,6], [6,7], [7,7],
    ],
    rowClues: [0, 0, 0, 0, 0, 0, 3, 3, 1, 1],
    colClues: [0, 0, 0, 0, 3, 2, 1, 2, 0, 0],
    defenders: [[8,3], [8,5], [7,3], [7,6], [6,4], [5,5], [5,6]],
    inventory: {
      'vertical':  1,
      'horizontal': 1,
      'corner-ur':  0,
      'corner-ul':  1,
      'corner-dr':  2,
      'corner-dl':  1,
    },
  },

  // ─── PLAY 2: Screen Pass (own 30 → opponent's 40) ───
  // Longer winding route through mid-field. Start near play 1's first-down.
  // 11 cells, 9 route pieces. Visible: rows 2–7 (6 rows)
  {
    id: 'screen-pass',
    name: 'SCREEN PASS',
    description: 'Screen pass and run — get past midfield!',
    gridSize: 10,
    start: [7, 3],
    end:   [3, 7],
    visibleFrom: 2,
    visibleTo: 7,
    solution: [
      [7,3], [6,3], [5,3], [5,4], [4,4], [4,5], [4,6], [5,6], [5,7], [4,7], [3,7],
    ],
    rowClues: [0, 0, 0, 1, 4, 4, 1, 1, 0, 0],
    colClues: [0, 0, 0, 3, 2, 1, 2, 3, 0, 0],
    defenders: [[6,4], [5,5], [4,3], [3,6], [6,2], [5,8], [3,8], [2,7]],
    inventory: {
      'vertical':  2,
      'horizontal': 1,
      'corner-ur':  1,
      'corner-ul':  2,
      'corner-dr':  2,
      'corner-dl':  1,
    },
  },

  // ─── PLAY 3: Deep Ball (opponent's 30 → end zone) ───
  // Hardest puzzle — dense defenders, winding route to the end zone.
  // Start near play 2's first-down. 12 cells, 10 route pieces.
  // Visible: rows 0–4 (5 rows, includes end zone)
  {
    id: 'deep-ball',
    name: 'DEEP BALL',
    description: 'Final push to the end zone — score the touchdown!',
    gridSize: 10,
    start: [3, 2],
    end:   [0, 8],
    visibleFrom: 0,
    visibleTo: 4,
    solution: [
      [3,2], [2,2], [2,3], [2,4], [1,4], [1,5], [1,6], [2,6], [2,7], [1,7], [1,8], [0,8],
    ],
    rowClues: [1, 5, 5, 1, 0, 0, 0, 0, 0, 0],
    colClues: [0, 0, 2, 1, 2, 1, 2, 2, 2, 0],
    defenders: [[2,5], [1,3], [0,7], [3,3], [1,2], [0,6], [2,8], [0,4], [3,4]],
    inventory: {
      'vertical':  0,
      'horizontal': 2,
      'corner-ur':  1,
      'corner-ul':  3,
      'corner-dr':  3,
      'corner-dl':  1,
    },
  },
]

function validatePuzzle(puzzle) {
  const { id, gridSize, start, end, rowClues, colClues, solution, defenders = [] } = puzzle

  for (let r = 0; r < gridSize; r++) {
    const count = solution.filter(([row]) => row === r).length
    if (count !== rowClues[r]) {
      console.error(`Puzzle "${id}" row ${r}: solution has ${count} cells, clue says ${rowClues[r]}`)
    }
  }
  for (let c = 0; c < gridSize; c++) {
    const count = solution.filter(([, col]) => col === c).length
    if (count !== colClues[c]) {
      console.error(`Puzzle "${id}" col ${c}: solution has ${count} cells, clue says ${colClues[c]}`)
    }
  }

  const hasStart = solution.some(([r, c]) => r === start[0] && c === start[1])
  const hasEnd   = solution.some(([r, c]) => r === end[0]   && c === end[1])
  if (!hasStart) console.error(`Puzzle "${id}": start [${start}] not in solution`)
  if (!hasEnd)   console.error(`Puzzle "${id}": end [${end}] not in solution`)

  for (const [dr, dc] of defenders) {
    if (solution.some(([sr, sc]) => sr === dr && sc === dc)) {
      console.error(`Puzzle "${id}": defender [${dr},${dc}] overlaps solution path`)
    }
  }

  // Validate inventory matches solution piece count
  if (puzzle.inventory) {
    let totalInventory = 0
    for (const count of Object.values(puzzle.inventory)) totalInventory += count
    const routePieces = solution.length - 2
    if (totalInventory !== routePieces) {
      console.error(`Puzzle "${id}": inventory total ${totalInventory} !== route pieces ${routePieces}`)
    }
  }
}

if (import.meta.env.DEV) {
  PUZZLES.forEach(validatePuzzle)
}
