import { StrictMode, Suspense, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { MachineModel } from '../src/components/viewer/MachineModel'
import { MachineViewer } from '../src/components/viewer/MachineViewer'
import { ResearchSection } from '../src/components/research/ResearchSection'
import { ViewerBoundary } from '../src/components/viewer/ViewerBoundary'
import { ProcessSheet } from '../src/components/bottom-sheet/ProcessSheet'
import { steps } from '../src/data/config'
import { useSimulator } from '../src/simulation/useSimulator'
import type { ProcessStep } from '../src/types/machine'
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
  if (mode?.startsWith('viewer-')) return <><button onClick={() => setSource('/tests/part-fixture.gltf')}>Switch source</button><section className="simulator"><ViewerBoundary><MachineViewer selectedPartId={simulator.state.selectedPartId} onSelectPart={simulator.selectPart} url={mode === 'viewer-missing' ? '/tests/missing.gltf' : mode === 'viewer-switch' ? source : '/tests/part-fixture.gltf'} registry={mode === 'viewer-invalid' ? invalidRegistry : validRegistry} quality={mode === 'viewer-low' ? {dpr:[1,1],contactShadows:false,shadowResolution:64} : undefined}/></ViewerBoundary></section></>
  return <><p>Test fixture only — not scientific data</p><button onClick={() => setMounted(value => !value)}>{mounted ? 'Unmount' : 'Mount'}</button>
    {mounted && (mode === 'model' || mode === 'missing' ? <><div style={{width:400,height:400,background:'#333'}}><ViewerBoundary><Canvas camera={{position:[0,0,4]}}><ambientLight intensity={2}/><Suspense fallback={null}><MachineModel url={mode === 'missing' ? '/tests/missing.gltf' : '/tests/part-fixture.gltf'} parts={[{id:'test-part',nodeName:'NamedAssembly',label:'Test assembly',focus:[0,0,0]}]} onSelect={part => setSelected(part?.id ?? 'none')}/></Suspense></Canvas></ViewerBoundary></div><p id="fixture-selection">{selected}</p></> : <SheetFixture processSteps={mode === 'long' ? longFixtures : mode === 'no-process' ? [] : fixtures}/>)}
  </>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Harness/></StrictMode>)
