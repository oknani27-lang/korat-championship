import type { CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from 'lucide-react'
import type { Simulator } from '../../simulation/useSimulator'
import { ProcessInset } from './ProcessInset'
import { ProcessChemistry } from './ProcessChemistry'

export function ProcessSheet({ simulator, showDetails = true }: { simulator: Simulator; showDetails?: boolean }) {
  const { state, step, processSteps, clock, dispatch } = simulator
  const { playheadSeconds, playing: isPlaying, demoMode } = state
  const progress = playheadSeconds / clock.durationSeconds
  const index = processSteps.findIndex(s => s.id === step?.id)
  const prototype = clock.playableUntilSeconds < clock.durationSeconds
  const pending = step?.developmentStatus === 'pending' || playheadSeconds > clock.playableUntilSeconds
  const completed = prototype && !pending && playheadSeconds === clock.playableUntilSeconds
  const finished=playheadSeconds>=clock.durationSeconds
  const hasPrototypeVisuals=processSteps.some(s=>s.id==='conditioning'&&s.developmentStatus==='prototype')
  const enabled = demoMode && Boolean(step)
  function goToStep(next: number) { const step = processSteps[next]; if (step) dispatch({ type: 'step', id: step.id }) }
  if (!step) return <section id="results" className="bottom-sheet missing-process" aria-label="ข้อมูลกระบวนการยังไม่พร้อม"><h2>รอข้อมูลกระบวนการ</h2><p role="status">ไม่พบข้อมูลขั้นตอนที่ใช้งานได้ กรุณาเพิ่มหรือตรวจ process-steps.json ก่อนใช้ไทม์ไลน์</p></section>
  return <section id="results" className={`bottom-sheet expanded ${showDetails?'':'summary-sheet'}`} aria-label="ข้อมูลกระบวนการและผลลัพธ์" data-playhead={playheadSeconds.toFixed(3)} data-playing={isPlaying}>
    <span className="sr-only" role="status">{demoMode ? `Demo Mode: ${step.title}` : 'พร้อมเริ่ม Demo'}</span>
    <div className="sheet-handle" aria-hidden="true"><span/></div>
    <div className="sheet-top"><div className="step-kicker"><span className="green-dot"/> {demoMode ? 'DEMO MODE' : 'PROCESS EXPLORER'} <span className="muted">/ {String(index + 1).padStart(2, '0')} OF {String(processSteps.length).padStart(2, '0')}</span></div></div>
    <div id="sheet-content" className="sheet-content">
      <div className="sheet-columns">
        <article><span className="section-label">STEP {String(index + 1).padStart(2, '0')}</span><h2 id="process-title">{step.title}</h2><h3>{step.subtitle}</h3>{step.formulas.length > 0 && <p>{step.description}</p>}<div className="step-dots">{processSteps.map((s, i) => <button key={s.id} className={i === index ? 'active' : ''} aria-label={`ไปขั้นตอน ${i + 1}: ${s.title}`} aria-current={i === index ? 'step' : undefined} disabled={!enabled} onClick={() => goToStep(i)}/>)}</div></article>
        {showDetails&&<ProcessChemistry step={step}/>}
        <article className="outputs"><span className="section-label">OUTPUTS</span><h3>สารที่ได้ / ผลลัพธ์</h3>{step.outputs.length ? <ul>{step.outputs.map(output => <li key={output}>{output}</li>)}</ul> : <div className="pending-output"><span className="status-ring"/>รอข้อมูลสารที่ได้</div>}{!step.outputs.length && <p className="small-note">ยังไม่มีผลลัพธ์เชิงวิทยาศาสตร์ในตัวอย่างนี้</p>}</article>
      </div>
    </div>
    <div className="process-controls"><div className="timeline"><button className="play-button" aria-label={isPlaying ? 'หยุดการนำเสนอ' : 'เล่นการนำเสนอ'} title={isPlaying ? 'หยุดชั่วคราว' : 'เล่นต่อ'} disabled={!enabled} onClick={() => dispatch({ type: 'togglePlayback' })}>{isPlaying ? <Pause size={17}/> : <Play size={17}/>}</button><button className="restart-button" aria-label="เริ่มไทม์ไลน์ใหม่" disabled={!enabled} onClick={() => dispatch({ type: 'restart' })}><RotateCcw size={16}/></button><div className="timeline-label"><strong>{isPlaying ? 'กำลังนำเสนออัตโนมัติ' : finished ? 'จบการนำเสนอ' : 'รอบนำเสนอ 60 วินาที'}</strong><span>{demoMode ? 'ลากเพื่อดู · กดเล่นเพื่อเล่นต่อ' : 'กด Start Demo เพื่อเริ่ม'}</span></div><input aria-label="เวลาการนำเสนอ วินาที" aria-valuetext={`${playheadSeconds.toFixed(1)} จาก ${clock.durationSeconds} วินาที${pending ? ' รอพัฒนา' : ''}`} type="range" min="0" max={clock.durationSeconds} step="0.01" value={playheadSeconds} disabled={!enabled} onChange={event => dispatch({ type: 'scrub', seconds: Number(event.target.value) })} style={{ '--progress': `${progress * 100}%` } as CSSProperties}/><output aria-live="off">{playheadSeconds.toFixed(1)}<span>/ {clock.durationSeconds} s</span></output></div><div className="step-buttons"><button className="secondary" disabled={!enabled || index <= 0} onClick={() => dispatch({ type: 'navigate', direction: -1 })}><ArrowLeft size={15}/> ก่อนหน้า</button><button className="primary" disabled={!enabled || index >= processSteps.length - 1} onClick={() => dispatch({ type: 'navigate', direction: 1 })}>ถัดไป <ArrowRight size={15}/></button></div></div>
    {demoMode && (completed || pending || finished) && <p className="prototype-status" role="status">{finished ? 'จบการนำเสนอ 60 วินาที' : completed ? 'จบช่วงต้นแบบ · แยกสารที่ F101 แล้ว' : 'กำลังอธิบายขั้นตอนตามแผน · ภาพการไหลขั้นนี้ยังรอพัฒนา'}</p>}
    {showDetails && demoMode && hasPrototypeVisuals && !pending && <ProcessInset seconds={playheadSeconds} pending={pending}/>}
  </section>
}



