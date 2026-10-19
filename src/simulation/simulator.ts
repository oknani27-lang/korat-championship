import type { ProcessStep } from '../types/machine.ts'
import { clampProgress, stepAtProgress } from './timeline.ts'

export interface PresentationClock { durationSeconds: number; playableUntilSeconds: number }
export const FULL_CLOCK: PresentationClock = { durationSeconds: 60, playableUntilSeconds: 60 }
export const PROTOTYPE_CLOCK: PresentationClock = { durationSeconds: 60, playableUntilSeconds: 17 }

export interface SimulatorState {
  demoMode: boolean
  playheadSeconds: number
  selectedPartId: string | null
  sheetExpanded: boolean
  playing: boolean
  focusedStepId: string | null
}
export type SimulatorAction =
  | { type: 'enter' | 'toggleSheet' | 'togglePlayback' | 'restart' }
  | { type: 'step'; id: string }
  | { type: 'navigate'; direction: -1 | 1 }
  | { type: 'scrub'; seconds: number }
  | { type: 'tick'; elapsed: number }
  | { type: 'selectPart'; id: string | null }

export function stepAtSeconds(steps: ProcessStep[], seconds: number, clock = FULL_CLOCK) {
  if (!steps.length) return undefined
  // Keep the completed separator visible at the prototype endpoint.
  const time = seconds === clock.playableUntilSeconds && seconds < clock.durationSeconds ? seconds - 1e-7 : seconds
  return steps[stepAtProgress(steps, clampProgress(time / clock.durationSeconds))]
}
export function initialSimulator(): SimulatorState {
  return { demoMode: false, playheadSeconds: 0, selectedPartId: null, sheetExpanded: false, playing: false, focusedStepId: null }
}
export function currentSimulatorStep(steps: ProcessStep[], state: SimulatorState, clock = FULL_CLOCK) {
  // Manual selection disambiguates the two adjacent stages at exactly 17 s; it owns no separate time.
  return steps.find(step => step.id === state.focusedStepId) ?? stepAtSeconds(steps,state.playheadSeconds,clock)
}
export function reduceSimulator(state: SimulatorState, action: SimulatorAction, steps: ProcessStep[], clock = FULL_CLOCK): SimulatorState {
  if (action.type === 'toggleSheet') return { ...state, sheetExpanded: !state.sheetExpanded }
  if (action.type === 'selectPart') return { ...state, selectedPartId: action.id }
  if (action.type === 'enter') {
    if (state.demoMode && state.playing) return state
    const finished=state.playheadSeconds>=clock.playableUntilSeconds
    return {...state,demoMode:true,playheadSeconds:finished?0:state.playheadSeconds,focusedStepId:finished?null:state.focusedStepId,playing:steps.length>0}
  }
  const current = currentSimulatorStep(steps, state, clock)
  if (!state.demoMode || !current) return state
  switch (action.type) {
    case 'step':
    case 'navigate': {
      const next = action.type === 'step' ? steps.find(step => step.id === action.id) : steps[steps.indexOf(current) + action.direction]
      return next ? { ...state, playheadSeconds: next.timeline.start * clock.durationSeconds, focusedStepId: next.id, selectedPartId: null, playing: next.timeline.start*clock.durationSeconds<clock.playableUntilSeconds } : state
    }
    case 'scrub': return { ...state, playheadSeconds: clampProgress(action.seconds / clock.durationSeconds) * clock.durationSeconds, focusedStepId: null, playing: false, selectedPartId: null }
    case 'restart': return { ...state, playheadSeconds: 0, focusedStepId: null, selectedPartId: null, playing: true }
    case 'togglePlayback': {
      if ((clock.playableUntilSeconds<clock.durationSeconds && current.timeline.start*clock.durationSeconds>=clock.playableUntilSeconds) || state.playheadSeconds > clock.playableUntilSeconds) return state
      return { ...state, playheadSeconds: state.playheadSeconds === clock.playableUntilSeconds ? 0 : state.playheadSeconds, focusedStepId: null, playing: !state.playing }
    }
    case 'tick': {
      if (!state.playing) return state
      const elapsed = Number.isFinite(action.elapsed) ? Math.max(0, action.elapsed) / 1000 : 0
      const seconds = Math.min(clock.playableUntilSeconds, state.playheadSeconds + elapsed)
      const nextStep=stepAtSeconds(steps,seconds,clock)
      return { ...state, playheadSeconds: seconds, focusedStepId: null, selectedPartId: nextStep?.id===current.id?state.selectedPartId:null, playing: seconds < clock.playableUntilSeconds }
    }
  }
}
