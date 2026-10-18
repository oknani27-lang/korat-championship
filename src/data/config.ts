import processData from './process-steps.json'
import partsData from './machine-parts.json'
import pathsData from './flow-paths.json'
import researchData from './research.json'
import { parseFlows, parseParts, parseResearch, parseSteps, readData } from './parse'
import type { ModelTransform, ViewerQuality } from '../types/machine'

const process = readData(processData, parseSteps, 'ข้อมูลกระบวนการ')
const machine = readData(partsData, parseParts, 'ข้อมูลชิ้นส่วน')
const flow = readData(pathsData, parseFlows, 'เส้นทางการไหล')
const research = readData(researchData, parseResearch, 'ข้อมูลงานวิจัย')
export const steps = process.items
export const parts = machine.items
export const flowPaths = flow.items
export const papers = research.items
export const dataIssues = [process.error, machine.error, flow.error, research.error].filter((error): error is string => error !== null)
const known = (id: string, ids: string[], context: string) => { if (!ids.includes(id)) dataIssues.push(`${context}: ไม่พบ ID ${id}`) }
for (const step of steps) {
  for (const id of [...step.activeParts, ...(step.activeXrayParts ?? [])]) known(id, parts.map(part => part.id), step.id)
  for (const id of step.flowPaths) known(id, flowPaths.map(path => path.id), step.id)
  for (const id of step.researchIds ?? []) known(id, papers.map(paper => paper.id), step.id)
  for (const phase of step.timeline.phases ?? []) {
    for (const id of phase.activeXrayParts ?? []) known(id, parts.map(part => part.id), phase.id)
    for (const id of phase.flowPaths ?? []) known(id, flowPaths.map(path => path.id), phase.id)
  }
}
for (const paper of papers) for (const id of paper.processIds) known(id, steps.map(step => step.id), paper.id)
for (const path of flowPaths) {
  for (const id of path.partIds) known(id, parts.map(part => part.id), path.id)
  for (const end of [path.from, path.to]) if (end && !parts.some(part => part.id === end.partId && part.connectionPoints?.some(point => point.id === end.connectionId))) dataIssues.push(`${path.id}: ไม่พบจุดเชื่อมต่อ ${end.partId}/${end.connectionId}`)
}
export const viewerQuality: ViewerQuality = { dpr: [1, 1.5], contactShadows: true, shadowResolution: 128 }
// Supply '/models/dmr-machine.glb' only after the verified model is available.
export const modelUrl: string | null = null
// No automatic recentering/scaling; opt in after verifying the model's coordinate frame.
export const modelTransform: ModelTransform = {}
