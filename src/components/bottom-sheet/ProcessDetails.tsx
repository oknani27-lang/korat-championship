import type { Simulator } from '../../simulation/useSimulator'
import { ProcessChemistry } from './ProcessChemistry'
import { ProcessInset } from './ProcessInset'

export function ProcessDetails({ simulator }: { simulator: Simulator }) {
  const { state, step, processSteps } = simulator
  const supported=processSteps.some(s=>s.id==='conditioning'&&s.developmentStatus==='prototype')
  return <aside className="process-details" aria-label="สูตรเคมีและภาพจำลองกระบวนการ">
    <section className="details-card"><h2 className="details-title">สูตรเคมี</h2>{step?<ProcessChemistry step={step}/>:<p>รอข้อมูลกระบวนการ</p>}</section>
    <section className="details-card"><h2 className="details-title">จำลองกระบวนการ</h2>
      {state.demoMode&&step&&supported&&step.developmentStatus!=='pending'?<ProcessInset seconds={state.playheadSeconds}/>:<p className="simulation-placeholder">{!state.demoMode?'กด Start Demo เพื่อเริ่มภาพจำลองตามขั้นตอน':!step?'รอข้อมูลกระบวนการ':'ภาพจำลองขั้นนี้ยังรอพัฒนา · คำอธิบายและสูตรยังติดตามเวลาเดียวกัน'}</p>}
    </section>
  </aside>
}
