<script setup>
import { computed } from 'vue'
import { SEGMENT_TYPES } from '../composables/usePuzzle.js'

const props = defineProps({
  row:          { type: Number,  required: true },
  col:          { type: Number,  required: true },
  gridSize:     { type: Number,  default: 10 },
  filled:       { type: Boolean, default: false },
  isStart:      { type: Boolean, default: false },
  isEnd:        { type: Boolean, default: false },
  isTouchdown:  { type: Boolean, default: false },
  segmentType:  { type: String,  default: null  },
  isWon:        { type: Boolean, default: false },
  isConflicted: { type: Boolean, default: false },
  isDefender:   { type: Boolean, default: false },
  isAnimating:  { type: Boolean, default: false },
  isRouteRunning: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

const SVG_PATHS = {
  [SEGMENT_TYPES.VERTICAL]:   'M 50 0 L 50 100',
  [SEGMENT_TYPES.HORIZONTAL]: 'M 0 50 L 100 50',
  [SEGMENT_TYPES.CORNER_UR]:  'M 50 0 Q 50 50 100 50',
  [SEGMENT_TYPES.CORNER_UL]:  'M 50 0 Q 50 50 0 50',
  [SEGMENT_TYPES.CORNER_DR]:  'M 50 100 Q 50 50 100 50',
  [SEGMENT_TYPES.CORNER_DL]:  'M 50 100 Q 50 50 0 50',
}

const svgPath = computed(() => {
  if (!props.filled || !props.segmentType) return null
  return SVG_PATHS[props.segmentType] ?? null
})

const isEndZone = computed(() => props.row === 0)

const cellClass = computed(() => [
  'cell',
  props.filled       ? 'cell--filled'     : 'cell--empty',
  props.isStart      ? 'cell--start'      : '',
  props.isEnd        ? 'cell--end'        : '',
  props.isConflicted ? 'cell--conflicted' : '',
  props.isDefender   ? 'cell--defender'   : '',
  props.isWon && props.filled ? 'cell--won' : '',
  isEndZone.value    ? 'cell--end-zone'   : '',
  props.isAnimating  ? 'cell--animating'  : '',
])

const showFirstDownMarker = computed(() => props.isEnd && !props.isTouchdown)
const showStaticWR = computed(() => props.isStart && !props.isRouteRunning)
</script>

<template>
  <div :class="cellClass" @click="emit('click')">
    <!-- Route segment SVG -->
    <svg
      v-if="filled && svgPath"
      viewBox="0 0 100 100"
      class="segment-svg"
      preserveAspectRatio="none"
    >
      <path
        :d="svgPath"
        stroke="currentColor"
        stroke-width="16"
        stroke-linecap="round"
        fill="none"
      />
    </svg>

    <!-- WR at start (idle stance) — hidden during entire route run -->
    <div v-if="showStaticWR" class="cell-icon wr-icon">
      <svg viewBox="0 0 40 54" class="wr-svg">
        <!-- Helmet -->
        <ellipse cx="20" cy="8" rx="6.5" ry="7" fill="#1a3a8f"/>
        <rect x="14" y="4" width="12" height="5" rx="2.5" fill="#aab"/>
        <rect x="13" y="8.5" width="14" height="2.5" rx="1" fill="#ccd"/>
        <circle cx="14" cy="8" r="1" fill="#ccd"/>
        <!-- Jersey -->
        <path d="M12,16 Q12,14 16,14 L24,14 Q28,14 28,16 L28,32 Q28,33 27,33 L13,33 Q12,33 12,32 Z" fill="#1a3a8f"/>
        <text x="20" y="27" text-anchor="middle" fill="white" font-size="8" font-weight="900">88</text>
        <!-- Arms (relaxed) -->
        <rect x="7" y="17" width="6" height="3.5" rx="1.5" fill="#1a3a8f"/>
        <rect x="27" y="17" width="6" height="3.5" rx="1.5" fill="#1a3a8f"/>
        <circle cx="7" cy="18.5" r="2" fill="#d4a574"/>
        <!-- Football tucked -->
        <ellipse cx="33" cy="21" rx="3.5" ry="2.2" fill="#8B4513" transform="rotate(-15 33 21)"/>
        <line x1="31" y1="20" x2="35" y2="20" stroke="#fff" stroke-width="0.5" transform="rotate(-15 33 21)"/>
        <!-- Pants -->
        <rect x="14" y="33" width="5.5" height="12" rx="2" fill="white"/>
        <rect x="20.5" y="33" width="5.5" height="12" rx="2" fill="white"/>
        <!-- Cleats -->
        <rect x="13" y="43" width="7" height="3.5" rx="1.2" fill="#222"/>
        <rect x="20" y="43" width="7" height="3.5" rx="1.2" fill="#222"/>
        <rect x="13" y="45" width="7" height="1.5" rx="0.5" fill="#444"/>
        <rect x="20" y="45" width="7" height="1.5" rx="0.5" fill="#444"/>
      </svg>
    </div>

    <!-- Animated WR (running) — only on the currently animating cell -->
    <div v-if="isAnimating" class="cell-icon wr-icon wr-running-container">
      <svg viewBox="0 0 40 54" class="wr-svg wr-svg--running">
        <!-- Helmet -->
        <ellipse cx="20" cy="8" rx="6.5" ry="7" fill="#1a3a8f"/>
        <rect x="14" y="4" width="12" height="5" rx="2.5" fill="#aab"/>
        <rect x="13" y="8.5" width="14" height="2.5" rx="1" fill="#ccd"/>
        <circle cx="14" cy="8" r="1" fill="#ccd"/>
        <!-- Jersey (leaning forward) -->
        <path d="M12,16 Q12,14 16,14 L24,14 Q28,14 28,16 L28,32 Q28,33 27,33 L13,33 Q12,33 12,32 Z" fill="#1a3a8f"/>
        <text x="20" y="27" text-anchor="middle" fill="white" font-size="8" font-weight="900">88</text>
        <!-- Pumping arms -->
        <g class="arm-left">
          <rect x="5" y="16" width="8" height="3.5" rx="1.5" fill="#1a3a8f" transform="rotate(-25 9 17.5)"/>
          <circle cx="5" cy="16" r="2" fill="#d4a574"/>
        </g>
        <g class="arm-right">
          <rect x="27" y="16" width="8" height="3.5" rx="1.5" fill="#1a3a8f" transform="rotate(15 31 17.5)"/>
        </g>
        <!-- Football tucked high -->
        <ellipse cx="34" cy="18" rx="3.5" ry="2.2" fill="#8B4513" transform="rotate(-20 34 18)"/>
        <line x1="32" y1="17" x2="36" y2="17" stroke="#fff" stroke-width="0.5" transform="rotate(-20 34 18)"/>
        <!-- Running legs (animated via CSS) -->
        <g class="leg-left">
          <rect x="14" y="33" width="5.5" height="13" rx="2" fill="white"/>
          <rect x="13" y="44" width="7" height="3.5" rx="1.2" fill="#222"/>
        </g>
        <g class="leg-right">
          <rect x="20.5" y="33" width="5.5" height="13" rx="2" fill="white"/>
          <rect x="20" y="44" width="7" height="3.5" rx="1.2" fill="#222"/>
        </g>
      </svg>
      <!-- Speed lines -->
      <div class="speed-lines">
        <span class="speed-line"></span>
        <span class="speed-line"></span>
        <span class="speed-line"></span>
      </div>
    </div>

    <!-- First down marker -->
    <div v-if="showFirstDownMarker" class="first-down-marker">
      <svg viewBox="0 0 40 60" class="first-down-svg">
        <rect x="17" y="0" width="6" height="60" fill="#ff6b35" rx="2"/>
        <rect x="5" y="0" width="30" height="20" rx="3" fill="#ff6b35"/>
        <text x="20" y="15" text-anchor="middle" fill="white" font-size="11" font-weight="900">1ST</text>
      </svg>
    </div>

    <!-- Touchdown target (end zone) -->
    <div v-if="isEnd && isTouchdown" class="cell-icon td-icon">
      <svg viewBox="0 0 40 40" class="td-svg">
        <polygon points="20,2 25,15 39,15 28,24 32,38 20,30 8,38 12,24 1,15 15,15" fill="#f5c518" stroke="#fff" stroke-width="1"/>
      </svg>
    </div>

    <!-- Defender -->
    <div v-if="isDefender" class="cell-icon defender-icon">
      <svg viewBox="0 0 40 44" class="defender-svg">
        <!-- Helmet -->
        <ellipse cx="20" cy="8" rx="6.5" ry="7" fill="#cc2222"/>
        <rect x="14" y="4" width="12" height="5" rx="2.5" fill="#888"/>
        <rect x="13" y="8.5" width="14" height="2.5" rx="1" fill="#999"/>
        <circle cx="14" cy="8" r="1" fill="#999"/>
        <!-- Jersey -->
        <path d="M12,16 Q12,14 16,14 L24,14 Q28,14 28,16 L28,32 Q28,33 27,33 L13,33 Q12,33 12,32 Z" fill="#cc2222"/>
        <text x="20" y="27" text-anchor="middle" fill="white" font-size="7" font-weight="900">DB</text>
        <!-- Arms (tackle stance) -->
        <rect x="5" y="17" width="8" height="3.5" rx="1.5" fill="#cc2222" transform="rotate(-30 9 18)"/>
        <rect x="27" y="17" width="8" height="3.5" rx="1.5" fill="#cc2222" transform="rotate(30 31 18)"/>
        <circle cx="5" cy="17" r="2" fill="#d4a574"/>
        <circle cx="35" cy="17" r="2" fill="#d4a574"/>
        <!-- Pants + cleats -->
        <rect x="14" y="33" width="5.5" height="8" rx="2" fill="white"/>
        <rect x="20.5" y="33" width="5.5" height="8" rx="2" fill="white"/>
        <rect x="13" y="39.5" width="7" height="3" rx="1" fill="#222"/>
        <rect x="20" y="39.5" width="7" height="3" rx="1" fill="#222"/>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.cell {
  width: var(--cell-size);
  height: var(--cell-size);
  border: none;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
  color: var(--color-route);
  user-select: none;
  z-index: 2;
  overflow: hidden;
}

.cell--end-zone {
  background-color: rgba(0, 0, 0, 0.12);
}

.cell--empty:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.cell--filled {
  background-color: rgba(245, 197, 24, 0.1);
}

.cell--start {
  background-color: rgba(30, 144, 255, 0.2);
  cursor: default;
}

.cell--end {
  cursor: default;
}

.cell--conflicted {
  background-color: rgba(220, 50, 50, 0.25) !important;
  color: #ff6b6b;
}

.cell--defender {
  cursor: not-allowed;
  background-color: rgba(180, 30, 30, 0.08);
}

.cell--won {
  color: var(--color-clue-satisfied);
  animation: route-pulse 0.7s ease-in-out infinite alternate;
}

.cell--animating {
  background-color: rgba(30, 144, 255, 0.3) !important;
  z-index: 10;
}

/* ── SVG route segments ── */
.segment-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  z-index: 3;
}

/* ── Icons ── */
.cell-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}

.wr-svg {
  width: calc(var(--cell-size) * 0.72);
  height: calc(var(--cell-size) * 0.88);
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
}

/* ── Running WR ── */
.wr-running-container {
  z-index: 12;
}

.wr-svg--running {
  animation: wr-run 0.18s ease-in-out infinite alternate;
}

.wr-svg--running .leg-left {
  animation: leg-stride-l 0.18s ease-in-out infinite alternate;
  transform-origin: 16.75px 33px;
}

.wr-svg--running .leg-right {
  animation: leg-stride-r 0.18s ease-in-out infinite alternate;
  transform-origin: 23.25px 33px;
}

.wr-svg--running .arm-left {
  animation: arm-pump-l 0.18s ease-in-out infinite alternate;
  transform-origin: 12px 17px;
}

.wr-svg--running .arm-right {
  animation: arm-pump-r 0.18s ease-in-out infinite alternate;
  transform-origin: 28px 17px;
}

@keyframes wr-run {
  0%   { transform: translateY(-1.5px) rotate(-1.5deg); }
  100% { transform: translateY(1px) rotate(1.5deg); }
}

@keyframes leg-stride-l {
  0%   { transform: rotate(-18deg); }
  100% { transform: rotate(12deg); }
}

@keyframes leg-stride-r {
  0%   { transform: rotate(12deg); }
  100% { transform: rotate(-18deg); }
}

@keyframes arm-pump-l {
  0%   { transform: rotate(10deg); }
  100% { transform: rotate(-10deg); }
}

@keyframes arm-pump-r {
  0%   { transform: rotate(-8deg); }
  100% { transform: rotate(8deg); }
}

/* Speed lines behind the runner */
.speed-lines {
  position: absolute;
  left: -2px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 3px;
  opacity: 0.5;
}

.speed-line {
  display: block;
  width: calc(var(--cell-size) * 0.25);
  height: 1.5px;
  background: linear-gradient(to left, rgba(255,255,255,0.5), transparent);
  border-radius: 1px;
  animation: speed-trail 0.2s ease-in-out infinite alternate;
}

.speed-line:nth-child(2) {
  width: calc(var(--cell-size) * 0.35);
  animation-delay: 0.05s;
}

.speed-line:nth-child(3) {
  width: calc(var(--cell-size) * 0.2);
  animation-delay: 0.1s;
}

@keyframes speed-trail {
  0%   { opacity: 0.2; transform: translateX(0); }
  100% { opacity: 0.6; transform: translateX(-3px); }
}

.first-down-marker {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 4;
}

.first-down-svg {
  height: calc(var(--cell-size) * 0.85);
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
}

.td-svg {
  width: calc(var(--cell-size) * 0.6);
  height: calc(var(--cell-size) * 0.6);
  filter: drop-shadow(0 0 6px rgba(245, 197, 24, 0.6));
}

.defender-icon { z-index: 4; }

.defender-svg {
  width: calc(var(--cell-size) * 0.75);
  height: calc(var(--cell-size) * 0.75);
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
}

@keyframes route-pulse {
  from { opacity: 0.6; }
  to   { opacity: 1.0; }
}
</style>
