import type { HarvestFrame } from '../../simulation/harvest'
import { SubstanceLegend, SubstanceSymbol } from './SubstanceSymbol'
import { ProcessRouteSummary } from './ProcessRouteSummary'

const captions={
  harvest:{title:'F501 · แยกชีวมวลกับ filtrate',state:'ชีวมวล → T501 / filtrate → สายกู้คืนน้ำ',note:'แยกเชิงหน้าที่ ไม่เลือก mesh หรือเมมเบรนให้ DMR จุดเซลล์ด้าน filtrate สื่อว่าอาจมีการหลุดรอด ไม่ใช่ค่า retention จริง',route:'ท่อจริง: R401 → F501 → T501 · เก็บ filtrate ไว้ติดตามช่วงถัดไป ยังมีน้ำและสารละลาย'},
  recovery:{title:'W601 → T601 · candidate รอตรวจ',state:'T501 พักชีวมวล / T601 กักของเหลว ยังไม่อนุมัติคืน',note:'W601 เป็นกล่องหน้าที่ที่ยังไม่เลือกเทคโนโลยี ไม่แสดงว่ากำจัดสารปนเปื้อนหมด ส่วนเข้มข้น/ของเสียใน schematic ยังต้องออกแบบจุดรับ',route:'ท่อจริง: F501 → ขอบเขต W601 → T601 · ไม่มีการไหลผ่านทางคืน R401/T302'},
  washing:{title:'T501 · ล้างและลดน้ำชีวมวล',state:'น้ำผ่านเกณฑ์เป็นตัวอย่าง / น้ำล้างไปกักแยก',note:'น้ำล้างเข้า-ออกเป็น schematic แหล่งน้ำและการรับน้ำล้างร่วมที่ W601 ยังรอยืนยัน ไม่ใช่ถังใหม่ที่เพิ่มในโมเดล',route:'ยังไม่เปิดท่อ WF2_WATER_T501 / WF2_T501_W601 · จบที่ชีวมวลเปียกรอแปรรูป ไม่ใช่อาหารพร้อมกิน'},
}
const research='https://www.frontiersin.org/journals/astronomy-and-space-sciences/articles/10.3389/fspas.2023.1229043/full'
export function HarvestInset({frame,seconds}:{frame:HarvestFrame;seconds:number}) {
  const {stage}=frame,info=captions[stage]
  return <section className="process-inset harvest-inset" aria-label="ภาพขยายกระบวนการเชิงสัญลักษณ์" data-stage={stage} data-water-released={frame.waterReleased} data-playhead={seconds.toFixed(3)}>
    <div className="inset-heading"><strong>{info.title}</strong><span>SCHEMATIC</span></div>
    <div className="schematic-state" aria-live="polite">{info.state}</div>
    <ProcessRouteSummary stage={stage}/>
    <svg viewBox="30 10 410 185" role="img" aria-label={info.title}>
      {stage==='harvest'?<>
        <rect x="65" y="40" width="155" height="97" rx="12" fill="#F0F7FA" stroke="#A6BCB2"/>
        <rect x="303" y="40" width="120" height="97" rx="12" fill="#EFF6FF" stroke="#93B4D5"/>
        <path d="M250 42V135M220 85h75" stroke="#718579" strokeWidth="2" strokeDasharray="5 4"/>
        <text x="75" y="28">ชีวมวลเข้มข้น → T501</text><text x="306" y="28">filtrate ยังมีสารละลาย</text>
        <text x="171" y="162">แยกเชิงหน้าที่ · ไม่ระบุเทคโนโลยี</text>
      </>:stage==='recovery'?<>
        <rect x="37" y="58" width="99" height="78" rx="10" fill="#F1F8F1" stroke="#81A58C"/>
        <rect x="160" y="44" width="105" height="75" rx="8" fill="#F2F3F5" stroke="#94A3B8" strokeDasharray="4 3"/>
        <rect x="318" y="44" width="109" height="88" rx="10" fill="#EFF6FF" stroke="#93B4D5"/>
        <rect x="188" y="137" width="98" height="40" rx="8" fill="#FFF7ED" stroke="#BD8B63" strokeDasharray="4 3"/>
        <path d="M265 77h45M213 119v12" stroke="#718579" strokeDasharray="4 3" fill="none"/>
        <text x="40" y="47">T501 พักชีวมวล</text><text x="160" y="29">W601 ไม่เลือกวิธี</text>
        <text x="320" y="29">T601 รอตรวจ</text><text x="194" y="190">ส่วนเข้มข้น/กัก</text>
        <path d="M433 75v32" stroke="#B45309" strokeWidth="3"/>
      </>:<>
        <rect x="65" y="58" width="165" height="88" rx="12" fill="#F0F7FA" stroke="#81A58C"/>
        <rect x="302" y="72" width="125" height="74" rx="10" fill="#FFF7ED" stroke="#BD8B63" strokeDasharray="4 3"/>
        <path d="M145 30v20M230 105h65" stroke="#718579" strokeDasharray="4 3"/>
        <text x="65" y="25">ตัวอย่างน้ำที่ผ่านเกณฑ์</text><text x="80" y="164">T501 ชีวมวลเปียก</text>
        <text x="300" y="164">น้ำล้างกักแยก</text>
      </>}
      {frame.particles.map(p=><g key={p.key} data-species={p.species} data-stream={p.stream} transform={`translate(${p.x.toFixed(3)} ${p.y.toFixed(3)})`}><SubstanceSymbol species={p.species}/></g>)}
    </svg>
    <SubstanceLegend ids={['water','nitrate','algae']}/>
    <p className="inset-caption">ไนเตรตเป็นตัวแทนสารละลายที่ติดตาม ไม่ใช่องค์ประกอบทั้งหมดของน้ำเลี้ยงหรือน้ำล้าง</p>
    <p className="inset-caption">{info.note}</p>
    <p className="route-boundary">{info.route}</p>
    <p className="inset-caption">สี รูปร่าง จำนวนและเวลาเป็นสัญลักษณ์ ไม่ใช่ค่าความเข้มข้น สมดุลมวล ประสิทธิภาพแยกหรือเวลาทำงานจริง</p>
    <div className="chemical-sources">หลักฐานแนวคิด: <a href={research} target="_blank" rel="noopener noreferrer">Tallec et al., 2023 · BHU/MFU</a><span>เป็นระบบทดลองของผู้แต่ง ไม่ใช่สเปก F501/W601 และผลทดสอบของ DMR</span></div>
  </section>
}
