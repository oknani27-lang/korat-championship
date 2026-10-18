# DEMETER ReFeed — Simulator UX Fix + Regression Audit

18 ตุลาคม 2026 · โปรเจกต์เดิม `C:\Users\oknan\Downloads\korat championship`

## ผลลัพธ์

Start Demo เข้าสู่ Demo Mode บนหน้าเดิม โดยรักษาตำแหน่ง scroll, URL hash และ Canvas เดิม แผงข้อมูลเริ่ม Compact ตามเดิมและเปิดใช้ manual timeline เมื่อเข้าสู่ demo แล้ว ไม่มี autoplay หรือการสร้างแอนิเมชันวิทยาศาสตร์

## Root cause และการแก้

| ระดับ | ปัญหา / สาเหตุจริง | การแก้ |
|---|---|---|
| P1 UX | Start Demo ทั้งสองตำแหน่งเป็น `<a href="#results">` และเปิดแผง เมื่อคลิกจริง scrollY เปลี่ยน **0 → 621**, hash เป็น `#results`, viewer เหลือให้เห็นเพียงส่วนล่าง | เปลี่ยนเป็น `<button type="button">` ที่ dispatch `enter`; focus พื้นที่เครื่องด้วย `preventScroll: true`; ไม่เปลี่ยน hash และไม่ขยายแผงอัตโนมัติ |
| P2 | เดิม `stepAtProgress` เลือกขั้นตอนจาก progress รวมทั้งกระบวนการ จึง scrub แล้วเปลี่ยนขั้นตอน | เก็บ `currentStepId` แยกจาก `timelineProgress` 0–1 ภายในขั้นตอน; Previous/Next/step dots เป็นตัวเปลี่ยนขั้นตอน |
| P2 | การกดถัดไปรัวใน turn เดียวอ้าง index จาก render เก่า ทำให้บางคำสั่งไม่ถูกนับ พบระหว่าง regression | ส่งทิศทางการนำทางให้ reducer คำนวณจาก state ล่าสุด ป้องกันออกนอกขอบเขต |
| P2 | Previous/Next อยู่ในคอลัมน์ outputs ซึ่งถูก inert/ซ่อนเมื่อ Compact | ย้ายไป footer ร่วมกับ timeline นอกเนื้อหาที่ยุบได้ |
| P3 | ข้อความรอข้อมูลแสดงเสมอ แม้ fixture ของขั้นตอนมีสูตร/outputs แล้ว | แสดงข้อความรอเฉพาะส่วนที่ไม่มีข้อมูล; หากไม่มีสูตร ใช้ process explanation ที่มีอยู่ใน metadata |

บันทึกการทำซ้ำก่อนแก้: `baseline-scroll.json` ไม่ได้สรุปจากการอ่านโค้ดเพียงอย่างเดียว

## State และ timeline

- Reducer แหล่งเดียวเก็บ `demoMode`, `currentStepId`, `timelineProgress`, `selectedPartId`, `sheetExpanded` และ `playing`
- App, ProcessSheet และ viewer ใช้ state/metadata ชุดเดียว ไม่มี local step/progress/selected-part ที่แข่งขันกันใน production components
- Enter ครั้งแรกเปิดการควบคุม; กด Start Demo ซ้ำไม่ reset ความคืบหน้าหรือ remount Canvas
- เปลี่ยนขั้นตอนแล้วอัปเดต title, formula/process, outputs, indicator และ active step metadata พร้อม reset progress เป็น 0, หยุดเล่น และล้างชิ้นส่วนที่เลือกในการเปลี่ยน state เดียว
- Scrub 0–100% หรือย้อนกลับไม่เปลี่ยนขั้นตอน; Restart กลับ 0% ของขั้นตอนเดิม; เล่นจนจบหยุดที่ 100% โดยไม่ข้ามขั้นตอน
- Timer ทำงานเฉพาะตอนเล่น มี visibility/unmount cleanup; Tick ที่มาถึงหลังหยุดไม่เปลี่ยน progress
- Viewer รับ active step รวมถึง active parts และ camera focus metadata เดิม พร้อม selectedPartId จากส่วนกลาง ยังไม่ใช้ข้อมูลเหล่านี้สร้าง Auto Zoom/Smart X-Ray จริง
- เก็บ timeline ranges เดิมใน schema แต่ไม่ใช้เป็นตัวเลือกขั้นตอนจาก slider อีกต่อไป การแมปแอนิเมชัน/phase จริงต้องกำหนดเมื่อได้รับข้อมูลเครื่องและกระบวนการ

## Bottom Sheet

รักษา soft-white surface, typography, toolbar, navbar, hero และ placeholder geometry เดิม

- Expanded desktop ใช้ CSS Grid 3 คอลัมน์: step/ข้อมูลย่อ, สูตรหรือคำอธิบายกระบวนการ, outputs
- ไม่มีสูตรจะแสดง description ที่มีอยู่ในพื้นที่ process; ไม่มีการแต่งสูตรหรือข้อมูลใหม่
- Controls footer ใช้ grid แยกจากเนื้อหา จึงใช้ Previous/Next และ timeline ได้ทั้ง Compact/Expanded
- Tablet จัด 2 คอลัมน์แล้ว outputs ลงแถวถัดไป; mobile เรียงแนวตั้งและปุ่มนำทางแยกแถว ไม่ clip เนื้อหายาว
- ก่อนเข้าสู่ Demo timeline และ navigation disabled พร้อมข้อความเริ่มใช้งานในแผง; ส่วน 3D controls ยังสำรวจได้
- มี live status สำหรับโปรแกรมอ่านหน้าจอ, keyboard entry และ reduced-motion styles เดิม
- Hero ยังคงมีเพียงสองหัวข้อใหญ่และ Start Demo ไม่มีข้อความเล็กที่เคยสั่งลบ

## ไฟล์ที่เปลี่ยน

1. `src/App.tsx` — Demo buttons, shared controller, focus โดยไม่ scroll
2. `src/simulation/simulator.ts` — typed state และ reducer ใหม่
3. `src/simulation/useSimulator.ts` — shared state owner, playback timer/cleanup
4. `src/components/bottom-sheet/ProcessSheet.tsx` — controlled UI, per-step timeline, footer navigation และ pending states
5. `src/components/viewer/MachineViewer.tsx` — derived selection/active step, memo เพื่อข้าม render จาก timeline-only updates
6. `src/styles/app.css` — grid footer, content alignment, mobile stacking
7. `src/simulation/timeline.test.ts` — simulator reducer assertions
8. `tests/harness.tsx` — ใช้ controller จริงสำหรับ test fixtures
9. `tests/browser-audit.cjs` — regressions ใหม่และเปลี่ยน expectations จาก global timeline เป็น per-step
10. `SIMULATOR-UX-AUDIT.md` — สำเนารายงานนี้ในโปรเจกต์

ไม่เพิ่ม dependency, ไม่แก้ geometry, research/process JSON, Blender หรือระบบ deploy

## Tests ที่รันจริง

| Check | ผล |
|---|---|
| `npm run typecheck` | ผ่าน strict app + tests |
| `npm run lint` | ผ่าน ESLint + Oxlint |
| `npm test` | ผ่าน รวม enter/idempotence, per-step progress, navigation, boundaries, selected part reset, stale ticks, completion/restart และ missing steps |
| `npm run build` | ผ่าน มี size warning เดิมของ viewer |
| `npm run test:browser` | ผ่าน **16 กลุ่ม** |
| Production smoke | ผ่าน 1440, 1280, 768, 390, 320px |

Browser regression รวม Start Demo จากบนหน้า/กดซ้ำ/คีย์บอร์ด, Canvas และ geometry identity, Compact/Expanded, multi-step metadata/formula/outputs, rapid navigation, forward/reverse scrubbing, Play/Pause/Restart, สลับขั้นตอนขณะเล่น, hidden-tab/timer/unmount cleanup, long content, Orbit/Zoom/Pan/Reset, touch/pinch, Research/filter/empty state และ loading/mapping/WebGL error fallbacks เดิม

Production ทดสอบ Start Demo ซ้ำทั้งตำแหน่ง scroll **0 และ 80px** ในทั้ง 5 ขนาดจอ: ทุกกรณี scroll และ hash ก่อน/หลังเท่ากัน Canvas DOM เดิมและพื้นที่เครื่องยังอยู่ใน viewport ตรวจ reduced-motion ที่ 320px ด้วย

Production normal flow: **0 console errors, 0 network failures** ส่วน fault-injection tests จงใจสร้าง errors เพื่อตรวจ fallback

หลักฐาน: `verified/browser-audit.json`, `production-smoke.json`

## Performance และสิ่งที่ยังไม่ยืนยัน

- ไม่มี animation loop ใหม่; ใช้ timer UI 100ms เฉพาะเมื่อเล่น และ renderer แบบ demand เดิม
- Viewer ถูก memo และรับเฉพาะ step/selection ที่จำเป็น ไม่รับ progress ที่เปลี่ยนทุก tick
- Regression วัด idle 700ms พบ 0 frames เพิ่ม; placeholder 12 geometries / 3 textures ไม่ใช่การวัด FPS ของเครื่องจริง
- Production viewer 947.61 KB / gzip 253.00 KB ยังมี bundle-size warning; GLTF module ยังแยก lazy เช่นเดิม
- ยังมีคำเตือน `THREE.Clock` จาก React Three Fiber ไม่มีการซ่อนหรือ patch dependency
- Production มีขั้นตอน placeholder ที่ใช้งานได้เพียงหนึ่งขั้นตอน จึง disabled Previous/Next ตามขอบเขต การทดสอบหลายขั้นตอนใช้ fixtures ที่ระบุชัดว่าเป็น UI test เท่านั้น
- ยังไม่มี GLB/Auto Zoom/Smart X-Ray/การไหลจริง; ไม่เปลี่ยน placeholder geometry หรือสร้างข้อมูลวิทยาศาสตร์
- ทดสอบ Chrome + software WebGL และ touch emulation ยังไม่ได้ทดสอบ Safari/Firefox, มือถือ/GPU จริง หรือประสิทธิภาพโมเดลจริง

## ภาพหลังแก้

- `desktop-1440.png` — desktop viewport, Demo Mode + Compact
- `expanded-1440.png` — desktop หน้าเต็ม, Expanded
- `desktop-1280.png`, `desktop-768.png`, `desktop-390.png`, `desktop-320.png`
- `expanded-390.png` — mobile หน้าเต็ม, Expanded

ตรวจภาพ desktop/mobile ด้วยสายตาแล้ว คง visual direction เดิม แผงข้อมูลและ controls ไม่ทับกัน

ไม่ได้ push GitHub หรือ deploy
