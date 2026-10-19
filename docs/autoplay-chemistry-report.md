# การนำเสนออัตโนมัติและรายละเอียดเคมีในแผงกระบวนการ

วันที่ตรวจ: 19 ตุลาคม 2026

## พฤติกรรมปัจจุบัน

- Start Demo เริ่มลำดับนำเสนอ 60 วินาทีทันทีและหยุดเมื่อจบ ไม่มีปุ่ม Play/Pause แยก กด Start Demo ซ้ำระหว่างเล่นไม่เริ่มใหม่
- ถัดไป ก่อนหน้า และเลือกขั้นเริ่มเล่นจากจุดเริ่มขั้นนั้นทันที Restart เริ่มที่ 0 แล้วเล่นต่อ
- ลาก timeline เพื่อพักตรวจได้ ใช้ Start Demo เล่นต่อ ซ่อนแท็บแล้วพักเวลาและกลับมาไม่กระโดดข้าม
- รายละเอียดแผงด้านล่างเปิดเต็มตลอด ไม่มีปุ่มย่อ/ขยาย ไม่มีป๊อปอัปบังโมเดล
- คอลัมน์ CHEMISTRY & PROCESS แสดงคำอธิบาย สูตร ตัวห้อย/ยก ขอบเขตของสมการ และแหล่งอ้างอิงตามขั้นปัจจุบัน
- ขั้นแยกสาร กักตรวจ ปรับสูตร กรอง กู้คืนน้ำ ล้าง แปรรูป และบรรจุไม่ใส่สมการเคมีสมมติ

## ขอบเขตและแหล่งสมการ

สูตรอยู่ใน `src/data/process-chemistry.ts` และจับคู่ด้วย process ID จริงใน config ข้อมูล JSON กระบวนการเดิมยังใช้กำหนดเวลา อุปกรณ์ และผลลัพธ์

- รับวัตถุดิบ: สูตรของน้ำและยูเรียที่ติดตาม ไม่ใช่องค์ประกอบทั้งหมดของปัสสาวะ
- EC101: ครึ่งปฏิกิริยารีดักชันน้ำเป็นตัวอย่างอธิบาย OH⁻ ใกล้แคโทด ไม่ใช่ผลทดสอบขั้วหรือผลิตภัณฑ์ของเครื่องจริง และไม่ยืนยัน struvite — [De Paepe et al., 2020](https://pubmed.ncbi.nlm.nih.gov/32049503/)
- R201: สมการสรุปแอมโมเนียม → ไนไตรต์ → ไนเตรต ไม่รวมการสร้างเซลล์หรืออัตราเปลี่ยนจริง — [US EPA, Wastewater Basics 101](https://www.epa.gov/sites/default/files/2015-06/documents/epa-mou_wastewater_basics_101.pdf)
- R401: สมการสังเคราะห์แสงย่อ ใช้กลูโคสเป็นตัวแทน ไม่ใช่สูตรชีวมวลหรือผลผลิตจริงของ Limnospira — [OpenStax, Energy and Metabolism](https://openstax.org/books/concepts-biology/pages/4-1-energy-and-metabolism)

ปัจจุบันเพิ่มภาพบนท่อและ schematic ช่วง 17–38 วินาทีแล้ว ดู `animation-growth-report.md` ช่วง 38–60 วินาทียังเดินข้อความและหลักการตามแผน พร้อมป้ายว่าภาพการไหลรอพัฒนา เวลา 60 วินาทีเป็นเวลาเล่าเรื่อง ไม่มีการแก้ Blender, GLB, topology หรือพิกัดท่อ และยังไม่ยืนยันแขนง R102 ทางคืนน้ำ หรือวิธีแปรรูป

## ผลตรวจ

- Typecheck, unit tests, ESLint และ Oxlint เฉพาะโค้ดเว็บ/ตัวสร้างข้อมูล: ผ่าน
- Production build: ผ่าน มีคำเตือนขนาด bundle ของตัวแสดงสามมิติ
- Browser regression: ผ่าน 16 ชุด รวม always-expanded layout, Start Demo, Next, timeline, hidden tab, cleanup/unmount, touch, fallback และความคงที่ของ Canvas
- Inline chemistry: ผ่านทุก 12 ขั้นที่ 1440, 768, 390, 320 px ไม่มีข้อความหรือสูตรล้นแนวนอน ไม่มีป๊อปอัปหรือปุ่มย่อรายละเอียด
- Animation regression: ผ่าน desktop 1440 และ mobile 390 px ตรวจ deterministic scrub, geometry/material ownership, idle rendering, resource stability และ desktop เล่นครบ 60 วินาทีด้วย interval เดียว
- ตรวจภาพ `test-results/process-chemistry/details-1440.png` และ `details-390.png` แล้ว สูตรและรายละเอียดอ่านได้ครบ

ภาพและรายงาน JSON อยู่ใน `test-results/process-chemistry/`, `test-results/animation-prototype/` และ `test-results/` ซึ่ง Git ignore ไว้ การตรวจมือถือเป็น viewport emulation ไม่ใช่การวัดสมรรถนะ GPU ของโทรศัพท์จริง

ไม่ได้ commit, push หรือ deploy
