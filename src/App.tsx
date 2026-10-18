import { lazy, Suspense, useRef, useState } from 'react'
import { ArrowRight, Recycle, Menu, X } from 'lucide-react'
const MachineViewer = lazy(() => import('./components/viewer/MachineViewer').then(module => ({ default: module.MachineViewer })))
import { ProcessSheet } from './components/bottom-sheet/ProcessSheet'
import { ViewerBoundary } from './components/viewer/ViewerBoundary'
import { ResearchSection } from './components/research/ResearchSection'
import { dataIssues, steps } from './data/config'
import { useSimulator } from './simulation/useSimulator'
import './styles/app.css'

const links = [['Overview', '#overview'], ['Research', '#research'], ['Technology', '#technology']]

export default function App() {
  const [menu, setMenu] = useState(false)
  const simulator = useSimulator(steps)
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
      <button ref={menuButton} className="menu-toggle" aria-controls="main-navigation" aria-label={menu ? 'ปิดเมนู' : 'เปิดเมนู'} aria-expanded={menu} onClick={() => setMenu(value => !value)}>{menu ? <X/> : <Menu/>}</button>
    </header>
    <main id="overview">
      {dataIssues.length > 0 && <aside className="data-notice" role="alert"><strong>ข้อมูลบางส่วนยังไม่พร้อมใช้งาน</strong><p>ส่วนอื่นของเว็บไซต์ยังใช้งานได้ กรุณาตรวจข้อมูลต่อไปนี้</p><ul>{dataIssues.map((issue, i) => <li key={i}>{issue}</li>)}</ul></aside>}
      <section ref={stage} id="simulator" className="simulator" tabIndex={-1} aria-label="พื้นที่สำรวจเครื่อง DMR" data-demo-mode={simulator.state.demoMode}>
        <div className="viewer-heading"><h1>DEMETER ReFeed</h1><h2>Turn Waste Into <br/>New Value</h2><button type="button" className="primary hero-cta" aria-pressed={simulator.state.demoMode} onClick={enterDemo}>Start Demo <ArrowRight size={21}/></button></div>
        <ViewerBoundary><Suspense fallback={<div className="canvas-wrap canvas-fallback">กำลังเตรียมพื้นที่สามมิติ…</div>}><MachineViewer visual={simulator.visual} demoMode={simulator.state.demoMode} activeStep={simulator.step} selectedPartId={simulator.state.selectedPartId} onSelectPart={simulator.selectPart}/></Suspense></ViewerBoundary>
      </section>
      <ProcessSheet simulator={simulator}/>
      <section id="technology" className="below-section"><div><span className="section-label">BUILT FOR EXPLORATION</span><h2>พื้นที่สำหรับเข้าใจ<br/>ทุกส่วนของกระบวนการ.</h2></div><div><p>โครงสร้างพร้อมเชื่อมโมเดลสามมิติ ข้อมูลชิ้นส่วน และขั้นตอนที่ผ่านการยืนยัน เพื่ออธิบายเครื่อง DMR อย่างชัดเจน</p><span className="subtle-badge">โมเดลจริง · Smart X-Ray · Flow paths — รอข้อมูล</span></div></section>
      <ResearchSection/>
      <footer id="about"><a className="footer-brand" href="#overview"><Recycle size={21}/> DEMETER ReFeed</a><p>Interactive 3D Process Simulator · Phase 1.1 Foundation</p><span>DESIGNED TO UNDERSTAND.</span></footer>
    </main>
  </>
}
