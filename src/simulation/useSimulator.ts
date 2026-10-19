import { useCallback, useEffect, useReducer } from 'react'
import type { ProcessStep } from '../types/machine'
import { FULL_CLOCK, initialSimulator, reduceSimulator, currentSimulatorStep } from './simulator'
import type { PresentationClock } from './simulator'

export function useSimulator(steps: ProcessStep[], clock: PresentationClock = FULL_CLOCK) {
  const [state, dispatch] = useReducer((state, action: Parameters<typeof reduceSimulator>[1]) => reduceSimulator(state, action, steps, clock), undefined, initialSimulator)
  const step = currentSimulatorStep(steps, state, clock)
  const hasSteps = steps.length > 0
  useEffect(() => {
    if (!state.playing || !state.demoMode || !hasSteps) return
    let timer: number | undefined
    function schedule() {
      window.clearInterval(timer)
      if (document.hidden) return
      let previous = performance.now()
      timer = window.setInterval(() => {
        const now = performance.now()
        dispatch({ type: 'tick', elapsed: now - previous })
        previous = now
      }, 33)
    }
    schedule()
    document.addEventListener('visibilitychange', schedule)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', schedule) }
  }, [state.playing, state.demoMode, hasSteps])
  const selectPart = useCallback((id: string | null) => dispatch({ type: 'selectPart', id }), [])
  return { state, step, processSteps: steps, clock, dispatch, selectPart }
}
export type Simulator = ReturnType<typeof useSimulator>
