import type { GrowthFrame } from '../../simulation/growth'
import type { SubstanceId } from '../../data/substances'
import { SubstanceLegend, SubstanceSymbol } from './SubstanceSymbol'
import { ProcessRouteSummary } from './ProcessRouteSummary'

const details = {
  nitrification: {title:'R201 · biofilm และการเปลี่ยนรูปไนโตรเจน',note:'แสดงเฉพาะส่วน NH₄⁺ ที่เข้าสู่ไนตริฟิเคชัน ยูเรียยังแยกติดตาม ไม่ได้แสดงการเปลี่ยนยูเรียโดยตรง',route:'ท่อจริง: F101 → R201 → T301 · ก๊าซและภายใน R201 เป็น schematic เนื่องจากจุดต่อ G201 ไม่ครบ'},
  hold: {title:'T301 · กักล็อตก่อนอนุมัติ',note:'ตัวอย่างหนึ่งล็อตสำหรับเล่าลำดับงาน ไม่ใช่ผลตรวจจริง ล็อตไม่ผ่านต้องกักแยกและไม่เปิดส่ง T302',route:'ท่อจริง: R201 → T301 → T302 · การอนุมัติและตรวจวิเคราะห์เป็น schematic'},
  formulation: {title:'T302 · ผสมและตรวจสูตรก่อนจ่าย',note:'น้ำและสารเสริมเป็น schematic ที่สมมติว่าผ่านเกณฑ์ ไม่มีสูตรหรือปริมาณผสมยืนยัน ไม่รับสารจาก R102 โดยอัตโนมัติ',route:'ท่อจริง: T301 → T302 → P301 · จุดรับน้ำและสารเสริมยังรอยืนยันการอนุมัติ'},
  cultivation: {title:'R401 · แสง ก๊าซ และเซลล์เกลียว',note:'จำนวนเซลล์เพิ่มแบบย่อเวลาเพื่อสื่อความหมาย ไม่ใช่อัตราเติบโตหรือผลผลิตจริง ก๊าซและการแลกเปลี่ยนภายในเป็น schematic',route:'ท่อจริง: P301 → R401 และ R401 → P401 → AIT401 → R401 · แยกจากสายก๊าซ G401 ที่ยังรอยืนยัน interface'},
}
export function GrowthInset({frame,seconds}:{frame:GrowthFrame;seconds:number}) {
  const {stage,progress,gate}=frame, info=details[stage]
  const ids:SubstanceId[]=stage==='nitrification'?['water','urea','ammonium','nitrite','nitrate','gas']:stage==='cultivation'?['water','nitrate','gas','algae']:['water','urea','nitrate',...(stage==='formulation'?['nutrient'] as const:[])]
  return <section className="process-inset growth-inset" aria-label="ภาพขยายกระบวนการเชิงสัญลักษณ์" data-stage={stage} data-playhead={seconds.toFixed(3)}>
    <div className="inset-heading"><strong>{info.title}</strong><span>SCHEMATIC</span></div>
    <div className="schematic-state" aria-live="polite">{stage==='nitrification'?'NH₄⁺ → NO₂⁻ → NO₃⁻ · biofilm บนตัวกลาง':stage==='cultivation'?'แสง + อาหาร + แหล่งคาร์บอน · ย่อเวลา':gate==='example-release'?'ตัวอย่างการอนุมัติ · เปิดส่งต่อ':stage==='hold'?'กักรอตรวจ · ยังไม่เปิดส่งต่อ':'ผสมและรอตรวจสูตร · ยังไม่จ่าย'}</div>
    <ProcessRouteSummary stage={stage}/>
    <svg viewBox={stage==='nitrification'||stage==='hold'?'55 25 395 120':'55 0 395 150'} role="img" aria-label={info.title}>
      <rect x="62" y="35" width="350" height="105" rx="18" fill="#F0F7FA" stroke="#B7C9D1"/>
      {stage==='nitrification'&&<g fill="#94A3B8" stroke="#4D7C0F" strokeWidth="2">{[100,180,260,340].map(x=><g key={x} transform={`translate(${x} ${112+Math.sin(progress*6+x)*6})`}><circle r="10"/><path d="M-6 -5L6 5M-6 5L6 -5" stroke="#fff"/></g>)}</g>}
      {stage==='formulation'&&<g stroke="#64748B" strokeWidth="3" fill="none"><path d="M235 14V94"/><g transform={`translate(235 94) rotate(${progress*360})`}><path d="M-35 0H35M0 -13V13"/></g><path d="M330 12V30" strokeDasharray="3 3"/></g>}
      {stage==='cultivation'&&<g stroke="#D19C19" strokeWidth="2" fill="none">{[95,175,255,335].map(x=><path key={x} d={`M${x} 8l-5 10h10l-5 10`} opacity={.5+.5*Math.sin(progress*8)**2}/>)}</g>}
      {gate&&<g transform="translate(400 90)" stroke={gate==='example-release'?'#0F766E':'#B45309'} strokeWidth="3"><path d={gate==='example-release'?'M-8 -16L8 16':'M0 -20V20'}/><circle r="8" fill="white"/><path d="M20 0h25" strokeDasharray={gate==='example-release'?undefined:'3 3'}/></g>}
      {frame.particles.filter(p=>p.visible).map(p=><g key={p.key} data-species={p.species} transform={`translate(${p.x.toFixed(3)} ${p.y.toFixed(3)})`}><SubstanceSymbol species={p.species}/></g>)}
    </svg>
    <SubstanceLegend ids={ids}/>
    <p className="inset-caption">{info.note}</p>
    <p className="route-boundary">{info.route}</p>
    <p className="inset-caption">สี รูปร่าง ขนาดและจำนวนเป็นสัญลักษณ์ ไม่ใช่สีจริง สัดส่วนจริง สมดุลมวล หรือเวลาปฏิกิริยาจริง จุดบนเครื่องซ้อนตำแหน่งท่อ ไม่เปิดผิวถัง</p>
  </section>
}
