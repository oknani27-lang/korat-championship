import type { FlowPath, MachinePart, ModelTransform, ProcessStep, Vec3 } from '../types/machine'
import { validateTimeline } from '../simulation/timeline.ts'
import type { ResearchPaper } from '../types/research'

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string')
const vector = (value: unknown): value is Vec3 => Array.isArray(value) && value.length === 3 && value.every(item => typeof item === 'number' && Number.isFinite(item))
const named = (value: unknown): value is Record<string, unknown> & { id: string } => record(value) && typeof value.id === 'string' && value.id.trim().length > 0

function list<T extends { id: string }>(data: unknown, valid: (value: unknown) => value is T, label: string): T[] {
  if (!Array.isArray(data) || !data.every(valid)) throw new Error(`Invalid ${label} configuration`)
  if (new Set(data.map(item => item.id)).size !== data.length) throw new Error(`Duplicate ${label} id`)
  return data
}
function isStep(value: unknown): value is ProcessStep {
  return named(value) && typeof value.title === 'string' && typeof value.subtitle === 'string' && typeof value.description === 'string'
    && strings(value.outputs) && strings(value.activeParts) && strings(value.flowPaths)
    && (value.activeXrayParts === undefined || strings(value.activeXrayParts)) && (value.researchIds === undefined || strings(value.researchIds))
    && Array.isArray(value.formulas) && value.formulas.every(formula => Array.isArray(formula) && formula.every(token => record(token) && typeof token.text === 'string' && (token.kind === 'text' || token.kind === 'sub' || token.kind === 'sup')))
    && (value.cameraFocus === null || (record(value.cameraFocus) && vector(value.cameraFocus.position) && vector(value.cameraFocus.target)))
    && record(value.timeline) && typeof value.timeline.start === 'number' && typeof value.timeline.end === 'number'
}
export function parseSteps(data: unknown): ProcessStep[] {
  const steps = list(data, isStep, 'process steps')
  validateTimeline(steps)
  for (const step of steps) {
    const phases = step.timeline.phases
    if (phases !== undefined && (!Array.isArray(phases) || phases.some(phase => !named(phase) || !Number.isFinite(phase.start) || !Number.isFinite(phase.end) || phase.start < step.timeline.start || phase.end > step.timeline.end || phase.end <= phase.start || (phase.activeXrayParts !== undefined && !strings(phase.activeXrayParts)) || (phase.flowPaths !== undefined && !strings(phase.flowPaths)) || (phase.effectIds !== undefined && !strings(phase.effectIds))) || new Set(phases.map(phase => phase.id)).size !== phases.length)) throw new Error(`Invalid timeline phases: ${step.id}`)
  }
  return steps
}
export function parseParts(data: unknown): MachinePart[] {
  const parts = list(data, (value): value is MachinePart => named(value) && typeof value.nodeName === 'string' && value.nodeName.trim().length > 0 && (value.nodeNames === undefined || strings(value.nodeNames)) && typeof value.label === 'string' && (value.focus === null || vector(value.focus)) && (value.xrayNodeNames === undefined || strings(value.xrayNodeNames)) && (value.connectionPoints === undefined || (Array.isArray(value.connectionPoints) && value.connectionPoints.every(point => named(point) && vector(point.position)) && new Set(value.connectionPoints.map(point => point.id)).size === value.connectionPoints.length)), 'machine parts')
  const names = parts.flatMap(part => [part.nodeName, ...(part.nodeNames ?? [])])
  if (parts.some(part => (part.nodeNames !== undefined && (!strings(part.nodeNames) || part.nodeNames.some(name => !name.trim()))) || part.xrayNodeNames?.some(name => !name.trim()))) throw new Error('Invalid machine node names')
  if (new Set(names).size !== names.length) throw new Error('Duplicate machine node mapping')
  return parts
}
const flowPoints = (value: unknown): value is Vec3[] => Array.isArray(value) && value.length >= 2 && value.every(vector) && value.some(point => point.some((n, i) => n !== value[0][i]))
export function parseFlows(data: unknown): FlowPath[] {
  const endpoint = (value: unknown) => value === undefined || (record(value) && typeof value.partId === 'string' && typeof value.connectionId === 'string')
  return list(data, (value): value is FlowPath => named(value) && strings(value.partIds) && flowPoints(value.points) && (value.direction === undefined || value.direction === 'forward' || value.direction === 'reverse') && (value.phase === undefined || (record(value.phase) && typeof value.phase.start === 'number' && Number.isFinite(value.phase.start) && typeof value.phase.end === 'number' && Number.isFinite(value.phase.end) && value.phase.start >= 0 && value.phase.end <= 1 && value.phase.end > value.phase.start)) && endpoint(value.from) && endpoint(value.to), 'flow paths')
}
export function parseModelTransform(value: unknown): ModelTransform {
  if (!record(value) || (value.center !== undefined && typeof value.center !== 'boolean') || [value.scale, value.fitSize].some(n => n !== undefined && (typeof n !== 'number' || !Number.isFinite(n) || n <= 0)) || (value.scale !== undefined && value.fitSize !== undefined)) throw new Error('Invalid model transform: use a positive scale OR fitSize and optional center')
  return value as ModelTransform
}

function sourceUrl(value: unknown, localPdf = false): value is string {
  if (typeof value !== 'string' || !value.trim()) return false
  if (localPdf && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return true
  try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
}
export function parseResearch(data: unknown): ResearchPaper[] {
  return list(data, (value): value is ResearchPaper => named(value) && typeof value.title === 'string' && value.title.trim().length > 0 && strings(value.authors) && typeof value.year === 'number' && Number.isInteger(value.year) && value.year > 0 && typeof value.publication === 'string' && sourceUrl(value.sourceUrl) && (value.pdfUrl === undefined || sourceUrl(value.pdfUrl, true)) && (value.doi === undefined || (typeof value.doi === 'string' && /^10\.\d{4,9}\/\S+$/.test(value.doi))) && typeof value.summary === 'string' && strings(value.processIds) && value.processIds.length > 0 && strings(value.supports) && strings(value.limitations) && strings(value.unverifiedClaims), 'research')
}

export function readData<T>(data: unknown, parse: (data: unknown) => T[], label: string): { items: T[]; error: string | null } {
  try { return { items: parse(data), error: null } }
  catch (error) { return { items: [], error: `${label}: ${error instanceof Error ? error.message : String(error)}` } }
}

