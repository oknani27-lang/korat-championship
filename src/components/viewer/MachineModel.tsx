import { useEffect, useMemo, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import type { MachinePart, MappingIssue } from '../../types/machine'
import { checkPartMappings, findPart } from '../../simulation/parts'
import { Box3, Color, Mesh, MeshStandardMaterial } from 'three'
import type { Material } from 'three'
import type { ModelBounds } from '../../simulation/camera'
import type { Vec3 } from '../../types/machine'

interface Props { url: string; parts: MachinePart[]; activePartIds?:string[]; selectedPartId?:string|null; onSelect: (part: MachinePart | null) => void; onReady?: (issues: MappingIssue[]) => void; onBounds?: (bounds: ModelBounds) => void }
export function MachineModel({ url, parts, activePartIds, selectedPartId, onSelect, onReady, onBounds }: Props) {
  const invalidate=useThree(state=>state.invalidate)
  const { scene } = useGLTF(url)
  const {model,owned} = useMemo(() => {
    const model=scene.clone(true)
    const cache=new Map<string,{material:Material;partId:string;emissive:Color;intensity:number}>()
    model.traverse(object=>{
      if (!(object instanceof Mesh)) return
      const partId=findPart(object,parts)?.id ?? ''
      const copy=(material:Material)=>{
        const key=partId+':'+material.uuid
        if (!cache.has(key)) {
          const clone=material.clone()
          cache.set(key,{material:clone,partId,emissive:clone instanceof MeshStandardMaterial?clone.emissive.clone():new Color(),intensity:clone instanceof MeshStandardMaterial?clone.emissiveIntensity:0})
        }
        return cache.get(key)!.material
      }
      object.material=Array.isArray(object.material)?object.material.map(copy):copy(object.material)
    })
    return {model,owned:[...cache.values()]}
  }, [scene,parts])
  useEffect(()=>()=>owned.forEach(entry=>entry.material.dispose()),[owned])
  useEffect(()=>{
    for(const entry of owned) {
      if (!(entry.material instanceof MeshStandardMaterial)) continue
      const selected=entry.partId!==''&&entry.partId===selectedPartId
      const active=activePartIds?.includes(entry.partId)
      entry.material.setValues({emissive:selected||active?new Color(selected?'#0284C7':'#0D9488'):entry.emissive,
        emissiveIntensity:selected?0.35:active?0.22:entry.intensity})
    }
    invalidate()
  },[owned,activePartIds,selectedPartId,invalidate])
  const [hovered, setHovered] = useState<MachinePart | null>(null)
  const issues = useMemo(() => checkPartMappings(model, parts), [model, parts])
  const bounds = useMemo(() => {
    model.updateMatrixWorld(true)
    const box = new Box3().setFromObject(model)
    if (box.isEmpty()) throw new Error('โมเดลไม่มีชิ้นส่วนที่แสดงได้')
    return { min: box.min.toArray() as Vec3, max: box.max.toArray() as Vec3 }
  }, [model])
  useEffect(() => { onReady?.(issues) }, [onReady, issues])
  useEffect(() => { onBounds?.(bounds) }, [onBounds, bounds])
  function resolve(event: ThreeEvent<PointerEvent | MouseEvent>) { return findPart(event.object, parts) }
  return <group onPointerOver={event => setHovered(resolve(event))} onPointerOut={() => setHovered(null)} onClick={event => { event.stopPropagation(); onSelect(resolve(event)) }}>
    <primitive object={model} dispose={null}/>
    {hovered?.focus && <mesh position={hovered.focus} raycast={() => {}}><sphereGeometry args={[0.035, 12, 8]}/><meshBasicMaterial color="#67d8eb"/></mesh>}
  </group>
}
