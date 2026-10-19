import type { finishingFrame } from '../../simulation/finishing'
import { SubstanceLegend, SubstanceSymbol } from './SubstanceSymbol'
import { ProcessRouteSummary } from './ProcessRouteSummary'

type Frame = NonNullable<ReturnType<typeof finishingFrame>>
const states = {
  loading: 'ชีวมวลเปียกจาก T501 · โหลดถาดเป็นชุด',
  drying: 'ตัวอย่างลดน้ำ · ไอน้ำแยกจากผลิตภัณฑ์',
  'await-packing': 'ผลิตภัณฑ์จากขั้นตัวอย่าง · รอบรรจุ',
  filling: 'ตัวอย่างส่งเป็นชุด → PK801 เติมซอง',
  sealing: 'PK801 · ซีลซองเชิงสัญลักษณ์',
  lot: 'ระบุ “ล็อตตัวอย่าง” · ไม่ใช่ข้อมูลล็อตจริง',
  quarantine: 'บรรจุแล้ว / กักรอตรวจ · T801',
}
export function FinishingInset({ frame, seconds }: { frame: Frame; seconds: number }) {
  const processing = frame.stage === 'processing'
  const title = processing ? 'ตัวอย่างทางเลือก: อบแห้ง · DR701' : 'PK801 → T801 · บรรจุและกักรอตรวจ'
  return <section className="process-inset finishing-inset" aria-label="ภาพขยายกระบวนการเชิงสัญลักษณ์" data-stage={frame.stage} data-phase={frame.phase} data-released={frame.released} data-playhead={seconds.toFixed(3)}>
    <div className="inset-heading"><strong>{title}</strong><span>SCHEMATIC</span></div>
    <div className="schematic-state" aria-live="polite">{states[frame.phase]}</div>
    <ProcessRouteSummary stage={frame.stage}/>
    <svg viewBox="15 10 430 180" role="img" aria-label={title}>
      {processing ? <>
        <rect x="165" y="32" width="150" height="113" rx="10" fill="#F0F7FA" stroke="#94A3B8"/>
        <text x="180" y="24">DR701 · ตัวอย่าง</text><text x="24" y="161">T501 → ถาด</text>
        <g transform={`translate(${frame.trayX.toFixed(3)} 106)`}>
          <path d="M0 -23V12H95V-23" fill="#E2E8F0" stroke="#64748B"/>
          <rect x="4" y={12-frame.waterLevel} width="87" height={frame.waterLevel} fill="#BAE6FD"/>
          {[0,1,2,3].map(i=><g key={i} transform={`translate(${14+i*21} 0)`}><SubstanceSymbol species="algae"/></g>)}
        </g>
        {frame.vapor.map((p,i)=><g key={i} transform={`translate(${p.x} ${p.y.toFixed(3)})`}><SubstanceSymbol species="vapor"/></g>)}
        <text x="323" y="66">ไอน้ำ</text><text x="322" y="106">ลดน้ำทางกายภาพ</text>
        <text x="140" y="180">H701 / FD701 เป็นทางเลือก · ไม่เปิดในรอบนี้</text>
      </> : <>
        <rect x="145" y="33" width="127" height="113" rx="10" fill="#F0F7FA" stroke="#94A3B8"/>
        <rect x="325" y="33" width="110" height="113" rx="10" fill="#FFF7ED" stroke="#B45309" strokeDasharray="4 3"/>
        <text x="163" y="24">PK801</text><text x="334" y="24">T801 · กัก</text>
        <text x="18" y="52">ส่งเป็นชุด</text>
        <g transform="translate(85 78)"><SubstanceSymbol species="product"/></g>
        <path d="M40 110h75M120 114h185" stroke="#64748B" strokeDasharray="4 3"/>
        <g data-pouch="true" data-sealed={frame.sealed} data-labelled={frame.labelled} transform={`translate(${frame.pouchX.toFixed(3)} 66)`}>
          <path d="M0 0H44L47 62H-3Z" fill="#FEF3C7" stroke="#92400E"/>
          <rect x="3" y={56-34*frame.fill} width="38" height={34*frame.fill} fill="#65A30D"/>
          {frame.sealed&&<path d="M0 4h44M0 8h44" stroke="#92400E" strokeWidth="2"/>}
          {frame.labelled&&<text x="-7" y="82" fontSize="10">ล็อตตัวอย่าง</text>}
        </g>
        {frame.phase==='filling'&&[0,1,2].map(i=><g key={i} transform={`translate(211 ${43+((frame.progress*110+i*9)%22)})`}><SubstanceSymbol species="product"/></g>)}
        {frame.phase==='sealing'&&<path d="M180 63h62" stroke="#92400E" strokeWidth="5"/>}
        <text x="42" y="183">เติมซอง → ซีล → ล็อตตัวอย่าง → กักรอตรวจ</text>
      </>}
    </svg>
    <SubstanceLegend ids={processing ? ['water','algae','vapor'] : ['product','pouch']}/>
    <p className="inset-caption">{processing ? 'DR701 เป็นตัวอย่างทางเลือก ยังไม่เลือกวิธีจริง เซลล์ไม่ได้เปลี่ยนเป็นโมเลกุลใหม่ ผลิตภัณฑ์มีหลายองค์ประกอบ ไม่ใช่โปรตีนบริสุทธิ์ ไม่มีค่าอุณหภูมิ เวลาอบ ความชื้น หรือผลผลิตสมมติ' : 'ส่งผลิตภัณฑ์เป็นชุดใน schematic ไม่ปั๊มผลิตภัณฑ์แห้งผ่านท่อ ซอง ซีล และล็อตเป็นภาพตัวอย่าง ไม่ใช่บันทึกการผลิตจริง'}</p>
    <p className="route-boundary">{processing ? 'ทางออก T501 และการย้ายถาดยังต้องยืนยัน ไม่เปิดท่อเข้าตู้แปรรูปหรือสายผลิตภัณฑ์' : 'จบที่บรรจุแล้ว / กักรอตรวจ ไม่ใช่อนุมัติบริโภค ต้องยืนยันผลิตภัณฑ์ ฟิล์ม การซีล สภาพเก็บ และเกณฑ์ปล่อยล็อต'}</p>
    <p className="inset-caption">การลดน้ำหรือซีลไม่รับรองว่าปลอดเชื้อหรือกำจัดสารปนเปื้อนทั้งหมด · สี รูปร่าง ปริมาณและเวลาเป็นสัญลักษณ์ ไม่ใช่เวลาทำงานจริง</p>
  </section>
}
