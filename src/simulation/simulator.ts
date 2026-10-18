import type { ProcessStep } from '../types/machine.ts'
import { clampProgress, nextProgress } from './timeline.ts'

export interface SimulatorState {
  demoMode: boolean
  currentStepId: string | null
  timelineProgress: number
  selectedPartId: string | null
  sheetExpanded: boolean
  playing: boolean
}
export type SimulatorAction =
  | { type: 'enter' | 'toggleSheet' | 'togglePlayback' | 'restart' }
  | { type: 'step'; id: string }
  | { type: 'navigate'; direction: -1 | 1 }
  | { type: 'scrub'; progress: number }
  | { type: 'tick'; elapsed: number }
  | { type: 'selectPart'; id: string | null }

export function initialSimulator(steps: ProcessStep[]): SimulatorState {
  return { demoMode: false, currentStepId: steps[0]?.id ?? null, timelineProgress: 0, selectedPartId: null, sheetExpanded: false, playing: false }
}
export function reduceSimulator(state: SimulatorState, action: SimulatorAction, steps: ProcessStep[]): SimulatorState {
  if (action.type === 'toggleSheet') return { ...state, sheetExpanded: !state.sheetExpanded }
  if (action.type === 'selectPart') return { ...state, selectedPartId: action.id }
  if (action.type === 'enter') return state.demoMode ? state : { ...state, demoMode: true }
  if (!state.demoMode || !steps.some(step => step.id === state.currentStepId)) return state
  switch (action.type) {
    case 'step':
    case 'navigate': {
      const next = action.type === 'step' ? steps.find(step => step.id === action.id) : steps[steps.findIndex(step => step.id === state.currentStepId) + action.direction]
      return next ? { ...state, currentStepId: next.id, timelineProgress: 0, selectedPartId: null, playing: false } : state
    }
    case 'scrub': return { ...state, timelineProgress: clampProgress(action.progress), playing: false }
    case 'restart': return { ...state, timelineProgress: 0, playing: false }
    case 'togglePlayback': return { ...state, timelineProgress: state.timelineProgress >= 1 ? 0 : state.timelineProgress, playing: !state.playing }
    case 'tick': {
      if (!state.playing) return state
      const progress = nextProgress(state.timelineProgress, action.elapsed, 30000)
      return { ...state, timelineProgress: progress, playing: progress < 1 }
    }
  }
}
