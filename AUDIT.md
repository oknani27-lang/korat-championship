# DEMETER ReFeed — Phase 1 Bug Audit & Fix

วันที่: 18 ตุลาคม 2026 (Asia/Bangkok)

โครงการ: `C:\Users\oknan\Downloads\korat championship`

**Verdict: พร้อมสำหรับ first GitHub push ในฐานะ Phase 1 UI foundation** พร้อมข้อจำกัดด้าน dependency และฟีเจอร์ที่ยังรอโมเดลจริงด้านล่าง ไม่ใช่ scientific simulator ฉบับสมบูรณ์

ตรวจและแก้ในโฟลเดอร์เดิม ไม่เปลี่ยนแนวดีไซน์ ไม่แก้ Blender/FBX ไม่ใส่ข้อมูลวิทยาศาสตร์ และไม่ได้ init Git, commit, push หรือ deploy โฟลเดอร์ยังไม่มี `.git`

## ขอบเขตที่ตรวจ

อ่าน source ทั้ง navbar, bottom sheet, timeline, viewer, loader, data/types, CSS, entry point, Vite/TypeScript/lint config, dependencies, tests, README และรายงาน Phase 1 เดิม ประเมินการใช้เป็นเว็บ client-side สำหรับผู้ใช้หนึ่งคนต่อแท็บ ไม่มี backend หรือข้อมูลร่วมระหว่างผู้ใช้

ดีไซน์เดิมคงไว้: white navbar, botanical green, graphite viewport, vertical toolbar, white bottom sheet ตรวจภาพ desktop/mobile หลังแก้ ยังไม่มี approved screenshot แยกให้เทียบแบบ pixel-perfect

## บั๊กที่แก้แล้ว

P1 = สูง, P2 = กลาง, P3 = ต่ำ

| # | ระดับ | อาการและสาเหตุ | การแก้ / หลักฐาน |
| --- | --- | --- | --- |
| 1 | P1 | ดาวน์โหลด lazy viewer module ไม่สำเร็จแล้ว error หลุดออกจาก Suspense ได้ เพราะ boundary เดิมอยู่ภายใน module ที่ยังโหลดไม่ได้ | วาง `ViewerBoundary` ครอบ lazy import จาก App ทดสอบ abort module แล้ว process sheet และ timeline ยังใช้ได้ มีข้อความแจ้งพร้อม reload |
| 2 | P2 | Reset หลังหมุนทันทีไม่คืนมุมเริ่มต้นอย่างนิ่ง: OrbitControls ยังมี spherical/pan damping ค้างอยู่ | flush damping ก่อน reset ทั้งสองปุ่มใช้ฟังก์ชันเดียวกัน ทดสอบตำแหน่งกล้อง/target ก่อนหลังด้วย tolerance 1e-5 |
| 3 | P2 | WebGL context หายแล้ว viewport หยุดทำงานโดยไม่มีสถานะชัดเจน toolbar ยังรับคำสั่ง | ฟัง context loss/restoration พร้อม cleanup แสดงข้อความและปิด camera controls ชั่วคราว ทดสอบด้วย `WEBGL_lose_context` จริงและ restore ได้ |
| 4 | P2 | กดเมนู “ผลลัพธ์” หลังย่อแผงแล้วเนื้อหายังซ่อนอยู่: anchor อย่างเดียวไม่เปลี่ยน expanded state | ยก expanded state ไปยัง App ให้ navigation เปิดแผงก่อนเลื่อนไปจุดหมาย ทดสอบมือถือและ hash |
| 5 | P2 | โหมด Zoom บนมือถือยังหมุนโมเดลเมื่อใช้หนึ่งนิ้ว: touch mapping ยังคง Rotate | ปิดการหมุนในโหมด Zoom และระบุวิธีใช้สองนิ้ว ทดสอบ one-finger rotate/pan และ pinch zoom ผ่าน touch events ของ Chrome |
| 6 | P2 | เลือกชิ้นส่วนไม่พบเมื่อชื่อ registry อยู่บน parent assembly และ hover marker อาจบัง raycast | ค้นจาก mesh ขึ้นตาม parent chain และปิด raycast ของ marker ทดสอบ pure helper และ synthetic glTF ที่มี NamedAssembly → MeshChild พร้อม hover/click |
| 7 | P2 | ชื่อยาว/สูตรที่ไม่มีจุดตัดคำถูก clip ภายใน grid แม้ทั้งหน้าไม่เกิด horizontal scrolling | กำหนด min-width:0, overflow-wrap:anywhere และจำกัดความกว้างสูตร เทียบ CSS เดิมใน harness แล้ว panel overflow=true; CSS ที่แก้=false |
| 8 | P2 | เมื่อเติม JSON สูตร/พิกัดที่ถูกต้อง โค้ดเดิมอาจ build ไม่ผ่าน: JSON import ให้ kind:string และ coordinates:number[] ซึ่งไม่ตรง literal union/tuple ของ types | พิสูจน์ TS2322 จาก valid JSON fixture แล้วใช้ parsers ตรวจ token kinds, finite vectors, IDs และ timeline ก่อนคืน typed data มี positive/negative tests ไม่ได้ใช้ unchecked cast |
| 9 | P3 | ไทม์ไลน์ยังมี interval 100ms ตลอดเวลาขณะซ่อนแท็บ เพราะเช็ก document.hidden เฉพาะภายใน callback | หยุด interval เมื่อ hidden และเริ่มนับเวลาใหม่เมื่อกลับมา ทดสอบ virtual clock 60 วินาที มี 0 timer ขณะ hidden และไม่มี progress jump |

ปรับเพิ่มเติมโดยคงรูปลักษณ์เดิม: Escape ปิดเมนูและคืน keyboard focus, เพิ่ม aria-controls, ปิด live announcement ของ output ที่อัปเดตถี่ และตัด onChange/invalidate ที่ซ้ำกับการทำงานภายใน Drei เพื่อลดการผูก listener ใหม่เมื่อ UI rerender

## ไฟล์ที่แก้/เพิ่ม

| ไฟล์ | เปลี่ยนอะไร |
| --- | --- |
| `src/App.tsx` | viewer boundary, expanded state, navigation และ keyboard focus |
| `src/components/viewer/ViewerBoundary.tsx` (ใหม่) | fallback เมื่อ lazy module, renderer หรือ model โหลดไม่สำเร็จ |
| `src/components/viewer/MachineViewer.tsx` | damping reset, touch Zoom, context loss/recovery, disabled controls, ลด callback ซ้ำ |
| `src/components/viewer/MachineModel.tsx` | ancestor mapping และ marker ที่ไม่บังการคลิก |
| `src/components/bottom-sheet/ProcessSheet.tsx` | controlled expanded state, typed testable steps, visibility-aware interval cleanup, aria-live |
| `src/simulation/parts.ts` (ใหม่) | shared named-part lookup |
| `src/data/parse.ts` (ใหม่), `src/data/config.ts` | JSON validation ที่รองรับ formula union และ vector tuples |
| `src/styles/app.css` | error/context feedback และป้องกันเนื้อหายาวถูกตัด |
| `src/simulation/timeline.test.ts` | เพิ่ม assertions สำหรับ timeline, parts และ JSON validation |
| `tests/browser-audit.cjs`, `tests/harness.html`, `tests/harness.tsx` (ใหม่) | browser regressions และ UI/synthetic-model fixtures ที่ไม่รวมใน production build |
| `eslint.config.js`, `tsconfig.tests.json` (ใหม่) | ESLint และ type-check tests |
| `package.json`, `package-lock.json` | เพิ่ม eslint/typescript-eslint เฉพาะ dev และ scripts lint/typecheck/test:browser |
| `.gitignore`, `README.md`, `AUDIT.md` | ไม่ track test artifacts พร้อมวิธีทดสอบและข้อจำกัด |

ไม่ได้แก้ process-steps.json, machine-parts.json, flow-paths.json หรือเพิ่มโมเดลจริง ไม่มี production dependency ใหม่

## Tests ที่รันจริง

| คำสั่ง/การตรวจ | ผล |
| --- | --- |
| `npm run typecheck` | PASS — `tsc -b` และ test/harness type checking |
| `npm run lint` | PASS — ESLint และ Oxlint ไม่มี lint warnings |
| `npm test` | PASS — boundaries, invalid ranges, bidirectional seek, playback clamp, parent lookup, JSON token/vector/ID validation |
| `npm run build` | PASS — production build; มี advisory เรื่อง viewer chunk >500 kB |
| `npm run test:browser` | PASS — 10 suites ด้านล่าง |
| Production preview smoke | PASS — Canvas, Zoom/Reset, scrub 75%; console errors=0 และ network failures=0 |
| `npm audit --omit=dev` | PASS — 0 reported vulnerabilities ใน production dependency tree ณ เวลาตรวจ |

Browser suites:

1. Layout, anchors, ผลลัพธ์ขณะแผงย่อ, Escape/focus; ขนาด 1440, 1024, 768, 580, 390 และ 320 px
2. Orbit, pan, zoom drag/wheel/buttons, min/max zoom, Reset, resize, scene/geometry identity และ idle rendering
3. Timeline play/pause/restart, 0–100%, reverse scrub, three-step boundaries, switching during playback, rapid double-click, completion/replay, hidden-tab interval, unmount/remount cleanup
4. Long titles และ formula tokens บน desktop/mobile
5. Mobile one-finger rotation/pan, one-finger ไม่หมุนใน Zoom mode และ two-finger pinch zoom
6. Real WebGL context loss/recovery พร้อม UI state
7. ไม่มี WebGL แล้ว fallback ไม่ทำให้ process UI หาย
8. Lazy module โหลดล้มเหลวแล้วแสดง boundary แทน crash ทั้งหน้า
9. Synthetic glTF parent selection/hover และ Canvas disposal
10. Missing glTF แล้ว error ถูกจับโดย boundary

ชุดทดสอบ failure cases ตั้งใจทำให้เกิด WebGL creation error, module request abort และ missing-model 404 จึงมี expected console/network errors บันทึกใน `browser-audit.json` ไม่ได้ลบหรือปิด error logging ส่วนเส้นทางใช้งานปกติทั้งหมดตรวจแล้วไม่มี errors/network failures

## Performance findings

- ยืนยันว่า idle renderer เพิ่ม **0 frames ในช่วงวัด 700 ms** หลังหยุด interaction ก่อน resize ไม่ได้แปลว่ารับประกัน FPS
- Scene และ geometry UUID เดิมตลอดการสลับ Parts/X-Ray 8 รอบ, renderer memory counter คงเดิมที่ 12 geometries / 3 textures ใน fixture ปัจจุบัน ไม่พบการเพิ่มสะสมจากการทดสอบนี้
- Canvas ไม่ remount เมื่อ resize; synthetic-model unmount เรียก renderer.dispose หนึ่งครั้ง และ R3F root ถูกถอดออก
- Timer มี 1 ตัวขณะเล่น, 0 เมื่อหยุด/จบ/ซ่อนแท็บ/unmount; listener visibility ถูกถอดเมื่อ unmount
- ยังใช้ demand rendering, DPR 1–1.5, contact shadow ความละเอียดต่ำหนึ่งเฟรม ไม่มี postprocessing/physics/environment texture downloads
- Build ล่าสุด: UI 239.05 kB (gzip 75.57 kB), viewer 949.75 kB (gzip 253.44 kB), CSS 24.01 kB (gzip 6.35 kB) รักษาการแยกโหลด viewer ไม่ปิด Vite chunk advisory
- ไม่วัด CPU/GPU utilization ของอุปกรณ์จริงหรือ heap ระยะหลายชั่วโมง Chrome ทดสอบใช้ software WebGL จึงไม่อ้าง 60 FPS หรือรับประกันประสิทธิภาพบนมือถือจริง

## ข้อจำกัดที่เหลือ

1. **Upstream deprecation warning:** R3F 9.8.2 เรียก `new THREE.Clock()` ภายใน ขณะที่ Three.js เลิกแนะนำ Clock ตั้งแต่ r183 ดู [Three.js docs](https://threejs.org/docs/pages/Clock.html) Warning เกิดทั้ง dev และ production แต่ไม่ทำให้ใช้งานล้มเหลว ไม่ได้ suppress console, patch dependency หรือเปลี่ยน renderer major เพียงเพื่อปิดข้อความนี้
2. Viewer bundle ยังเกิน 500 kB minified ต้องวัดจริงอีกครั้งเมื่อมีโมเดล ไม่ใช่ build failure
3. GLB จริง, material highlighting เต็มรูปแบบ, Smart X-Ray ภายในเครื่อง, Camera Auto Zoom, fluid/flow animation และ science data ยังไม่ทำตาม scope
4. GLTF selection ตรวจด้วย rigid synthetic triangle/parent assembly ไม่ใช่ DMR จริง GLB cache ยังเป็นของ useGLTF; animated/skinned model ต้องวางแผน clone/disposal ตามประเภทข้อมูล
5. ยังไม่ได้ทดสอบ Firefox/Safari, screen reader จริง, GPU มือถือจริง หรือ pixel-perfect เทียบ approved screenshot ที่ยังไม่ได้ส่งมา

## GitHub readiness

**พร้อม push เป็น Phase 1 foundation**: checks ผ่าน, ไม่มี confirmed blocker ที่ยังไม่แก้ในขอบเขตนี้ และไม่มี runtime/network errors ในเส้นทางปกติ ต้องระบุว่าเครื่อง/ข้อมูลยังเป็น preview และยอมรับ known warnings ด้านบน

โฟลเดอร์ยังไม่ใช่ Git repository; เมื่อผู้ใช้สั่งขั้นถัดไปจึงค่อย init/review staged files/commit/push ไม่ได้ทำขั้นตอนเหล่านี้ใน audit นี้

## วิธีรันทดสอบซ้ำ

```powershell
Set-Location 'C:\Users\oknan\Downloads\korat championship'
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

อีก terminal ใช้ Playwright ที่ติดตั้งอยู่ (ถ้า resolve package ได้อยู่แล้ว ไม่ต้องตั้ง module path):

```powershell
$env:DMR_PLAYWRIGHT_MODULE = 'C:\path\to\node_modules\playwright'
npm run test:browser
```

ไม่พบการแก้โมเดล Blender หรือข้อมูลวิทยาศาสตร์ระหว่างงานนี้ ไม่ได้ push/deploy
