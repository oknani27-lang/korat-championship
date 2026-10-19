> Historical phase report: the 51–60 second pending status below is superseded by animation-finishing-report.md. Harvest routing constraints remain in force.

# DMR - อนิเมชันเก็บเกี่ยว กู้คืนน้ำ และล้างชีวมวล 38-51 วินาที

ตรวจวันที่ 19 ตุลาคม 2026

## ผลที่ทำ

เพิ่มภาพบนท่อจริงและ schematic ต่อจากช่วงเพาะ โดยใช้ `playheadSeconds` เดียวกับระบบเดิม ไม่มี timer หรือ Canvas เพิ่ม เริ่ม Demo แล้วนำเสนอจบ 60 วินาที ปุ่ม Play/Pause หยุดและเล่นต่อจากเวลาเดิม Next/Previous/เลือกขั้นยังเริ่มเล่นต่อทันที การลากย้อนให้ตำแหน่งและสถานะเดิม และซ่อนแท็บแล้วไม่นับเวลาที่ซ่อน

| เวลาเล่าเรื่อง | สิ่งที่แสดง |
| --- | --- |
| 38-44 s | Culture จาก R401 ไป F501 แล้วส่งชีวมวลเปียกไป T501; schematic แยกชีวมวลเข้มข้นกับ filtrate ที่ยังมีน้ำและสารละลาย |
| 44-48 s | ติดตาม filtrate จาก F501 ถึงขอบเขต W601 และ candidate liquid ไปกัก T601 โดยคงชีวมวลใน T501 แยกกัน T601 ยังไม่ถูก release |
| 48-51 s | T501 ล้าง/ลดน้ำเชิงสัญลักษณ์ ใช้ตัวอย่างน้ำที่ผ่านเกณฑ์ใน schematic แยกน้ำล้างไปกัก ไม่เปิดท่อรับน้ำล้างร่วมที่ W601 และไม่คืน R401 |
| 51-60 s | แปรรูปและบรรจุยังเป็นคำอธิบายพร้อมป้ายรอภาพการไหล ไม่มีภาพบนท่อหรือ schematic กระบวนการใหม่ในช่วงนี้ |

การล้างจบที่ชีวมวลเปียกพร้อมรอแปรรูป ไม่ใช่การรับรองอาหารพร้อมกิน สี รูปร่าง จำนวนจุดและเวลาเป็นสัญลักษณ์ ไม่ใช่ประสิทธิภาพ ความเข้มข้น สมดุลมวล อัตราการไหล หรือเวลาจริง ไนเตรตเป็นตัวแทนสารละลายที่เลือกติดตาม ไม่ใช่องค์ประกอบทั้งหมด

## หลักฐานจากโมเดลและทะเบียนเครื่อง

ตรวจไฟล์ Blender ที่บันทึกไว้ด้วย background process แยกแบบอ่านอย่างเดียว ตรวจ visible POLY centerline และ bounding boxes ของอุปกรณ์ แล้วเทียบชื่อวัตถุกับ node ใน GLB จริง Browser tests ตรวจพิกัดทั้งหมดอยู่ในขอบเขต mesh ท่อหลัง world transform

ใช้ transformation เดิม `[x, z, -y]` หลัง translation โดยไม่เปลี่ยน scale พิกัดทุกจุด ทิศทาง ตัวกลาง ชื่อวัตถุที่แตะปลายท่อ และสถานะเส้นทางอยู่ใน `harvest-geometry-audit.json`, `harvest-route-audit.json`, `src/data/flow-paths.json` และ connection anchors ใน `machine-parts.json` มิติโมเดลไม่ใช่มิติรับรองสำหรับผลิต

| เส้นทางเปิดอนิเมชัน | วัตถุท่อจริง | อุปกรณ์/ขอบเขตที่แตะปลาย | เวลา packet |
| --- | --- | --- | --- |
| R401 → F501 | `WF2_R401_F501` | R401_Body → F501_Body | 38.1-39.8 s |
| F501 → T501 | `WF2_F501_T501` | F501_Body → T501_Body | 40.5-43.5 s |
| F501 → W601 | `WF2_F501_W601` | F501_Body → W601_Pending | 44-45.4 s |
| W601 → T601 | `WF2_W601_T601` | W601_Pending → T601_Neck | 46-47.4 s |

เพิ่ม 4 เส้น รวมเส้นเดิมเป็น 15 เส้น ทุกเส้นเป็น liquid/culture overlay ไม่มีการเพิ่มเส้นท่อในโมเดล ไม่มีการลากอนุภาคผ่านภายในอุปกรณ์ทึบเพื่อข้ามระหว่าง packet ทิศทางเล่าเรื่องอ้าง role/input/output ของ F501/T501/W601/T601 ใน `Part_Inventory.csv` การแตะ bounding box เป็นหลักฐานรูปทรง ไม่ใช่ hydraulic validation หรือ nozzle design

W601 เป็น `Pending` boundary ของโมเดล ท่อเข้า-ออกจึงสื่อเส้นทาง candidate ในสถาปัตยกรรมที่เสนอ ไม่ได้หมายความว่าเครื่องบำบัดที่เลือกแล้วสามารถทำงานได้ ไม่แสดงกลไก RO/UF/UV หรือผลคุณภาพน้ำขึ้นเอง

## แยกภาพบนท่อ / schematic / รอยืนยัน

| ส่วน | สถานะ |
| --- | --- |
| ท่อหลัก 4 เส้นในตาราง | ภาพซ้อนท่อจริงที่ตรวจพิกัด ไม่ใช่สีจริงของสารหรือการเปิดผิวถัง |
| ภายใน F501 | Schematic การแยกเชิงหน้าที่ ไม่กำหนด mesh, pore size หรือชนิดเมมเบรนให้ DMR; จุดเซลล์ใน filtrate แสดงความเป็นไปได้ของ carryover ไม่ใช่ค่าการกักจริงหรือข้อสรุปว่าแยกได้ทั้งหมด |
| ภายใน W601 และส่วนเข้มข้น/ของเสีย | Schematic กล่องหน้าที่และจุดกักที่ยังต้องออกแบบ ไม่ใช่ถังหรือท่อที่สร้างเพิ่มใน GLB ไม่มีค่าการกำจัดสารปนเปื้อน/ความบริสุทธิ์สมมติ |
| T601 | Candidate liquid รอตรวจตลอดช่วง `data-water-released=false` ไม่มีผลตรวจหรือจุดใช้ที่อนุมัติจริง |
| น้ำล้างเข้า `WF2_WATER_T501` | ตรวจ geometry แล้วเริ่มที่ header และจบ T501 แต่แหล่งจ่ายและการ release น้ำยังไม่ยืนยัน จึงใช้ schematic เท่านั้น ไม่สมมติว่ามาจาก T601 |
| น้ำล้างออก `WF2_T501_W601` | Geometry แตะ T501 และ W601_Pending แต่ permit ในทะเบียนกำหนดให้อนุมัติ wash stream แยก จึงไม่ปล่อยอนุภาคบนเส้นนี้ ใช้จุดกักแยกใน schematic แทน ไม่มีการเพิ่มถังจริง |
| `WF2_T601_R401_RETURN` และทางคืน T302 | ไม่เปิด แม้มีท่อบางส่วนในโมเดล การมีรูปทรงไม่ใช่การอนุมัติใช้ซ้ำ |
| R102 | ไม่เปิดแขนงและคงข้อจำกัดเดิม |

## งานวิจัยที่ใช้

[Tallec et al. (2023), Implementation of an automated process for Limnospira indica harvesting and culture medium recycling for space applications](https://www.frontiersin.org/journals/astronomy-and-space-sciences/articles/10.3389/fspas.2023.1229043/full)

อ่าน Materials and methods, Results and discussion และ Conclusion เพื่อใช้หลักการแยกหน้าที่เก็บเกี่ยวชีวมวลกับจัดการ medium และข้อจำกัด fouling การทดลอง BHU/MFU ของผู้แต่งมี configuration และเงื่อนไขเฉพาะ จึงไม่ถ่ายโอนชนิดตัวกรอง ประสิทธิภาพการกัก เป้ากำลังผลิต หรือผลการกู้คืนน้ำมาเป็นผลจริงของ F501/W601 ใน DMR ลิงก์อ้างอิงและข้อจำกัดนี้แสดงใน schematic ด้วย ไม่เพิ่มสมการเคมีให้ขั้นแยกทางกายภาพ

## รูปแบบเว็บและทรัพยากร

- คงหัวเว็บแบบกระชับ แถบ Rotate/Zoom/X-Ray/Reset/More แนวนอนใต้โมเดล และการ์ดสูตร/จำลองด้านขวา desktop
- การ์ดอ่านรายละเอียดต่อภายในได้ ไม่มีป๊อปอัปหรือแผงรายละเอียดซ้ำ มือถือใช้ลำดับการ์ดแบบซ้อนตามเดิม
- `harvestFrame(seconds)` เป็น pure function คำนวณทุกเฟรมจากเวลา จำนวนสัญลักษณ์แต่ละชนิดคงอยู่ใน schematic ไม่ทำให้น้ำและสารละลายหายทั้งชุด
- ใช้ registry เดิม: น้ำวงกลมฟ้า ไนเตรตหกเหลี่ยมม่วง เซลล์เกลียวเขียว พร้อม legend ชื่อและรูปทรง ไม่พึ่งสีอย่างเดียว ใช้ `data-stream` แยก culture/biomass/filtrate/candidate/reject-hold/wash-in/wash-hold สำหรับตรวจรับ
- อนุภาคบนท่อใช้ 396 instance slots รวม 6 ชุด geometry/material ที่ใช้ซ้ำ ไม่ใช่จำนวนอนุภาคที่มองเห็นพร้อมกันทั้งหมด ไม่เพิ่มชุดทรัพยากรเมื่อสลับขั้น
- ไม่เพิ่มกล้องอัตโนมัติหรือ Smart X-Ray การหมุน ซูม เลือกชิ้นส่วน Reset และ fallback ยังทำงาน

## ผลตรวจ

| ชุดตรวจ | ผล |
| --- | --- |
| `npm test` | ผ่าน: 15 เส้นตรงกับ centerline audit, timing, deterministic frames, แยกสายน้ำ/ชีวมวล/น้ำล้าง, ห้ามทางคืนและ wash pipe ที่ยังไม่อนุมัติ |
| `npm run typecheck` | ผ่าน |
| ESLint / Oxlint สำหรับ `src`, Vite/config และตัวสร้างข้อมูล | ผ่าน |
| `npm run build` | ผ่าน มีคำเตือนเดิมเรื่อง viewer bundle มากกว่า 500 kB |
| `tests/process-chemistry.cjs` | ผ่าน 12 ขั้นที่ 1440/768/390/320 px สูตร/ข้อความไม่ล้นและไม่มี popup |
| `tests/viewport-fit.cjs` | ผ่าน 1520×860, 1440×900, 1366×768, 1280×720, 1024×768, 390×844; desktop เห็นแผงขั้นตอนและปุ่มถัดไปครบโดยไม่เลื่อนหน้า |
| `tests/animation-prototype.cjs` | ผ่าน desktop 1440 / mobile 390: 15 เส้นอยู่ใน mesh ท่อ, รอยต่อ 38/44/48/51 s, forward/reverse matrices และ SVG เดิม, Pause หยุดภาพและเวลา, Play/Next เล่นต่อ, resources คงที่, idle ไม่ render, hidden tab และครบ 60 s แล้วหยุด |
| `tests/browser-audit.cjs` | ผ่าน 16 ชุด; ปรับเกณฑ์ความสูง canvas มือถือจาก layout เก่าเป็นพื้นที่ใช้งานตาม layout กระชับที่อนุมัติก่อนหน้า ไม่ได้แก้โมเดลเพื่อตอบเกณฑ์ทดสอบ |
| `tests/model-integration.cjs` | ผ่าน 1440/768/390 px และ missing-model fallback; ต้นฉบับ 646 ชิ้นและ 24 mapping ยังครบ |

ไม่พบ console error ในเส้นทางปกติ มี warning เดิมจาก dependency `THREE.Clock` deprecated ทดสอบ mobile ด้วย viewport emulation ไม่ใช่การวัด FPS/GPU บนโทรศัพท์จริง

ตรวจภาพ desktop/mobile และภาพท่อ F501 จากด้านหน้า/มุมเฉียงแล้ว:

- `test-results/process-chemistry/harvest-1440.png`, `recovery-1440.png`, `washing-1440.png`
- `test-results/process-chemistry/harvest-390.png`, `recovery-390.png`, `washing-390.png`
- `test-results/animation-prototype/stage-38-1440.png`, `stage-44-1440.png`, `stage-48-1440.png`, `stage-51-1440.png` และไฟล์คู่ที่ 390 px
- `test-results/animation-prototype/harvest-pipe-detail-front.png`, `harvest-pipe-detail-angle.png`
- รายงาน JSON ของ animation/chemistry/model/browser อยู่ใน `test-results/` ตามเดิมและถูก Git ignore

## ไฟล์ที่เปลี่ยนในช่วงนี้

- เพิ่มภาพ/เฟรม: `src/simulation/harvest.ts`, `src/components/bottom-sheet/HarvestInset.tsx`
- เชื่อมภาพและขอบเขต: `src/components/bottom-sheet/ProcessInset.tsx`, `src/App.tsx`
- Presentation data: `src/data/flow-paths.json`, `machine-parts.json`, `process-steps.json`
- Audit/generator: `scripts/audit_harvest_paths.py`, `scripts/build_prototype_data.mjs`, `docs/harvest-geometry-audit.json`, `harvest-route-audit.json`
- ตรวจรับ: `src/simulation/timeline.test.ts`, `tests/animation-prototype.cjs`, `tests/process-chemistry.cjs`, `tests/browser-audit.cjs`
- เอกสาร: README, animation-plan, หมายเหตุสถานะใน animation-growth-report และรายงานนี้

SHA-256 หลังงานตรงกับก่อนงาน:

- Blender: `041db30b47b2174d1e233b9cd971969add8bfa66d7a68d8996dea7027d940c7a`
- GLB: `f54ad5ff0d28752c5bc4f6b29babe0497910074e17d1b483276ee3649cdf5d3d`

ไม่ได้แก้หรือสร้าง .blend ไม่เปลี่ยน GLB/topology/เส้นทางท่อ ไม่ commit, push หรือ deploy ภาพแปรรูปและบรรจุ 51-60 s ยังไม่ทำในรอบนี้
