import processData from './process-steps.json'
import partsData from './machine-parts.json'
import pathsData from './flow-paths.json'
import researchData from './research.json'
import { parseFlows, parseParts, parseResearch, parseSteps, readData, validateReferences } from './parse'
import type { ModelTransform, ViewerQuality } from '../types/machine'

const process = readData(processData, parseSteps, 'ข้อมูลกระบวนการ')
const machine = readData(partsData, parseParts, 'ข้อมูลชิ้นส่วน')
const flow = readData(pathsData, parseFlows, 'เส้นทางการไหล')
const research = readData(researchData, parseResearch, 'ข้อมูลงานวิจัย')
export const steps = process.items
export const parts = machine.items
export const flowPaths = flow.items
export const papers = research.items
export const dataIssues = [...[process.error, machine.error, flow.error, research.error].filter((error): error is string => error !== null), ...validateReferences(steps, parts, flowPaths, papers)]
export const viewerQuality: ViewerQuality = { dpr: [1, 1.5], contactShadows: true, shadowResolution: 128 }
// Supply '/models/dmr-machine.glb' only after the verified model is available.
export const modelUrl: string | null = null
// No automatic recentering/scaling; opt in after verifying the model's coordinate frame.
export const modelTransform: ModelTransform = {}
