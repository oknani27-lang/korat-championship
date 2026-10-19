import type { FlowPath, Vec3 } from '../types/machine.ts'
import { isSubstance, substances } from '../data/substances.ts'
import type { SubstanceId } from '../data/substances.ts'

export function pointOnPolyline(points: Vec3[], progress: number): Vec3 {
  const lengths = points.slice(1).map((p,i) => Math.hypot(...p.map((v,k) => v-points[i][k])))
  const total = lengths.reduce((a,b) => a+b,0)
  if (!total || !Number.isFinite(progress)) return [...points[0]]
  let distance = Math.max(0,Math.min(1,progress))*total
  for (let i=0;i<lengths.length;i++) {
    if (lengths[i] > 0 && (distance <= lengths[i] || i===lengths.length-1)) {
      const f=distance/lengths[i]
      return points[i].map((v,k) => v+(points[i+1][k]-v)*f) as Vec3
    }
    distance -= lengths[i]
  }
  return [...points[points.length-1]]
}
export function particleFrame(paths: FlowPath[], seconds: number) {
  return paths.flatMap(path => {
    const timing=path.animation
    if (!timing || path.medium !== 'liquid' || path.evidence?.status !== 'geometry-checked') return []
    return timing.substances.filter(isSubstance).flatMap((species,kind) => Array.from({length:substances[species].count},(_,index)=> {
      const local=(seconds-timing.startSeconds)/(timing.endSeconds-timing.startSeconds)
      // One finite packet per pipe segment; no modulo loop, no connection across opaque equipment.
      const p=(local-index*0.018-kind*0.013)/0.62
      return {key:`${path.id}:${species}:${index}`,pathId:path.id,species,visible:seconds>=timing.startSeconds && seconds<timing.endSeconds && p>=0 && p<=1,
        position:pointOnPolyline(path.points,Math.max(0,Math.min(1,p)))}
    }))
  })
}
export interface SchematicParticle { species: SubstanceId; x: number; y: number }
export function schematicFrame(seconds: number): {stage:'overview'|'tank'|'cell'|'filter'|'pending';progress:number;particles:SchematicParticle[]} {
  const stage=seconds>17?'pending':seconds>=11?'filter':seconds>=6?'cell':seconds>=3?'tank':'overview'
  const start=stage==='tank'?3:stage==='cell'?6:11
  const progress=Math.max(0,Math.min(1,(seconds-start)/(stage==='tank'?3:stage==='cell'?5:6)))
  if (stage==='overview'||stage==='pending') return {stage,progress,particles:[]}
  const particles:SchematicParticle[]=[]
  for (const species of ['water','urea','phosphorus'] as const) {
    const count=species==='water'?14:species==='urea'?7:4
    for(let i=0;i<count;i++) {
      const offset=species==='water'?0:species==='urea'?19:37
      const x=100+((i*43+offset)%145), y=48+((i*23+offset)%62)
      if (stage==='tank') particles.push({species,x:x+progress*18,y:y-12+progress*12})
      else if(stage==='cell') {
        const solid=species==='phosphorus'
        const angle=progress*Math.PI*2+i*1.8+offset
        particles.push({species:solid&&progress>.45?'sediment':species,
          x:solid?x+(240-x)*progress:170+Math.cos(angle)*(48+i%3*13),
          y:solid?y+(110-y)*progress:80+Math.sin(angle)*25})
      } else {
        const solid=species==='phosphorus'
        particles.push({species:solid?'sediment':species,x:x+((solid?247-i*7:356+i%4*17)-x)*progress,
          y:y+((solid?107+i%2*8:50+i%5*13)-y)*progress})
      }
    }
  }
  return {stage,progress,particles}
}
