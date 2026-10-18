import { useEffect, useMemo, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { MachinePart, MappingIssue } from '../../types/machine'
import { checkPartMappings, findPart } from '../../simulation/parts'

interface Props { url: string; parts: MachinePart[]; onSelect: (part: MachinePart | null) => void; onReady?: (issues: MappingIssue[]) => void }
export function MachineModel({ url, parts, onSelect, onReady }: Props) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => scene.clone(true), [scene])
  const [hovered, setHovered] = useState<MachinePart | null>(null)
  const issues = useMemo(() => checkPartMappings(model, parts), [model, parts])
  useEffect(() => { onReady?.(issues) }, [onReady, issues])
  function resolve(event: ThreeEvent<PointerEvent | MouseEvent>) { return findPart(event.object, parts) }
  return <group onPointerOver={event => setHovered(resolve(event))} onPointerOut={() => setHovered(null)} onClick={event => { event.stopPropagation(); onSelect(resolve(event)) }}>
    <primitive object={model} dispose={null}/>
    {hovered?.focus && <mesh position={hovered.focus} raycast={() => {}}><sphereGeometry args={[0.035, 12, 8]}/><meshBasicMaterial color="#67d8eb"/></mesh>}
  </group>
}
