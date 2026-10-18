import type { FlowPath, ProcessStep, ProcessVisualState } from '../types/machine.ts'
import { clampProgress } from './timeline.ts'

export const inactiveVisuals: ProcessVisualState = { activePartIds: [], xrayPartIds: [], flowPathIds: [], phaseIds: [], effectIds: [], progress: 0 }
const unique = (ids: string[]) => [...new Set(ids)]
export function processVisuals(step: ProcessStep | undefined, progress: number, demoMode: boolean): ProcessVisualState {
  if (!demoMode || !step || !(step.activeParts.length || step.activeXrayParts?.length || step.flowPaths.length || step.timeline.phases?.length)) return inactiveVisuals
  const p = clampProgress(progress)
  const time = step.timeline.start + p * (step.timeline.end - step.timeline.start)
  const phases = (step.timeline.phases ?? []).filter(phase => time >= phase.start && (time < phase.end || (p === 1 && phase.end === step.timeline.end)))
  return {
    progress: p, activePartIds: step.activeParts,
    xrayPartIds: unique([...(step.activeXrayParts ?? []), ...phases.flatMap(phase => phase.activeXrayParts ?? [])]),
    flowPathIds: unique([...step.flowPaths, ...phases.flatMap(phase => phase.flowPaths ?? [])]),
    phaseIds: phases.map(phase => phase.id), effectIds: unique(phases.flatMap(phase => phase.effectIds ?? [])),
  }
}
export function flowProgress(path: FlowPath, progress: number): number | null {
  const { start, end } = path.phase ?? { start: 0, end: 1 }
  const p = clampProgress(progress)
  if (p < start || p > end) return null
  const local = (p - start) / (end - start)
  return path.direction === 'reverse' ? 1 - local : local
}
