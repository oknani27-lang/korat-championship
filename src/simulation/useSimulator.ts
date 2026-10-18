import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type { ProcessStep } from '../types/machine'
import { initialSimulator, reduceSimulator } from './simulator'
import { processVisuals } from './visual-state'

export function useSimulator(steps: ProcessStep[]) {
  const [state, dispatch] = useReducer((state, action: Parameters<typeof reduceSimulator>[1]) => reduceSimulator(state, action, steps), steps, initialSimulator)
  const step = steps.find(step => step.id === state.currentStepId)
  const visual = useMemo(() => processVisuals(step, state.timelineProgress, state.demoMode), [step, state.timelineProgress, state.demoMode])
  useEffect(() => {
    if (!state.playing || !state.demoMode || !step) return
    let timer: number | undefined
    function schedule() {
      window.clearInterval(timer)
      if (document.hidden) return
      let previous = performance.now()
      timer = window.setInterval(() => {
        const now = performance.now()
        dispatch({ type: 'tick', elapsed: now - previous })
        previous = now
      }, 100)
    }
    schedule()
    document.addEventListener('visibilitychange', schedule)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', schedule) }
  }, [state.playing, state.demoMode, step])
  const selectPart = useCallback((id: string | null) => dispatch({ type: 'selectPart', id }), [])
  return { state, step, visual, processSteps: steps, dispatch, selectPart }
}
export type Simulator = ReturnType<typeof useSimulator>
