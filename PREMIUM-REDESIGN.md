# DEMETER ReFeed — Premium UI / Hero Cleanup

วันที่ตรวจ: 18 ตุลาคม 2026

## ผลลัพธ์

ปรับโปรเจกต์เดิมที่ `C:\Users\oknan\Downloads\korat championship` เป็นโทน white studio ตามภาพอ้างอิง โดย hero ฝั่งซ้ายมีเพียง 3 องค์ประกอบ: `DEMETER ReFeed`, `Turn Waste Into New Value` และ `Start Demo` ไม่มี tagline, supporting paragraph, helper caption หรือปุ่มแนะนำวิดีโอในส่วนนี้

- จัดหัวข้อใหญ่ฝั่งซ้าย โมเดลฝั่งขวา และพื้นที่ว่างใหม่ พร้อม navbar Overview / Research / Technology
- Start Demo ทั้ง navbar และ hero เปิดแผงข้อมูลและนำไปที่ results
- Toolbar หลักเหลือ Rotate / Zoom / X-Ray / Reset; Pan / Normal / Parts อยู่ในเมนูเพิ่มเติม ใช้คีย์บอร์ดได้และ Escape คืน focus
- แผงล่างเป็น soft white เริ่ม Compact; Expanded มี 3 คอลัมน์บน desktop และเรียงตามหน้าจอเล็ก ไทม์ไลน์ยังเข้าถึงได้
- ใช้ Inter และ Noto Sans Thai แบบ self-hosted พร้อม preload, font-display: optional และไฟล์ลิขสิทธิ์ ไม่มี runtime font CDN หรือ dependency ใหม่
- เก็บ Research, search/filter, typed schemas, loading/error states และ controls เดิม ไม่เปลี่ยนข้อมูลวิทยาศาสตร์

## สิ่งที่พบและแก้

| ระดับ | ปัญหา / สาเหตุ | การแก้ |
|---|---|---|
| P2 ด้านภาพ | Hero และพื้นหลังเดิมไม่ตรงข้อกำหนดใหม่: ข้อความรองใน App และ CSS โทนเข้ม | ลบข้อความรอง เปลี่ยนเฉพาะ composition/styles และเพิ่ม assertion ว่า hero มี 3 องค์ประกอบเท่านั้น |
| P3 | ระบุชื่อ Inter/Noto Sans Thai ใน CSS แต่ไม่มีไฟล์ฟอนต์ ทำให้ขึ้นกับฟอนต์เครื่อง | เพิ่ม WOFF2 ในโปรเจกต์ ตรวจผ่าน Chrome CDP ว่าใช้ Noto Sans Thai จริง |
| P2 regression ระหว่างพัฒนา | เมนูเพิ่มเติมที่เปิดค้างบัง Reset บนมือถือ | จัดตำแหน่งเปิดไปซ้าย ปิดหลังเลือกคำสั่ง/Escape และเว้นระยะ toolbar; มี regression assertion |
| P3 regression ระหว่างพัฒนา | ป้าย placeholder ชนปุ่ม zoom บน tablet | แยกตำแหน่งป้ายตาม breakpoint; production test ตรวจกรอบไม่ทับกัน |

Baseline ไม่พบ functional failure จากชุดทดสอบที่มีอยู่ ไม่มีการยืนยันว่าปราศจากบั๊กทุกกรณี เปิด TypeScript strict เพิ่มแล้วผ่านทั้งแอปและ test harness

## ไฟล์ที่แก้ / เพิ่ม

- `src/App.tsx` — hero, branding, navigation, Start Demo
- `src/styles/app.css` — white studio layout, responsive toolbar/menu, panels และ neutral palette
- `src/index.css` — local fonts, fallback order และสีพื้นฐาน
- `src/components/viewer/MachineViewer.tsx` — 4 primary controls, secondary menu, lazy model module
- `index.html` — font preloads และ theme color
- `tsconfig.app.json` — strict checking
- `tests/browser-audit.cjs` — hero assertions, 1280px coverage, navigation/menu และ overlap regressions
- `public/fonts/inter-latin.woff2`, `public/fonts/noto-sans-thai.woff2`, OFL ทั้งสองไฟล์ และ `README.txt`
- `PREMIUM-REDESIGN.md` — สำเนารายงานนี้ในโปรเจกต์

ไม่ได้แก้ process/research/parts data, package dependencies หรือ Blender

## การทดสอบที่รันจริง

| Check | Baseline | หลังแก้ |
|---|---|---|
| `npm run typecheck` | ผ่าน | ผ่าน รวม strict |
| `npm run lint` | ผ่าน | ผ่าน ESLint + Oxlint |
| `npm test` | ผ่าน | ผ่าน timeline, parts, research, config validation/filtering |
| `npm run build` | ผ่าน พร้อม size warning | ผ่าน พร้อม size warning ตามด้านล่าง |
| `npm run test:browser` | ผ่าน 14 กลุ่ม | ผ่าน 14 กลุ่ม รวม assertion ใหม่ |
| Production Chrome smoke | — | ผ่านที่ 1440, 1280, 768, 390, 320px |

Browser regression ครอบคลุม Orbit/Pan/Zoom/Reset และขอบเขต, touch/pinch, resize, camera/scene persistence, idle rendering, rapid timeline actions, reverse scrubbing, step changes, hidden tab/timer cleanup/unmount, long text/formula overflow, Research filter/empty state, GLTF fixture selection/hover/disposal, loading/missing GLB/invalid mapping/source replacement และ WebGL failure/recovery

Production smoke ตรวจ hero exact contents, 4 controls, menu action/Escape, ไม่มี horizontal overflow หรือ control/status overlap, Compact/Expanded, Start Demo, timeline seek, Research และฟอนต์ที่ใช้จริง พบ **0 console errors และ 0 network failures** ใน flow ปกติ ส่วน failure fixtures จงใจสร้าง error เพื่อตรวจ fallback

หลักฐาน: `baseline/browser-audit.json`, `verified/browser-audit.json`, `production-smoke.json`

## Performance

- Scene ยัง render แบบ demand; วัดได้ 0 frames เพิ่มในช่วง idle 700ms, 12 geometries / 3 textures ใน placeholder fixture ไม่ใช่ผล FPS บน GPU ผู้ใช้
- สลับ UI แล้ว scene/geometry identity ไม่เปลี่ยน; Canvas dispose และ root removal ผ่านชุดทดสอบ
- แยก MachineModel/GLTF loader แบบ lazy: initial viewer chunk ลดจาก **1,017.59 KB → 947.23 KB** (gzip 273.20 → 252.83 KB)
- Model chunk 72.15 KB / gzip 21.40 KB; production ยืนยันว่าไม่ได้ request chunk นี้เมื่อไม่มี model URL
- ฟอนต์ใหม่รวม 75,180 bytes เป็น visual asset เพิ่ม จึงไม่อ้างว่า total first load ลดลงจากการแยก JS เพียงอย่างเดียว
- CSS build ลดจาก 31.43 → 29.33 KB; initial layout shift ที่วัดใน production Chrome run นี้เท่ากับ 0 ไม่รับรองทุกเครือข่าย/อุปกรณ์
- Viewer ยังเกิน 500 KB ตาม Vite warning เนื่องจาก Three/R3F stack ไม่ปรับ warning threshold เพื่อซ่อน
- `THREE.Clock` warning มาจาก `node_modules/@react-three/fiber/dist/events-e51d7528.esm.js:1207` (`clock: new THREE.Clock()`) ไม่ใช่ app animation loop คงคำเตือนไว้ ไม่ patch dependency หรือเปลี่ยน clock ภายใน renderer โดยไม่ทดสอบ compatibility

## เทียบภาพอ้างอิง / ข้อจำกัด

ตรวจ screenshot desktop และ mobile ด้วยสายตาแล้ว: ไม่มีข้อความเล็กใน hero ซ้าย โทนสีและ typography hierarchy เป็นไปตามทิศทาง white studio; toolbar และแผงข้อมูลไม่ชนกัน

ความต่างที่ยังมี:

- โมเดลยังเป็น placeholder สามถังเดิม ไม่ใช่เครื่องอุตสาหกรรมในภาพ จึงยังไม่มีรายละเอียดเครื่อง/วัสดุ/ภาพสะท้อนเหมือน reference
- ไอคอนแบรนด์ใช้ Recycle แบบเส้นจากไลบรารีเดิม ไม่มีไฟล์โลโก้วงกลมทึบตามภาพอ้างอิง
- ค่าเริ่มต้นยัง Compact ตามพฤติกรรมเดิม ภาพ reference เป็น Expanded; บันทึกภาพทั้งสองสถานะ
- เนื้อหาในแผงเป็นรอข้อมูลยืนยัน ไม่มี Filtration, สูตร หรือผลลัพธ์ที่คัดลอกจากภาพมาอ้างเป็นข้อมูลจริง
- ยังไม่มี Smart X-Ray/Flow simulation จริง; X-Ray เป็นโครงร่างตัวอย่างและปิดเมื่อโหลด model URL ที่ยังไม่รองรับ
- ทดสอบด้วย Chrome/SwiftShader และ touch emulation ยังไม่ได้วัดประสิทธิภาพกับ GLB จริง, GPU จริง หรือ Safari/Firefox/มือถือจริง

## ภาพที่บันทึก

- `desktop.png` — desktop viewport 1440×1050, Compact
- `expanded-desktop.png` — หน้าเต็ม desktop, Expanded
- `compact-1440.png`, `compact-1280.png`, `compact-768.png`, `compact-390.png`, `compact-320.png`
- `expanded-mobile.png` — หน้าเต็ม mobile, Expanded

## ความพร้อม

พร้อมรับ GLB จริงในระดับ architecture: loader/fallback, named part mapping, camera controls, quality settings, typed process/research/timeline และ error handling ยังทำงาน ก่อนใช้งานจริงต้องใส่โมเดล+node manifest, จัด camera framing ให้ตรงขนาดเครื่อง และวัด performance ใหม่

ไม่ได้ push GitHub หรือ deploy
