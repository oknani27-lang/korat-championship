import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, PerspectiveCamera } from '@react-three/drei'
import { Box, CircleHelp, Focus, Hand, Layers3, Rotate3D, RotateCcw, ScanLine, ZoomIn, ZoomOut } from 'lucide-react'
import { Vector3 } from 'three'

import { flowPaths, modelTransform, modelUrl, parts, viewerQuality } from '../../data/config'
import type { FlowPath, MachinePart, MappingIssue, ModelTransform, ProcessStep, ProcessVisualState, ViewerMode, ViewerQuality } from '../../types/machine'
const MachineModel = lazy(() => import('./MachineModel').then(module => ({ default: module.MachineModel })))
import { ViewerBoundary } from './ViewerBoundary'
import { CameraMotion } from './CameraMotion'
import type { CameraMotionHandle } from './CameraMotion'
import type { ModelInstance } from '../../simulation/model'
import { flowProgress, inactiveVisuals } from '../../simulation/visual-state'
const FlowPaths = lazy(() => import('./FlowPaths').then(module => ({ default: module.FlowPaths })))

const emptyModel: { loading: boolean; error: string | null; issues: MappingIssue[] } = { loading: false, error: null, issues: [] }

// Keep Drei's one-frame shadow counter and render targets stable during timeline updates.
const StaticShadows = memo(function StaticShadows({ revision, enabled, resolution }: { revision: string; enabled: boolean; resolution: number }) {
  return <ContactShadows userData={{ revision }} visible={enabled} position={[0, -0.1, 0]} opacity={0.35} scale={12} blur={2.5} far={5} resolution={resolution} frames={enabled ? 1 : 0}/>
})

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
export const MachineViewer = memo(function MachineViewer({ url = modelUrl, registry = parts, quality = viewerQuality, demoMode = false, activeStep, selectedPartId = null, onSelectPart, visual = inactiveVisuals, paths = flowPaths, transform = modelTransform }: { url?: string | null; registry?: MachinePart[]; quality?: ViewerQuality; demoMode?: boolean; activeStep?: ProcessStep; selectedPartId?: string | null; onSelectPart?: (id: string | null) => void; visual?: ProcessVisualState; paths?: FlowPath[]; transform?: ModelTransform }) {

  const [mode, setMode] = useState<ViewerMode>('rotate')
  const cameraMotion = useRef<CameraMotionHandle>(null)
  const instance = useRef<ModelInstance | null>(null)
  const receiveInstance = useCallback((value: ModelInstance | null) => { instance.current = value }, [])
  const [materialMode, setMaterialMode] = useState<{ stepId?: string; mode: 'auto' | 'normal' | 'xray' }>({ mode: 'auto' })
  if (materialMode.stepId !== activeStep?.id) setMaterialMode({ stepId: activeStep?.id, mode: 'auto' })
  const currentMaterialMode = materialMode.stepId === activeStep?.id ? materialMode.mode : 'auto'
  const manualParts = useMemo(() => selectedPartId ? [selectedPartId] : visual.activePartIds, [selectedPartId, visual.activePartIds])
  const xray = currentMaterialMode === 'xray' || (currentMaterialMode === 'auto' && visual.xrayPartIds.length > 0)
  const effectiveVisual = useMemo(() => currentMaterialMode === 'normal' ? { ...visual, activePartIds: [], xrayPartIds: [] } : currentMaterialMode === 'xray' ? { ...visual, xrayPartIds: [...new Set([...visual.xrayPartIds, ...manualParts])] } : visual, [currentMaterialMode, visual, manualParts])
  const [showParts, setShowParts] = useState(false)
  const selected = registry.find(part => part.id === selectedPartId)
  const setSelected = useCallback((part: MachinePart | null) => onSelectPart?.(part?.id ?? null), [onSelectPart])
  const [contextLost, setContextLost] = useState(false)
  const [modelState, setModelState] = useState({ url, ...emptyModel })
  const { loading, error: modelError, issues: mappingIssues } = modelState.url === url ? modelState : emptyModel
  const setLoading = useCallback((loading: boolean) => {
    if (loading) { setSelected(null); setMaterialMode(previous => ({ ...previous, mode: 'auto' })) }
    setModelState(previous => ({ ...(previous.url === url && !loading ? previous : emptyModel), url, loading }))
  }, [url, setSelected])
  const ready = useCallback((issues: MappingIssue[]) => { setSelected(null); setMaterialMode(previous => ({ ...previous, mode: 'auto' })); setModelState({ url, loading: false, error: null, issues }) }, [url, setSelected])
  const failed = useCallback((error: Error) => { setSelected(null); setMaterialMode(previous => ({ ...previous, mode: 'auto' })); setModelState({ url, loading: false, error: error.message, issues: [] }) }, [url, setSelected])
  useEffect(() => {
    if (selectedPartId && !loading && !modelError) {
      const box = instance.current?.partBounds(selectedPartId)
      if (box && !box.isEmpty()) { const focus = registry.find(part => part.id === selectedPartId)?.focus; if (focus) box.translate(new Vector3(...focus).sub(box.getCenter(new Vector3()))); cameraMotion.current?.focus(box) }
    }
    return cameraMotion.current?.cancel
  }, [selectedPartId, loading, modelError, url, registry])
  useEffect(() => {
    if (demoMode && activeStep?.cameraFocus && !loading && !modelError && instance.current) cameraMotion.current?.focus(activeStep.cameraFocus)
    return cameraMotion.current?.cancel
  }, [demoMode, activeStep?.id, activeStep?.cameraFocus, loading, modelError, url])
  useEffect(() => { if (contextLost) cameraMotion.current?.cancel() }, [contextLost])
  function reset() { setSelected(null); cameraMotion.current?.reset() }
  function zoom(factor: number) { cameraMotion.current?.zoom(factor) }
  const actions = [
    { name: 'Rotate', label: 'หมุนมุมมอง', icon: Rotate3D, active: mode === 'rotate', click: () => setMode('rotate') },
    { name: 'Zoom', label: 'ซูม: ลากด้วยเมาส์ หรือใช้สองนิ้วบนจอสัมผัส', icon: ZoomIn, active: mode === 'zoom', click: () => setMode('zoom') },
    { name: 'Pan', label: 'เลื่อนมุมมอง', icon: Hand, active: mode === 'pan', click: () => setMode('pan') },
    { name: 'X-Ray', label: url ? 'X-Ray ชิ้นส่วนที่เลือก' : 'X-Ray ตัวอย่างโครงร่าง — ยังไม่ใช่ Smart X-Ray จริง', icon: ScanLine, active: xray, click: () => setMaterialMode({ stepId: activeStep?.id, mode: xray ? 'normal' : 'xray' }), disabled: !!url && (loading || !!modelError || (!manualParts.length && !visual.xrayPartIds.length)) },
    { name: 'Normal', label: 'แสดงผิวปกติ', icon: Box, active: !xray, click: () => setMaterialMode({ stepId: activeStep?.id, mode: 'normal' }) },
    { name: 'Parts', label: 'รายการชิ้นส่วน', icon: Layers3, active: showParts, click: () => setShowParts(value => !value) },
  ]
  return <>
    <div className="canvas-wrap" data-phase-ids={visual.phaseIds.join(',')} data-active-step={demoMode ? activeStep?.id : undefined} data-active-parts={demoMode ? activeStep?.activeParts.join(',') : undefined} aria-label="โมเดลตัวอย่าง 3D ใช้แถบเครื่องมือปรับมุมมอง">
      <Canvas onPointerMissed={() => setSelected(null)} frameloop="demand" dpr={quality.dpr} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }} fallback={<div className="canvas-fallback">อุปกรณ์นี้ไม่รองรับ WebGL · ยังใช้งานแผงข้อมูลได้</div>}>
        <ContextStatus onLost={setContextLost}/>
        <PerspectiveCamera makeDefault position={[4.1, 2.5, 5.8]} fov={35}/>
        <ambientLight intensity={1.3}/><directionalLight position={[-3, 6, 4]} intensity={3.2}/><directionalLight position={[4, 2, -3]} intensity={2} color="#b6d9e1"/>
        {url ? <ViewerBoundary key={url} fallback={<Placeholder xray={false}/>} onError={failed}><Suspense fallback={<ModelLoading onLoading={setLoading}/>}><MachineModel url={url} parts={registry} onSelect={setSelected} onReady={ready} onInstance={receiveInstance} transform={transform} selectedPartId={selectedPartId} visual={effectiveVisual}/></Suspense></ViewerBoundary> : <Placeholder xray={xray}/>}
        {quality.contactShadows && <StaticShadows revision={modelError ? 'fallback' : url ?? 'placeholder'} enabled={!loading && !contextLost} resolution={quality.shadowResolution}/>}

        <CameraMotion mode={mode} handle={cameraMotion}/>
        {url && !loading && !modelError && paths.some(path => effectiveVisual.flowPathIds.includes(path.id) && flowProgress(path, effectiveVisual.progress) !== null) && <Suspense fallback={null}><FlowPaths paths={paths} visual={effectiveVisual}/></Suspense>}
      </Canvas>
    </div>
    {(!url || modelError) && <div className="placeholder-callout"><span>MODEL PLACEHOLDER</span><small>รอโมเดล DMR ฉบับยืนยัน</small></div>}
    {loading && <div className="model-notice" role="status">กำลังโหลดโมเดล GLB…</div>}
    {modelError && <div className="model-notice" role="alert"><strong>{modelError.includes('404') ? 'ไม่พบไฟล์โมเดล GLB' : 'โหลดโมเดล GLB ไม่สำเร็จ'}</strong><p>แสดงโมเดลตัวอย่างแทน กรุณาตรวจไฟล์ {url}</p><details><summary>รายละเอียดข้อผิดพลาด</summary>{modelError}</details></div>}
    {!modelError && mappingIssues.length > 0 && <div className="model-notice" role="alert"><strong>ข้อมูลชิ้นส่วนจับคู่กับโมเดลไม่ครบ</strong><p>ยังสำรวจโมเดลได้ แต่ชิ้นส่วนต่อไปนี้ต้องแก้ nodeName</p><ul>{mappingIssues.map((issue, i) => <li key={i}>{issue.partId}: {issue.reason === 'ambiguous' ? 'ชื่อซ้ำ' : issue.reason === 'conflict' ? 'X-Ray อ้างอิงชิ้นส่วนอื่น' : 'ไม่พบ'} {issue.nodeName}</li>)}</ul></div>}
    <aside className="viewer-toolbar" aria-label="เครื่องมือมุมมอง 3D">{actions.filter(action => ['Rotate', 'Zoom', 'X-Ray'].includes(action.name)).map(action => <button key={action.name} title={action.label} aria-label={action.label} aria-pressed={action.active} disabled={action.disabled || contextLost} className={action.active ? 'active' : ''} onClick={action.click}><action.icon size={23} strokeWidth={1.5}/><span>{action.name}</span></button>)}<button title="คืนมุมมองเริ่มต้น" aria-label="คืนมุมมองเริ่มต้น" disabled={contextLost} onClick={reset}><RotateCcw size={23} strokeWidth={1.5}/><span>Reset</span></button></aside>
    <details className="viewer-more" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}><summary>เพิ่มเติม</summary><div>{actions.filter(action => ['Pan', 'Normal', 'Parts'].includes(action.name)).map(action => <button key={action.name} aria-label={action.label} aria-pressed={action.active} disabled={contextLost} onClick={event => { action.click(); const menu = event.currentTarget.closest('details'); if (menu) { menu.open = false; menu.querySelector('summary')?.focus() } }}><action.icon size={19}/><span>{action.name}</span></button>)}</div></details>
    <div className="zoom-controls"><button disabled={contextLost} aria-label="ซูมเข้า" onClick={() => zoom(0.85)}><ZoomIn size={17}/></button><span/><button disabled={contextLost} aria-label="ซูมออก" onClick={() => zoom(1.18)}><ZoomOut size={17}/></button><button aria-label="คืนมุมมอง" disabled={contextLost} onClick={reset}><Focus size={17}/></button></div>
    {contextLost && <div className="context-lost" role="alert">การแสดงผล 3D หยุดชั่วคราว · กำลังรอ WebGL กลับมาทำงาน</div>}
    {xray && <div className="xray-note"><ScanLine size={14}/> {url ? 'X-Ray ชิ้นส่วน · การแสดงผลตัวอย่าง' : 'โครงร่างตัวอย่าง · Smart X-Ray รอโมเดลจริง'}</div>}
    {showParts && <div className="parts-panel"><h3>Machine components</h3>{selectedPartId && <button onClick={() => setSelected(null)}>ล้างการเลือกชิ้นส่วน</button>}{demoMode && activeStep && <p>ขั้นตอน: {activeStep.title}</p>}{registry.length ? registry.map(part => <button key={part.id} aria-pressed={selectedPartId === part.id} aria-current={demoMode && activeStep?.activeParts.includes(part.id) ? 'true' : undefined} disabled={contextLost || loading || Boolean(modelError) || mappingIssues.some(issue => issue.partId === part.id)} onClick={() => { setSelected(selectedPartId === part.id ? null : part) }}>{part.label}</button>) : <p><CircleHelp size={16}/> รอโมเดลและข้อมูลชิ้นส่วนฉบับยืนยัน</p>}</div>}
    {selected && <div className="selected-part" role="status">{selected.label}</div>}
  </>
})






