// Build only presentation JSON from the read-only geometry audit; never touch GLB/Blender.
import fs from 'node:fs'
import { createHash } from 'node:crypto'
const geometry = JSON.parse(fs.readFileSync('docs/prototype-geometry-audit.json', 'utf8'))
const growth = JSON.parse(fs.readFileSync('docs/growth-geometry-audit.json', 'utf8'))
const harvest = JSON.parse(fs.readFileSync('docs/harvest-geometry-audit.json', 'utf8'))
if (growth.glbSha256 !== geometry.glbSha256 || growth.sourceSha256 !== geometry.sourceSha256) throw new Error('Geometry audits refer to different assets')
if (harvest.glbSha256 !== growth.glbSha256 || harvest.sourceSha256 !== growth.sourceSha256) throw new Error('Harvest audit differs from existing assets')
const glb=fs.readFileSync('public/models/dmr-machine.glb')
if(createHash('sha256').update(glb).digest('hex')!==growth.glbSha256)throw new Error('Actual GLB differs from geometry audit')
geometry.curves = [...geometry.curves, ...growth.curves.filter(c => !geometry.curves.some(old => old.object === c.object))]
geometry.bounds = [...geometry.bounds, ...growth.bounds.filter(b => !geometry.bounds.some(old => old.object === b.object))]
geometry.bounds = [...geometry.bounds, ...harvest.bounds.filter(b => !geometry.bounds.some(old => old.object === b.object))]
const parts = JSON.parse(fs.readFileSync('src/data/machine-parts.json', 'utf8'))
const specs = [
  ['feed-to-pump', 'WF2_T101_P101', 'T101', 'P101', 3.25, 4.65, ['water','urea','phosphorus']],
  ['pump-to-cell', 'WF2_P101_EC101', 'P101', 'EC101', 4.75, 6.25, ['water','urea','phosphorus']],
  ['cell-to-filter', 'WF2_EC101_F101', 'EC101', 'F101', 10, 12.6, ['water','urea','sediment']],
  ['filter-to-bioreactor', 'WF2_F101_R201', 'F101', 'R201', 17, 18.3, ['water','urea']],
  ['bioreactor-to-hold', 'WF2_R201_T301', 'R201', 'T301', 22.2, 23.5, ['water','urea','nitrate']],
  ['hold-to-formulation', 'WF2_T301_T302', 'T301', 'T302', 25.25, 26.5, ['water','urea','nitrate']],
  ['formulation-to-dosing', 'WF2_T302_P301', 'T302', 'P301', 29.05, 30, ['water','urea','nitrate']],
  ['dosing-to-culture', 'WF2_P301_R401', 'P301', 'R401', 30, 30.9, ['water','urea','nitrate']],
  ['culture-to-circulation', 'WF2_R401_P401', 'R401', 'P401', 32, 33.4, ['water','nitrate','algae']],
  ['circulation-to-sensor', 'WF2_P401_SENSOR', 'P401', 'AIT401', 33.45, 35, ['water','nitrate','algae']],
  ['sensor-to-culture', 'WF2_SENSOR_R401', 'AIT401', 'R401', 35.1, 37.8, ['water','nitrate','algae']],
  ['culture-to-harvest', 'WF2_R401_F501', 'R401', 'F501', 38.1, 39.8, ['water','nitrate','algae']],
  ['harvest-to-biomass', 'WF2_F501_T501', 'F501', 'T501', 40.5, 43.5, ['water','nitrate','algae']],
  ['filtrate-to-recovery', 'WF2_F501_W601', 'F501', 'W601', 44, 45.4, ['water','nitrate']],
  ['candidate-to-water-hold', 'WF2_W601_T601', 'W601', 'T601', 46, 47.4, ['water','nitrate']],
]
const paths = specs.map(([id, object, from, to, startSeconds, endSeconds, substances]) => {
  const curve = geometry.curves.find(c => c.object === object)
  if (!curve || curve.splines.length !== 1 || curve.splines[0].type !== 'POLY') throw new Error('Unsupported audited curve: '+object)
  const points = curve.splines[0].points
  const sourceObjects = [object]
  for (const [tag, connectionId, position] of [[from, id+'-out', points[0]], [to, id+'-in', points.at(-1)]]) {
    const part = parts.find(p => p.id === tag)
    const endpoint = geometry.bounds.find(b => b.object.startsWith(tag+'_') && position.every((x,i) => x >= b.min[i]-1e-5 && x <= b.max[i]+1e-5))
    if (!part || !endpoint) throw new Error('Endpoint does not reach equipment geometry: '+id+' '+tag)
    sourceObjects.push(endpoint.object)
    part.connectionPoints ??= []
    part.connectionPoints = part.connectionPoints.filter(p => p.id !== connectionId)
    part.connectionPoints.push({id: connectionId, position})
  }
  return {id, partIds:[from,to], points, medium:'liquid', from:{partId:from,connectionId:id+'-out'}, to:{partId:to,connectionId:id+'-in'},
    evidence:{sourceObjects, sourceSha256:geometry.sourceSha256, glbSha256:geometry.glbSha256, status:'geometry-checked', note:'Centerline copied from saved visible POLY curve; endpoints meet equipment geometry. Visual placement only, not hydraulic validation. Opaque pump/cell internals are not interpolated.'},
    animation:{startSeconds,endSeconds,substances}}
})
const rows = [
  ['overview','ภาพรวมเครื่อง','ติดตามวัตถุดิบหนึ่งชุด',0,3,[],[],'ภาพประกอบครบ 60 วินาที แปรรูปและบรรจุเป็น schematic ตัวอย่าง ยังไม่ยืนยันวิธีจริง เวลาเป็นเวลาเล่าเรื่อง ไม่ใช่เวลาบำบัดจริง',[]],
  ['intake','รับวัตถุดิบ','T101 → P101 → EC101',3,6,['T101','P101'],['feed-to-pump','pump-to-cell'],'รับและส่งของเหลวจากถังพักผ่านปั๊มไปปรับสภาพ จุดสีซ้อนบนตำแหน่งท่อจริงเป็นสัญลักษณ์การไหล',['ของเหลวที่ส่งไปปรับสภาพ']],
  ['conditioning','ปรับสภาพ','EC101 · ภาพขยายเชิงสัญลักษณ์',6,11,['EC101'],['pump-to-cell','cell-to-filter'],'แสดงการปรับสภาพด้วยไฟฟ้าเคมีและการรวมกลุ่มตะกอนที่มีฟอสฟอรัส โดยไม่ระบุชนิดผลึก สมการ หรือประสิทธิภาพที่ยังไม่ยืนยัน ยูเรียไม่ได้ถูกเปลี่ยนเป็นฟอสฟอรัส',['สารละลายพร้อมตะกอนไป F101']],
  ['separation','แยกของเหลวและตะกอน','F101 · แยกก่อนส่งต่อ R201',11,17,['F101'],['cell-to-filter'],'แยกกลุ่มตะกอนออกจากของเหลว สารที่ละลายยังอยู่ในของเหลว ไม่เท่ากับน้ำบริสุทธิ์ ไม่ปล่อยอนุภาคเข้าแขนง R102 ที่ยังขัดข้อมูล',['ของเหลวที่ยังมีสารละลาย','ตะกอนกักแยก · ทางไป R102 ยังรอตรวจ']],
  ['nitrification','ไนตริฟิเคชัน','R201 · ของเหลวบนท่อ / ภายในเป็น schematic',17,23,['R201','G201'],['filter-to-bioreactor','bioreactor-to-hold'],'แสดง NH₄⁺ → NO₂⁻ → NO₃⁻ จากส่วนแอมโมเนียมเชิงสัญลักษณ์ ไม่แสดงว่ายูเรียเปลี่ยนเป็นไนเตรตโดยตรง ก๊าซ G201 ใช้ schematic เนื่องจากจุดต่อไม่ครบ',['ส่วนไนโตรเจนที่แสดงเป็นไนเตรต · ไม่ใช่ผลตรวจจริง','ของเหลวส่ง T301 เพื่อกักตรวจ']],
  ['hold','กักตรวจ','T301 · กักก่อนส่งต่อ',23,26,['T301'],['bioreactor-to-hold','hold-to-formulation'],'แสดงกักตรวจและตัวอย่างการอนุมัติหนึ่งล็อตก่อนเปิดส่ง T302 ไม่แสดงค่าตรวจหรือรับรองว่าทุกล็อตผ่าน',['ตัวอย่างล็อตที่อนุมัติไป T302','ล็อตไม่ผ่านยังต้องกักแยก']],
  ['formulation','ปรับสูตร','T302 → P301 · การเติมเป็น schematic',26,30,['T302','P301'],['hold-to-formulation','formulation-to-dosing'],'ผสม stock ที่อนุมัติ น้ำและสารเสริมใน schematic ไม่กำหนดสูตรหรือปริมาณ การปล่อยไป P301 เป็นตัวอย่างหลังตรวจสูตร',['ตัวอย่างอาหารที่อนุมัติส่งเข้าเพาะ']],
  ['cultivation','เพาะสาหร่าย','R401 · อาหารและวงจรหมุนเวียนแยกสาย',30,38,['R401','P301','P401','AIT401'],['dosing-to-culture','culture-to-circulation','circulation-to-sensor','sensor-to-culture'],'เซลล์เกลียว แสงและก๊าซแสดงใน schematic แบบย่อเวลา สายอาหารกับวงจร P401/AIT401 ใช้ท่อจริง ไม่แสดงว่าการหมุนเวียนคือการเติมก๊าซ',['ชีวมวลเชิงสัญลักษณ์ · ไม่ใช่อัตราเติบโตหรือผลผลิตจริง']],
  ['harvest','เก็บเกี่ยว','R401 → F501 → T501 · แยกชีวมวลและ filtrate',38,44,['R401','F501','T501'],['culture-to-harvest','harvest-to-biomass'],'F501 แยกเชิงหน้าที่เป็นชีวมวลเข้มข้นและ filtrate ที่ยังมีสารละลาย ภายในเป็น schematic ไม่กำหนดชนิดตัวกรองหรือค่าการกักจริง',['ชีวมวลเปียกพักใน T501','filtrate กักก่อนติดตามไป W601 · ไม่ใช่น้ำบริสุทธิ์']],
  ['recovery','กู้คืนน้ำ','F501 → W601 → T601 · ยังไม่อนุมัติใช้ซ้ำ',44,48,['F501','W601','T601','T501'],['filtrate-to-recovery','candidate-to-water-hold'],'ติดตาม filtrate ตามท่อถึงขอบเขต W601 และของเหลว candidate ไป T601 เพื่อกักรอตรวจ ไม่เลือกกลไกบำบัด ไม่เปิดทางคืนถังเพาะ ชีวมวลยังพัก T501',['ของเหลว candidate ใน T601 · รอตรวจตามจุดใช้','ชีวมวลพัก T501 แยกจากสายกู้คืนน้ำ']],
  ['washing','ล้างชีวมวล','T501 · น้ำล้างเข้าและออกเป็น schematic',48,51,['T501'],[],'ตัวอย่างน้ำที่ผ่านเกณฑ์ล้างชีวมวลและลดน้ำ น้ำล้างออกไปกักแยก ไม่รวมกับน้ำกู้คืนที่อนุมัติแล้ว ท่อรับน้ำล้างร่วมยังรอยืนยัน',['ชีวมวลเปียกพร้อมรอแปรรูป · ยังไม่ใช่อาหารพร้อมกิน','น้ำล้างกักแยก · ไม่ส่งกลับถังเพาะ']],
  ['processing','แปรรูป','ตัวอย่างทางเลือก: อบแห้ง · DR701',51,56,['DR701'],[],'โหลดชีวมวลเปียกเป็นชุดและลดน้ำใน schematic ของ DR701 เป็นตัวอย่างทางเลือก ไม่ใช่วิธีจริงที่ยืนยัน H701 / FD701 ไม่ทำงานอนุกรม',['ผลิตภัณฑ์จากขั้นตัวอย่าง · รอบรรจุ ไม่ใช่โปรตีนบริสุทธิ์']],
  ['packing','บรรจุและกักรอตรวจ','PK801 → T801 · batch transfer ตัวอย่าง',56,60,['PK801','T801'],[],'เติมซอง ซีล ระบุล็อตตัวอย่าง และย้ายไป T801 ใน schematic ไม่แสดงว่าอนุมัติบริโภคแล้ว',['บรรจุแล้ว / กักรอตรวจ · ล็อตตัวอย่าง']],
]
const steps = rows.map(([id,title,subtitle,start,end,activeParts,flowPaths,description,outputs])=>({id,title,subtitle,description,formulas:[],outputs,activeParts,flowPaths,cameraFocus:null,timeline:{start:start/60,end:end/60},developmentStatus:'prototype'}))
const exportAudit=JSON.parse(fs.readFileSync('docs/model-export-audit.json','utf8'))
const glbNames=new Set(JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString()).nodes.map(node=>node.name))
for(const path of paths)for(const name of path.evidence.sourceObjects) {
  const exported=exportAudit.nodes.find(node=>node.sourceName===name)?.exportName
  if(!exported||!glbNames.has(exported))throw new Error('Audited object missing from actual GLB: '+name)
}
const distance=(point,box)=>Math.hypot(...point.map((v,i)=>Math.max(box.min[i]-v,0,v-box.max[i])))
const diagnostic=(name,tag,endpoint)=>{
  const point=growth.curves.find(c=>c.object===name).splines[0].points.at(endpoint)
  const boxes=growth.bounds.filter(b=>b.object.startsWith(tag+'_')&&!/Sign|Label/.test(b.object))
  const nearest=boxes.map(box=>({object:box.object,distance:distance(point,box)})).sort((a,b)=>a.distance-b.distance)[0]
  return {object:name,endpoint:point,nearest}
}
const report={sourceSha256:geometry.sourceSha256,glbSha256:geometry.glbSha256,coordinateUnits:'web/model units, not a verified physical build dimension',
  inventory:'new-chat/new-chat/output/DMR_Linear_Blueprint_RevF/Part_Inventory.csv',
  inventorySha256:createHash('sha256').update(fs.readFileSync('new-chat/new-chat/output/DMR_Linear_Blueprint_RevF/Part_Inventory.csv')).digest('hex'),
  enabled:paths.slice(3,11).map(path=>({id:path.id,representation:'actual-pipe-overlay',direction:[path.from.partId,path.to.partId],sourceObjects:path.evidence.sourceObjects,points:path.points,timing:path.animation,geometry:'Both anchors touch equipment bounds; exact POLY centerline and exported names checked.',processBasis:'Part_Inventory.csv role/input/output. Story-time direction only; no pressure, flow, internal ports or full hydraulic validation.'})),
  schematic:[{stage:'nitrification',scope:'Biofilm, ammonium/nitrite/nitrate sequence and bubbles; urea remains separate.'},{stage:'hold',scope:'Quarantine and illustrative one-lot release; no assays.'},{stage:'formulation',scope:'Qualified water and unspecified supplement additions; no physical dosing routes enabled.'},{stage:'cultivation',scope:'Light, helical cells and gas exchange; no growth rate or yield. G401 branch not enabled.'}],
  unresolved:[
    {route:'G201 gas service',representation:'schematic-only',checks:[diagnostic('WF2_G201_R201','G201',0),diagnostic('REF_AIR_TO_G201','G201',-1)],reason:'Saved gas centerlines do not reach G201 physical pump/filter. No gas particles cross these gaps; terminal device fitting/interface remains unverified.'},
    {route:'G401 gas/liquid branch',representation:'schematic-only',sourceObjects:['REF_CARBON_TO_G401','REF_CIRC_TEE_G401','REF_G401_R401','REF_G401_TO_EXHAUST'],reason:'Visible concept branches are not a validated gas/liquid interface. No CO2 particles enter liquid pipes; contactor/pressure design pending in inventory.'},
    {route:'Qualified water to T302 and supplements',representation:'schematic-only',sourceObjects:['WF2_WATER_T302','REF_HEADER_WATER'],reason:'Water header geometry exists, but supply qualification/release is not evidenced. No supplement port/recipe verified.'},
    {route:'AIT401 return',representation:'actual-pipe-overlay',sourceObjects:['WF2_P401_SENSOR','WF2_SENSOR_R401'],reason:'Both centerlines share the wetted-interface anchor; visual continuity does not establish distinct engineered inlet/outlet ports or flow direction.'},
    {route:'R102 and recovered-water return',representation:'not-enabled',reason:'Existing conflicts and intended-use approval remain unresolved.'},
  ],scope:'Geometry and illustrative process presentation only. No model, source inventory or GLB modified.'}
for (const [file,data] of [['flow-paths',paths],['process-steps',steps],['machine-parts',parts]]) fs.writeFileSync('src/data/'+file+'.json',JSON.stringify(data,null,2)+'\n')
fs.writeFileSync('docs/growth-route-audit.json',JSON.stringify(report,null,2)+'\n')
const harvestReport={sourceSha256:harvest.sourceSha256,glbSha256:harvest.glbSha256,inventory:report.inventory,inventorySha256:report.inventorySha256,coordinateUnits:report.coordinateUnits,
  enabled:paths.slice(11).map(path=>({id:path.id,representation:'actual-pipe-overlay',direction:[path.from.partId,path.to.partId],medium:path.medium,points:path.points,sourceObjects:path.evidence.sourceObjects,timing:path.animation,processBasis:'Inventory role/input/output supports the stream intent. W601 is a pending functional boundary, not a selected or validated treatment system. Candidate liquid remains unapproved at T601.'})),
  inspected:harvest.curves.filter(c=>['WF2_R401_F501','WF2_F501_T501','WF2_F501_W601','WF2_W601_T601','WF2_WATER_T501','WF2_T501_W601','WF2_T601_R401_RETURN'].includes(c.object)).map(c=>({object:c.object,points:c.splines[0].points,endpointContacts:[c.splines[0].points[0],c.splines[0].points.at(-1)].map(point=>harvest.bounds.filter(b=>/^(R401|F501|T501|W601|T601)_/.test(b.object)&&!/Sign|Label/.test(b.object)&&distance(point,b)<1e-5).map(b=>b.object))})),
  schematic:[{stage:'harvest',scope:'Generic physical split; neither a mesh nor a membrane specification. Symbols preserve water and solutes; possible cell carryover does not quantify retention.'},{stage:'recovery',scope:'W601 functional block, candidate transfer to T601 quarantine, unresolved reject/retentate in schematic; biomass remains held separately at T501.'},{stage:'washing',scope:'Illustrative qualified-water wash and dewatering in T501; wash effluent goes to a distinct schematic hold, no actual wash pipe animation.'}],
  unresolved:[{route:'WF2_WATER_T501',representation:'schematic-only',reason:'Physical curve starts at water header, not a qualified and released supply. No verified release/source boundary; do not infer T601 supplies this header.'},{route:'WF2_T501_W601',representation:'not-enabled / schematic-hold',reason:'Geometry reaches T501 and W601_Pending, but shared wash treatment acceptance/barriers remain pending in inventory. No wash particles enter W601. A separate schematic hold is not an added physical tank.'},{route:'WF2_T601_R401_RETURN',representation:'not-enabled',reason:'Visible geometry is not approval for intended water reuse.'},{route:'W601 internals and reject',representation:'schematic-only',reason:'Technology, contaminants partition and physical reject acceptance unresolved. No RO/UF/UV mechanism or purity claim.'}],
  research:{url:'https://www.frontiersin.org/journals/astronomy-and-space-sciences/articles/10.3389/fspas.2023.1229043/full',readSections:['2 Materials and methods','3 Results and discussion','4 Conclusion'],application:'Supports separating biomass harvesting from medium treatment and considering fouling. Research BHU/MFU configuration, test conditions and efficiencies are not assigned to DMR.'},
  scope:'Illustrative story-time overlays only; actual visible curve endpoints touch model equipment bounds, not validated nozzle routing or hydraulic operation. No Blender or GLB changed.'}
fs.writeFileSync('docs/harvest-route-audit.json',JSON.stringify(harvestReport,null,2)+'\n')
console.log('Built '+paths.length+' geometry-checked liquid paths, '+steps.length+' timed stages; no R102 route enabled.')
