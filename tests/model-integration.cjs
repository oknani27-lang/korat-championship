// Real exported asset checks; separate from the synthetic UI regression fixtures.
const { chromium } = require(process.env.DMR_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const base = process.env.DMR_TEST_URL || 'http://127.0.0.1:5175';
const output = path.resolve('test-results/model-integration');
let browser;
const results = [];
async function inspect(page) {
  return page.evaluate(async () => {
    const resource = performance.getEntriesByType('resource').find(r => r.name.includes('/@react-three_fiber.js'));
    const { _roots } = await import(resource.name);
    const root = _roots.get(document.querySelector('canvas')).store.getState();
    const meshes = [];
    const corners = [];
    root.scene.updateMatrixWorld(true);
    root.scene.traverse(o => {
      if (!o.isMesh || !o.userData.sourceObjectName) return;
      meshes.push(o.userData.sourceObjectName);
      o.geometry.computeBoundingBox();
      const { min, max } = o.geometry.boundingBox;
      for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
        corners.push(root.camera.position.clone().set(x,y,z).applyMatrix4(o.matrixWorld).project(root.camera).toArray());
      }
    });
    const parts = [];
    root.scene.traverse(o => { if (/^WEB_/.test(o.name)) parts.push({name:o.name,children:o.children.length}); });
    return { meshes, parts, projectedWidth:(Math.max(...corners.map(p=>p[0]))-Math.min(...corners.map(p=>p[0])))/2, clippedCorners:corners.filter(p=>Math.abs(p[0])>1.001||Math.abs(p[1])>1.001||Math.abs(p[2])>1).length,
      position:root.camera.position.toArray(),target:root.controls.target.toArray(),scene:root.scene.uuid,
      frame:root.gl.info.render.frame,render:{...root.gl.info.render},memory:{...root.gl.info.memory} };
  });
}
(async () => {
  await fs.mkdir(output,{recursive:true});
  const audit = JSON.parse(await fs.readFile('docs/model-export-audit.json','utf8'));
  const registry = JSON.parse(await fs.readFile('src/data/machine-parts.json','utf8'));
  browser = await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for (const width of [1440,768,390]) {
    const page = await browser.newPage({viewport:{width,height:width<600?844:1050}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto(base);
    await page.locator('.canvas-wrap[data-model-state=ready]').waitFor({timeout:45000});
    await page.waitForTimeout(700);
    assert.equal(await page.locator('.model-notice[role=alert]').count(),0);
    assert.equal(await page.locator('.placeholder-callout').count(),0);
    assert.equal(await page.locator('canvas').count(),1);
    const initial=await inspect(page);
    assert.equal(initial.meshes.length,audit.exportedSourceObjects);
    assert.deepEqual(new Set(initial.meshes),new Set(audit.nodes.map(n=>n.sourceName)));
    for(const part of registry) assert(initial.parts.find(p=>p.name===part.nodeName&&p.children>0),part.id);
    assert.equal(initial.clippedCorners,0,'whole machine must fit at '+width);
    assert(initial.projectedWidth>.75,'machine should fill most of its viewport');
    assert((await page.locator('canvas').boundingBox()).width>(await page.locator('#simulator').boundingBox()).width*.85,'machine fills its workspace beside the details');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:path.join(output,'machine-'+width+'.png'),fullPage:true});
    await page.locator('.viewer-more summary').click();
    await page.getByRole('button',{name:'รายการชิ้นส่วน',exact:true}).click();
    assert.equal(await page.locator('.parts-panel button').count(),registry.length);
    for(const part of registry){
      const button=page.getByRole('button',{name:part.label,exact:true});
      assert(await button.isEnabled(),part.id);
      await button.click();
      assert.equal(await page.locator('.selected-part').innerText(),part.label);
      const focus=(await inspect(page)).target;
      assert(focus.every((v,i)=>Math.abs(v-part.focus[i])<.001),'focus '+part.id);
    }
    await page.locator('.viewer-more summary').click();
    await page.getByRole('button',{name:'รายการชิ้นส่วน',exact:true}).click();
    await page.getByRole('button',{name:'คืนมุมมองเริ่มต้น',exact:true}).click();
    await page.waitForTimeout(200);
    const reset=await inspect(page);
    assert(reset.position.every((v,i)=>Math.abs(v-initial.position[i])<.00001));
    const canvas=await page.locator('canvas').boundingBox();
    await page.mouse.move(canvas.x+canvas.width*.55,canvas.y+canvas.height*.5);
    await page.mouse.down();await page.mouse.move(canvas.x+canvas.width*.55+40,canvas.y+canvas.height*.5+20,{steps:8});await page.mouse.up();
    await page.waitForTimeout(500);assert.notDeepEqual((await inspect(page)).position,initial.position);
    await page.getByRole('button',{name:'ซูมเข้า',exact:true}).click();
    await page.getByRole('button',{name:'คืนมุมมองเริ่มต้น',exact:true}).click();
    await page.mouse.move(1,1);
    await page.waitForTimeout(900);const idle=await inspect(page);await page.waitForTimeout(700);
    assert.equal((await inspect(page)).frame,idle.frame,'demand rendering must become idle');
    assert.deepEqual(errors,[]);
    results.push({width,result:'PASS',meshCount:initial.meshes.length,assemblies:registry.length,clippedCorners:initial.clippedCorners,render:initial.render,memory:initial.memory});
    console.log('PASS real machine',width);
    await page.close();
  }
  // Exercise the real application fallback, not only a synthetic component fixture.
  const page=await browser.newPage({viewport:{width:1440,height:1050}});
  await page.route('**/models/dmr-machine.glb',r=>r.fulfill({status:404,body:'Intentional missing-model test'}));
  await page.goto(base);
  await page.locator('.model-notice[role=alert]').waitFor();
  assert(await page.locator('.placeholder-callout').isVisible());
  assert.equal(await page.locator('canvas').count(),1);
  await page.locator('.nav-cta').click();assert(await page.getByRole('slider').isEnabled());
  results.push({test:'real application missing GLB fallback',result:'PASS'});
  await fs.writeFile(path.join(output,'report.json'),JSON.stringify({results},null,2));
  console.log('PASS real GLB, assembly registry, framing, controls and missing-model fallback');
})().catch(async error=>{
  console.error(error);await fs.mkdir(output,{recursive:true});
  await fs.writeFile(path.join(output,'report.json'),JSON.stringify({results,error:error.message},null,2));process.exitCode=1;
}).finally(async()=>{await browser?.close();});
