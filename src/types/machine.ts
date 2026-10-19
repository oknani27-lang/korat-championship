export type Vec3 = [number, number, number]
export type FormulaToken = { kind: 'text' | 'sub' | 'sup'; text: string }
export interface ChemistryInfo {
  kind: 'substances' | 'reaction' | 'physical' | 'pending'
  headline: string
  explanation: string
  scope: string
  formulas: FormulaToken[][]
  sources: {label:string;url:string}[]
}
export interface TimelinePhase { id: string; start: number; end: number }
export interface ProcessStep {
  id: string
  title: string
  subtitle: string
  description: string
  formulas: FormulaToken[][]
  outputs: string[]
  activeParts: string[]
  flowPaths: string[]
  cameraFocus: { position: Vec3; target: Vec3 } | null
  timeline: { start: number; end: number; phases?: TimelinePhase[] }
  activeXrayParts?: string[]
  researchIds?: string[]
  developmentStatus?: 'prototype' | 'pending'
  chemistry?: ChemistryInfo
}
// id is the stable component ID; nodeName is the exact GLB node/assembly name.
export interface MachinePart { id: string; nodeName: string; label: string; focus: Vec3 | null; xrayNodeNames?: string[]; connectionPoints?: { id: string; position: Vec3 }[] }
export interface FlowPath {
  id: string; partIds: string[]; points: Vec3[]
  from?: { partId: string; connectionId: string }; to?: { partId: string; connectionId: string }
  medium?: 'liquid' | 'gas'
  evidence?: { sourceObjects: string[]; sourceSha256: string; glbSha256: string; status: 'geometry-checked'; note: string }
  animation?: { startSeconds: number; endSeconds: number; substances: string[] }
}
export interface MappingIssue { partId: string; nodeName: string }
export interface ViewerQuality { dpr: [number, number]; contactShadows: boolean; shadowResolution: number }
export type ViewerMode = 'rotate' | 'zoom' | 'pan'
