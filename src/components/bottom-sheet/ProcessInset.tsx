import { schematicFrame } from '../../simulation/flow'
import { growthFrame } from '../../simulation/growth'
import { GrowthInset } from './GrowthInset'
import { SubstanceLegend, SubstanceSymbol } from './SubstanceSymbol'
import { harvestFrame } from '../../simulation/harvest'
import { HarvestInset } from './HarvestInset'
import { finishingFrame } from '../../simulation/finishing'
import { FinishingInset } from './FinishingInset'
import { ProcessRouteSummary } from './ProcessRouteSummary'

export function ProcessInset({seconds,pending=false}:{seconds:number;pending?:boolean}) {
  const finishing=finishingFrame(seconds)
  if(finishing&&!pending)return <FinishingInset frame={finishing} seconds={seconds}/>
  const harvest=harvestFrame(seconds)
  if(harvest&&!pending)return <HarvestInset frame={harvest} seconds={seconds}/>
  const growth=growthFrame(seconds)
  if(growth&&!pending)return <GrowthInset frame={growth} seconds={seconds}/>
  const frame=schematicFrame(seconds)
  const stage=pending?'pending':frame.stage
  const particles=pending?[]:frame.particles
  const title=stage==='tank'?'T101 · รับและส่งของเหลว':stage==='cell'?'EC101 · ปรับสภาพเชิงสัญลักษณ์':stage==='filter'?'F101 · แยกตะกอนกับของเหลว':stage==='pending'?'ช่วงนี้รอพัฒนาอนิเมชัน':'T101 → EC101 → F101'
  return <section className="process-inset" aria-label="ภาพขยายกระบวนการเชิงสัญลักษณ์" data-stage={stage} data-playhead={seconds.toFixed(3)}>
    <div className="inset-heading"><strong>{title}</strong><span>SCHEMATIC</span></div>
    <ProcessRouteSummary stage={stage}/>
    {stage==='pending'?<p className="pending-stage">ภาพจำลองสำหรับข้อมูลขั้นตอนนี้ยังไม่พร้อม · ไม่เปิดเส้นทางที่ยังรอยืนยัน</p>:stage==='overview'?<p className="pending-stage">ติดตามของเหลวไปปรับสภาพและแยกตะกอน · ปั๊มและภายในถังแสดงเชิงสัญลักษณ์ ไม่ใช่แบบก่อสร้าง</p>:<svg viewBox="55 10 390 145" role="img" aria-label={title}>
      <rect x="62" y="27" width="365" height="105" rx="18" fill="#F0F7FA" stroke="#B7C9D1"/>
      {stage==='cell'&&<g stroke="#94A3B8" strokeWidth="5" fill="none"><path d="M78 40V118M294 40V118"/><path d="M78 30V15H294V30" strokeWidth="2"/></g>}
      {stage==='filter'&&<g stroke="#718579" strokeWidth="2"><path d="M273 28V130"/>{[40,55,70,85,100,115].map(y=><path key={y} d={`M264 ${y}h18`}/>)}</g>}
      {particles.map((p,i)=><g key={i} data-species={p.species} transform={`translate(${p.x.toFixed(3)} ${p.y.toFixed(3)})`}><SubstanceSymbol species={p.species}/></g>)}
      <text x="70" y="144">{stage==='filter'?'ตะกอนกักแยก':'น้ำและสารละลาย'}</text>
      {stage==='filter'&&<text x="295" y="144">ของเหลวยังมีสารละลาย</text>}
    </svg>}
    <SubstanceLegend ids={['water','urea','phosphorus','sediment']}/>
    <p className="inset-caption">สี รูปร่าง ขนาด และจำนวนจุดใช้สื่อความหมาย ไม่ใช่สีจริง สัดส่วนจริง หรือสมดุลมวล · จุดบนเครื่องซ้อนตำแหน่งท่อ ไม่มีการเปิดผิวถัง</p>
    {stage==='filter'&&<p className="route-boundary">แยกที่ F101 ก่อนส่งของเหลวไป R201 · ไม่แสดงทางเข้า R102 ที่ยังขัดข้อมูล · ยังไม่ระบุชนิดตัวกลางกรองหรือผลึก</p>}
  </section>
}
