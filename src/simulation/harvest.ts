import type { SubstanceId } from '../data/substances.ts'

export type HarvestStage = 'harvest' | 'recovery' | 'washing'
export type HarvestStream = 'culture' | 'biomass' | 'filtrate' | 'candidate' | 'reject-hold' | 'wash-in' | 'wash-hold'
export interface HarvestParticle { key: string; species: SubstanceId; stream: HarvestStream; x: number; y: number }
export interface HarvestFrame { stage: HarvestStage; progress: number; particles: HarvestParticle[]; waterReleased: false }
const clamp=(n:number)=>Math.max(0,Math.min(1,n))

// Pure story-time frames. Counts and trajectories illustrate stream identity, never recovery or mass balance.
export function harvestFrame(seconds:number):HarvestFrame|null {
  const stage=seconds>=38&&seconds<44?'harvest':seconds>=44&&seconds<48?'recovery':seconds>=48&&seconds<51?'washing':null
  if(!stage)return null
  const start=stage==='harvest'?38:stage==='recovery'?44:48
  const progress=(seconds-start)/(stage==='harvest'?6:stage==='recovery'?4:3)
  const particles:HarvestParticle[]=[]
  const add=(species:SubstanceId,index:number,stream:HarvestStream,x:number,y:number)=>particles.push({key:species+index,species,stream,x,y})
  for(const species of ['water','nitrate','algae'] as const) {
    const count=species==='water'?20:10
    for(let i=0;i<count;i++) {
      const offset=species==='water'?0:species==='nitrate'?13:27
      if(stage==='harvest') {
        const f=clamp((progress-.1-i*.008)/.7)
        const goesRight=species==='algae'?i===9:i>=count/2
        const x0=95+(i*17+offset)%55, y0=70+(i*19+offset)%40
        const x1=goesRight?335+(i*11)%60:125+(i*11)%65, y1=65+(i*13+offset)%48
        add(species,i,f===0?'culture':goesRight?'filtrate':'biomass',x0+(x1-x0)*f,y0+(y1-y0)*f)
      } else if(stage==='recovery') {
        if(species==='algae'||i<3) {
          add(species,i,'biomass',55+(i*19)%65,88+(i*11+offset)%35)
        } else {
          const f=clamp((progress-i*.007)/.73), reject=i%4===0
          const x0=180+(i*9)%20, y0=67+(i*13+offset)%35
          const x1=reject?215+(i*7)%40:345+(i*9)%55, y1=reject?151+(i*3)%13:65+(i*13+offset)%48
          add(species,i,reject?'reject-hold':f<.15?'filtrate':'candidate',x0+(x1-x0)*f,y0+(y1-y0)*f)
        }
      } else {
        if(species==='algae'&&i<9) {
          add(species,i,'biomass',115+(i*17)%65+Math.sin(progress*4+i)*3,85+(i*13)%37)
        } else {
          const f=clamp((progress-.3-i*.004)/.57)
          const x0=species==='water'?105+(i*7)%75:130+(i*5)%40
          const y0=species==='water'?35+(i*7)%15:85+(i*11)%30
          const x1=330+(i*11)%65,y1=95+(i*13+offset)%38
          add(species,i,f>0?'wash-hold':species==='water'?'wash-in':'biomass',x0+(x1-x0)*f,y0+(y1-y0)*f)
        }
      }
    }
  }
  return {stage,progress,particles,waterReleased:false}
}
