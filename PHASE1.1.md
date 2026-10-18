# DEMETER ReFeed — Phase 1.1

โครงการ: `C:\Users\oknan\Downloads\korat championship`

**เสร็จตามขอบเขต Phase 1.1** พัฒนาจากโครงการเดิม ไม่สร้างโครงการซ้ำ ไม่เพิ่ม dependency และไม่ได้ push/deploy

## 1. Bottom Sheet

- เริ่มหน้าเว็บแบบ **Compact** แสดงหมายเลขขั้นตอน ชื่อ คำอธิบายชื่อขั้นตอน ปุ่ม/handle ขยาย และ Manual Timeline
- Expanded แสดง process, chemistry และ outputs ครบสามคอลัมน์บน desktop และเรียงตามแนวตั้งบน mobile
- ย้ายแผงให้ต่ำลงโดยใช้ normal document flow และ responsive spacing แทน negative overlap; viewer ใช้ความสูงแบบ clamp/svh
- ไม่ปิดบัง toolbar ด้านขวาหรือ Timeline ขยายแล้วข้อมูลทั้งหมดเลื่อนอ่านได้ ไม่มี fixed-height container ที่ตัดเนื้อหา
- ใช้ CSS grid/opacity transition และ inert สำหรับส่วนที่ย่อ รองรับ reduced motion
- กดเมนู “ผลลัพธ์” จะเปิด Expanded ให้เอง การย่อ/ขยายไม่ reset กล้องหรือสร้าง Canvas/timer ซ้ำ
- เพิ่มพื้นที่สัมผัสของ slider โดยคงเส้น timeline บางตามดีไซน์

## 2. Research & References

เพิ่ม navigation **งานวิจัย** ไปยัง `#research` ซึ่งใช้โทนสีและ typography เดิม

ข้อมูลอยู่ใน `src/data/research.json` ปัจจุบันมีเพียง `[]` ไม่มีการสร้างบทความ ผู้เขียน DOI หรือแหล่งข้อมูลทางวิทยาศาสตร์ขึ้นเอง

`ResearchPaper` รองรับ:

- `id`, `title`, `authors`, `year`, `publication`
- optional `doi`, `sourceUrl`, optional `pdfUrl`
- `summary`, `processIds`
- `supports`, `limitations`, `unverifiedClaims`

แสดงข้อมูลหลัก ฐานหลักฐาน ข้อจำกัด และสิ่งที่ยังไม่ยืนยันแยกกัน ไม่ถือว่าการเชื่อม reference เป็นการรับรองข้อกล่าวอ้างโดยอัตโนมัติ

เพิ่มเอกสารจริงได้ใน JSON โดยไม่เปลี่ยน layout รองรับ keyword search และ process filter แล้ว ขณะไม่มีเอกสารจะแสดง empty state ที่ชัดเจนและปิดตัวกรองที่ยังใช้ไม่ได้

URL ผ่าน validation ให้เป็น HTTP(S); PDF รองรับ path ภายในเว็บไซต์ด้วย DOI เป็น optional และสร้าง resolver URL โดย encode แต่ละส่วน External links ใช้ noopener/noreferrer

## 3. โครงสร้างเตรียมเครื่องและกระบวนการ

- คง component ID (`MachinePart.id`) และ exact GLB node/assembly name (`nodeName`)
- เพิ่ม optional `xrayNodeNames` และ named `connectionPoints`
- เพิ่ม optional `FlowPath.from`/`to` โดยอ้าง `partId` + `connectionId`; ยังคง world-space path points
- ProcessStep รองรับ optional `activeXrayParts`, `researchIds` และ `timeline.phases`
- phases ใช้ normalized progress 0–1 และต้องอยู่ภายในช่วงขั้นตอน สามารถ overlap ได้เพื่อเตรียม parallel effects ในอนาคต
- ตรวจ unknown process/part/flow/research IDs, missing connection points และ duplicate node mappings พร้อมแสดงปัญหาในหน้าเว็บ
- คงโครง cameraFocus, formula tokens, process descriptions และ outputs เดิม
- เพิ่ม `viewerQuality` สำหรับ DPR และ contact-shadow enable/resolution โดยไม่เพิ่มเมนูหรือเอฟเฟกต์หนัก

ไม่ได้สร้าง geometry เครื่องจริง ไม่แก้ Blender/FBX ไม่ทำ fluid animation, internal Smart X-Ray หรือ Camera Auto Zoom animation

## 4. Loading / Errors

| กรณี | พฤติกรรม |
| --- | --- |
| GLB กำลังโหลด | แสดง status ใน DOM โดยคง Canvas เดิม |
| ไม่พบไฟล์ / โหลดไฟล์ไม่ได้ | แสดง placeholder ที่ระบุชัด พร้อมชื่อไฟล์และ error detail จริง; ส่วนอื่นยังใช้ได้ |
| Node mapping ไม่ตรง | แสดงรายการ node ที่ไม่พบ และปิดเฉพาะรายการ Parts ที่ใช้ไม่ได้ |
| ข้อมูลกระบวนการหาย/ไม่ผ่าน validation | แสดงข้อความรอข้อมูล/ข้อผิดพลาด ไม่เริ่ม timeline และไม่ crash ทั้งหน้า |
| WebGL initialization fail | viewer boundary แสดง fallback และรายละเอียด ส่วนข้อมูล/งานวิจัยยังอยู่ |
| WebGL context หลุด | แจ้งสถานะ ปิด camera controls ชั่วคราว และกลับมาใช้ได้เมื่อ restore |

การเปลี่ยน model source ไม่สร้าง Canvas ใหม่ สถานะ loading/error/mapping ผูกกับ URL เพื่อไม่ใช้ error ของไฟล์เดิมกับไฟล์ใหม่ Shadow สร้างใหม่เมื่อโหลดโมเดลหรือ restore WebGL แทนเก็บ texture ว่างไว้

ไม่ suppress console errors ที่เกิดจริง Negative tests ตั้งใจสร้าง network/GL errors และเก็บรายละเอียดเหล่านั้นไว้ในผลทดสอบ

## 5. ไฟล์ที่แก้/เพิ่ม

| ไฟล์ | หน้าที่ |
| --- | --- |
| `src/App.tsx` | default Compact, Research navigation/section และ configuration notices |
| `src/components/bottom-sheet/ProcessSheet.tsx` | compact summary และ missing-metadata state |
| `src/components/research/ResearchSection.tsx` (ใหม่) | empty state, paper layout, search/filter |
| `src/types/research.ts` (ใหม่) | ResearchPaper contract |
| `src/data/research.json` (ใหม่) | รายการเอกสารจริง ปัจจุบันว่าง |
| `src/data/research.ts` (ใหม่) | pure keyword/process filter |
| `src/types/machine.ts` | connection points, endpoints, X-Ray IDs, research references, timeline phases, mapping issues, quality |
| `src/data/parse.ts`, `src/data/config.ts` | validation, safe loading, reference checks และ quality configuration |
| `src/simulation/parts.ts` | ตรวจ GLB node mappings |
| `src/components/viewer/MachineViewer.tsx` | model lifecycle, statuses, quality และ error fallback โดยใช้ Canvas เดิม |
| `src/components/viewer/MachineModel.tsx` | ready callback และตรวจ registry/X-Ray nodes กับ scene |
| `src/components/viewer/ViewerBoundary.tsx` | fallback/error callback และรายละเอียด error |
| `src/styles/app.css` | responsive viewer/sheet, research styles และ status panels |
| `src/simulation/timeline.test.ts` | research/schema/mapping tests เพิ่มจาก tests เดิม |
| `tests/browser-audit.cjs`, `tests/harness.tsx` | coverage รวม 14 suites และ UI-only fixtures |
| `index.html`, `README.md`, `PHASE1.1.md` | metadata และเอกสารการเพิ่มข้อมูล/โมเดล |

ไม่เพิ่ม backend/database/dependency ไม่ใส่จริงหรือแก้ข้อมูลวิทยาศาสตร์ใน process JSON เดิม ไม่เปลี่ยนโครงสร้างโครงการโดยรวม

## 6. ผลทดสอบที่รันจริง

| รายการ | ผล |
| --- | --- |
| `npm run typecheck` | PASS — app, configuration, unit tests และ harness |
| `npm run lint` | PASS — ESLint + Oxlint ไม่มี lint warnings |
| `npm test` | PASS — timeline/parts/research/validation/filtering |
| `npm run build` | PASS — มี advisory เรื่อง viewer chunk size |
| `npm run test:browser` | PASS — 14 suites |
| Production smoke | PASS — Compact/Expanded, Zoom/Reset, timeline scrub, Research, mobile layout; console errors=0, network failures=0 |

Browser coverage รวม:

1. Compact default, Expanded desktop สามคอลัมน์, navigation และ keyboard menu
2. Orbit/Pan/Zoom/Reset, min/max limits, resize, scene identity และ idle rendering
3. Timeline/step boundaries, reverse scrub, playback, switching steps, hidden tab และ unmount cleanup
4. Long labels/formulas
5. Mobile rotate/pan/pinch zoom
6. WebGL context loss/recovery
7. WebGL ใช้งานไม่ได้แต่ส่วนข้อมูลยังอยู่
8. Lazy viewer module โหลดล้มเหลว
9. Synthetic glTF selection/hover และ renderer disposal
10. Missing glTF และ error boundary
11. Research navigation, empty state, search, combined filtering และ clear filters
12. Metadata ว่าง/ไม่ผ่าน validation แล้วแสดงปัญหาแทน crash
13. Deferred model loading, quality DPR=1 และ invalid mappings
14. Missing-model fallback แล้วเปลี่ยน source สำเร็จโดยไม่ remount Canvas

ตรวจ responsive ที่ความกว้าง 1440, 1150, 1101, 1024, 768, 580, 390 และ 320 px พร้อมตรวจภาพ desktop/mobile จริงจาก browser ไม่พบ horizontal overflow ในรายการทดสอบ

Fixtures ใน test harness เป็นข้อมูลทดสอบ UI/synthetic triangle ที่ระบุชัดว่าไม่ใช่งานวิจัยหรือ DMR จริง ไม่รวมใน production build

## 7. Performance / ข้อจำกัด

- Demand rendering ยังทำงาน: วัดได้ 0 เฟรมเพิ่มในช่วง idle 700 ms หลัง interaction หยุด
- การสลับ UI ไม่เปลี่ยน scene/geometry UUID หรือเพิ่ม geometry/texture counters ใน test เดิม
- DPR default 1–1.5, shadow 128px หนึ่งเฟรม, ไม่มี postprocessing/physics/environment texture ขนาดใหญ่
- มี Canvas เดียวในหน้า และ source replacement tests ยืนยัน scene เดิม
- Production bundle: UI 249.46 kB (gzip 78.32 kB), viewer 1,017.59 kB (gzip 273.20 kB), CSS 30.58 kB (gzip 7.68 kB)
- Vite ยังเตือน viewer chunk >500 kB; เก็บการ lazy-load ไว้ ไม่ซ่อนคำเตือน
- ยังมี upstream `THREE.Clock` deprecation warning จาก R3F/Three.js เดิม ไม่ได้ patch dependencies หรือ suppress console
- Browser QA ใช้ Chrome/software WebGL ไม่ใช่ benchmark GPU มือถือจริง ไม่อ้าง FPS
- ยังไม่มี GLB DMR, research papers ที่ยืนยันแล้ว, fluid simulation หรือ Smart X-Ray ภายในให้ตรวจจริง และยังไม่มี approved screenshot แยกสำหรับเทียบ pixel-perfect

## 8. ความพร้อมเชื่อม GLB

โครงเชื่อมและ error paths พร้อมสำหรับขั้นถัดไป แต่ยังไม่ถือว่า DMR integration เสร็จ:

1. ใส่ไฟล์ที่ผ่านการตรวจใน `public/models/dmr-machine.glb`
2. ตั้ง `modelUrl` ใน `src/data/config.ts`
3. ใส่ node/component registry และจุดเชื่อมต่อที่ตรงกับเครื่องจริง
4. ปรับ initial camera/target ตาม bounds และหน่วยของโมเดลจริง
5. ใส่เอกสารจริงใน `research.json` และเชื่อม process IDs; แยก supported evidence/limitations/unverified claims ตามเอกสาร
6. เมื่อข้อมูลพร้อมจึงเชื่อม normalized progress ไปยัง flow/X-Ray/fluid level/camera controllers และทดสอบบนอุปกรณ์จริง

วิธีเปิดยังเหมือนเดิม: เปิดโฟลเดอร์ใน VS Code แล้วรัน `npm run dev` รายละเอียด contracts และคำสั่ง tests อยู่ใน README

ไม่ได้ push หรือ deploy และไม่ได้แก้ Blender model ระหว่าง Phase 1.1
