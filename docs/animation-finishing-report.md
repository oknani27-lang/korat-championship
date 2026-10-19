# DMR — ภาพประกอบช่วงสุดท้าย 51–60 วินาที

19 ตุลาคม 2026

## ผลที่ทำ

ภาพประกอบครบหนึ่งรอบ 0–60 วินาที โดยคงภาพบนท่อจริง 15 เส้นเดิมถึงช่วงกู้คืนน้ำ ส่วน 51–60 วินาทีเป็น schematic ตัวอย่างทั้งหมด ไม่มีการเปิดท่อแปรรูปหรือส่งผลิตภัณฑ์แห้งผ่านท่อ และไม่ได้เพิ่มกล้องอัตโนมัติหรือ Smart X-Ray

| เวลาเล่าเรื่อง | ภาพและขอบเขต |
| --- | --- |
| 51–56 s | ชีวมวลเปียก T501 → โหลดถาด → DR701 ตัวอย่างลดน้ำ → ผลิตภัณฑ์รอบรรจุ แสดงน้ำและเซลล์เกลียวเดิม ไอน้ำใช้เส้นคลื่นต่างจากฟองก๊าซ ไม่อ้างว่าเปลี่ยนเป็นโปรตีนบริสุทธิ์ |
| 56–60 s | ส่งเป็นชุดใน schematic → PK801 เติมซอง → ซีล → ล็อตตัวอย่าง → T801 กักรอตรวจ |
| 60 s | เวลาและภาพหยุด คงซองซีลพร้อมข้อความกักรอตรวจ กด Play หลังจบเริ่มรอบใหม่ที่ 0 |

DR701 เป็นตัวอย่างทางเลือก ยังไม่เลือกวิธีแปรรูปจริง H701/FD701 ไม่เปิดและไม่ทำงานอนุกรมร่วมกัน ไม่มีอุณหภูมิ เวลาอบ ความชื้น อัตราการไหล ผลผลิต ประสิทธิภาพ หรือผลตรวจสมมติ การลดน้ำและซีลไม่ใช่หลักฐานว่าปลอดเชื้อ กำจัดสารปนเปื้อน หรืออนุมัติบริโภคแล้ว เวลา 60 วินาทีเป็นเวลาเล่าเรื่อง

## หลักฐานโมเดลและสถานะเส้นทาง

ตรวจไฟล์ Blender ที่บันทึกไว้ด้วย background process แยกแบบอ่านอย่างเดียว และตรวจชื่อใน GLB จริง 77 วัตถุ (67 equipment meshes และ 10 candidate curves) พิกัด bounds/centerline และชื่อ export อยู่ใน `finishing-geometry-audit.json` และ `finishing-route-audit.json` เป็นพิกัดโมเดล ไม่ใช่มิติผลิตที่รับรองแล้ว

- T501: `T501_Body`, `T501_Contents` และ `PT_T501_TransferPump` มีอยู่ แต่ทางโหลดถาดและการจัดการชีวมวลจริงยังต้องออกแบบ
- ตัวเลือกแปรรูป: `H701_Cabinet`, `DR701_Cabinet`, `FD701_Cabinet` พร้อมชุด `*_Tray_0..2` และ `*_Process_Service` มีอยู่ ใช้เฉพาะการเน้น DR701 และ schematic ตัวอย่าง ไม่ขยับ mesh ต้นฉบับ
- สายเข้า/ออกตู้ `PT_Wet_To_*`, `PT_*_To_Product_Header` และ `PT_Hopper_To_PK801` ตรวจ centerline/endpoint contacts แล้ว แต่ไม่มีหลักฐานว่าผลิตภัณฑ์แห้งส่งผ่านได้ จึงไม่เปิดอนุภาคทุกเส้นดังกล่าว
- บรรจุ: `PK801_Machine`, `PK801_Conveyor`, `PK801_Belt`, `PK801_Package`, `PK801_Sealing_Bar`, `PK801_Tool_Set`, `PK801_Seal_Check` มีอยู่ ซองและซีลที่เคลื่อนไหวเป็น SVG แยก ไม่แก้ mesh/สายพานใน GLB
- กักรอตรวจ: `T801_Machine`, `T801_Lot_Shelf_0..2` มีอยู่ การส่งซองและกักเป็น schematic ไม่ใช่เส้นทางสายพานจริงที่ยืนยันแล้ว

ข้อมูล role/input/output/missing ของ DR701, PK801 และ T801 อ้าง `Part_Inventory.csv` การลดน้ำเชิงหน้าที่เป็นข้อมูลเดิมในทะเบียน ไม่เพิ่มข้อกล่าวอ้างทางวิทยาศาสตร์หรือสมการเคมีใหม่

| ประเภท | สถานะ |
| --- | --- |
| Actual-pipe overlay | 15 เส้นเดิม ไม่มีเส้นใหม่ในช่วง 51–60 |
| Schematic / example | ย้ายถาด อบตัวอย่าง ลดน้ำ ไอน้ำ ส่งผลิตภัณฑ์เป็นชุด เติมซอง ซีล ล็อตตัวอย่าง และกัก |
| รอยืนยัน | ชนิดผลิตภัณฑ์ วิธี/เงื่อนไขอบ จุดสิ้นสุด ความร้อน การจัดการไอน้ำ ทางโหลด/ขนถ่าย ความเหมาะสมฟิล์ม/ซีล สภาพเก็บ อายุผลิตภัณฑ์ และเกณฑ์ปล่อยล็อต |
| ไม่เปิด | แขนง R102 น้ำคืน R401/T302 น้ำล้างเข้าบำบัดร่วม และท่อผลิตภัณฑ์ที่ยังไม่ยืนยัน |

## ระบบเวลาและ layout

`finishingFrame(seconds)` เป็น pure function ไม่มี timer ใหม่ คำนวณตำแหน่งถาด ระดับน้ำ สัญลักษณ์ไอน้ำ การเติม การซีล ล็อต และซองจากเวลาเดียวกัน รวมเวลา 60 แบบ inclusive การลากย้อนให้ภาพเดิม ไม่มี CSS animation หรือ callback ต่อเอฟเฟกต์

SVG ใช้ registry กลาง เพิ่มสัญลักษณ์ไอน้ำ ผลิตภัณฑ์หลายองค์ประกอบ และซอง พร้อมชื่อ/รูปทรง ไม่เพิ่ม geometry/material ฝั่ง Three.js คง Canvas เดิม ปุ่ม Play/Pause, Next/Previous, Restart และ scrub เดิม ซ่อนแท็บพักเวลา ไม่มี popup หรือแผงรายละเอียดซ้ำ การ์ดยาวอ่านต่อภายในได้

## ผลตรวจ

Unit tests, typecheck, scoped ESLint/Oxlint และ build ผ่าน ตรวจสูตร/layout 12 ขั้นที่ 1440/768/390/320 px ผ่าน Viewport fit ที่ 1520×860, 1440×900, 1366×768, 1280×720, 1024×768 และ 390×844 ผ่าน โดยทุก desktop มี sheet และปุ่มขั้นตอนใน viewport รวมที่ 60 วินาที

Model integration ผ่าน 1440/768/390 px รวม framing, registry, controls และ missing-model fallback Browser regression ผ่าน 16 suites รวมเวลา ซ่อนแท็บ cleanup การเลือกชิ้นส่วน และ idle rendering

Animation regression ผ่าน 1440 และ 390 px: เล่น/ลากย้อนผ่านช่วง 0–60 ให้ particle matrices และ SVG เดิม; ทดสอบรอยต่อ 17/23/26/30/38/44/48/51/56/60; DR701 เน้นเพียงทางเลือกเดียว; Pause ที่ 53 และ 58 วินาทีหยุดภาพจริง; ที่ 60 คงซองซีล/ล็อตและสถานะกัก ไม่ release; เล่นซ้ำและสลับขั้นไม่มี geometry/material เพิ่ม, idle frames ไม่เพิ่ม, one-clock/hidden-tab lifecycle ผ่าน ไม่มี console error เส้นทางปกติ ภาพจบจากการเล่นจริง: `test-results/animation-prototype/completed-60-1440.png`; ภาพ workspace desktop/mobile: `details-60-1440.png`, `details-60-390.png`

คำเตือนเดิม: viewer bundle มากกว่า 500 kB และ `THREE.Clock` deprecated ไม่ใช่ console error เส้นทางปกติ การตรวจ mobile เป็น browser emulation ไม่ใช่การรับรอง FPS บนอุปกรณ์จริง

## ไฟล์ที่เปลี่ยนในรอบนี้

- `src/simulation/finishing.ts`, `src/components/bottom-sheet/FinishingInset.tsx`, `ProcessInset.tsx`
- `src/data/substances.ts`, `process-chemistry.ts`, `process-steps.json`, `SubstanceSymbol.tsx`, `src/App.tsx`
- `scripts/build_prototype_data.mjs`, `audit_finishing_paths.py`, `build_finishing_audit.mjs`
- `src/simulation/timeline.test.ts`, `tests/animation-prototype.cjs`, `tests/process-chemistry.cjs`
- `docs/finishing-geometry-audit.json`, `finishing-route-audit.json`, รายงานนี้, `animation-plan.md`, หมายเหตุประวัติใน `animation-harvest-report.md`, README

ตรวจ SHA-256 ของ `.blend` และ GLB ตรงกับ export audit เดิม:

- Blender: `041db30b47b2174d1e233b9cd971969add8bfa66d7a68d8996dea7027d940c7a`
- GLB: `f54ad5ff0d28752c5bc4f6b29babe0497910074e17d1b483276ee3649cdf5d3d`

ไม่มีการสร้าง/บันทึก Blender, เปลี่ยน GLB, commit, push หรือ deploy เก็บงานเดิมที่ยังไม่ commit ไว้

ภาพตรวจอยู่ใน `test-results/process-chemistry/processing-1440.png`, `packing-1440.png`, `processing-390.png`, `packing-390.png` และ `test-results/animation-prototype/` (ผลตรวจในโฟลเดอร์ ignored)
