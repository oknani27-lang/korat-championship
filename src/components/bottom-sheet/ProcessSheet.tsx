import type { CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Pause, Play, RotateCcw } from 'lucide-react'
import type { Simulator } from '../../simulation/useSimulator'

export function ProcessSheet({ simulator }: { simulator: Simulator }) {
  const { state, step, processSteps, dispatch } = simulator
  const { timelineProgress: progress, sheetExpanded: expanded, playing: isPlaying, demoMode } = state
  const index = processSteps.findIndex(step => step.id === state.currentStepId)
  const enabled = demoMode && Boolean(step)
  function onToggle() { dispatch({ type: 'toggleSheet' }) }
  function goToStep(next: number) { const step = processSteps[next]; if (step) dispatch({ type: 'step', id: step.id }) }
  if (!step) return <section id="results" className="bottom-sheet missing-process" aria-label="ข้อมูลกระบวนการยังไม่พร้อม"><h2>รอข้อมูลกระบวนการ</h2><p role="status">ไม่พบข้อมูลขั้นตอนที่ใช้งานได้ กรุณาเพิ่มหรือตรวจ process-steps.json ก่อนใช้ไทม์ไลน์</p></section>
  return <section id="results" className={`bottom-sheet ${expanded ? 'expanded' : 'collapsed'}`} aria-label="ข้อมูลกระบวนการและผลลัพธ์">
    <span className="sr-only" role="status">{demoMode ? `Demo Mode: ${step.title}` : 'พร้อมเริ่ม Demo'}</span>
    <button className="sheet-handle" onClick={onToggle} aria-expanded={expanded} aria-controls="sheet-content" aria-label={expanded ? 'ย่อแผงข้อมูล' : 'ขยายแผงข้อมูล'}><span/></button>
    <div className="sheet-top"><div className="step-kicker"><span className="green-dot"/> {demoMode ? 'DEMO MODE' : 'PROCESS EXPLORER'} <span className="muted">/ {String(index + 1).padStart(2, '0')} OF {String(processSteps.length).padStart(2, '0')}</span></div><button className="sheet-toggle" onClick={onToggle} aria-expanded={expanded} aria-controls="sheet-content">{expanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียด'} {expanded ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}</button></div>
    {!expanded && <div className="compact-summary"><span className="section-label">STEP {String(index + 1).padStart(2, '0')}</span><h2 id="compact-process-title">{step.title}</h2><p>{step.subtitle}</p></div>}
    <div id="sheet-content" className="sheet-content" inert={!expanded} aria-hidden={!expanded}>
      <div className="sheet-columns">
        <article><span className="section-label">STEP {String(index + 1).padStart(2, '0')}</span><h2 id="process-title">{step.title}</h2><h3>{step.subtitle}</h3>{step.formulas.length > 0 && <p>{step.description}</p>}<div className="step-dots">{processSteps.map((s, i) => <button key={s.id} className={i === index ? 'active' : ''} aria-label={`ไปขั้นตอน ${i + 1}: ${s.title}`} aria-current={i === index ? 'step' : undefined} disabled={!enabled} onClick={() => goToStep(i)}/>)}</div></article>
        <article><span className="section-label">CHEMISTRY & PROCESS</span><h3>{step.formulas.length ? 'สูตรเคมี / กระบวนการ' : 'รายละเอียดกระบวนการ'}</h3><div className="formula-area">{step.formulas.length ? step.formulas.map((formula, i) => <div className="formula" key={i}>{formula.map((token, n) => token.kind === 'sub' ? <sub key={n}>{token.text}</sub> : token.kind === 'sup' ? <sup key={n}>{token.text}</sup> : <span key={n}>{token.text}</span>)}</div>) : <p className="process-explanation">{step.description || 'รอรายละเอียดกระบวนการฉบับยืนยัน'}</p>}</div>{!step.formulas.length && <p className="small-note">ยังไม่มีสูตรเคมีที่บันทึกสำหรับขั้นตอนนี้</p>}</article>
        <article className="outputs"><span className="section-label">OUTPUTS</span><h3>สารที่ได้ / ผลลัพธ์</h3>{step.outputs.length ? <ul>{step.outputs.map(output => <li key={output}>{output}</li>)}</ul> : <div className="pending-output"><span className="status-ring"/>รอข้อมูลสารที่ได้</div>}{!step.outputs.length && <p className="small-note">ยังไม่มีผลลัพธ์เชิงวิทยาศาสตร์ในตัวอย่างนี้</p>}</article>
      </div>
    </div>
    <div className="process-controls"><div className="timeline"><button className="play-button" aria-label={isPlaying ? 'หยุดตัวอย่าง UI' : 'เล่นตัวอย่าง UI'} disabled={!enabled} onClick={() => dispatch({ type: 'togglePlayback' })}>{isPlaying ? <Pause size={16}/> : <Play size={16}/>}</button><button className="restart-button" aria-label="เริ่มไทม์ไลน์ใหม่" disabled={!enabled} onClick={() => dispatch({ type: 'restart' })}><RotateCcw size={16}/></button><div className="timeline-label"><strong>Manual timeline</strong><span>{demoMode ? 'ตัวอย่าง UI เท่านั้น' : 'กด Start Demo เพื่อเริ่ม'}</span></div><input aria-label="ความคืบหน้าตัวอย่าง UI" type="range" min="0" max="1000" value={Math.round(progress * 1000)} disabled={!enabled} onChange={event => dispatch({ type: 'scrub', progress: Number(event.target.value) / 1000 })} style={{ '--progress': `${progress * 100}%` } as CSSProperties}/><output aria-live="off">{Math.round(progress * 100)}<span>%</span></output></div><div className="step-buttons"><button className="secondary" disabled={!enabled || index <= 0} onClick={() => dispatch({ type: 'navigate', direction: -1 })}><ArrowLeft size={15}/> ก่อนหน้า</button><button className="primary" disabled={!enabled || index >= processSteps.length - 1} onClick={() => dispatch({ type: 'navigate', direction: 1 })}>ถัดไป <ArrowRight size={15}/></button></div></div>
  </section>
}



