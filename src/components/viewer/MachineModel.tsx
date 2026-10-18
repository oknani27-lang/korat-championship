import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import type { MachinePart, MappingIssue, ModelTransform, ProcessVisualState } from '../../types/machine'
import { createModelInstance } from '../../simulation/model'
import type { ModelInstance } from '../../simulation/model'
import { createMaterialController } from '../../simulation/materials'
import { inactiveVisuals } from '../../simulation/visual-state'

const noTransform: ModelTransform = {}
interface Props {
  url: string; parts: MachinePart[]; onSelect: (part: MachinePart | null) => void
  onReady?: (issues: MappingIssue[]) => void; onInstance?: (instance: ModelInstance | null) => void
  transform?: ModelTransform; selectedPartId?: string | null; visual?: ProcessVisualState
}
export function MachineModel({ url, parts, onSelect, onReady, onInstance, transform = noTransform, selectedPartId = null, visual = inactiveVisuals }: Props) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => createModelInstance(scene, parts, transform), [scene, parts, transform])
  const materials = useMemo(() => createMaterialController(model), [model])
  const [hovered, setHovered] = useState<string | null>(null)
  const invalidate = useThree(state => state.invalidate)
  useEffect(() => { onReady?.(model.issues); onInstance?.(model); return () => { onInstance?.(null); materials.dispose(); model.dispose() } }, [model, materials, onReady, onInstance])
  useEffect(() => { if (materials.apply({ selectedPartId, hoveredPartId: hovered, activePartIds: visual.activePartIds, xrayPartIds: visual.xrayPartIds })) invalidate() }, [materials, selectedPartId, hovered, visual, invalidate])
  const hover = useCallback((event: ThreeEvent<PointerEvent>) => setHovered(model.partFor(event.object)?.definition.id ?? null), [model])
  const leave = useCallback(() => setHovered(null), [])
  const select = useCallback((event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); const part = model.partFor(event.object)?.definition ?? null; onSelect(part?.id === selectedPartId ? null : part) }, [model, onSelect, selectedPartId])
  return <group onPointerMove={hover} onPointerOut={leave} onClick={select}>
    {/* Geometry/textures belong to the shared GLTF cache; only instance materials are owned here. */}
    <primitive object={model.root} dispose={null}/>
  </group>
}
