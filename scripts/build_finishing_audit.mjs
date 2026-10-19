import fs from 'node:fs'
import { createHash } from 'node:crypto'
const audit=JSON.parse(fs.readFileSync('docs/finishing-geometry-audit.json','utf8'))
const exported=JSON.parse(fs.readFileSync('docs/model-export-audit.json','utf8'))
const glb=fs.readFileSync('public/models/dmr-machine.glb')
const names=new Set(JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString()).nodes.map(n=>n.name))
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
if(sha(exported.source)!==audit.sourceSha256||sha('public/models/dmr-machine.glb')!==audit.glbSha256)throw Error('Asset changed')
const objects=[...audit.bounds,...audit.curves.filter(c=>/^PT_/.test(c.object))].map(o=>{
  const name=exported.nodes.find(n=>n.sourceName===o.object)?.exportName
  if(!name||!names.has(name))throw Error('Missing exported object: '+o.object)
  return {...o,exportName:name}
})
const distance=(point,box)=>Math.hypot(...point.map((v,i)=>Math.max(box.min[i]-v,0,v-box.max[i])))
const routes=audit.curves.filter(c=>/^PT_/.test(c.object)).map(c=>({
  object:c.object,points:c.splines[0].points,
  endpointContacts:[c.splines[0].points[0],c.splines[0].points.at(-1)].map(p=>audit.bounds.filter(b=>!/Sign/.test(b.object)&&distance(p,b)<1e-5).map(b=>b.object)),
  representation:'not-enabled',medium:'Unconfirmed product state and conveying method',
  reason:'Geometry is not proof of food-compatible transfer. No product particles on these pipes; batch transfer is schematic only.',
}))
fs.writeFileSync('docs/finishing-route-audit.json',JSON.stringify({
  sourceSha256:audit.sourceSha256,glbSha256:audit.glbSha256,
  inventorySha256:sha('new-chat/new-chat/output/DMR_Linear_Blueprint_RevF/Part_Inventory.csv'),
  coordinates:'Web/model coordinates; not verified physical build dimensions',objects,routes,
  enabledActualPipeRoutes:[],
  schematic:[{stage:'processing',time:[51,56],example:'DR701 batch tray loading and symbolic water removal only. H701/FD701 inactive alternatives.'},{stage:'packing',time:[56,60],example:'Batch transfer to PK801, fill/seal/example lot, hold at T801. Final frame remains at 60; no food release.'}],
  unresolved:['Product form, drying mode/kinetics/endpoint and thermal load','T501 outlet and tray-handling interface','Actual product transfer to packaging, film and seal validation','Storage condition, shelf life and release plan'],
  scope:'Read-only geometry evidence. No hydraulic, thermal, food safety or process qualification. No GLB or Blender writes.',
},null,2)+'\n')
console.log('Finishing audit: '+objects.length+' GLB objects verified, '+routes.length+' candidate curves not enabled')
