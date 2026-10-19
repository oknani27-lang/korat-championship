const {chromium}=require(process.env.DMR_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const base=process.env.DMR_TEST_URL||'http://127.0.0.1:5175';
const output=path.resolve('test-results/animation-prototype');
const results=[];let browser;
async function snapshot(page) {
  return page.evaluate(async()=>{
    if(!window.protoStore) {
      const url=performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js')).name;
      const {_roots}=await import(url);
      window.protoStore=_roots.get(document.querySelector('canvas')).store;
    }
    const root=window.protoStore.getState();
    const flow=[],geometry=[],materials={};
    root.scene.traverse(o=>{
      if(o.geometry)geometry.push(o.geometry.uuid);
      if(o.userData.flowSpecies)flow.push({species:o.userData.flowSpecies,count:o.count,matrix:Array.from(o.instanceMatrix.array)});
      if(/^WEB_/.test(o.name)) {
        const list=[];o.traverse(c=>{if(c.material)for(const m of Array.isArray(c.material)?c.material:[c.material])if(m.emissive)list.push([m.uuid,m.emissive.getHex(),m.emissiveIntensity]);});
        materials[o.name]=list;
      }
    });
    return {scene:root.scene.uuid,flow,geometry:geometry.sort(),materials,frame:root.gl.info.render.frame,memory:{...root.gl.info.memory},schematic:document.querySelector('.process-inset > svg')?.outerHTML};
  });
}
async function seek(page,seconds) {
  await page.getByRole('slider').fill(String(seconds));
  await page.waitForFunction(t=>Math.abs(Number(document.querySelector('#results').dataset.playhead)-t)<.001,seconds);
  await page.waitForTimeout(150);
}
(async()=>{
  await fs.mkdir(output,{recursive:true});
  const geometry=JSON.parse(await fs.readFile('docs/prototype-geometry-audit.json','utf8'));
  const paths=JSON.parse(await fs.readFile('src/data/flow-paths.json','utf8'));
  assert.equal(crypto.createHash('sha256').update(await fs.readFile('public/models/dmr-machine.glb')).digest('hex'),geometry.glbSha256);
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const width of [1440,390]) {
    const page=await browser.newPage({viewport:{width,height:width<600?844:1050}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(base);await page.locator('.canvas-wrap[data-model-state=ready]').waitFor({timeout:45000});
    assert.equal(await page.locator('.data-notice').count(),0);
    await page.waitForTimeout(300);const baseline=await snapshot(page);
    assert.equal(baseline.flow.length,6);
    await page.locator('.nav-cta').click();
    assert.equal((await snapshot(page)).scene,baseline.scene);
    assert.deepEqual((await snapshot(page)).geometry,baseline.geometry);
    // Every sampled point must be inside the exported pipe object's world-space bounds.
    const checked=await page.evaluate(async paths=>{
      const url=performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js')).name;
      const {_roots}=await import(url);const root=_roots.get(document.querySelector('canvas')).store.getState();
      return paths.map(path=>{const mesh=root.scene.getObjectByName(path.evidence.sourceObjects[0]);mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);return {id:path.id,contains:path.points.every(p=>box.clone().expandByScalar(1e-5).containsPoint(mesh.position.clone().set(...p)))};});
    },paths);
    assert(checked.every(p=>p.contains));
    const snapshots={};
    const samples=[3.7,5.3,8.25,11.5,16.9,17,18,20,22.99,23,25.25,26,28,30,33.2,36,37.99,38,38.8,40,43.99,44,46.5,47.99,48,49.5,50.99,51,53,55.99,56,57,58.5,59.99,60];
    for(const seconds of samples) {
      await seek(page,seconds);snapshots[seconds]=await snapshot(page);
      assert.equal(snapshots[seconds].scene,baseline.scene);
      assert.deepEqual(snapshots[seconds].geometry,baseline.geometry);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      if([8.25,16.9,17,20,23,26,28,30,33.2,38,40,44,46.5,48,49.5,51,53,56,58.5,60].includes(seconds)){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,`stage-${seconds}-${width}.png`),fullPage:true});if(seconds>=17&&seconds<=60)await page.locator('.stage-layout').screenshot({path:path.join(output,`details-${seconds}-${width}.png`)});}
    }
    assert.equal(await page.locator('.chemistry-popup,.sheet-toggle').count(),0);
    for(const seconds of [...samples].reverse()) {
      await seek(page,seconds);const current=await snapshot(page);
      assert.deepEqual(current.flow,snapshots[seconds].flow,'reverse scrub must reproduce particle matrices');
      assert.equal(current.schematic,snapshots[seconds].schematic,'reverse scrub must reproduce separation');
    }
    const visible=(snapshot,species)=>snapshot.flow.filter(g=>!species||g.species===species).reduce((sum,g)=>sum+Array.from({length:g.count},(_,i)=>g.matrix[i*16]||g.matrix[i*16+5]||g.matrix[i*16+10]).filter(Boolean).length,0);
    assert(visible(snapshots[18])>0);assert(visible(snapshots[36],'algae')>0);assert(visible(snapshots[38.8])>0);assert(visible(snapshots[46.5])>0);assert.equal(visible(snapshots[51]),0);
    for(const [seconds,stage] of [[17,'nitrification'],[23,'hold'],[26,'formulation'],[30,'cultivation'],[38,'harvest'],[44,'recovery'],[48,'washing'],[51,'processing'],[56,'packing'],[60,'packing']]){
      await seek(page,seconds);
      assert.equal(await page.locator('.canvas-wrap').getAttribute('data-active-step'),stage);
      assert.equal(await page.locator('.process-chemistry').getAttribute('data-step'),stage);
      assert.equal(await page.locator('.process-inset').getAttribute('data-stage'),stage);assert.equal(await page.locator('.prototype-status').count(),seconds===60?1:0);
    }
    await seek(page,53);assert.notDeepEqual((await snapshot(page)).materials.WEB_DR701,baseline.materials.WEB_DR701);
    for(const tag of ['H701','FD701'])assert.deepEqual((await snapshot(page)).materials['WEB_'+tag],baseline.materials['WEB_'+tag]);
    await seek(page,60);assert.equal(await page.locator('.finishing-inset').getAttribute('data-phase'),'quarantine');
    assert.equal(await page.locator('[data-pouch]').getAttribute('data-sealed'),'true');
    assert.equal(await page.locator('.finishing-inset').getAttribute('data-released'),'false');
    await seek(page,17);assert.equal(await page.locator('.growth-inset [data-species=ammonium]').count(),8);assert.equal(await page.locator('.growth-inset [data-species=urea]').count(),7);
    await seek(page,20);assert.equal(await page.locator('.growth-inset [data-species=nitrite]').count(),8);
    await seek(page,22.99);assert.equal(await page.locator('.growth-inset [data-species=nitrate]').count(),8);
    await seek(page,25.24);assert.match(await page.locator('.schematic-state').innerText(),/กักรอตรวจ/);
    await seek(page,25.25);assert.match(await page.locator('.schematic-state').innerText(),/ตัวอย่างการอนุมัติ/);
    assert.notDeepEqual(snapshots[20].materials.WEB_R201,baseline.materials.WEB_R201);
    assert.deepEqual(snapshots[20].materials.WEB_T302,baseline.materials.WEB_T302);
    assert.notDeepEqual(snapshots[33.2].materials.WEB_AIT401,baseline.materials.WEB_AIT401);
    assert.notDeepEqual(snapshots[40].materials.WEB_F501,baseline.materials.WEB_F501);
    assert.notDeepEqual(snapshots[46.5].materials.WEB_T601,baseline.materials.WEB_T601);
    assert.deepEqual(snapshots[46.5].materials.WEB_R401,baseline.materials.WEB_R401);
    assert.notDeepEqual(snapshots[49.5].materials.WEB_T501,baseline.materials.WEB_T501);
    for(const t of [38.8,43.99,44,46.5,48,49.5,50.99]){
      await seek(page,t);assert.equal(await page.locator('.harvest-inset').getAttribute('data-water-released'),'false');
      assert.equal(await page.locator('.harvest-inset [data-species=water]').count(),20);
      assert.equal(await page.locator('.harvest-inset [data-species=nitrate]').count(),10);
    }
    await seek(page,43.99);for(const stream of ['biomass','filtrate'])for(const species of ['water','nitrate'])assert(await page.locator('.harvest-inset [data-stream='+stream+'][data-species='+species+']').count()>0);
    await seek(page,46.5);assert.equal(await page.locator('.harvest-inset [data-species=algae][data-stream=biomass]').count(),10);
    await seek(page,50.99);assert(await page.locator('.harvest-inset [data-stream=wash-hold]').count()>0);
    assert.equal(await page.locator('.harvest-inset [data-stream=candidate]').count(),0);
    await seek(page,46.5);await page.locator('.nav-cta').click();await page.getByRole('button',{name:'หยุดการนำเสนอ',exact:true}).click();
    const stop=await page.locator('#results').getAttribute('data-playhead'),frozen=await snapshot(page);await page.waitForTimeout(400);
    assert.equal(await page.locator('#results').getAttribute('data-playhead'),stop);assert.deepEqual((await snapshot(page)).flow,frozen.flow);assert.equal((await snapshot(page)).schematic,frozen.schematic);
    await page.getByRole('button',{name:'เล่นการนำเสนอ',exact:true}).click();await page.waitForTimeout(250);assert(Number(await page.locator('#results').getAttribute('data-playhead'))>Number(stop));
    await seek(page,46.5);await page.getByRole('button',{name:'ถัดไป',exact:true}).click();assert.equal(await page.locator('.harvest-inset').getAttribute('data-stage'),'washing');assert.equal(await page.locator('#results').getAttribute('data-playing'),'true');
    for(const t of [53,58]) {
      await seek(page,t);await page.getByRole('button',{name:'เล่นการนำเสนอ',exact:true}).click();await page.waitForTimeout(120);
      await page.getByRole('button',{name:'หยุดการนำเสนอ',exact:true}).click();
      const frozen=await snapshot(page),time=await page.locator('#results').getAttribute('data-playhead');await page.waitForTimeout(300);
      assert.equal(await page.locator('#results').getAttribute('data-playhead'),time);assert.equal((await snapshot(page)).schematic,frozen.schematic);
    }
    await seek(page,53);
    // Only the active assembly changes emissive material state; other assemblies retain their values.
    assert.notDeepEqual(snapshots[8.25].materials.WEB_EC101,baseline.materials.WEB_EC101);
    assert.deepEqual(snapshots[8.25].materials.WEB_T101,baseline.materials.WEB_T101);
    assert.deepEqual(snapshots[16.9].materials.WEB_EC101,baseline.materials.WEB_EC101);
    assert.notDeepEqual(snapshots[16.9].materials.WEB_F101,baseline.materials.WEB_F101);
    for(let n=0;n<6;n++){await seek(page,5.3);await seek(page,20);await seek(page,25.25);await seek(page,28);await seek(page,36);await seek(page,40);await seek(page,46.5);await seek(page,49.5);await seek(page,53);await seek(page,58);await seek(page,60);await seek(page,53);}
    const cycled=await snapshot(page);assert.deepEqual(cycled.memory,snapshots[53].memory);assert.deepEqual(cycled.geometry,baseline.geometry);
    await page.waitForTimeout(700);const idle=(await snapshot(page)).frame;await page.waitForTimeout(700);assert.equal((await snapshot(page)).frame,idle);
    if(width===1440) {
      // Inspect both ends and the pump in a close view from two angles through existing UI controls.
      await seek(page,40);await page.locator('.viewer-more summary').click();await page.getByRole('button',{name:'รายการชิ้นส่วน',exact:true}).click();
      await page.getByRole('button',{name:"F501 · ชุดเก็บเกี่ยวและแยกชีวมวล",exact:true}).click();
      await page.locator('.viewer-more summary').click();await page.getByRole('button',{name:'รายการชิ้นส่วน',exact:true}).click();
      for(let i=0;i<8;i++)await page.getByRole('button',{name:'ซูมเข้า',exact:true}).click();
      await page.screenshot({path:path.join(output,'harvest-pipe-detail-front.png'),fullPage:true});
      const box=await page.locator('canvas').boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.5+90,box.y+box.height*.5+20,{steps:10});await page.mouse.up();await page.waitForTimeout(1200);
      await page.screenshot({path:path.join(output,'harvest-pipe-detail-angle.png'),fullPage:true});
      await page.getByRole('button',{name:'คืนมุมมองเริ่มต้น',exact:true}).click();
      await seek(page,0);
      await page.clock.install();
      await page.evaluate(()=>{
        window.protoTimers=new Map();const set=setInterval.bind(window),clear=clearInterval.bind(window);
        window.setInterval=(fn,ms,...args)=>{const id=set(fn,ms,...args);window.protoTimers.set(id,ms);return id;};
        window.clearInterval=id=>{window.protoTimers.delete(id);clear(id);};
      });
      const timerIds=()=>page.evaluate(()=>[...window.protoTimers].filter(([,ms])=>ms===33).map(([id])=>id));
      const time=()=>page.locator('#results').getAttribute('data-playhead').then(Number);
      await page.locator('.nav-cta').click();const ids=await timerIds();assert.equal(ids.length,1);
      await page.clock.runFor(7000);await page.waitForTimeout(100);
      const advanced=await time();
      assert(advanced>=6.9 && advanced<8,'clock should advance 7 s within one tick/action latency, got '+advanced);assert.deepEqual(await timerIds(),ids,'stage changes must not replace the clock');
      assert.equal(await page.locator('.canvas-wrap').getAttribute('data-active-step'),'conditioning');
      await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
      assert.equal((await timerIds()).length,0);const before=await time();await page.clock.fastForward(60000);assert.equal(await time(),before);
      await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
      assert.equal((await timerIds()).length,1);await page.clock.fastForward(500);assert(await time()<before+1);
      await seek(page,8.25);assert.equal((await timerIds()).length,0);
      const paused=await time(), frame=await snapshot(page);await page.clock.fastForward(2000);assert.equal(await time(),paused);assert.deepEqual((await snapshot(page)).flow,frame.flow);
      await page.locator('.nav-cta').click();await page.clock.fastForward(20000);await page.waitForTimeout(100);
      assert(await time()>28);assert.equal(await page.locator('#results').getAttribute('data-playing'),'true');
      await page.getByRole('button',{name:'ถัดไป',exact:true}).click();assert.equal(await page.locator('#results').getAttribute('data-playing'),'true');
      assert.equal(await page.locator('.process-inset').getAttribute('data-stage'),'cultivation');assert.equal((await timerIds()).length,1);
      await page.clock.runFor(65000);await page.waitForTimeout(100);
      assert.equal(await time(),60);assert.equal(await page.locator('#results').getAttribute('data-playing'),'false');assert.equal((await timerIds()).length,0);
      assert.match(await page.locator('.prototype-status').innerText(),/จบการนำเสนอ/);
      assert.equal(await page.locator('.finishing-inset').getAttribute('data-phase'),'quarantine');
      const final=await snapshot(page);await page.clock.runFor(500);assert.equal((await snapshot(page)).schematic,final.schematic);
      await page.screenshot({path:path.join(output,'completed-60-1440.png'),fullPage:true});
      await page.locator('.nav-cta').click();assert(await time()<1);assert.equal((await timerIds()).length,1);
      await page.getByRole('button',{name:'เริ่มไทม์ไลน์ใหม่',exact:true}).click();assert(await time()<1);assert.equal((await timerIds()).length,1);
      await page.goto('about:blank');
    }
    assert.deepEqual(errors,[]);
    results.push({width,result:'PASS',paths:checked,instances:baseline.flow.reduce((sum,g)=>sum+g.count,0),checks:'deterministic scrub, geometry/material ownership, idle, resource stability, responsive layout; 17–60 s stage boundaries, biomass/filtrate/wash separation and actual pause/resume, symbolic nitrogen/release/helix cells; desktop includes clock/hidden/scrub pause/60s completion and multi-angle pipe images'});
    console.log('PASS animation prototype',width);await page.close();
  }
  await fs.writeFile(path.join(output,'report.json'),JSON.stringify({results},null,2));
})().catch(async e=>{console.error(e);await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'report.json'),JSON.stringify({results,error:e.message},null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();});
