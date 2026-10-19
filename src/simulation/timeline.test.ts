import assert from 'node:assert/strict'
import { PerspectiveCamera, Vector3 } from 'three'
import { fitModelCamera } from './camera.ts'
import { clampProgress, nextProgress, stepAtProgress, stepStart, validateTimeline } from './timeline.ts'
import { checkPartMappings, findPart } from './parts.ts'
import { parseFlows, parseParts, parseResearch, parseSteps, readData } from '../data/parse.ts'
import { filterResearch } from '../data/research.ts'
import { initialSimulator, reduceSimulator, currentSimulatorStep, stepAtSeconds, PROTOTYPE_CLOCK } from './simulator.ts'
import { readFileSync } from 'node:fs'
import { pointOnPolyline, particleFrame, schematicFrame } from './flow.ts'
import { chemistryByStep } from '../data/process-chemistry.ts'
import { growthFrame } from './growth.ts'
import { harvestFrame } from './harvest.ts'
import { finishingFrame } from './finishing.ts'
const steps = [{ timeline: { start: 0, end: 0.3 } }, { timeline: { start: 0.3, end: 1 } }]
validateTimeline(steps)
assert.equal(stepAtProgress(steps, 0.3), 1)
assert.equal(stepAtProgress(steps, 1), 1)
assert.equal(stepAtProgress(steps, 0.1), 0)
assert.equal(stepStart(steps, -1), 0)
assert.equal(stepStart(steps, 99), 0.3)
assert.equal(nextProgress(0.99, 1000, 30000), 1)
assert.equal(nextProgress(0.5, -100, 30000), 0.5)
assert.equal(clampProgress(NaN), 0)
assert.throws(() => validateTimeline([]))
assert.throws(() => validateTimeline([{ timeline: { start: 0, end: 0.2 } }]))
assert.throws(() => nextProgress(0, 1, 0))
assert.throws(() => validateTimeline([{timeline:{start:0,end:0.6}},{timeline:{start:0.5,end:1}}]))
assert.throws(() => validateTimeline([{timeline:{start:0,end:0.4}},{timeline:{start:0.5,end:1}}]))
assert.throws(() => validateTimeline([{timeline:{start:0,end:NaN}}]))
const part = { id:'tank', nodeName:'NamedAssembly', label:'Test', focus:null }
const assembly = {name:'NamedAssembly',parent:null}
assert.equal(findPart({name:'mesh-child',parent:assembly},[part]),part)
assert.equal(findPart({name:'unmapped',parent:null},[part]),null)
assert.equal(findPart(null,[part]),null)
const example = { id:'example', title:'UI example', subtitle:'Test', description:'UI fixture only', formulas:[[{kind:'text',text:'A'},{kind:'sub',text:'2'},{kind:'sup',text:'+'}]], outputs:[], activeParts:[], flowPaths:[], cameraFocus:{position:[1,2,3],target:[0,0,0]}, timeline:{start:0,end:1} }
const simulatorSteps = parseSteps([{...example,timeline:{start:0,end:0.3}},{...example,id:'second',timeline:{start:0.3,end:1}}])
let simulator = initialSimulator()
const act = (action: Parameters<typeof reduceSimulator>[1]) => { simulator = reduceSimulator(simulator, action, simulatorSteps) }
const current = () => currentSimulatorStep(simulatorSteps,simulator)?.id
act({type:'togglePlayback'}); assert.equal(simulator.playing,false)
act({type:'enter'}); assert.equal(simulator.demoMode,true); assert.equal(simulator.playing,true); assert.equal(simulator.sheetExpanded,false)
act({type:'scrub',seconds:60}); assert.equal(current(),'second')
act({type:'scrub',seconds:6}); assert.equal(simulator.playheadSeconds,6); assert.equal(simulator.playing,false)
act({type:'enter'}); assert.equal(simulator.playheadSeconds,6); assert.equal(simulator.playing,true)
act({type:'selectPart',id:'tank'}); act({type:'step',id:'second'})
assert.equal(current(),'second'); assert.equal(simulator.playheadSeconds,18); assert.equal(simulator.selectedPartId,null); assert.equal(simulator.playing,true)
act({type:'tick',elapsed:1000}); assert.equal(simulator.playheadSeconds,19)
act({type:'scrub',seconds:NaN}); assert.equal(simulator.playheadSeconds,0)
act({type:'step',id:'unknown'}); assert.equal(current(),'example')
act({type:'enter'}); act({type:'tick',elapsed:60000})
assert.equal(simulator.playheadSeconds,60); assert.equal(simulator.playing,false); assert.equal(current(),'second')
act({type:'enter'}); assert.equal(simulator.playheadSeconds,0); assert.equal(simulator.playing,true)
act({type:'restart'}); assert.equal(simulator.playing,true); assert.equal(current(),'example')
for(let i=0;i<20;i++) act({type:'navigate',direction:-1})
assert.equal(current(),'example')
for(let i=0;i<20;i++) act({type:'navigate',direction:1})
assert.equal(current(),'second'); assert.equal(simulator.playheadSeconds,18); assert.equal(simulator.playing,true)
assert.equal(reduceSimulator(initialSimulator(),{type:'enter'},[]).playing,false)
assert.equal(parseSteps(JSON.parse(JSON.stringify([example])))[0].formulas[0][1].kind,'sub')
assert.throws(()=>parseSteps([{...example,formulas:[[{kind:'html',text:'not allowed'}]]}]))
assert.throws(()=>parseSteps([{...example,cameraFocus:{position:[1,2],target:[0,0,0]}}]))
assert.throws(()=>parseSteps([{...example,id:''}]))
assert.throws(()=>parseParts([part,part]))
assert.equal(parseParts([{...part,focus:[1,2,3]}])[0].focus?.[2],3)
assert.throws(()=>parseParts([{...part,focus:[NaN,0,0]}]))
assert.equal(parseFlows([{id:'flow',partIds:['tank'],points:[[0,0,0],[1,1,1]]}]).length,1)
assert.throws(()=>parseFlows([{id:'flow',partIds:['tank'],points:[[0,0]]}]))
const fixturePaper = { id:'ui-fixture', title:'UI search fixture', authors:[], year:2026, publication:'Test harness only', sourceUrl:'http://localhost:5173/tests/harness.html', summary:'Interface test, not research', processIds:['example'], supports:[], limitations:[], unverifiedClaims:[] }
const references = parseResearch([fixturePaper])
assert.equal(filterResearch(references,'SEARCH','example').length,1)
assert.equal(filterResearch(references,'search','other').length,0)
assert.equal(filterResearch(references,'missing','').length,0)
assert.equal(filterResearch(references,'   ','').length,1)
assert.throws(()=>parseResearch([{...fixturePaper,sourceUrl:'javascript:alert(1)'}]))
assert.throws(()=>parseResearch([{...fixturePaper,pdfUrl:'//untrusted.invalid/document'}]))
assert.throws(()=>parseResearch([{...fixturePaper,doi:'invalid'}]))
assert.equal(parseResearch([{...fixturePaper,pdfUrl:'/papers/source.pdf'}]).length,1)
assert.throws(()=>parseResearch([fixturePaper,fixturePaper]))
assert.throws(()=>parseParts([{...part,id:'second'},part]))
assert.equal(parseParts([{...part,xrayNodeNames:['internal'],connectionPoints:[{id:'out',position:[0,0,0]}]}]).length,1)
assert.throws(()=>parseParts([{...part,connectionPoints:[{id:'out',position:[0,0]}]}]))
assert.throws(()=>parseSteps([{...example,timeline:{start:0,end:1,phases:[{id:'outside',start:0.5,end:1.1}]}}]))
assert.equal(parseSteps([{...example,activeXrayParts:['tank'],researchIds:['ui-fixture'],timeline:{start:0,end:1,phases:[{id:'phase',start:0,end:0.5}]}}]).length,1)
assert.equal(readData([],parseSteps,'process').items.length,0)
assert.match(readData([],parseSteps,'process').error ?? '',/At least one/)
assert.deepEqual(checkPartMappings({getObjectByName:name=>name==='NamedAssembly' ? {} : undefined},[part]),[])
assert.deepEqual(checkPartMappings({getObjectByName:()=>undefined},[part]),[{partId:'tank',nodeName:'NamedAssembly'}])
// Check real skid proportions and narrow mobile aspects: every bounding corner must fit.
for (const aspect of [0.45, 0.8, 1.2, 2.3]) {
  const bounds = { min: [-8.2, 0, -1.1] as [number,number,number], max: [8.2, 4.9, 1.1] as [number,number,number] }
  const frame = fitModelCamera(bounds, aspect)
  const camera = new PerspectiveCamera(35, aspect, 0.05, 1000)
  camera.position.copy(frame.position); camera.lookAt(frame.target); camera.updateMatrixWorld(true)
  for (const x of [bounds.min[0], bounds.max[0]]) for (const y of [bounds.min[1], bounds.max[1]]) for (const z of [bounds.min[2], bounds.max[2]]) {
    const p = new Vector3(x,y,z).project(camera)
    assert(Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && Math.abs(p.z) < 1)
  }
}
// Global presentation clock, strict prototype endpoint, and bidirectional deterministic visual state.
const planned=parseSteps(JSON.parse(readFileSync('src/data/process-steps.json','utf8')))
const routes=parseFlows(JSON.parse(readFileSync('src/data/flow-paths.json','utf8')))
assert.equal(planned.length,13)
assert.deepEqual(planned.map(s=>Math.round(s.timeline.start*60)),[0,3,6,11,17,23,26,30,38,44,48,51,56])
for (const [seconds,id] of [[0,'overview'],[3,'intake'],[6,'conditioning'],[11,'separation'],[17,'separation'],[23,'hold'],[60,'packing']] as const) assert.equal(stepAtSeconds(planned,seconds,PROTOTYPE_CLOCK)?.id,id)
let prototype=initialSimulator()
const tick=(action: Parameters<typeof reduceSimulator>[1])=>{prototype=reduceSimulator(prototype,action,planned,PROTOTYPE_CLOCK)}
tick({type:'enter'});tick({type:'tick',elapsed:20000})
assert.equal(prototype.playheadSeconds,17);assert.equal(prototype.playing,false)
assert.equal(currentSimulatorStep(planned,prototype,PROTOTYPE_CLOCK)?.id,'separation')
tick({type:'navigate',direction:1});assert.equal(currentSimulatorStep(planned,prototype,PROTOTYPE_CLOCK)?.id,'nitrification')
tick({type:'togglePlayback'});assert.equal(prototype.playing,false)
tick({type:'scrub',seconds:40});tick({type:'togglePlayback'});assert.equal(prototype.playing,false)
tick({type:'restart'});assert.equal(prototype.playheadSeconds,0)
tick({type:'scrub',seconds:5.7});tick({type:'enter'});tick({type:'tick',elapsed:500})
assert.equal(currentSimulatorStep(planned,prototype,PROTOTYPE_CLOCK)?.id,'conditioning')
tick({type:'togglePlayback'});tick({type:'tick',elapsed:10000});assert.equal(prototype.playheadSeconds,6.2)
tick({type:'togglePlayback'});tick({type:'tick',elapsed:NaN});assert.equal(prototype.playheadSeconds,6.2)
tick({type:'selectPart',id:'EC101'});tick({type:'tick',elapsed:100});assert.equal(prototype.selectedPartId,'EC101')
tick({type:'tick',elapsed:5000});assert.equal(prototype.selectedPartId,null)
assert.deepEqual(pointOnPolyline([[0,0,0],[2,0,0],[2,2,0]],.75),[2,1,0])
assert.deepEqual(pointOnPolyline([[0,0,0],[0,0,0],[2,0,0]],.5),[1,0,0])
for(const seconds of [0,3.7,5.3,8.25,11.5,16.9,17,40]) {
  const first=particleFrame(routes,seconds), inset=schematicFrame(seconds)
  particleFrame(routes,16);particleFrame(routes,1)
  assert.deepEqual(particleFrame(routes,seconds),first)
  assert.deepEqual(schematicFrame(seconds),inset)
  for(const p of first.filter(p=>p.visible)) {
    assert(!/R102/.test(p.pathId))
    const path=routes.find(r=>r.id===p.pathId)!
    assert(path.points.some((point,i)=>{
      const next=path.points[i+1];if(!next)return false
      const varying=[0,1,2].filter(k=>Math.abs(point[k]-next[k])>1e-6)
      return [0,1,2].every(k=>varying.includes(k)?p.position[k]>=Math.min(point[k],next[k])-1e-6&&p.position[k]<=Math.max(point[k],next[k])+1e-6:Math.abs(p.position[k]-point[k])<1e-6)
    }),'particles must stay on a measured polyline segment')
  }
}
assert.equal(particleFrame(routes,51).some(p=>p.visible),false)
assert.equal(particleFrame(routes,-1).some(p=>p.visible),false)
for(const t of [3,6,9,11,17]) {
  const p=schematicFrame(t).particles
  assert.equal(p.filter(p=>p.species==='water').length,14)
  assert.equal(p.filter(p=>p.species==='urea').length,7)
  assert.equal(p.filter(p=>p.species==='phosphorus'||p.species==='sediment').length,4)
}
assert(schematicFrame(17).particles.filter(p=>p.species==='sediment').every(p=>p.x<273))
assert(schematicFrame(17).particles.filter(p=>p.species==='water'||p.species==='urea').every(p=>p.x>273))
assert.equal(routes.length,15)
assert(routes.every(p=>p.medium==='liquid'&&p.evidence?.sourceObjects.length&&p.animation!.endSeconds<=51))
assert.equal(routes.filter(p=>p.animation!.endSeconds<=17).length,3)
const geometryAudit=JSON.parse(readFileSync('docs/growth-geometry-audit.json','utf8')) as {curves:{object:string;splines:{points:number[][]}[]}[]}
for(const route of routes) {
  assert.deepEqual(route.points,geometryAudit.curves.find(c=>c.object===route.evidence?.sourceObjects[0])?.splines[0].points)
  assert(!route.animation!.substances.some(id=>id==='gas'))
  assert(!/R102|RETURN|G401/.test(route.evidence!.sourceObjects[0]))
}
for(const [time,stage] of [[17,'nitrification'],[23,'hold'],[26,'formulation'],[30,'cultivation']] as const) {
  assert.equal(growthFrame(time)?.stage,stage)
  assert.equal(stepAtSeconds(planned,time)?.id,stage)
}
for(const time of [-1,16.99,38,40,60,NaN])assert.equal(growthFrame(time),null)
for(const time of [17,18.5,20,22.99,23,25.24,25.25,26,28,29,30,33,37.99]) {
  const frame=growthFrame(time)!
  growthFrame(37);growthFrame(17)
  assert.deepEqual(growthFrame(time),frame)
  assert.equal(frame.particles.filter(p=>p.species==='water').length,14)
  if(time<30)assert.equal(frame.particles.filter(p=>p.species==='urea').length,7)
  assert(frame.particles.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))
}
assert.equal(growthFrame(17)!.particles.filter(p=>p.species==='ammonium').length,8)
assert.equal(growthFrame(20)!.particles.filter(p=>p.species==='nitrite').length,8)
assert.equal(growthFrame(22.99)!.particles.filter(p=>p.species==='nitrate').length,8)
assert.equal(growthFrame(25.24)?.gate,'hold')
assert.equal(growthFrame(25.25)?.gate,'example-release')
assert.equal(growthFrame(29)?.gate,'example-release')
assert.equal(routes.find(p=>p.id==='hold-to-formulation')?.animation?.startSeconds,25.25)
assert(growthFrame(37.9)!.particles.filter(p=>p.species==='algae'&&p.visible).length>growthFrame(30)!.particles.filter(p=>p.species==='algae'&&p.visible).length)
assert(particleFrame(routes,18).some(p=>p.visible&&p.pathId==='filter-to-bioreactor'))
assert(particleFrame(routes,36).some(p=>p.visible&&p.pathId==='sensor-to-culture'&&p.species==='algae'))
for(const [time,stage] of [[38,'harvest'],[44,'recovery'],[48,'washing']] as const) {
  assert.equal(harvestFrame(time)?.stage,stage)
  assert.equal(stepAtSeconds(planned,time)?.id,stage)
}
for(const time of [0,37.99,51,60,NaN])assert.equal(harvestFrame(time),null)
for(const time of [38,38.8,40.5,43.99,44,45,46.5,47.99,48,49.4,50.99]) {
  const frame=harvestFrame(time)!
  harvestFrame(50);harvestFrame(38)
  assert.deepEqual(harvestFrame(time),frame)
  assert.equal(frame.waterReleased,false)
  assert.equal(frame.particles.filter(p=>p.species==='water').length,20)
  assert.equal(frame.particles.filter(p=>p.species==='nitrate').length,10)
  assert.equal(frame.particles.filter(p=>p.species==='algae').length,10)
  assert.equal(new Set(frame.particles.map(p=>p.key)).size,40)
  assert(frame.particles.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))
}
const harvestEnd=harvestFrame(43.99)!
for(const stream of ['biomass','filtrate'])for(const species of ['water','nitrate'])assert(harvestEnd.particles.some(p=>p.stream===stream&&p.species===species))
assert(harvestEnd.particles.some(p=>p.species==='algae'&&p.stream==='filtrate'),'schematic must not imply perfect cell retention')
assert(harvestFrame(46)!.particles.filter(p=>p.species==='algae').every(p=>p.stream==='biomass'))
assert(harvestFrame(50.99)!.particles.some(p=>p.stream==='wash-hold'&&p.species==='nitrate'))
assert(harvestFrame(50.99)!.particles.some(p=>p.stream==='biomass'&&p.species==='algae'))
for(const seconds of [38.7,41.4,44.7,46.7])assert(particleFrame(routes,seconds).some(p=>p.visible))
for(const route of routes.filter(p=>p.animation!.startSeconds>=38))assert(!route.animation!.substances.includes('sediment'))
assert(!routes.some(r=>r.evidence!.sourceObjects.some(n=>/T501_W601|WATER_T501|T601_R401/.test(n))))
assert.equal(particleFrame(routes,25).some(p=>p.visible&&p.pathId==='hold-to-formulation'),false)
for(const route of routes)for(const seconds of [route.animation!.startSeconds-.001,route.animation!.endSeconds])assert(!particleFrame([route],seconds).some(p=>p.visible))
assert.throws(()=>parseFlows([{...routes[0],animation:{...routes[0].animation,substances:['toString']}}]))
assert.throws(()=>parseFlows([{...routes[0],medium:'gas'}]))
let tour=initialSimulator()
tour=reduceSimulator(tour,{type:'enter'},planned)
for(let second=1;second<=60;second++) {
  tour=reduceSimulator(tour,{type:'tick',elapsed:1000},planned)
  assert.equal(tour.playheadSeconds,second)
  assert.equal(tour.playing,second<60)
}
assert.equal(currentSimulatorStep(planned,tour)?.id,'packing')
tour=reduceSimulator(tour,{type:'step',id:'nitrification'},planned)
assert.equal(tour.playing,true);assert.equal(tour.playheadSeconds,17)
assert.deepEqual(Object.keys(chemistryByStep).sort(),planned.filter(s=>s.id!=='overview').map(s=>s.id).sort())
assert(chemistryByStep.conditioning.scope.includes('ไม่ใช่ผลยืนยัน'))
for(const info of Object.values(chemistryByStep)) {
  if(info.kind==='physical'||info.kind==='pending') assert.equal(info.formulas.length,0)
  assert(info.sources.every(s=>new URL(s.url).protocol==='https:'))
}

for(const t of [-1,50.99,60.01,NaN,Infinity])assert.equal(finishingFrame(t),null)
for(const t of [51,52,54,55.99,56,57,58,59.5,60]) {
  const frame=finishingFrame(t)!
  finishingFrame(60);finishingFrame(51)
  assert.deepEqual(finishingFrame(t),frame)
  assert.equal(frame.released,false)
  assert.equal(stepAtSeconds(planned,t)?.id,frame.stage)
  assert.equal(particleFrame(routes,t).some(p=>p.visible),false,'No dry product on unverified pipes')
}
assert.equal(finishingFrame(51)?.phase,'loading')
assert.equal(finishingFrame(56)?.phase,'filling')
assert.equal(finishingFrame(60)?.phase,'quarantine')
assert.equal(finishingFrame(60)?.sealed,true)
assert.equal(finishingFrame(60)?.labelled,true)
assert.deepEqual(planned.find(s=>s.id==='processing')?.activeParts,['DR701'])
console.log('PASS: deterministic 0–60 s, 15 audited liquid paths, example drying/packing, final quarantine, shared clock, validation and framing')
