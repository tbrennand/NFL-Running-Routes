// Route Runner — Puzzle Definitions
// 10x10 grid = American football field (row 0 = end zone, row 9 = line of scrimmage)
// visibleFrom: first visible row (crops field to fit on screen)
// inventory: exact number of each route piece type available

export const PUZZLES = [
  {
    id: 'short-rush',
    name: 'SHORT RUSH',
    description: 'Quick rush up the gut — move the chains!',
    gridSize: 10,
    start: [9, 3],
    end:   [5, 7],
    visibleFrom: 4,
    rowClues: [0, 0, 0, 0, 0, 4, 1, 2, 1, 1],
    colClues: [0, 0, 0, 3, 3, 1, 1, 1, 0, 0],
    solution: [[9,3],[8,3],[7,3],[7,4],[6,4],[5,4],[5,5],[5,6],[5,7]],
    defenders: [[8,4],[7,5],[6,3],[5,3]],
    inventory: {
      'vertical': 2,
      'horizontal': 2,
      'corner-ur': 0,
      'corner-ul': 1,
      'corner-dr': 2,
      'corner-dl': 0,
    },
  },
  {
    id: 'screen-pass',
    name: 'SCREEN PASS',
    description: 'Screen pass and run — get into the red zone!',
    gridSize: 10,
    start: [9, 4],
    end:   [3, 7],
    visibleFrom: 2,
    rowClues: [0, 0, 0, 2, 2, 1, 1, 1, 2, 1],
    colClues: [0, 0, 0, 0, 2, 5, 2, 1, 0, 0],
    solution: [[9,4],[8,4],[8,5],[7,5],[6,5],[5,5],[4,5],[4,6],[3,6],[3,7]],
    defenders: [[8,6],[7,4],[6,6],[4,4],[3,5]],
    inventory: {
      'vertical': 3,
      'horizontal': 0,
      'corner-ur': 0,
      'corner-ul': 2,
      'corner-dr': 3,
      'corner-dl': 0,
    },
  },
  {
    id: 'deep-pass',
    name: 'DEEP BALL',
    description: 'Deep ball to the back of the end zone — score!',
    gridSize: 10,
    start: [9, 2],
    end:   [0, 7],
    visibleFrom: 0,
    rowClues: [1, 2, 1, 3, 1, 1, 3, 1, 1, 1],
    colClues: [0, 0, 4, 1, 4, 1, 3, 2, 0, 0],
    solution: [[9,2],[8,2],[7,2],[6,2],[6,3],[6,4],[5,4],[4,4],[3,4],[3,5],[3,6],[2,6],[1,6],[1,7],[0,7]],
    defenders: [[8,3],[7,3],[6,5],[5,3],[4,3],[3,7],[2,7],[1,5]],
    inventory: {
      'vertical': 5,
      'horizontal': 2,
      'corner-ur': 0,
      'corner-ul': 3,
      'corner-dr': 3,
      'corner-dl': 0,
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
}

if (import.meta.env.DEV) {
  PUZZLES.forEach(validatePuzzle)
}
