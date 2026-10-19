# ผลการนำโมเดล DMR จริงเข้าเว็บ — ช่วงที่ 1

วันที่ตรวจ: 19 ตุลาคม 2026

## ผลงาน

- เว็บโหลด `public/models/dmr-machine.glb` แทนถังตัวอย่าง โดยคง fallback เดิมเมื่อโหลดไม่สำเร็จ
- GLB ขนาด 2,095,168 bytes (ประมาณ 2.00 MiB) มีวัตถุต้นฉบับที่มองเห็น 646/646 ชิ้น ไม่มี export node หาย
- แปลง curve ท่อ 44 ชิ้นเป็น mesh ใน Blender process ชั่วคราว รวม 33,108 triangles, 24 materials และ 5 images
- เลือกอุปกรณ์ได้ 24 กลุ่มผ่าน `WEB_<รหัสเครื่อง>`; สมาชิกและชื่อวัตถุต้นฉบับอยู่ใน `model-export-audit.json`
- กล้องเริ่มต้นและ Reset ใช้ขอบเขตโมเดลจริง ปรับตามสัดส่วน viewport พร้อมพื้น เงา และแสง
- แผนอนิเมชันปรับเป็น 60 วินาทีแล้ว ยังไม่เชื่อมเข้าการไหลหรือเปลี่ยนตัวอย่าง UI timeline เดิม

## การรักษาต้นฉบับ

ต้นฉบับ: `new-chat/DMR_Reference_Pipes_20261019_122113/DMR_Reference_Pipes_R102_Fixed.blend`

SHA-256 ก่อน export หลัง export และตรวจซ้ำตรงกัน:

`041db30b47b2174d1e233b9cd971969add8bfa66d7a68d8996dea7027d940c7a`

ไม่มีการบันทึกทับหรือสร้าง `.blend` ใหม่ ไม่แก้ topology หรือเส้นทางท่อในต้นฉบับ Export อ่านฉบับที่บันทึกบนดิสก์ ไม่รวมการแก้ที่ยังไม่บันทึกใน Blender ที่เปิดอยู่ วัตถุซ่อน 62 ชิ้นไม่นำมาแสดง รายชื่ออยู่ใน audit

## การตรวจรับ

| รายการ | ผล |
| --- | --- |
| Unit tests: timeline, registry/configuration validation, camera framing | ผ่าน |
| Typecheck โค้ดแอปและ TypeScript test harness | ผ่าน |
| ESLint (`src`, `vite.config.ts`, `eslint.config.js`) และ Oxlint (`src`, `vite.config.ts`) | ผ่าน |
| Production build | ผ่าน มีคำเตือน viewer bundle ใหญ่กว่า 500 kB |
| GLB จริงบน viewport กว้าง 1440 / 768 / 390 px | ผ่านทั้งสามขนาด |
| เปรียบเทียบวัตถุ GLB กับ export manifest | ครบ 646 ชิ้นทุกขนาดจอ |
| Registry, เลือก/โฟกัสอุปกรณ์ 24 กลุ่ม, หมุน ซูม Reset | ผ่าน |
| กรอบโมเดลเริ่มต้นและหน้าจอไม่ล้นแนวนอน | ผ่าน ไม่มี bounding-box corner ถูกตัด |
| หยุด render เมื่อไม่มีการโต้ตอบ | ผ่าน |
| เส้นทางโหลดปกติไม่มี console/page/network error | ผ่าน |
| บังคับ GLB 404 แล้วใช้ fallback และ ProcessSheet | ผ่าน |
| Browser regression ของ UI เดิม | ผ่านครบ 16 ชุด |

ตรวจภาพจริงจาก Chrome แล้วทั้ง desktop และ mobile ภาพและรายงานดิบอยู่ใน `test-results/model-integration/` และ `test-results/browser-audit.json` (Git ignored)

ปรับ browser test ให้รอการหยุดของกล้องก่อนเปรียบเทียบมุมมอง และรอข้อความแจ้งข้อมูลขั้นตอนว่าง/ผิดรูปแบบก่อนตรวจผล ไม่เปลี่ยนพฤติกรรมกล้องในแอปเพื่อให้ test ผ่าน การรันสุดท้ายมีคำเตือน `THREE.Clock` deprecated จาก dependency; เส้นทางปกติไม่มี console error

## ไฟล์งานเว็บ

- Asset: `public/models/dmr-machine.glb`, `public/models/README.md`
- Export/audit: `scripts/export_dmr_web.py`, `docs/model-export-audit.json`
- Viewer: `src/components/viewer/MachineModel.tsx`, `src/components/viewer/MachineViewer.tsx`, `src/simulation/camera.ts`
- Registry/config: `src/data/machine-parts.json`, `src/data/config.ts`
- หน้าตาและข้อความ: `src/App.tsx`, `src/styles/app.css`
- ตรวจรับ: `src/simulation/timeline.test.ts`, `tests/model-integration.cjs`, `tests/browser-audit.cjs`
- เอกสาร: `README.md`, `docs/animation-plan.md`, รายงานฉบับนี้

เอกสารวิเคราะห์ต้นทุน/อวกาศและโฟลเดอร์ `new-chat/` เป็นข้อมูลจากงานก่อนหน้า ไม่ใช่ส่วนที่ต้องเพิ่มเข้า production build

## ข้อจำกัดที่ต้องเก็บไว้ก่อนเริ่มอนิเมชัน

- R102 → F101 และตำแหน่ง tee เข้า R102 ยังไม่ได้รับการยืนยันจากข้อมูลเครื่อง
- ทางคืนน้ำต้องกำหนดจุดใช้งานและเกณฑ์อนุมัติให้ชัดเจน
- จุดต่อส่งผลิตภัณฑ์เข้าตู้แปรรูปยังเป็นรูปประกอบ ไม่ยืนยันวิธีขนถ่ายจริง
- กลุ่มอุปกรณ์อิงชื่อวัตถุและการจัดสมาชิกใน export; การมีท่อใน GLB ไม่ใช่หลักฐานยืนยันกระบวนการ
- โมเดลนี้เป็นรูปทรงนำเสนอ ไม่ใช่ CAD ที่ยืนยันขนาดและมวลจริง
- ไม่เพิ่มอนุภาค โมเลกุล การไหล ปฏิกิริยา หรือ Smart X-Ray ในช่วงนี้
- Browser tests ใช้ Chrome และการจำลอง viewport/touch บนเครื่องนี้ ไม่ใช่การวัด GPU บนโทรศัพท์จริง รุ่นนี้ยังมีประมาณ 647 draw calls ควรทดสอบประสิทธิภาพเครื่องเป้าหมายก่อนเพิ่มอนุภาคจำนวนมาก
- ไม่ commit, push หรือ deploy
