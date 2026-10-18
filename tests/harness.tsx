import { StrictMode, Suspense, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { MachineModel } from '../src/components/viewer/MachineModel'
import { MachineViewer } from '../src/components/viewer/MachineViewer'
import { ResearchSection } from '../src/components/research/ResearchSection'
import { ViewerBoundary } from '../src/components/viewer/ViewerBoundary'
import { ProcessSheet } from '../src/components/bottom-sheet/ProcessSheet'
import { steps } from '../src/data/config'
import { genericFixture } from './generic-fixture'
import { useSimulator } from '../src/simulation/useSimulator'
import type { FlowPath, MachinePart, ModelTransform, ProcessStep } from '../src/types/machine'
import type { ResearchPaper } from '../src/types/research'
import '../src/index.css'
import '../src/styles/app.css'

// UI-only fixtures, not process research. This entry is not in the production build.
const fixtures: ProcessStep[] = [
  { ...steps[0], id: 'fixture-1', title: 'UI fixture 1', timeline: { start: 0, end: 0.25 } },
  { ...steps[0], id: 'fixture-2', title: 'UI fixture 2', timeline: { start: 0.25, end: 0.75 }, formulas: [[{kind:'text',text:'A'},{kind:'sub',text:'2'},{kind:'sup',text:'+'}]] },
  { ...steps[0], id: 'fixture-3', title: 'UI fixture 3', timeline: { start: 0.75, end: 1 } },
]
const longFixtures: ProcessStep[] = fixtures.map((step, i) => i ? step : { ...step, title: 'LongUnbrokenLabel'.repeat(18), formulas: [[{ kind: 'text', text: 'FORMULA_TOKEN_'.repeat(30) }]] })
const paperFixtures: ResearchPaper[] = ['A','B'].map((letter, i) => ({ id:`ui-${letter}`, title:`UI filter fixture ${letter}`, authors:[], year:2026, publication:'Test harness only — not a publication', sourceUrl:`${location.origin}/tests/harness.html`, summary:'Interface test, not research', processIds:[fixtures[i].id], supports:['UI fixture only'], limitations:[], unverifiedClaims:[] }))
const validRegistry = [{id:'test-part',nodeName:'NamedAssembly',label:'Test assembly',focus:null}]
const invalidRegistry = [{id:'missing-part',nodeName:'MissingNode',label:'Missing test node',focus:null}]
const genericUrl='data:model/gltf+json;base64,'+btoa(JSON.stringify(genericFixture()))
const genericParts: MachinePart[] = [
  {id:'a',nodeName:'ModuleA',nodeNames:['ExtraA'],xrayNodeNames:['ShellA'],label:'Generic group A',focus:null},
  {id:'b',nodeName:'InsertB',label:'Generic object B',focus:null},
  {id:'c',nodeName:'BoxC',label:'Generic object C',focus:null},
]
const genericPaths: FlowPath[] = [
  {id:'path-a',partIds:[],points:[[-1,1.9,0],[0,1.9,0],[1,1.9,0]]},
  {id:'path-b',partIds:[],points:[[-1,.2,.8],[0,1,.8],[1,.2,.8]],direction:'reverse',phase:{start:.25,end:1}},
]
const genericSteps: ProcessStep[] = [
  {...steps[0],id:'generic-1',title:'Generic interface fixture 1',description:'Simple shapes only — not scientific data',activeParts:['b'],timeline:{start:0,end:.5,phases:[{id:'early',start:0,end:.25,activeXrayParts:['a'],flowPaths:['path-a']},{id:'late',start:.25,end:.5,flowPaths:['path-a','path-b']}]}},
  {...steps[0],id:'generic-2',title:'Generic interface fixture 2',description:'Simple shapes only — not scientific data',activeXrayParts:['c'],flowPaths:['path-b'],cameraFocus:{position:[3,2,5],target:[1.1,.6,0]},timeline:{start:.5,end:1}},
]
const fixtureQuality = { dpr: [1,1] as [number,number], contactShadows:false, shadowResolution:64 }
const staticSteps = genericSteps.map(step => ({...step,cameraFocus:null,activeXrayParts:[],flowPaths:[],timeline:{...step.timeline,phases:[]}}))
const staticQuality = {...fixtureQuality,contactShadows:true}
const normalizedTransform: ModelTransform = { fitSize:3, center:true }
const unchangedTransform: ModelTransform = {}
function IntegrationFixture({ normalized }: { normalized: boolean }) {
  const staticMode = new URLSearchParams(location.search).has('static')
  const simulator = useSimulator(staticMode ? staticSteps : genericSteps)
  return <><button onClick={() => simulator.dispatch({type:'enter'})}>Start Demo</button><output id="generic-selection">{simulator.state.selectedPartId ?? 'none'}</output>
    <section className="simulator"><ViewerBoundary><MachineViewer url={genericUrl} transform={normalized ? normalizedTransform : unchangedTransform} registry={genericParts} paths={genericPaths} quality={staticMode ? staticQuality : fixtureQuality} demoMode={simulator.state.demoMode} activeStep={simulator.step} visual={simulator.visual} selectedPartId={simulator.state.selectedPartId} onSelectPart={simulator.selectPart}/></ViewerBoundary></section>
    <ProcessSheet simulator={simulator}/></>
}
function SheetFixture({ processSteps }: { processSteps: ProcessStep[] }) {
  const simulator = useSimulator(processSteps)
  return <><button onClick={() => simulator.dispatch({ type: 'enter' })}>Start Demo</button><ProcessSheet simulator={simulator}/></>
}
export function Harness() {
  const [mounted, setMounted] = useState(true)
  const simulator = useSimulator(fixtures)
  const [selected, setSelected] = useState('none')
  const [source, setSource] = useState('/tests/missing.gltf')
  const mode = new URLSearchParams(location.search).get('case')
  if (mode === 'research') return <ResearchSection articles={paperFixtures} processSteps={fixtures}/>
  if (mode === 'integration' || mode === 'integration-normalized') return <><p>Generic software fixture only — no DMR equipment or scientific claims.</p><button onClick={() => setMounted(value => !value)}>{mounted ? 'Unmount' : 'Mount'}</button>{mounted && <IntegrationFixture normalized={mode === 'integration-normalized'}/>}</>
  if (mode?.startsWith('viewer-')) return <><button onClick={() => setSource('/tests/part-fixture.gltf')}>Switch source</button><section className="simulator"><ViewerBoundary><MachineViewer selectedPartId={simulator.state.selectedPartId} onSelectPart={simulator.selectPart} url={mode === 'viewer-missing' ? '/tests/missing.gltf' : mode === 'viewer-switch' ? source : '/tests/part-fixture.gltf'} registry={mode === 'viewer-invalid' ? invalidRegistry : validRegistry} quality={mode === 'viewer-low' ? {dpr:[1,1],contactShadows:false,shadowResolution:64} : undefined}/></ViewerBoundary></section></>
  return <><p>Test fixture only — not scientific data</p><button onClick={() => setMounted(value => !value)}>{mounted ? 'Unmount' : 'Mount'}</button>
    {mounted && (mode === 'model' || mode === 'missing' ? <><div style={{width:400,height:400,background:'#333'}}><ViewerBoundary><Canvas camera={{position:[0,0,4]}}><ambientLight intensity={2}/><Suspense fallback={null}><MachineModel url={mode === 'missing' ? '/tests/missing.gltf' : '/tests/part-fixture.gltf'} parts={[{id:'test-part',nodeName:'NamedAssembly',label:'Test assembly',focus:[0,0,0]}]} onSelect={part => setSelected(part?.id ?? 'none')}/></Suspense></Canvas></ViewerBoundary></div><p id="fixture-selection">{selected}</p></> : <SheetFixture processSteps={mode === 'long' ? longFixtures : mode === 'no-process' ? [] : fixtures}/>)}
  </>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Harness/></StrictMode>)

