import { ref, computed } from 'vue'

export function useRouteAnimation(puzzle, traceRoute, defenderKeys) {
  const animatingCell = ref(null)
  const isRunning = ref(false)
  const animationResult = ref(null)

  const resultMessage = computed(() => {
    switch (animationResult.value) {
      case 'touchdown':
        return { title: 'TOUCHDOWN!', emoji: '🏆', msg: '6 points! The ball reaches the end zone!', type: 'touchdown' }
      case 'firstdown':
        return { title: 'FIRST DOWN!', emoji: '⬆️', msg: 'Chains moved! New set of downs.', type: 'firstdown' }
      case 'sacked':
        return { title: 'SACKED!', emoji: '💥', msg: 'The defender brought you down!', type: 'sacked' }
      case 'incomplete':
        return { title: 'INCOMPLETE!', emoji: '❌', msg: 'Route broken — the pass falls incomplete.', type: 'incomplete' }
      case 'turnover':
        return { title: 'TURNOVER ON DOWNS', emoji: '🔄', msg: 'Out of downs. The other team gets the ball.', type: 'turnover' }
      default:
        return null
    }
  })

  async function runRoute() {
    if (isRunning.value || !puzzle.value) return null

    isRunning.value = true
    animationResult.value = null
    animatingCell.value = null

    const path = traceRoute()
    const endKey = `${puzzle.value.end[0]}-${puzzle.value.end[1]}`

    console.log('[runRoute] path length=' + path.length + ' endKey=' + endKey)
    console.log('[runRoute] path: [' + path.join(', ') + ']')

    if (path.length <= 1) {
      console.log('[runRoute] path too short → incomplete')
      animationResult.value = 'incomplete'
      isRunning.value = false
      return 'incomplete'
    }

    for (let i = 0; i < path.length; i++) {
      const cell = path[i]
      animatingCell.value = cell

      if (defenderKeys.value.has(cell)) {
        console.log('[runRoute] SACK at cell ' + cell + ' (step ' + i + ')')
        await sleep(400)
        animationResult.value = 'sacked'
        animatingCell.value = null
        isRunning.value = false
        return 'sacked'
      }

      await sleep(280)
    }

    const lastCell = path[path.length - 1]
    let result
    if (lastCell === endKey) {
      const endRow = puzzle.value.end[0]
      result = endRow === 0 ? 'touchdown' : 'firstdown'
    } else {
      result = 'incomplete'
    }

    console.log('[runRoute] result=' + result + ' lastCell=' + lastCell)
    animationResult.value = result
    animatingCell.value = null
    isRunning.value = false
    return result
  }

  function dismissResult() {
    animationResult.value = null
  }

  function setResult(type) {
    animationResult.value = type
  }

  return {
    animatingCell, isRunning, animationResult, resultMessage,
    runRoute, dismissResult, setResult,
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
