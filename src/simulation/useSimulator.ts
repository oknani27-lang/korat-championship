import { useCallback, useEffect, useReducer } from 'react'
import type { ProcessStep } from '../types/machine'
import { initialSimulator, reduceSimulator } from './simulator'

export function useSimulator(steps: ProcessStep[]) {
  const [state, dispatch] = useReducer((state, action: Parameters<typeof reduceSimulator>[1]) => reduceSimulator(state, action, steps), steps, initialSimulator)
  const step = steps.find(step => step.id === state.currentStepId)
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
  return { state, step, processSteps: steps, dispatch, selectPart }
}
export type Simulator = ReturnType<typeof useSimulator>
