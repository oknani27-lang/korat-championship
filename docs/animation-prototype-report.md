# DMR — ต้นแบบการไหล T101 → EC101 → F101

วันที่ตรวจ: 19 ตุลาคม 2026

> รายงานนี้บันทึกต้นแบบเดิมที่หยุด 17 วินาที ปัจจุบัน UI เล่นคำอธิบายครบ 60 วินาทีและแสดงสูตรในแผงด้านล่างตลอด ดู `autoplay-chemistry-report.md` ต่อมาขยายช่วง 17–38 วินาทีตาม `animation-growth-report.md` ข้อมูลในรายงานนี้บันทึกผลช่วงต้นและข้อจำกัดเดิม

## สิ่งที่ทำ

- เชื่อมเวลาเดียว `playheadSeconds` กับข้อความ ขั้นตอน สัญลักษณ์บนท่อ ภาพ schematic และวัสดุเน้นอุปกรณ์
- กำหนด 13 ช่วงตามแผน 60 วินาที: 0–3, 3–6, 6–11, 11–17, 17–23, 23–26, 26–30, 30–38, 38–44, 44–48, 48–51, 51–56, 56–60
- เล่นอัตโนมัติเฉพาะ 0–17 วินาที แล้วหยุดพร้อมข้อความ “จบช่วงต้นแบบ” ที่ F101
- เลือก/ลากดูช่วงอนาคตได้ แต่แสดง “รอพัฒนา” และปิดปุ่มเล่นในช่วงนั้น เลือกขั้นถัดจากจุดจบ 17 วินาทีเพื่ออ่านไนตริฟิเคชันได้ โดยไม่เริ่มภาพการไหล
- Play/Pause, Restart, slider หน่วยวินาที, เลือกขั้น และ Prev/Next ใช้เวลาเดียวกัน Restart กลับ 0 วินาที
- มี interval กลางเพียงตัวเดียว 33 ms ระหว่างเล่น ไม่สร้างใหม่เมื่อเปลี่ยนขั้น ซ่อนแท็บแล้วพัก interval และเริ่มอ้างเวลาใหม่เมื่อกลับมา ไม่บวกเวลาที่ซ่อน
- ใช้ 75 instances ใน 4 ชุดวัสดุ/รูปทรง: น้ำฟ้า ยูเรียเหลือง กลุ่มสารที่มีฟอสฟอรัสแบบสี่เหลี่ยมโปร่ง และตะกอนน้ำตาลแบบสามเหลี่ยม/ทรงสี่หน้า
- ใช้ตำแหน่งบน polyline ตามระยะสะสม ไม่ตัดมุมท่อ ไม่มีการสุ่มใหม่หรือสะสมตำแหน่งตาม frame; เวลาเดียวกันจึงให้ผลเดิมเมื่อเล่นหรือลากย้อน
- คงโมเดลทึบไว้ ใช้สัญลักษณ์ซ้อนบนท่อ และภาพขยายที่ระบุ SCHEMATIC สำหรับภายในถัง ไม่ทำ Smart X-Ray
- แสดงว่าน้ำและยูเรียยังอยู่ในของเหลวเมื่อแยกตะกอน ไม่เปลี่ยนยูเรียเป็นฟอสฟอรัส ไม่เรียกตะกอนว่า struvite
- วัสดุที่เน้นอุปกรณ์เป็นสำเนาที่แยกตาม assembly ใช้ cached geometry/texture เดิม และ dispose เฉพาะวัสดุที่ component เป็นเจ้าของ
- คงปุ่มควบคุมไว้ก่อนภาพขยาย เพื่อให้กดเล่นแล้วมองเครื่องได้สะดวก

## หลักฐานพิกัดท่อ

อ่านไฟล์ Blender ที่บันทึกไว้ด้วย process แยกแบบไม่บันทึกกลับ ใช้ transformation เดียวกับ export: แปลตำแหน่งแล้วแปลง `[x, z, -y]` ไม่เปลี่ยน scale

| เส้นทางแสดงผล | วัตถุท่อจริง | จุดรับ–ส่งที่พบในรูปทรง | ผล |
| --- | --- | --- | --- |
| T101 → P101 | `WF2_T101_P101` | `T101_Outlet_End` → `P101_Feed_Pump_Concept` | ใช้ centerline POLY จริง |
| P101 → EC101 | `WF2_P101_EC101` | ผิวปั๊ม → header ของ EC101 | ใช้ centerline POLY จริง |
| EC101 → F101 | `WF2_EC101_F101` | header ของ EC101 → housing ของ F101 | ใช้ centerline POLY จริง |

รายละเอียด control points และ bounding boxes อยู่ใน `prototype-geometry-audit.json` ส่วน `src/data/flow-paths.json` มีชื่อวัตถุอ้างอิง hash ต้นฉบับ และ animation window ของแต่ละเส้นทาง จุดเข้า–ออกตรงกับ `connectionPoints` ใน registry

ทดสอบจุด centerline กับ world-space bounds ของ mesh ท่อที่โหลดจาก GLB ในเบราว์เซอร์ด้วย และเก็บภาพระยะใกล้จากสองมุม การตรวจนี้ยืนยันตำแหน่งรูปทรงสำหรับสื่อเท่านั้น ไม่ยืนยัน hydraulic design หรือรูปแบบการไหลภายในอุปกรณ์

ไม่ interpolate ช่องว่างภายในปั๊มหรือเซลล์ที่ไม่มี centerline ยืนยัน ใช้ packet ของแต่ละช่วงภายนอกและ schematic เล่าเหตุการณ์ต่อกัน จำนวนจุดไม่ใช่จำนวนโมเลกุลหรือสมดุลมวล

## รักษาต้นฉบับ

- `.blend` เดิม SHA-256: `041db30b47b2174d1e233b9cd971969add8bfa66d7a68d8996dea7027d940c7a`
- GLB เดิม SHA-256: `f54ad5ff0d28752c5bc4f6b29babe0497910074e17d1b483276ee3649cdf5d3d`
- ตรวจซ้ำแล้วทั้งสองไฟล์ตรงกับก่อนเริ่ม ไม่มี export GLB ใหม่ ไม่มีการแก้/สร้าง `.blend` และไม่เปลี่ยน topology หรือท่อ

## ผลตรวจรับ

| รายการ | ผล |
| --- | --- |
| Unit tests — เวลา, cutoff, ข้ามขั้น, เส้นทาง, การคงสารละลาย, deterministic scrub, validation | ผ่าน |
| Typecheck แอปและ TypeScript test harness | ผ่าน |
| ESLint และ Oxlint สำหรับโค้ดเว็บ/สคริปต์ข้อมูลใหม่ | ผ่าน |
| Production build | ผ่าน มีคำเตือน bundle viewer ใหญ่กว่า 500 kB |
| อนิเมชันจริง desktop 1440 px / mobile 390 px | ผ่านทั้งสองขนาดหลังจัดตำแหน่งปุ่มแล้ว |
| Browser regression เดิม 16 ชุด | ผ่านครบ 16 ชุด |
| Static model integration 1440 / 768 / 390 px และ fallback | ผ่านทั้งสามขนาดและ fallback |

ชุดตรวจอนิเมชันเปรียบเทียบ instance matrices และ SVG ที่เวลาเดิมทั้งไปข้างหน้า/ย้อนกลับ ตรวจ Play/Pause/Restart, เปลี่ยนขั้น, clock เดียว, hidden tab, cutoff 17 วินาที, วัสดุของอุปกรณ์อื่นไม่เปลี่ยน, scene/geometry คงเดิม, ไม่มี resource สะสมหลังวน scrub และ demand rendering หยุดเมื่อ idle

ภาพและผลทดสอบดิบอยู่ใน `test-results/animation-prototype/`, `test-results/browser-audit.json` และ `test-results/model-integration/` ซึ่งเป็นไฟล์ Git ignored

## ข้อจำกัดคงเหลือ

- ไม่ปล่อยอนุภาคเข้า R102: จุด tee ในโมเดลอยู่ก่อน F101 และท่อ R102 → F101 ยังไม่มีข้อมูลกระบวนการรองรับ เก็บรูปทรงเดิมไว้แต่ไม่ใช้เล่าทางไหล
- ไม่แสดงการไหลออกจาก F101 ไป R201 ในรอบนี้ และไม่เปิดแขนงน้ำกู้คืน/ตู้แปรรูป
- ระบบทางเข้า–ออกภายใน EC101/P101 และชนิดตัวกลางกรองใน F101 ยังไม่ใช่แบบก่อสร้างที่ยืนยันแล้ว
- สี ขนาด จำนวนจุด และเวลาคือสัญลักษณ์สำหรับการเล่าเรื่อง ไม่ใช่สีสารจริง อัตราการไหล ผลทดสอบ หรือผลจำลองเคมี/CFD
- ภาพใน schematic ไม่ใช่ topology ภายในถังจริง ไม่ยืนยันความบริสุทธิ์หรือความปลอดภัยสำหรับบริโภค
- ใช้ Chrome/SwiftShader และ viewport emulation ในการตรวจ ยังไม่ใช่การวัด FPS บนโทรศัพท์จริง และยังไม่รับประกันประสิทธิภาพบนทุกเครื่อง
- ยังมีคำเตือน `THREE.Clock` deprecated จาก dependency เดิม
- ไม่ commit, push หรือ deploy

## ไฟล์งานช่วงนี้

`src/simulation/simulator.ts`, `useSimulator.ts`, `flow.ts`, `timeline.test.ts`; `src/data/process-steps.json`, `flow-paths.json`, `machine-parts.json`, `substances.ts`, `parse.ts`; `src/components/viewer/FlowParticles.tsx`, `MachineModel.tsx`, `MachineViewer.tsx`; `src/components/bottom-sheet/ProcessInset.tsx`, `ProcessSheet.tsx`; `src/App.tsx`, `src/styles/app.css`, `src/types/machine.ts`; `scripts/audit_prototype_paths.py`, `build_prototype_data.mjs`; `tests/animation-prototype.cjs`, `browser-audit.cjs`; `package.json`, `README.md`, เอกสารแผนและรายงานช่วงนี้

หากเปลี่ยนโมเดลในอนาคต ต้องตรวจพิกัดและ hash ใหม่ ไม่ใช้ flow-paths เดิมโดยอัตโนมัติ
