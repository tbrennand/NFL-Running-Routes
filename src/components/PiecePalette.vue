<script setup>
import { SEGMENT_TYPES } from '../composables/usePuzzle.js'

const props = defineProps({
  selectedPiece: { type: String, default: null },
  inventory:     { type: Object, default: () => ({}) },
})

const emit = defineEmits(['select'])

const PIECES = [
  { type: SEGMENT_TYPES.VERTICAL,   label: 'Stem',    path: 'M 50 0 L 50 100' },
  { type: SEGMENT_TYPES.HORIZONTAL, label: 'Cross',   path: 'M 0 50 L 100 50' },
  { type: SEGMENT_TYPES.CORNER_UR,  label: 'Out',     path: 'M 50 0 Q 50 50 100 50' },
  { type: SEGMENT_TYPES.CORNER_UL,  label: 'Post',    path: 'M 50 0 Q 50 50 0 50' },
  { type: SEGMENT_TYPES.CORNER_DR,  label: 'Curl R',  path: 'M 50 100 Q 50 50 100 50' },
  { type: SEGMENT_TYPES.CORNER_DL,  label: 'Curl L',  path: 'M 50 100 Q 50 50 0 50' },
]

function remaining(type) {
  const val = props.inventory[type]
  return val !== undefined ? val : null
}

function isDisabled(type) {
  const r = remaining(type)
  return r !== null && r <= 0
}
</script>

<template>
  <div class="palette">
    <div class="palette-label">Route Pieces</div>
    <div class="palette-pieces">
      <button
        v-for="piece in PIECES"
        :key="piece.type"
        class="palette-btn"
        :class="{
          active: selectedPiece === piece.type,
          disabled: isDisabled(piece.type),
        }"
        :title="piece.label"
        @click="emit('select', piece.type)"
      >
        <div class="piece-icon-wrap">
          <svg viewBox="0 0 100 100" class="piece-svg" preserveAspectRatio="none">
            <path
              :d="piece.path"
              stroke="currentColor"
              stroke-width="18"
              stroke-linecap="round"
              fill="none"
            />
          </svg>
          <span v-if="remaining(piece.type) !== null" class="piece-count" :class="{ empty: isDisabled(piece.type) }">
            {{ remaining(piece.type) }}
          </span>
        </div>
        <span class="piece-label">{{ piece.label }}</span>
      </button>

      <!-- Eraser -->
      <button
        class="palette-btn eraser-btn"
        :class="{ active: selectedPiece === null }"
        title="Erase"
        @click="emit('select', null)"
      >
        <span class="eraser-icon">✕</span>
        <span class="piece-label">Erase</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.palette {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.palette-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-nfl-silver, rgba(165, 172, 175, 0.6));
}

.palette-pieces {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  justify-content: center;
}

.palette-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  width: 52px;
  padding: 0.35rem 0.2rem 0.25rem;
  border-radius: 6px;
  border: 2px solid rgba(165, 172, 175, 0.15);
  background: var(--color-bg-card, #16203a);
  color: rgba(165, 172, 175, 0.6);
  cursor: pointer;
  transition: all 0.12s ease;
}

.palette-btn:hover:not(.disabled) {
  border-color: rgba(165, 172, 175, 0.4);
  color: rgba(255, 255, 255, 0.85);
  background: var(--color-bg-secondary, #131d33);
}

.palette-btn.active:not(.disabled) {
  border-color: var(--color-route);
  color: var(--color-route);
  background: rgba(245, 197, 24, 0.12);
  box-shadow: 0 0 10px rgba(245, 197, 24, 0.2);
}

.palette-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.piece-icon-wrap {
  position: relative;
  width: 30px;
  height: 30px;
}

.piece-svg {
  width: 30px;
  height: 30px;
}

/* Remaining count badge */
.piece-count {
  position: absolute;
  bottom: -2px;
  right: -4px;
  min-width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  font-weight: 900;
  color: #fff;
  background: rgba(245, 197, 24, 0.85);
  border-radius: 7px;
  padding: 0 3px;
  line-height: 1;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.piece-count.empty {
  background: rgba(200, 50, 50, 0.7);
}

.piece-label {
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  line-height: 1;
}

.eraser-icon {
  font-size: 1rem;
  line-height: 1.8;
  font-weight: 900;
}

.eraser-btn {
  color: rgba(255, 100, 100, 0.6);
  border-color: rgba(255, 100, 100, 0.2);
}

.eraser-btn:hover {
  border-color: rgba(255, 100, 100, 0.5);
  color: rgba(255, 100, 100, 0.9);
}

.eraser-btn.active {
  border-color: rgba(255, 100, 100, 0.7);
  color: rgba(255, 120, 120, 1);
  background: rgba(255, 80, 80, 0.1);
  box-shadow: 0 0 10px rgba(255, 80, 80, 0.15);
}
</style>
