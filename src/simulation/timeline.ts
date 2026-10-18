type StepRange = { timeline: { start: number; end: number } }
export function clampProgress(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
}
export function nextProgress(progress: number, elapsedMs: number, durationMs: number) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) throw new Error('Timeline duration must be positive')
  return clampProgress(progress + Math.max(0, elapsedMs) / durationMs)
}
export function validateTimeline(steps: StepRange[]) {
  if (!steps.length) throw new Error('At least one process step is required')
  let end = 0
  for (const { timeline: r } of steps) {
    if (!Number.isFinite(r.start) || !Number.isFinite(r.end) || Math.abs(r.start - end) > 1e-8 || r.end <= r.start || r.end > 1) throw new Error('Step ranges must cover 0–1 without gaps or overlaps')
    end = r.end
  }
  if (Math.abs(end - 1) > 1e-8) throw new Error('Timeline must end at 1')
}
export function stepAtProgress(steps: StepRange[], progress: number) {
  const p = clampProgress(progress)
  const index = steps.findIndex(step => p < step.timeline.end)
  return index < 0 ? steps.length - 1 : index
}
export function stepStart(steps: StepRange[], index: number) {
  return steps[Math.max(0, Math.min(steps.length - 1, index))].timeline.start
}
