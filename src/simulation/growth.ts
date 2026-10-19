import type { SubstanceId } from '../data/substances.ts'

export type GrowthStage = 'nitrification' | 'hold' | 'formulation' | 'cultivation'
export interface GrowthParticle { key: string; species: SubstanceId; x: number; y: number; visible: boolean }
export interface GrowthFrame {
  stage: GrowthStage; progress: number; gate: 'hold' | 'example-release' | null
  particles: GrowthParticle[]
}
const ranges = [
  ['nitrification',17,23], ['hold',23,26], ['formulation',26,30], ['cultivation',30,38],
] as const

// Story-time illustrations only: no reaction rates, assays, yields or physical integration.
export function growthFrame(seconds: number): GrowthFrame | null {
  const range = ranges.find(([,start,end]) => seconds >= start && seconds < end)
  if (!range) return null
  const [stage,start,end] = range
  const progress = (seconds-start)/(end-start)
  const particles: GrowthParticle[] = []
  function orbit(species: SubstanceId, count: number, offset: number) {
    for(let i=0;i<count;i++) {
      const angle=progress*Math.PI*2+i*2.1+offset
      particles.push({key:species+i,species,x:220+Math.cos(angle)*(45+i%4*14),y:90+Math.sin(angle)*(25+i%3*5),visible:true})
    }
  }
  orbit('water',14,0)
  // Track urea separately, without depicting an unsupported ureolysis conversion.
  if(stage!=='cultivation') orbit('urea',7,1.3)
  if(stage==='nitrification') {
    for(let i=0;i<8;i++) {
      const phase=progress-i*.018
      const species=phase<.27?'ammonium':phase<.57?'nitrite':'nitrate'
      const angle=progress*Math.PI*2+i*2.1+2.5
      particles.push({key:'nitrogen'+i,species,x:220+Math.cos(angle)*(45+i%4*14),y:90+Math.sin(angle)*(25+i%3*5),visible:true})
    }
  } else orbit('nitrate',8,2.5)
  if(stage==='nitrification'||stage==='cultivation') {
    for(let i=0;i<6;i++) particles.push({key:'gas'+i,species:'gas',x:130+i*32,y:125-((progress*1.4+i*.17)%1)*80,visible:true})
  }
  if(stage==='formulation') {
    for(let i=0;i<4;i++) {
      const fraction=Math.min(1,Math.max(0,(progress-.12-i*.04)/.45))
      particles.push({key:'supplement'+i,species:'nutrient',x:330-80*fraction+i*5,y:25+65*fraction,visible:progress>=.12+i*.04})
    }
  }
  if(stage==='cultivation') {
    for(let i=0;i<20;i++) {
      const angle=progress*2+i*1.9
      particles.push({key:'cell'+i,species:'algae',x:135+(i*47)%170+Math.cos(angle)*8,y:58+(i*29)%64+Math.sin(angle)*7,visible:i<6+Math.floor(progress*14)})
    }
  }
  return {stage,progress,gate:stage==='hold'?(progress>=.75?'example-release':'hold'):stage==='formulation'?(progress>=.75?'example-release':'hold'):null,particles}
}
