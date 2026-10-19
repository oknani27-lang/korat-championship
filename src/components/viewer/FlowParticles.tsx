import { useLayoutEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { CatmullRomCurve3, DoubleSide, Object3D, Vector3 } from 'three'
import type { InstancedMesh } from 'three'
import type { FlowPath } from '../../types/machine'
import { substances } from '../../data/substances'
import type { SubstanceId } from '../../data/substances'
import { particleFrame } from '../../simulation/flow'

type Particle = ReturnType<typeof particleFrame>[number]
function SpeciesParticles({ species, frames }: {species:SubstanceId;frames:Particle[]}) {
  const mesh=useRef<InstancedMesh>(null)
  const invalidate=useThree(state=>state.invalidate)
  const transform=useMemo(()=>new Object3D(),[])
  const helix=useMemo(()=>new CatmullRomCurve3(Array.from({length:33},(_,i)=>new Vector3(Math.cos(i*Math.PI/6)*.035,(i/32-.5)*.15,Math.sin(i*Math.PI/6)*.035))),[])
  useLayoutEffect(()=>{
    if (!mesh.current) return
    frames.forEach((p,i)=>{
      transform.position.set(...p.position)
      transform.scale.setScalar(p.visible?1:0)
      transform.updateMatrix()
      mesh.current!.setMatrixAt(i,transform.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate=true
    invalidate()
  },[frames,transform,invalidate])
  if (!frames.length) return null
  return <instancedMesh ref={mesh} args={[undefined,undefined,frames.length]} visible={frames.some(frame=>frame.visible)} frustumCulled={false} renderOrder={10} raycast={()=>{}} userData={{flowSpecies:species}}>
    {species==='water'?<icosahedronGeometry args={[0.043,1]}/>:species==='urea'?<octahedronGeometry args={[0.053,0]}/>:species==='phosphorus'?<ringGeometry args={[0.027,0.045,4]}/>:species==='nitrate'?<circleGeometry args={[.055,6]}/>:species==='algae'?<tubeGeometry args={[helix,32,.009,4,false]}/>:<tetrahedronGeometry args={[0.065,0]}/>}
    <meshBasicMaterial color={substances[species].color} depthTest={false} depthWrite={false} side={DoubleSide}/>
  </instancedMesh>
}
export function FlowParticles({paths,seconds}:{paths:FlowPath[];seconds:number}) {
  const grouped=useMemo(()=>{
    const frames=particleFrame(paths,seconds)
    return (Object.keys(substances) as SubstanceId[]).map(species=>({species,frames:frames.filter(p=>p.species===species)})).filter(group=>group.frames.length)
  },[paths,seconds])
  return <group name="PROTOTYPE_FLOW_MARKERS">{grouped.map(group=><SpeciesParticles key={group.species} species={group.species} frames={group.frames}/>)}</group>
}
