import { ref, computed } from 'vue'

export const SEGMENT_TYPES = {
  VERTICAL:   'vertical',
  HORIZONTAL: 'horizontal',
  CORNER_UR:  'corner-ur',
  CORNER_UL:  'corner-ul',
  CORNER_DR:  'corner-dr',
  CORNER_DL:  'corner-dl',
}

export const SEGMENT_CONNECTIONS = {
  [SEGMENT_TYPES.VERTICAL]:   { up: true,  down: true,  left: false, right: false },
  [SEGMENT_TYPES.HORIZONTAL]: { up: false, down: false, left: true,  right: true  },
  [SEGMENT_TYPES.CORNER_UR]:  { up: true,  down: false, left: false, right: true  },
  [SEGMENT_TYPES.CORNER_UL]:  { up: true,  down: false, left: true,  right: false },
  [SEGMENT_TYPES.CORNER_DR]:  { up: false, down: true,  left: false, right: true  },
  [SEGMENT_TYPES.CORNER_DL]:  { up: false, down: true,  left: true,  right: false },
}

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' }

function cellKey(row, col) { return `${row}-${col}` }

function getNeighbors(row, col, gridSize) {
  const neighbors = {}
  if (row > 0)             neighbors.up    = [row - 1, col]
  if (row < gridSize - 1)  neighbors.down  = [row + 1, col]
  if (col > 0)             neighbors.left  = [row, col - 1]
  if (col < gridSize - 1)  neighbors.right = [row, col + 1]
  return neighbors
}

function getAutoSegmentType(row, col, filled, gridSize) {
  const n = getNeighbors(row, col, gridSize)
  const up    = n.up    ? filled.has(cellKey(...n.up))    : false
  const down  = n.down  ? filled.has(cellKey(...n.down))  : false
  const left  = n.left  ? filled.has(cellKey(...n.left))  : false
  const right = n.right ? filled.has(cellKey(...n.right)) : false

  // Two-direction matches
  if (up && down && !left && !right) return SEGMENT_TYPES.VERTICAL
  if (!up && !down && left && right) return SEGMENT_TYPES.HORIZONTAL
  if (up && right && !down && !left) return SEGMENT_TYPES.CORNER_UR
  if (up && left && !down && !right) return SEGMENT_TYPES.CORNER_UL
  if (down && right && !up && !left) return SEGMENT_TYPES.CORNER_DR
  if (down && left && !up && !right) return SEGMENT_TYPES.CORNER_DL

  // Single-direction (endpoints) — pick a segment that opens in that direction
  if (up && !down && !left && !right)   return SEGMENT_TYPES.VERTICAL
  if (down && !up && !left && !right)   return SEGMENT_TYPES.VERTICAL
  if (left && !up && !down && !right)   return SEGMENT_TYPES.HORIZONTAL
  if (right && !up && !down && !left)   return SEGMENT_TYPES.HORIZONTAL

  return null
}

function solveSegmentType(idx, solution) {
  const [r, c] = solution[idx]
  const prev = idx > 0 ? solution[idx - 1] : null
  const next = idx < solution.length - 1 ? solution[idx + 1] : null
  const dirs = { up: false, down: false, left: false, right: false }
  for (const nb of [prev, next]) {
    if (!nb) continue
    if (nb[0] < r) dirs.up = true
    if (nb[0] > r) dirs.down = true
    if (nb[1] < c) dirs.left = true
    if (nb[1] > c) dirs.right = true
  }
  if (dirs.up && dirs.down)    return SEGMENT_TYPES.VERTICAL
  if (dirs.left && dirs.right) return SEGMENT_TYPES.HORIZONTAL
  if (dirs.up && dirs.right)   return SEGMENT_TYPES.CORNER_UR
  if (dirs.up && dirs.left)    return SEGMENT_TYPES.CORNER_UL
  if (dirs.down && dirs.right) return SEGMENT_TYPES.CORNER_DR
  if (dirs.down && dirs.left)  return SEGMENT_TYPES.CORNER_DL
  return SEGMENT_TYPES.VERTICAL
}

export function usePuzzle() {
  const puzzle        = ref(null)
  const placedPieces  = ref(new Map())
  const selectedPiece = ref(SEGMENT_TYPES.VERTICAL)

  const defenders = computed(() => puzzle.value?.defenders || [])
  const defenderKeys = computed(() => new Set(defenders.value.map(([r, c]) => cellKey(r, c))))
  const visibleFrom = computed(() => puzzle.value?.visibleFrom ?? 0)
  const visibleTo = computed(() => puzzle.value?.visibleTo ?? (puzzle.value ? puzzle.value.gridSize - 1 : 9))

  const allPiecesUsed = computed(() => {
    if (!puzzle.value?.inventory) return false
    return Object.values(inventory.value).every(count => count <= 0)
  })

  const inventory = computed(() => {
    if (!puzzle.value?.inventory) return {}
    const base = { ...puzzle.value.inventory }
    for (const [, segType] of placedPieces.value) {
      if (segType && base[segType] !== undefined) base[segType]--
    }
    return base
  })

  const filledCells = computed(() => new Set(placedPieces.value.keys()))

  const cellSegments = computed(() => {
    if (!puzzle.value) return new Map()
    const map = new Map(placedPieces.value)
    const { start, end, gridSize } = puzzle.value
    const filled = filledCells.value
    for (const [r, c] of [start, end]) {
      map.set(cellKey(r, c), getAutoSegmentType(r, c, filled, gridSize))
    }
    return map
  })

  const rowCounts = computed(() => {
    if (!puzzle.value) return []
    const counts = new Array(puzzle.value.gridSize).fill(0)
    for (const key of filledCells.value) { counts[key.split('-').map(Number)[0]]++ }
    return counts
  })

  const colCounts = computed(() => {
    if (!puzzle.value) return []
    const counts = new Array(puzzle.value.gridSize).fill(0)
    for (const key of filledCells.value) { counts[key.split('-').map(Number)[1]]++ }
    return counts
  })

  const rowSatisfied = computed(() =>
    puzzle.value ? puzzle.value.rowClues.map((clue, i) => rowCounts.value[i] === clue) : []
  )
  const colSatisfied = computed(() =>
    puzzle.value ? puzzle.value.colClues.map((clue, i) => colCounts.value[i] === clue) : []
  )

  // Trace the route by following piece connections from start
  function traceRoute() {
    if (!puzzle.value) return []
    const { start, gridSize } = puzzle.value
    const segments = cellSegments.value
    const path = []
    const visited = new Set()
    let current = cellKey(start[0], start[1])
    let prevDir = null

    while (current) {
      path.push(current)
      visited.add(current)
      const [r, c] = current.split('-').map(Number)
      const segType = segments.get(current)
      if (!segType) break
      const conns = SEGMENT_CONNECTIONS[segType]
      if (!conns) break
      const neighbors = getNeighbors(r, c, gridSize)
      let nextCell = null

      for (const dir of ['up', 'down', 'left', 'right']) {
        if (!conns[dir]) continue
        if (prevDir && dir === OPPOSITE[prevDir]) continue
        const nbCoords = neighbors[dir]
        if (!nbCoords) continue
        const nbKey = cellKey(...nbCoords)
        if (visited.has(nbKey)) continue

        // Check if neighbor is a defender → sack
        if (defenderKeys.value.has(nbKey)) {
          path.push(nbKey)
          return path
        }

        const nbSeg = segments.get(nbKey)
        if (!nbSeg) continue
        if (!SEGMENT_CONNECTIONS[nbSeg]?.[OPPOSITE[dir]]) continue
        nextCell = nbKey
        prevDir = dir
        break
      }

      if (!nextCell) break
      current = nextCell
    }
    return path
  }

  function loadPuzzle(puzzleData) {
    puzzle.value = puzzleData
    placedPieces.value = new Map([
      [cellKey(puzzleData.start[0], puzzleData.start[1]), null],
      [cellKey(puzzleData.end[0],   puzzleData.end[1]),   null],
    ])
  }

  function placePiece(row, col) {
    if (!puzzle.value) return
    const { start, end } = puzzle.value
    if (row === start[0] && col === start[1]) return
    if (row === end[0]   && col === end[1])   return
    if (defenderKeys.value.has(cellKey(row, col))) return

    const key = cellKey(row, col)
    const newMap = new Map(placedPieces.value)

    if (selectedPiece.value === null) {
      newMap.delete(key)
    } else if (newMap.get(key) === selectedPiece.value) {
      newMap.delete(key)
    } else {
      const remaining = inventory.value[selectedPiece.value]
      if (remaining !== undefined && remaining <= 0 && !newMap.has(key)) return
      newMap.set(key, selectedPiece.value)
    }
    placedPieces.value = newMap
  }

  function showSolution() {
    if (!puzzle.value) return
    const { solution, start, end } = puzzle.value
    const newMap = new Map()
    for (let i = 0; i < solution.length; i++) {
      const [r, c] = solution[i]
      const key = cellKey(r, c)
      const isEndpoint = (r === start[0] && c === start[1]) || (r === end[0] && c === end[1])
      newMap.set(key, isEndpoint ? null : solveSegmentType(i, solution))
    }
    placedPieces.value = newMap
  }

  function selectPiece(type) { selectedPiece.value = type }
  function reset() { if (puzzle.value) loadPuzzle(puzzle.value) }

  return {
    puzzle, filledCells, placedPieces, selectedPiece,
    defenders, defenderKeys, inventory, allPiecesUsed, visibleFrom, visibleTo,
    rowCounts, colCounts, rowSatisfied, colSatisfied,
    cellSegments, traceRoute,
    loadPuzzle, placePiece, selectPiece, reset, showSolution,
  }
}
