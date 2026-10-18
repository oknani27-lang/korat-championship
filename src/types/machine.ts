export type Vec3 = [number, number, number]
export type FormulaToken = { kind: 'text' | 'sub' | 'sup'; text: string }
export interface TimelinePhase { id: string; start: number; end: number; activeXrayParts?: string[]; flowPaths?: string[]; effectIds?: string[] }
export interface ModelTransform { scale?: number; fitSize?: number; center?: boolean }
export interface CameraFocus { position: Vec3; target: Vec3 }
export interface ProcessVisualState { activePartIds: string[]; xrayPartIds: string[]; flowPathIds: string[]; phaseIds: string[]; effectIds: string[]; progress: number }
export interface ProcessStep {
  id: string
  title: string
  subtitle: string
  description: string
  formulas: FormulaToken[][]
  outputs: string[]
  activeParts: string[]
  flowPaths: string[]
  cameraFocus: CameraFocus | null
  timeline: { start: number; end: number; phases?: TimelinePhase[] }
  activeXrayParts?: string[]
  researchIds?: string[]
}
// id is the stable component ID; nodeName is the exact GLB node/assembly name.
export interface MachinePart { id: string; nodeName: string; nodeNames?: string[]; label: string; focus: Vec3 | null; xrayNodeNames?: string[]; connectionPoints?: { id: string; position: Vec3 }[] }
export interface FlowPath { id: string; partIds: string[]; points: Vec3[]; direction?: 'forward' | 'reverse'; phase?: { start: number; end: number }; from?: { partId: string; connectionId: string }; to?: { partId: string; connectionId: string } }
export interface MappingIssue { partId: string; nodeName: string; reason?: 'ambiguous' | 'conflict' }
export interface ViewerQuality { dpr: [number, number]; contactShadows: boolean; shadowResolution: number }
export type ViewerMode = 'rotate' | 'zoom' | 'pan'
