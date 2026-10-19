import { lazy, memo, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Box, CircleHelp, Focus, Hand, Layers3, Rotate3D, RotateCcw, ScanLine, ZoomIn, ZoomOut } from 'lucide-react'
import { MOUSE, TOUCH, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { modelUrl, parts, viewerQuality } from '../../data/config'
import type { FlowPath, MachinePart, MappingIssue, ProcessStep, ViewerMode, ViewerQuality } from '../../types/machine'
import { FlowParticles } from './FlowParticles'
const MachineModel = lazy(() => import('./MachineModel').then(module => ({ default: module.MachineModel })))
import { ViewerBoundary } from './ViewerBoundary'
import { fitModelCamera } from '../../simulation/camera'
import type { ModelBounds } from '../../simulation/camera'

const emptyModel: { loading: boolean; error: string | null; issues: MappingIssue[] } = { loading: false, error: null, issues: [] }

function ModelLoading({ onLoading }: { onLoading: (loading: boolean) => void }) {
  useEffect(() => { onLoading(true); return () => onLoading(false) }, [onLoading])
  return null
}

function ContextStatus({ onLost }: { onLost: (lost: boolean) => void }) {
  const gl = useThree(state => state.gl)
  const invalidate = useThree(state => state.invalidate)
  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => { event.preventDefault(); onLost(true) }
    const restored = () => { onLost(false); invalidate() }
    canvas.addEventListener('webglcontextlost', lost)
    canvas.addEventListener('webglcontextrestored', restored)
    return () => { canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', restored) }
  }, [gl, invalidate, onLost])
  return null
}
function Placeholder({ xray }: { xray: boolean }) {
  return <group position={[0, -0.08, 0]}>
    <mesh position={[0, 0.02, 0]}><boxGeometry args={[3.55, 0.1, 1.22]}/><meshStandardMaterial color="#666d70" metalness={0.55} roughness={0.4}/></mesh>
    {[-1.12, 0, 1.12].map(x => <group key={x} position={[x, 0.9, 0]}>
      <mesh><cylinderGeometry args={[0.37, 0.37, 1.55, 32]}/><meshStandardMaterial color={xray ? '#65cce0' : '#aeb8ba'} metalness={0.65} roughness={0.3} wireframe={xray}/></mesh>
      <mesh position={[0, 0.79, 0]}><sphereGeometry args={[0.37, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]}/><meshStandardMaterial color="#c4cdcd" metalness={0.6} roughness={0.28} wireframe={xray}/></mesh>
      <mesh position={[0, 0.15, 0.37]}><boxGeometry args={[0.09, 0.49, 0.035]}/><meshStandardMaterial color="#4c696b" roughness={0.6}/></mesh>
      
    </group>)}
    <mesh position={[0, 0.24, 0.48]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.045, 0.045, 2.35, 12]}/><meshStandardMaterial color="#88989b" metalness={0.5} roughness={0.3}/></mesh>
  </group>
}
function CameraControls({ mode, bounds, onResetReady, onControlsReady }: { mode: ViewerMode; bounds: ModelBounds | null; onResetReady: (reset: (() => void) | null) => void; onControlsReady: (controls: OrbitControlsImpl | null) => void }) {
  const controls = useRef<OrbitControlsImpl>(null)
  const aspect = useThree(state => state.size.width / Math.max(1, state.size.height))
  const invalidate = useThree(state => state.invalidate)
  const frame = useMemo(() => bounds ? fitModelCamera(bounds, aspect) : { position: new Vector3(4.1, 2.5, 5.8), target: new Vector3(0, 0.7, 0), minDistance: 2.8, maxDistance: 12 }, [bounds, aspect])
  useLayoutEffect(() => {
    const c = controls.current
    if (!c) return
    onControlsReady(c)
    const restore = () => {
      const damping = c.enableDamping
      c.enableDamping = false
      c.update()
      c.target0.copy(frame.target)
      c.position0.copy(frame.position)
      c.reset()
      c.enableDamping = damping
      invalidate()
    }
    onResetReady(restore)
    restore()
    return () => { onResetReady(null); onControlsReady(null) }
  }, [onControlsReady, onResetReady, frame, invalidate])
  return <OrbitControls ref={controls} makeDefault minDistance={frame.minDistance} maxDistance={frame.maxDistance} minPolarAngle={0.25} maxPolarAngle={Math.PI / 2 - 0.03} enablePan enableRotate={mode !== 'zoom'} enableDamping dampingFactor={0.08} mouseButtons={{ LEFT: mode === 'pan' ? MOUSE.PAN : mode === 'zoom' ? MOUSE.DOLLY : MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }} touches={{ ONE: mode === 'pan' ? TOUCH.PAN : TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}/>
}
const noActiveParts: string[] = []
const noFlows: FlowPath[] = []
export const MachineViewer = memo(function MachineViewer({ url = modelUrl, registry = parts, quality = viewerQuality, demoMode = false, activeStep, seconds = 0, flows = noFlows, selectedPartId = null, onSelectPart }: { url?: string | null; registry?: MachinePart[]; quality?: ViewerQuality; demoMode?: boolean; activeStep?: ProcessStep; seconds?:number; flows?:FlowPath[]; selectedPartId?: string | null; onSelectPart?: (id: string | null) => void }) {
  const controls = useRef<OrbitControlsImpl>(null)
  const registerControls = useCallback((value: OrbitControlsImpl | null) => { controls.current = value }, [])
  const resetRef = useRef<(() => void) | null>(null)
  const registerReset = useCallback((reset: (() => void) | null) => { resetRef.current = reset }, [])
  const [loadedBounds, setLoadedBounds] = useState<{ url: string | null; bounds: ModelBounds } | null>(null)
  const reportBounds = useCallback((bounds: ModelBounds) => setLoadedBounds({ url, bounds }), [url])
  const [mode, setMode] = useState<ViewerMode>('rotate')
  const [xray, setXray] = useState(false)
  const [showParts, setShowParts] = useState(false)
  const selected = registry.find(part => part.id === selectedPartId)
  const setSelected = useCallback((part: MachinePart | null) => onSelectPart?.(part?.id ?? null), [onSelectPart])
  const [contextLost, setContextLost] = useState(false)
  const [modelState, setModelState] = useState({ url, ...emptyModel })
  const { loading, error: modelError, issues: mappingIssues } = modelState.url === url ? modelState : emptyModel
  const bounds = !modelError && loadedBounds?.url === url ? loadedBounds.bounds : null
  const setLoading = useCallback((loading: boolean) => {
    if (loading) { setSelected(null); setXray(false) }
    setModelState(previous => ({ ...(previous.url === url && !loading ? previous : emptyModel), url, loading }))
  }, [url, setSelected])
  const ready = useCallback((issues: MappingIssue[]) => { setSelected(null); setXray(false); setModelState({ url, loading: false, error: null, issues }) }, [url, setSelected])
  const failed = useCallback((error: Error) => { setSelected(null); setXray(false); setModelState({ url, loading: false, error: error.message, issues: [] }) }, [url, setSelected])
  function reset() {
    resetRef.current?.()
  }
  function zoom(factor: number) {
    const c = controls.current
    if (!c) return
    const distance = Math.max(c.minDistance, Math.min(c.maxDistance, c.getDistance() * factor))
    c.object.position.sub(c.target).setLength(distance).add(c.target)
    c.update()
  }
  const actions = [
    { name: 'Rotate', label: 'หมุนมุมมอง', icon: Rotate3D, active: mode === 'rotate', click: () => setMode('rotate') },
    { name: 'Zoom', label: 'ซูม: ลากด้วยเมาส์ หรือใช้สองนิ้วบนจอสัมผัส', icon: ZoomIn, active: mode === 'zoom', click: () => setMode('zoom') },
    { name: 'Pan', label: 'เลื่อนมุมมอง', icon: Hand, active: mode === 'pan', click: () => setMode('pan') },
    { name: 'X-Ray', label: 'X-Ray ตัวอย่างโครงร่าง — ยังไม่ใช่ Smart X-Ray จริง', icon: ScanLine, active: xray, click: () => setXray(value => !value), disabled: !!url },
    { name: 'Normal', label: 'แสดงผิวปกติ', icon: Box, active: !xray, click: () => setXray(false) },
    { name: 'Parts', label: 'รายการชิ้นส่วน', icon: Layers3, active: showParts, click: () => setShowParts(value => !value) },
  ]
  return <>
    <div className="canvas-wrap" data-model-state={!url ? 'placeholder' : modelError ? 'error' : bounds && !loading ? 'ready' : 'loading'} data-active-step={demoMode ? activeStep?.id : undefined} data-active-parts={demoMode && activeStep?.developmentStatus!=='pending' ? activeStep?.activeParts.join(',') : undefined} aria-label="โมเดลเครื่อง 3D ใช้แถบเครื่องมือปรับมุมมอง">
      <Canvas frameloop="demand" dpr={quality.dpr} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }} fallback={<div className="canvas-fallback">อุปกรณ์นี้ไม่รองรับ WebGL · ยังใช้งานแผงข้อมูลได้</div>}>
        <ContextStatus onLost={setContextLost}/>
        <PerspectiveCamera makeDefault position={[4.1, 2.5, 5.8]} fov={35} near={0.05} far={1000}/>
        <ambientLight intensity={1.3}/><directionalLight position={[-3, 6, 4]} intensity={3.2}/><directionalLight position={[4, 2, -3]} intensity={2} color="#b6d9e1"/>
        {url ? <ViewerBoundary key={url} fallback={<Placeholder xray={false}/>} onError={failed}><Suspense fallback={<ModelLoading onLoading={setLoading}/>}><MachineModel url={url} parts={registry} activePartIds={demoMode && activeStep?.developmentStatus !== 'pending' ? activeStep?.activeParts ?? noActiveParts : noActiveParts} selectedPartId={selectedPartId} onSelect={setSelected} onReady={ready} onBounds={reportBounds}/></Suspense></ViewerBoundary> : <Placeholder xray={xray}/>}
        {bounds && !contextLost && <FlowParticles paths={flows} seconds={demoMode?seconds:-1}/>}
        {quality.contactShadows && !loading && !contextLost && <ContactShadows key={`${url ?? 'placeholder'}:${modelError ? 'fallback' : 'model'}:${bounds ? 'fitted' : 'initial'}`} position={[0, bounds ? bounds.min[1] - 0.02 : -0.1, 0]} opacity={0.25} scale={bounds ? Math.max(bounds.max[0] - bounds.min[0], bounds.max[2] - bounds.min[2]) * 1.1 : 12} blur={2.5} far={bounds ? bounds.max[1] - bounds.min[1] + 1 : 5} resolution={quality.shadowResolution} frames={1}/>}
        <CameraControls mode={mode} bounds={bounds} onResetReady={registerReset} onControlsReady={registerControls}/>
      </Canvas>
    </div>
    {(!url || modelError) && <div className="placeholder-callout"><span>MODEL PLACEHOLDER</span><small>รอโมเดล DMR ฉบับยืนยัน</small></div>}
    {loading && <div className="model-notice" role="status">กำลังโหลดโมเดล GLB…</div>}
    {modelError && <div className="model-notice" role="alert"><strong>{modelError.includes('404') ? 'ไม่พบไฟล์โมเดล GLB' : 'โหลดโมเดล GLB ไม่สำเร็จ'}</strong><p>แสดงโมเดลตัวอย่างแทน กรุณาตรวจไฟล์ {url}</p><details><summary>รายละเอียดข้อผิดพลาด</summary>{modelError}</details></div>}
    {!modelError && mappingIssues.length > 0 && <div className="model-notice" role="alert"><strong>ข้อมูลชิ้นส่วนจับคู่กับโมเดลไม่ครบ</strong><p>ยังสำรวจโมเดลได้ แต่ชิ้นส่วนต่อไปนี้ต้องแก้ nodeName</p><ul>{mappingIssues.map((issue, i) => <li key={i}>{issue.partId}: ไม่พบ {issue.nodeName}</li>)}</ul></div>}
    <div className="viewer-controls"><aside className="viewer-toolbar" aria-label="เครื่องมือมุมมอง 3D">{actions.filter(action => ['Rotate', 'Zoom', 'X-Ray'].includes(action.name)).map(action => <button key={action.name} title={action.label} aria-label={action.label} aria-pressed={action.active} disabled={action.disabled || contextLost} className={action.active ? 'active' : ''} onClick={action.click}><action.icon size={23} strokeWidth={1.5}/><span>{action.name}</span></button>)}<button title="คืนมุมมองเริ่มต้น" aria-label="คืนมุมมองเริ่มต้น" disabled={contextLost} onClick={reset}><RotateCcw size={23} strokeWidth={1.5}/><span>Reset</span></button></aside>
    <details className="viewer-more" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}><summary>เพิ่มเติม</summary><div>{actions.filter(action => ['Pan', 'Normal', 'Parts'].includes(action.name)).map(action => <button key={action.name} aria-label={action.label} aria-pressed={action.active} disabled={contextLost} onClick={event => { action.click(); const menu = event.currentTarget.closest('details'); if (menu) { menu.open = false; menu.querySelector('summary')?.focus() } }}><action.icon size={19}/><span>{action.name}</span></button>)}</div></details>
    <div className="zoom-controls"><button disabled={contextLost} aria-label="ซูมเข้า" onClick={() => zoom(0.85)}><ZoomIn size={17}/></button><span/><button disabled={contextLost} aria-label="ซูมออก" onClick={() => zoom(1.18)}><ZoomOut size={17}/></button><button aria-label="คืนมุมมอง" disabled={contextLost} onClick={reset}><Focus size={17}/></button></div>
    </div>
    {contextLost && <div className="context-lost" role="alert">การแสดงผล 3D หยุดชั่วคราว · กำลังรอ WebGL กลับมาทำงาน</div>}
    {xray && <div className="xray-note"><ScanLine size={14}/> โครงร่างตัวอย่าง · Smart X-Ray รอโมเดลจริง</div>}
    {showParts && <div className="parts-panel"><h3>Machine components</h3>{demoMode && activeStep && <p>ขั้นตอน: {activeStep.title}</p>}{registry.length ? registry.map(part => <button key={part.id} aria-pressed={selectedPartId === part.id} aria-current={demoMode && activeStep?.activeParts.includes(part.id) ? 'true' : undefined} disabled={contextLost || loading || Boolean(modelError) || mappingIssues.some(issue => issue.partId === part.id)} onClick={() => { setSelected(part); if(part.focus && controls.current) { controls.current.target.set(...part.focus); controls.current.update() } }}>{part.label}</button>) : <p><CircleHelp size={16}/> รอโมเดลและข้อมูลชิ้นส่วนฉบับยืนยัน</p>}</div>}
    {selected && <div className="selected-part" role="status">{selected.label}</div>}
  </>
})

