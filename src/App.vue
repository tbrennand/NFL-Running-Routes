<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { PUZZLES } from './data/puzzles.js'
import { usePuzzle } from './composables/usePuzzle.js'
import { useRouteAnimation } from './composables/useRouteAnimation.js'
import Grid from './components/Grid.vue'
import PiecePalette from './components/PiecePalette.vue'
import tdVideo from './assets/touchdown.mp4'
import fdVideo from './assets/firstdown.mp4'
import incVideo from './assets/incomplete.mp4'
import toVideo from './assets/turnover.mp4'
import sackedVideo from './assets/sacked.mp4'

const {
  puzzle, filledCells, selectedPiece,
  defenders, defenderKeys, inventory, allPiecesUsed, visibleFrom, visibleTo,
  rowCounts, colCounts, rowSatisfied, colSatisfied,
  cellSegments, traceRoute,
  loadPuzzle, placePiece, selectPiece, reset, showSolution,
} = usePuzzle()

const {
  animatingCell, isRunning, animationResult, resultMessage,
  runRoute, dismissResult, setResult,
} = useRouteAnimation(puzzle, traceRoute, defenderKeys)

const resultVideos = {
  touchdown: tdVideo,
  firstdown: fdVideo,
  incomplete: incVideo,
  sacked: sackedVideo,
  turnover: toVideo,
}

const showResultDetails = ref(false)

// ── Drive state ──
const currentPlayIndex = ref(0)
const currentDown = ref(1)
const gameOver = ref(false)

const DOWN_NAMES = ['1ST', '2ND', '3RD', '4TH']

function yardLineFromRow(row) {
  if (row === 0) return 'END ZONE'
  const yard = row * 10
  return yard <= 50 ? String(yard) : String(100 - yard)
}

const downText = computed(() => DOWN_NAMES[currentDown.value - 1] || '4TH')

const yardsToGo = computed(() => {
  if (!puzzle.value) return 10
  const startRow = puzzle.value.start[0]
  const endRow = puzzle.value.end[0]
  const yards = (startRow - endRow) * 10
  return yards > 0 ? yards : 10
})

const situationText = computed(() => {
  if (!puzzle.value) return ''
  const endRow = puzzle.value.end[0]
  if (endRow === 0) return `${downText.value} & GOAL`
  return `${downText.value} & ${yardsToGo.value}`
})

const ballPosition = computed(() => {
  if (!puzzle.value) return ''
  return yardLineFromRow(puzzle.value.start[0])
})

function startDrive() {
  currentPlayIndex.value = 0
  currentDown.value = 1
  gameOver.value = false
  showResultDetails.value = false
  loadPuzzle(PUZZLES[0])
}

function handlePlacePiece(row, col) {
  if (isRunning.value || gameOver.value) return
  placePiece(row, col)
}

function handleReset() {
  if (isRunning.value) return
  reset()
  dismissResult()
}

async function handleRunRoute() {
  if (isRunning.value || gameOver.value) return
  showResultDetails.value = false
  const result = await runRoute()
  // Drive logic is handled when user dismisses the result overlay
}

function handleResultDismiss() {
  const result = animationResult.value
  showResultDetails.value = false
  dismissResult()

  if (result === 'firstdown' || result === 'touchdown') {
    if (result === 'touchdown' || currentPlayIndex.value >= PUZZLES.length - 1) {
      gameOver.value = true
      if (result === 'touchdown') {
        // Keep the touchdown result visible
      }
      return
    }
    // Advance to next play — new first down
    currentPlayIndex.value++
    currentDown.value = 1
    loadPuzzle(PUZZLES[currentPlayIndex.value])
  } else {
    // Failed — increment down
    if (currentDown.value >= 4) {
      gameOver.value = true
      setResult('turnover')
      return
    }
    currentDown.value++
    reset()
  }
}

function handleNewDrive() {
  dismissResult()
  showResultDetails.value = false
  startDrive()
}

onMounted(() => {
  startDrive()
})

watch(allPiecesUsed, (used) => {
  if (used && !isRunning.value && !gameOver.value && !animationResult.value) {
    nextTick(() => handleRunRoute())
  }
})

watch(resultMessage, (msg) => {
  // If there's a video for this result type, wait for it to finish
  // before showing the detail card. Otherwise, show immediately.
  if (!msg) {
    showResultDetails.value = false
  } else {
    showResultDetails.value = !resultVideos[msg.type]
  }
})

// If you fail on 4th down, skip the extra \"sacked/incomplete\" screen
// and go straight to the TURNOVER animation.
watch(animationResult, (val) => {
  if (!val) return
  if (currentDown.value === 4 && (val === 'sacked' || val === 'incomplete')) {
    gameOver.value = true
    setResult('turnover')
  }
})

function handleResultVideoEnded() {
  showResultDetails.value = true
}
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="nfl-brand">
        <svg viewBox="0 0 60 36" class="nfl-shield">
          <path d="M30,1 L55,6 Q59,7 59,11 L59,25 Q59,33 30,35 Q1,33 1,25 L1,11 Q1,7 5,6 Z" fill="#013369" stroke="#a5acaf" stroke-width="1.5"/>
          <path d="M30,4 L53,8 Q56,9 56,12 L56,24 Q56,30 30,32 Q4,30 4,24 L4,12 Q4,9 7,8 Z" fill="#013369"/>
          <text x="30" y="16" text-anchor="middle" fill="#fff" font-size="7" font-weight="900" letter-spacing="0.5">ROUTE</text>
          <text x="30" y="25" text-anchor="middle" fill="#f5c518" font-size="9" font-weight="900" letter-spacing="1">RUNNER</text>
          <line x1="10" y1="17.5" x2="50" y2="17.5" stroke="#d50a0a" stroke-width="0.8"/>
        </svg>
      </div>
      <h1 class="title">NFL ROUTE RUNNER</h1>
      <p class="subtitle">BUILD THE ROUTE. MOVE THE CHAINS. SCORE.</p>
    </header>

    <!-- Down & Distance scoreboard -->
    <div v-if="puzzle" class="scoreboard">
      <div class="scoreboard-main">
        <span class="scoreboard-down">{{ situationText }}</span>
      </div>
      <div class="scoreboard-detail">
        BALL ON THE {{ ballPosition }} &mdash; PLAY {{ currentPlayIndex + 1 }} OF {{ PUZZLES.length }}
      </div>
    </div>

    <p v-if="puzzle" class="puzzle-desc">{{ puzzle.description }}</p>

    <!-- Game area (always visible when puzzle loaded) -->
    <main class="game-area" v-if="puzzle">
      <!-- Instructions -->
      <div class="how-to-play">
        <div class="how-step"><span class="step-num">1</span> Pick a route piece</div>
        <div class="how-step"><span class="step-num">2</span> Click cells to build the route</div>
        <div class="how-step"><span class="step-num">3</span> Hit <strong>SNAP BALL</strong> to run it</div>
      </div>

      <PiecePalette
        :selectedPiece="selectedPiece"
        :inventory="inventory"
        @select="selectPiece"
      />

      <div class="clue-hint">
        Edge numbers = route segments in that row/column.
        <span class="clue-hint-green">Green</span> = correct count.
      </div>

      <Grid
        :puzzle="puzzle"
        :filledCells="filledCells"
        :rowCounts="rowCounts"
        :colCounts="colCounts"
        :rowSatisfied="rowSatisfied"
        :colSatisfied="colSatisfied"
        :cellSegments="cellSegments"
        :conflictedCells="new Set()"
        :isWon="false"
        :animatingCell="animatingCell"
        :isRouteRunning="isRunning"
        :defenders="defenders"
        :visibleFrom="visibleFrom"
        :visibleTo="visibleTo"
        @cell-click="handlePlacePiece"
      />

      <div class="controls">
        <button class="ctrl-btn reset-btn" @click="handleReset" :disabled="isRunning || gameOver">
          Reset
        </button>
        <button v-if="!gameOver" class="ctrl-btn run-btn" @click="handleRunRoute" :disabled="isRunning">
          {{ isRunning ? 'Running...' : '▶ SNAP BALL' }}
        </button>
        <button v-if="gameOver" class="ctrl-btn run-btn" @click="handleNewDrive">
          NEW DRIVE
        </button>
        <button class="ctrl-btn solve-btn" @click="showSolution" :disabled="isRunning || gameOver">
          Show Answer
        </button>
      </div>

      <!-- Play tracker -->
      <div class="play-tracker">
        <div
          v-for="(p, i) in PUZZLES"
          :key="p.id"
          class="play-pip"
          :class="{
            'play-pip--active': i === currentPlayIndex && !gameOver,
            'play-pip--done': i < currentPlayIndex,
            'play-pip--future': i > currentPlayIndex,
          }"
        >
          <span class="play-pip-label">{{ i + 1 }}</span>
          <span class="play-pip-name">{{ p.name }}</span>
        </div>
      </div>

      <div class="legend">
        <span class="legend-item"><span class="legend-dot start-dot"></span> WR</span>
        <span class="legend-item"><span class="legend-dot end-dot"></span> Target</span>
        <span class="legend-item"><span class="legend-dot defender-dot"></span> Defender</span>
      </div>
    </main>

    <!-- Result overlay -->
    <Transition name="celebrate">
      <div v-if="resultMessage" class="celebration-overlay" :class="`overlay--${resultMessage.type}`">
        <div class="celebration-inner">
          <!-- Confetti / particles for touchdown -->
          <div v-if="resultMessage.type === 'touchdown'" class="confetti-container">
            <span v-for="i in 30" :key="i" class="confetti-piece" :style="{ '--i': i }"></span>
          </div>

          <!-- Result video first -->
          <div class="celebration-video-wrap" v-if="resultVideos[resultMessage.type]">
            <video
              class="celebration-video"
              :src="resultVideos[resultMessage.type]"
              autoplay
              muted
              playsinline
              @ended="handleResultVideoEnded"
            />
          </div>

          <!-- Result box underneath -->
          <div class="celebration-card" :class="`celebrate--${resultMessage.type}`">
            <div class="celebration-icon-wrap" v-if="!resultVideos[resultMessage.type] || showResultDetails">
              <div v-if="resultMessage.type === 'touchdown'" class="td-burst"></div>
              <div class="celebration-emoji">{{ resultMessage.emoji }}</div>
            </div>
            <h2 v-if="showResultDetails" class="celebration-title">{{ resultMessage.title }}</h2>
            <p v-if="showResultDetails" class="celebration-msg">{{ resultMessage.msg }}</p>

            <p
              v-if="showResultDetails && resultMessage.type !== 'touchdown' && resultMessage.type !== 'turnover' && resultMessage.type !== 'firstdown'"
              class="celebration-down-hint"
            >
              {{ currentDown >= 4 ? '4th down — last chance!' : `Next attempt: ${DOWN_NAMES[currentDown]} down` }}
            </p>

            <div v-if="showResultDetails" class="celebration-actions">
              <button v-if="resultMessage.type === 'turnover'" class="celebration-btn primary" @click.stop="handleNewDrive">New Drive</button>
              <button v-else-if="resultMessage.type === 'touchdown'" class="celebration-btn td-btn" @click.stop="handleNewDrive">New Drive</button>
              <button v-else-if="resultMessage.type === 'firstdown'" class="celebration-btn fd-btn" @click.stop="handleResultDismiss">Next Play</button>
              <button v-else class="celebration-btn primary" @click.stop="handleResultDismiss">
                {{ currentDown >= 4 ? 'Last Chance' : 'Try Again' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 1rem 3rem;
  gap: 0.7rem;
}

/* ── Header / NFL Branding ── */
.header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.nfl-brand {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nfl-shield {
  width: 48px;
  height: 30px;
  filter: drop-shadow(0 2px 8px rgba(1, 51, 105, 0.5));
}

.title {
  margin: 0;
  font-size: clamp(1.3rem, 4.5vw, 2.2rem);
  font-weight: 900;
  letter-spacing: 0.14em;
  color: #fff;
  text-shadow: 0 2px 16px rgba(1, 51, 105, 0.4);
}

.subtitle {
  margin: 0;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  color: var(--color-nfl-silver);
  text-transform: uppercase;
}

/* ── Scoreboard (down & distance) ── */
.scoreboard {
  background: linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-bg-secondary) 100%);
  border: 2px solid rgba(1, 51, 105, 0.6);
  border-radius: 6px;
  padding: 0.5rem 1.5rem;
  text-align: center;
  min-width: 220px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05);
}

.scoreboard-main {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.scoreboard-down {
  font-size: clamp(1.2rem, 3.5vw, 1.8rem);
  font-weight: 900;
  letter-spacing: 0.08em;
  color: var(--color-accent-gold);
}

.scoreboard-detail {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--color-nfl-silver);
  margin-top: 2px;
  text-transform: uppercase;
}

.puzzle-desc {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(165, 172, 175, 0.6);
  text-align: center;
  font-style: italic;
  max-width: 360px;
}

.how-to-play {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: center;
}

.how-step {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  color: var(--color-nfl-silver);
  opacity: 0.6;
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: rgba(1, 51, 105, 0.5);
  color: var(--color-accent-gold);
  font-size: 0.55rem;
  font-weight: 900;
  flex-shrink: 0;
}

.clue-hint {
  font-size: 0.62rem;
  color: rgba(165, 172, 175, 0.4);
  text-align: center;
  max-width: 380px;
}

.clue-hint-green {
  color: var(--color-clue-satisfied);
  font-weight: 700;
}

.game-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
}

.controls {
  display: flex;
  gap: 0.6rem;
  justify-content: center;
  flex-wrap: wrap;
}

.ctrl-btn {
  padding: 0.5rem 1.3rem;
  border-radius: 4px;
  border: 2px solid rgba(165, 172, 175, 0.2);
  background: var(--color-bg-card);
  color: var(--color-nfl-silver);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: all 0.15s ease;
}

.ctrl-btn:hover:not(:disabled) {
  border-color: rgba(165, 172, 175, 0.5);
  color: #fff;
  background: var(--color-bg-secondary);
}

.ctrl-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.run-btn {
  border-color: var(--color-accent-gold);
  color: var(--color-accent-gold);
  background: rgba(245, 197, 24, 0.06);
}

.run-btn:hover:not(:disabled) {
  background: rgba(245, 197, 24, 0.15);
  box-shadow: 0 0 16px rgba(245, 197, 24, 0.2);
}

.solve-btn {
  border-color: rgba(165, 172, 175, 0.1);
  color: rgba(165, 172, 175, 0.35);
  font-size: 0.65rem;
}

.solve-btn:hover:not(:disabled) {
  border-color: rgba(165, 172, 175, 0.3);
  color: rgba(165, 172, 175, 0.7);
}

.legend {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  justify-content: center;
  font-size: 0.62rem;
  color: rgba(165, 172, 175, 0.4);
}

.legend-item { display: flex; align-items: center; gap: 0.25rem; }

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.start-dot    { background: var(--color-endpoint-start); }
.end-dot      { background: var(--color-endpoint-end); }
.defender-dot { background: var(--color-defender); }

/* ── Play tracker ── */
.play-tracker {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.play-pip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  border: 1px solid rgba(165, 172, 175, 0.1);
  background: var(--color-bg-card);
  opacity: 0.3;
  transition: all 0.2s;
}

.play-pip--active {
  opacity: 1;
  border-color: var(--color-accent-gold);
  background: rgba(245,197,24,0.06);
}

.play-pip--done {
  opacity: 0.6;
  border-color: var(--color-clue-satisfied);
}

.play-pip--done .play-pip-label {
  color: var(--color-clue-satisfied);
}

.play-pip-label {
  font-size: 0.7rem;
  font-weight: 900;
  color: rgba(165, 172, 175, 0.5);
}

.play-pip--active .play-pip-label {
  color: var(--color-accent-gold);
}

.play-pip-name {
  font-size: 0.5rem;
  font-weight: 700;
  color: rgba(165, 172, 175, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ══════════════════════════════════════
   CELEBRATION OVERLAY & RESULT ANIMATIONS
   ══════════════════════════════════════ */

.celebration-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(6px);
  animation: overlay-in 0.3s ease-out;
}

.celebration-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  padding: 0 1rem;
}

.overlay--touchdown {
  background: radial-gradient(ellipse at center, rgba(0,60,20,0.85), rgba(0,0,0,0.9));
}

.overlay--firstdown {
  background: radial-gradient(ellipse at center, rgba(40,30,0,0.8), rgba(0,0,0,0.85));
}

.overlay--sacked,
.overlay--incomplete {
  background: rgba(10, 5, 5, 0.88);
}

.overlay--turnover {
  background: radial-gradient(ellipse at center, rgba(60,5,5,0.85), rgba(0,0,0,0.9));
}

@keyframes overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ── Celebration card ── */
.celebration-card {
  background: var(--color-bg-card);
  border-radius: 12px;
  padding: 1.5rem 2rem 1.8rem;
  text-align: center;
  max-width: 420px;
  width: 90%;
  position: relative;
  z-index: 2;
}

.celebrate--touchdown {
  border: 3px solid #00d084;
  box-shadow: 0 0 60px rgba(0, 208, 132, 0.4), 0 0 120px rgba(0, 208, 132, 0.15);
  animation: card-touchdown 0.5s ease-out;
}

.celebrate--firstdown {
  border: 3px solid var(--color-accent-gold);
  box-shadow: 0 0 40px rgba(245, 197, 24, 0.3);
  animation: card-firstdown 0.4s ease-out;
}

.celebrate--sacked {
  border: 3px solid #cc2222;
  box-shadow: 0 0 40px rgba(204, 34, 34, 0.3);
  animation: card-hit 0.35s ease-out;
}

.celebrate--incomplete {
  border: 2px solid rgba(165, 172, 175, 0.3);
  box-shadow: 0 0 20px rgba(0,0,0,0.3);
  animation: card-fade-in 0.3s ease-out;
}

.celebrate--turnover {
  border: 3px solid #cc2222;
  box-shadow: 0 0 50px rgba(204, 34, 34, 0.3);
  animation: card-hit 0.35s ease-out;
}

@keyframes card-touchdown {
  0%   { transform: scale(0.5) rotate(-3deg); opacity: 0; }
  60%  { transform: scale(1.08) rotate(1deg); }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

@keyframes card-firstdown {
  0%   { transform: translateY(30px) scale(0.9); opacity: 0; }
  60%  { transform: translateY(-5px) scale(1.02); }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes card-hit {
  0%   { transform: scale(0.95); opacity: 0; }
  20%  { transform: translateX(-6px); }
  40%  { transform: translateX(6px); }
  60%  { transform: translateX(-3px); }
  80%  { transform: translateX(3px); }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes card-fade-in {
  from { transform: translateY(15px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

/* ── Celebration content ── */
.celebration-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.4rem;
}

.celebration-video-wrap {
  width: 100%;
  max-width: 520px;
  margin: 0 auto 1rem;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.55);
}

.celebration-video {
  display: block;
  width: 100%;
  height: auto;
}

.celebration-emoji {
  font-size: 3rem;
  position: relative;
  z-index: 1;
}

.celebrate--touchdown .celebration-emoji {
  animation: td-emoji-bounce 0.6s ease-out 0.3s both;
}

@keyframes td-emoji-bounce {
  0%   { transform: scale(0); }
  50%  { transform: scale(1.3); }
  70%  { transform: scale(0.9); }
  100% { transform: scale(1); }
}

/* Gold burst ring behind TD emoji */
.td-burst {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,208,132,0.4) 0%, transparent 70%);
  animation: td-burst-anim 0.8s ease-out 0.2s both;
}

@keyframes td-burst-anim {
  0%   { transform: scale(0); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}

.celebration-title {
  margin: 0 0 0.4rem;
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.celebrate--touchdown .celebration-title {
  color: #00d084;
  text-shadow: 0 0 20px rgba(0, 208, 132, 0.5);
}
.celebrate--firstdown .celebration-title {
  color: var(--color-accent-gold);
  text-shadow: 0 0 15px rgba(245, 197, 24, 0.4);
}
.celebrate--sacked .celebration-title   { color: #ff4444; }
.celebrate--incomplete .celebration-title { color: var(--color-nfl-silver); }
.celebrate--turnover .celebration-title  { color: #ff4444; }

.celebration-msg {
  margin: 0 0 0.6rem;
  color: rgba(165, 172, 175, 0.7);
  font-size: 0.85rem;
}

.celebration-down-hint {
  margin: 0 0 1rem;
  color: rgba(245, 197, 24, 0.7);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.celebration-actions { display: flex; gap: 0.6rem; justify-content: center; }

.celebration-btn {
  padding: 0.5rem 1.2rem;
  border-radius: 4px;
  border: 2px solid rgba(165, 172, 175, 0.25);
  background: var(--color-bg-secondary);
  color: rgba(165, 172, 175, 0.7);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all 0.15s;
}

.celebration-btn:hover { border-color: rgba(165, 172, 175, 0.5); color: #fff; }

.celebration-btn.primary {
  border-color: var(--color-accent-gold);
  color: var(--color-accent-gold);
  background: rgba(245, 197, 24, 0.08);
}

.celebration-btn.td-btn {
  border-color: #00d084;
  color: #00d084;
  background: rgba(0, 208, 132, 0.08);
}

.celebration-btn.td-btn:hover {
  background: rgba(0, 208, 132, 0.18);
  box-shadow: 0 0 12px rgba(0, 208, 132, 0.2);
}

.celebration-btn.fd-btn {
  border-color: var(--color-accent-gold);
  color: var(--color-accent-gold);
  background: rgba(245, 197, 24, 0.08);
}

.celebration-btn.fd-btn:hover {
  background: rgba(245, 197, 24, 0.18);
  box-shadow: 0 0 12px rgba(245, 197, 24, 0.2);
}

/* ── Confetti (touchdown) ── */
.confetti-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.confetti-piece {
  position: absolute;
  width: 8px;
  height: 8px;
  top: -10px;
  left: calc(var(--i) * 3.3% + 1%);
  opacity: 0;
  animation: confetti-fall 2s ease-out calc(var(--i) * 0.06s) forwards;
}

.confetti-piece:nth-child(3n)   { background: #00d084; width: 6px; height: 10px; border-radius: 1px; }
.confetti-piece:nth-child(3n+1) { background: var(--color-accent-gold); width: 8px; height: 6px; border-radius: 1px; }
.confetti-piece:nth-child(3n+2) { background: #fff; width: 5px; height: 8px; border-radius: 50%; }
.confetti-piece:nth-child(5n)   { background: var(--color-nfl-red); }
.confetti-piece:nth-child(7n)   { background: var(--color-nfl-blue); width: 7px; height: 7px; }

@keyframes confetti-fall {
  0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
  25%  { opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

/* ── First-down chains animation ── */
.chains-anim {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  pointer-events: none;
}

.chain-marker--move {
  animation: chain-slide 0.6s ease-out 0.1s both;
}

.chain-svg {
  width: 30px;
  height: 50px;
  filter: drop-shadow(0 2px 8px rgba(255, 107, 53, 0.5));
}

@keyframes chain-slide {
  0%   { transform: translateX(-80px) scale(0.8); opacity: 0; }
  60%  { transform: translateX(10px) scale(1.05); opacity: 1; }
  100% { transform: translateX(0) scale(1); opacity: 1; }
}

/* ── Transitions ── */
.celebrate-enter-active { transition: opacity 0.3s ease; }
.celebrate-leave-active { transition: opacity 0.2s ease; }
.celebrate-enter-from, .celebrate-leave-to { opacity: 0; }
</style>
