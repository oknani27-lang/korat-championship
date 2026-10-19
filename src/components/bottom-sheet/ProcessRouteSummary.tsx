const summaries: Record<string, {route:string;scope:string}> = {
  overview:{route:'ติดตามของเหลว → เพาะ → เก็บเกี่ยว → แปรรูปตัวอย่าง → กัก',scope:'ภาพเล่าเรื่อง 60 วินาที · ไม่ใช่เวลาจริง'},
  tank:{route:'ของเหลว: T101 → P101 → EC101',scope:'ภาพสัญลักษณ์ · ภายในปั๊มไม่แสดงทางไหลจริง'},
  cell:{route:'EC101 → F101 · ของเหลวและกลุ่มตะกอน',scope:'ตัวอย่างหลักการ · ชนิดตะกอนรอยืนยัน'},
  filter:{route:'F101 → R201 · ตะกอนกักแยก ไม่เปิด R102',scope:'แยกทางกายภาพ · ของเหลวยังมีสารละลาย'},
  nitrification:{route:'F101 → R201 → T301 · ก๊าซแยกจากของเหลว',scope:'ภายใน schematic · จุดต่อก๊าซรอยืนยัน'},
  hold:{route:'T301 กักก่อนส่ง T302 · แสดงล็อตตัวอย่าง',scope:'ตัวอย่างการอนุมัติ · ไม่ใช่ผลตรวจจริง'},
  formulation:{route:'T302 ผสม → P301 · น้ำ/สารเสริมใน schematic',scope:'ตัวอย่างผสม · สูตรและสายเติมรอยืนยัน'},
  cultivation:{route:'อาหาร → R401 · P401/AIT401 หมุนเวียนแยกสาย',scope:'ย่อเวลา · ก๊าซและผลผลิตยังไม่ยืนยัน'},
  harvest:{route:'F501 → ชีวมวล T501 / filtrate รอกู้คืน',scope:'แยกเชิงหน้าที่ · ตัวกรองรอยืนยัน'},
  recovery:{route:'filtrate → W601 → T601 กัก · ชีวมวลพัก T501',scope:'วิธีบำบัดรอยืนยัน · ยังไม่อนุมัติคืนน้ำ'},
  washing:{route:'T501 ล้าง → ชีวมวลเปียก / น้ำล้างกักแยก',scope:'ตัวอย่างล้าง · สายเข้า–ออกรอยืนยัน'},
  processing:{route:'ชีวมวล T501 → ถาด DR701 · ไอน้ำแยกออก',scope:'ตัวอย่างทางเลือก · ยังไม่ยืนยันวิธีจริง'},
  packing:{route:'ผลิตภัณฑ์เป็นชุด → PK801 → ซองกัก T801',scope:'ล็อตตัวอย่าง · ไม่อนุมัติบริโภค'},
}

export function ProcessRouteSummary({stage}:{stage:string}) {
  const info=summaries[stage]
  if(!info)return null
  return <div className="process-route-summary">
    <span className="scope-label">{info.scope}</span>
    <p className="route-summary" aria-label="สายและปลายทาง">{info.route}</p>
  </div>
}
