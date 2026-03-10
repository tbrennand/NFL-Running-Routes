<script setup>
import { computed } from 'vue'
import TrackCell from './TrackCell.vue'

const props = defineProps({
  puzzle:          { type: Object,  required: true },
  filledCells:     { type: Object,  required: true },
  rowCounts:       { type: Array,   required: true },
  colCounts:       { type: Array,   required: true },
  rowSatisfied:    { type: Array,   required: true },
  colSatisfied:    { type: Array,   required: true },
  cellSegments:    { type: Object,  required: true },
  conflictedCells: { type: Object,  required: true },
  isWon:           { type: Boolean, default: false },
  animatingCell:   { type: String,  default: null },
  isRouteRunning:  { type: Boolean, default: false },
  defenders:       { type: Array,   default: () => [] },
  visibleFrom:     { type: Number,  default: 0 },
  visibleTo:       { type: Number,  default: 9 },
})

const emit = defineEmits(['cell-click'])

const cols = computed(() => props.puzzle.gridSize)
const visibleRowCount = computed(() => props.visibleTo - props.visibleFrom + 1)

const cells = computed(() => {
  const result = []
  for (let row = props.visibleFrom; row <= props.visibleTo; row++) {
    for (let col = 0; col < cols.value; col++) {
      result.push({ row, col, key: `${row}-${col}` })
    }
  }
  return result
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${cols.value}, var(--cell-size))`,
  gridTemplateRows: `repeat(${visibleRowCount.value}, var(--cell-size))`,
}))

const visibleRowClues = computed(() =>
  props.puzzle.rowClues.slice(props.visibleFrom, props.visibleTo + 1)
)
const visibleRowSatisfied = computed(() =>
  props.rowSatisfied.slice(props.visibleFrom, props.visibleTo + 1)
)

function isFilled(row, col) { return props.filledCells.has(`${row}-${col}`) }
function isStart(row, col) { return row === props.puzzle.start[0] && col === props.puzzle.start[1] }
function isEnd(row, col) { return row === props.puzzle.end[0] && col === props.puzzle.end[1] }
function getSegment(row, col) { return props.cellSegments.get(`${row}-${col}`) ?? null }
function isConflicted(row, col) { return props.conflictedCells.has(`${row}-${col}`) }
function isDefender(row, col) { return props.defenders.some(([r, c]) => r === row && c === col) }

const isTouchdown = computed(() => props.puzzle.end[0] === 0)
const showEndzone = computed(() => isTouchdown.value && props.visibleFrom === 0)

// SVG overlay viewBox: width = cols, height = visible rows
const svgViewBox = computed(() => `0 0 ${cols.value} ${visibleRowCount.value}`)

// Yard line number for a given grid row (10, 20, 30, 40, 50, 40, 30, 20, 10)
function yardNumber(gridRow) {
  if (gridRow === 0) return null
  const yard = gridRow * 10
  return yard <= 50 ? yard : 100 - yard
}

// Build field markings data for the SVG overlay
const fieldMarkings = computed(() => {
  const vf = props.visibleFrom
  const vt = props.visibleTo
  const c = cols.value
  const lines = []
  const numbers = []
  const hashMarks = []
  const sidelineTicks = []

  for (let row = vf; row <= vt; row++) {
    const y = row - vf // SVG y coordinate (top of this row)
    const yn = yardNumber(row)

    // Yard line at the TOP edge of each row
    if (row > 0 && row > vf) {
      const isGoalLine = row === 1 && showEndzone.value
      lines.push({ y, width: isGoalLine ? 0.14 : 0.08, opacity: isGoalLine ? 1 : 0.9 })
    }

    // Yard numbers in the middle of each row
    if (yn !== null) {
      const midY = y + 0.5
      numbers.push(
        { x: 1.3, y: midY, text: String(yn), anchor: 'middle' },
        { x: c - 1.3, y: midY, text: String(yn), anchor: 'middle' },
      )
    }

    // Hash marks: short vertical ticks in two columns, at top edge of each row
    if (row > vf && row > 0) {
      const hx1 = 3.5
      const hx2 = c - 3.5
      hashMarks.push(
        { x: hx1, y: y - 0.12, h: 0.24 },
        { x: hx2, y: y - 0.12, h: 0.24 },
      )
    }

    // Sideline ticks: small marks at left and right edges at yard lines
    if (row > vf && row > 0) {
      sidelineTicks.push(
        { x: 0, y, len: 0.25 },
        { x: c - 0.25, y, len: 0.25 },
      )
    }

    // Intermediate ticks (5-yard marks) — halfway through each row
    if (row > 0) {
      const midTick = y + 0.5
      sidelineTicks.push(
        { x: 0, y: midTick, len: 0.15 },
        { x: c - 0.15, y: midTick, len: 0.15 },
      )
      // Intermediate hash marks at midpoint
      hashMarks.push(
        { x: 3.5, y: midTick - 0.08, h: 0.16 },
        { x: c - 3.5, y: midTick - 0.08, h: 0.16 },
      )
    }
  }

    // Bottom yard line (line of scrimmage)
    if (vt === props.puzzle.gridSize - 1) {
      lines.push({ y: visibleRowCount.value, width: 0.08, opacity: 0.9 })
    }

  return { lines, numbers, hashMarks, sidelineTicks }
})
</script>

<template>
  <div class="grid-wrapper">
    <!-- Column clues (top) -->
    <div class="col-clues-row">
      <div class="clue-corner"></div>
      <div class="col-clues" :style="{ gridTemplateColumns: gridStyle.gridTemplateColumns }">
        <div
          v-for="(clue, ci) in puzzle.colClues"
          :key="'ct-' + ci"
          class="clue col-clue"
          :class="{ satisfied: colSatisfied[ci] }"
        >{{ clue }}</div>
      </div>
      <div class="clue-corner"></div>
    </div>

    <!-- Main field row -->
    <div class="field-row">
      <!-- Left row clues -->
      <div class="row-clues" :style="{ gridTemplateRows: `repeat(${visibleRowCount}, var(--cell-size))` }">
        <div
          v-for="(clue, ri) in visibleRowClues"
          :key="'rl-' + ri"
          class="clue row-clue"
          :class="{ satisfied: visibleRowSatisfied[ri] }"
        >{{ clue }}</div>
      </div>

      <!-- The field -->
      <div class="field-container">
        <!-- End zone -->
        <div v-if="showEndzone" class="endzone-banner">
          <span class="endzone-text">TOUCHDOWN</span>
        </div>

        <div class="field-grid" :style="gridStyle">
          <!-- SVG field markings overlay -->
          <svg
            class="field-markings-svg"
            :viewBox="svgViewBox"
            preserveAspectRatio="none"
          >
            <!-- Yard lines (full-width white lines) -->
            <line
              v-for="(line, i) in fieldMarkings.lines"
              :key="'yl-' + i"
              :x1="0"
              :y1="line.y"
              :x2="cols"
              :y2="line.y"
              stroke="white"
              :stroke-width="line.width"
              :stroke-opacity="line.opacity"
            />

            <!-- Sideline ticks (short horizontal marks at edges) -->
            <line
              v-for="(tick, i) in fieldMarkings.sidelineTicks"
              :key="'st-' + i"
              :x1="tick.x"
              :y1="tick.y"
              :x2="tick.x + tick.len"
              :y2="tick.y"
              stroke="white"
              stroke-width="0.05"
              stroke-opacity="0.75"
            />

            <!-- Hash marks (short vertical ticks) -->
            <line
              v-for="(hm, i) in fieldMarkings.hashMarks"
              :key="'hm-' + i"
              :x1="hm.x"
              :y1="hm.y"
              :x2="hm.x"
              :y2="hm.y + hm.h"
              stroke="white"
              stroke-width="0.06"
              stroke-opacity="0.65"
            />

            <!-- Yard numbers -->
            <text
              v-for="(num, i) in fieldMarkings.numbers"
              :key="'yn-' + i"
              :x="num.x"
              :y="num.y"
              :text-anchor="num.anchor"
              dominant-baseline="central"
              fill="white"
              fill-opacity="0.4"
              font-size="0.75"
              font-weight="900"
              font-family="'Segoe UI', Arial, sans-serif"
            >{{ num.text }}</text>
          </svg>

          <!-- Grid cells -->
          <TrackCell
            v-for="cell in cells"
            :key="cell.key"
            :row="cell.row"
            :col="cell.col"
            :gridSize="puzzle.gridSize"
            :filled="isFilled(cell.row, cell.col)"
            :isStart="isStart(cell.row, cell.col)"
            :isEnd="isEnd(cell.row, cell.col)"
            :isTouchdown="isTouchdown"
            :segmentType="getSegment(cell.row, cell.col)"
            :isWon="isWon"
            :isConflicted="isConflicted(cell.row, cell.col)"
            :isDefender="isDefender(cell.row, cell.col)"
            :isAnimating="animatingCell === `${cell.row}-${cell.col}`"
            :isRouteRunning="isRouteRunning"
            @click="emit('cell-click', cell.row, cell.col)"
          />
        </div>
      </div>

      <!-- Right row clues -->
      <div class="row-clues" :style="{ gridTemplateRows: `repeat(${visibleRowCount}, var(--cell-size))` }">
        <div
          v-for="(clue, ri) in visibleRowClues"
          :key="'rr-' + ri"
          class="clue row-clue"
          :class="{ satisfied: visibleRowSatisfied[ri] }"
        >{{ clue }}</div>
      </div>
    </div>

    <!-- Column clues (bottom) -->
    <div class="col-clues-row">
      <div class="clue-corner"></div>
      <div class="col-clues" :style="{ gridTemplateColumns: gridStyle.gridTemplateColumns }">
        <div
          v-for="(clue, ci) in puzzle.colClues"
          :key="'cb-' + ci"
          class="clue col-clue"
          :class="{ satisfied: colSatisfied[ci] }"
        >{{ clue }}</div>
      </div>
      <div class="clue-corner"></div>
    </div>
  </div>
</template>

<style scoped>
.grid-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.col-clues-row {
  display: flex;
  align-items: center;
}

.clue-corner {
  width: var(--clue-size);
  height: var(--clue-size);
}

.col-clues { display: grid; }

.clue {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 800;
  color: rgba(165, 172, 175, 0.5);
  transition: color 0.3s ease, text-shadow 0.3s ease;
  font-variant-numeric: tabular-nums;
}

.col-clue { width: var(--cell-size); height: var(--clue-size); }
.row-clue { width: var(--clue-size); height: var(--cell-size); }

.clue.satisfied {
  color: var(--color-clue-satisfied);
  text-shadow: 0 0 8px rgba(0, 208, 132, 0.5);
}

.field-row {
  display: flex;
  align-items: stretch;
}

.row-clues { display: grid; }

/* ── Field container ── */
.field-container {
  position: relative;
  border: 4px solid var(--color-sideline);
  box-shadow:
    0 0 0 2px rgba(1, 51, 105, 0.5),
    0 4px 30px rgba(0, 0, 0, 0.6),
    0 0 60px rgba(43, 107, 24, 0.15);
  border-radius: 3px;
}

/* ── End zone banner ── */
.endzone-banner {
  background:
    linear-gradient(180deg, #0a3205 0%, #145010 50%, #1a5a12 100%);
  border-top: 5px solid rgba(255, 255, 255, 0.85);
  border-bottom: 5px solid rgba(255, 255, 255, 0.9);
  padding: clamp(8px, 1.5vw, 16px) 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.endzone-text {
  font-size: clamp(0.8rem, 2.5vw, 1.2rem);
  font-weight: 900;
  letter-spacing: 0.4em;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
}

/* ── Field grid ── */
.field-grid {
  display: grid;
  position: relative;
  background:
    repeating-linear-gradient(
      to bottom,
      var(--color-field-dark) 0px,
      var(--color-field-dark) var(--cell-size),
      var(--color-field-light) var(--cell-size),
      var(--color-field-light) calc(var(--cell-size) * 2)
    );
}

/* ── SVG field markings (yard lines, numbers, hash marks) ── */
.field-markings-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
