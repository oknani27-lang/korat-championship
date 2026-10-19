import { lazy, Suspense, useRef, useState } from 'react'
import { ArrowRight, Recycle, Menu, X } from 'lucide-react'
const MachineViewer = lazy(() => import('./components/viewer/MachineViewer').then(module => ({ default: module.MachineViewer })))
import { ProcessSheet } from './components/bottom-sheet/ProcessSheet'
import { ProcessDetails } from './components/bottom-sheet/ProcessDetails'
import { ViewerBoundary } from './components/viewer/ViewerBoundary'
import { ResearchSection } from './components/research/ResearchSection'
import { dataIssues, flowPaths, steps } from './data/config'
import { FULL_CLOCK } from './simulation/simulator'
import { useSimulator } from './simulation/useSimulator'
import './styles/app.css'

const links = [['Overview', '#overview'], ['Research', '#research'], ['Technology', '#technology']]

export default function App() {
  const [menu, setMenu] = useState(false)
  const simulator = useSimulator(steps, FULL_CLOCK)
  const stage = useRef<HTMLElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  function enterDemo() {
    simulator.dispatch({ type: 'enter' })
    stage.current?.focus({ preventScroll: true })
  }
  return <>
    <a className="skip-link" href="#simulator">ข้ามไปยัง Simulator</a>
    <header className="navbar" onKeyDown={event => { if (event.key === 'Escape' && menu) { setMenu(false); menuButton.current?.focus() } }}>
      <a className="brand" href="#overview" aria-label="DEMETER ReFeed หน้าหลัก"><span className="brand-mark"><Recycle size={36} strokeWidth={2}/></span><span><strong>DEMETER</strong><small>ReFeed</small></span></a>
      <nav id="main-navigation" aria-label="เมนูหลัก" className={menu ? 'navigation open' : 'navigation'}>{links.map(([label, href]) => <a key={href} href={href} onClick={() => setMenu(false)}>{label}</a>)}</nav>
      <button type="button" className="primary nav-cta" aria-pressed={simulator.state.demoMode} onClick={enterDemo}>Start Demo <ArrowRight size={19}/></button>
      <button ref={menuButton} className="menu-toggle" aria-controls="main-navigation" aria-label={menu ? 'ปิดเมนู' : 'เปิดเมนู'} aria-expanded={menu} onClick={() => setMenu(value => !value)}>{menu ? <X/> : <Menu/>}</button>
    </header>
    <main id="overview">
      {dataIssues.length > 0 && <aside className="data-notice" role="alert"><strong>ข้อมูลบางส่วนยังไม่พร้อมใช้งาน</strong><p>ส่วนอื่นของเว็บไซต์ยังใช้งานได้ กรุณาตรวจข้อมูลต่อไปนี้</p><ul>{dataIssues.map((issue, i) => <li key={i}>{issue}</li>)}</ul></aside>}
      <div className="stage-layout"><section ref={stage} id="simulator" className="simulator" tabIndex={-1} aria-label="พื้นที่สำรวจเครื่อง DMR" data-demo-mode={simulator.state.demoMode}>
        <h1 className="sr-only">สำรวจเครื่อง DMR</h1>
        <ViewerBoundary><Suspense fallback={<div className="canvas-wrap canvas-fallback">กำลังเตรียมพื้นที่สามมิติ…</div>}><MachineViewer demoMode={simulator.state.demoMode} activeStep={simulator.step} seconds={simulator.state.playheadSeconds} flows={flowPaths} selectedPartId={simulator.state.selectedPartId} onSelectPart={simulator.selectPart}/></Suspense></ViewerBoundary>
      </section>
      <ProcessDetails simulator={simulator}/>
      </div>
      <ProcessSheet simulator={simulator} showDetails={false}/>
      <section id="technology" className="below-section"><div><span className="section-label">BUILT FOR EXPLORATION</span><h2>พื้นที่สำหรับเข้าใจ<br/>ทุกส่วนของกระบวนการ.</h2></div><div><p>สำรวจโมเดลเครื่อง DMR พร้อมคำอธิบายและสูตรประกอบแต่ละขั้นตอน</p><span className="subtle-badge">นำเสนออัตโนมัติ 60 วินาที · ภาพประกอบครบ 60 วินาที · แปรรูปเป็นตัวอย่าง · ไม่ใช่เวลาบำบัดจริง</span></div></section>
      <ResearchSection/>
      <footer id="about"><a className="footer-brand" href="#overview"><Recycle size={21}/> DEMETER ReFeed</a><p>Interactive 3D Process Simulator · Phase 1.1 Foundation</p><span>DESIGNED TO UNDERSTAND.</span></footer>
    </main>
  </>
}
