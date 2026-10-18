// Start npm run dev first. Uses an existing Playwright installation; no production dependency.
const { chromium } = require(process.env.DMR_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const base = process.env.DMR_TEST_URL || 'http://127.0.0.1:5173';
const output = process.env.DMR_TEST_OUTPUT || path.resolve('test-results');
const results = [];
const warnings = new Set();
let browser;

async function test(name, action) {
  if(process.env.DMR_TEST_FILTER && !new RegExp(process.env.DMR_TEST_FILTER).test(name))return;
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();
  const errors = [];
  const failures = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); if (msg.type() === 'warning') warnings.add(msg.text()); });
  page.on('requestfailed', request => failures.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  try {
    await action(page, { errors, failures });
    results.push({ name, result: 'PASS', consoleErrors: errors, networkFailures: failures });
    console.log('PASS', name);
  } finally { await context.close(); }
}
const near = (a, b) => a.every((value, i) => Math.abs(value - b[i]) < 1e-5);
async function state(page, action = 'read') {
  return page.evaluate(async action => {
    const url = performance.getEntriesByType('resource').find(r => r.name.includes('/@react-three_fiber.js')).name;
    const module = await import(url);
    const canvas = document.querySelector('canvas');
    const root = module._roots.get(canvas).store.getState();
    const geometries = [];
    root.scene.traverse(node => { if (node.geometry) geometries.push(node.geometry.uuid); });
    if (action === 'capture') window.auditScene = root.scene;
    return { position: root.camera.position.toArray(), target: root.controls?.target.toArray(), distance: root.controls?.getDistance(), scene: root.scene.uuid, geometryIds: geometries.sort(), frames: root.gl.info.render.frame, memory: { ...root.gl.info.memory }, sameScene: window.auditScene === root.scene, pixelRatio:root.gl.getPixelRatio() };
  }, action);
}
async function ready(page, url = '/') { await page.goto(base + url); await page.locator('canvas').waitFor(); await page.waitForTimeout(400); }
async function secondary(page, name) {
  await page.locator('.viewer-more summary').click();
  await page.getByRole('button', { name, exact: true }).click();
  assert.equal(await page.locator('.viewer-more').getAttribute('open'),null);
}
async function drag(page, dx, dy) {
  const b = await page.locator('canvas').boundingBox();
  await page.mouse.move(b.x + b.width * 0.6, b.y + b.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.6 + dx, b.y + b.height * 0.6 + dy, { steps: 8 });
  await page.mouse.up(); await page.waitForTimeout(350);
}
async function installTimerProbe(page) {
  await page.clock.install();
  await page.evaluate(() => {
    window.auditTimers = new Map();
    window.auditVisibility = new Set();
    const set = window.setInterval.bind(window), clear = window.clearInterval.bind(window);
    window.setInterval = (callback, ms, ...args) => { const id = set(callback, ms, ...args); window.auditTimers.set(id, ms); return id; };
    window.clearInterval = id => { window.auditTimers.delete(id); clear(id); };
    const add = document.addEventListener.bind(document), remove = document.removeEventListener.bind(document);
    document.addEventListener = (name, fn, options) => { if (name === 'visibilitychange') window.auditVisibility.add(fn); add(name, fn, options); };
    document.removeEventListener = (name, fn, options) => { if (name === 'visibilitychange') window.auditVisibility.delete(fn); remove(name, fn, options); };
  });
}
async function advance(page, ms) { await page.clock.runFor(ms); await new Promise(resolve => setTimeout(resolve, 40)); }
const timers = page => page.evaluate(() => [...window.auditTimers.values()].filter(ms => ms === 100).length);
async function routeModelFixture(page, gate) {
  const data=Buffer.alloc(36);[-1,-1,0,1,-1,0,0,1,0].forEach((value,i)=>data.writeFloatLE(value,i*4));
  const gltf={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:'NamedAssembly',children:[1]},{name:'MeshChild',mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],buffers:[{uri:'data:application/octet-stream;base64,'+data.toString('base64'),byteLength:36}],bufferViews:[{buffer:0,byteLength:36}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-1,-1,0],max:[1,1,0]}]};
  await page.route('**/tests/part-fixture.gltf',async route=>{if(gate)await gate;await route.fulfill({json:gltf})});
}
async function infrastructure(page) {
  return page.evaluate(async()=>{
    const url=performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js')).name;
    const {_roots}=await import(url),root=_roots.get(document.querySelector('canvas')).store.getState();
    const names=['ShellA','InsertB','ExtraA','BoxC'];const meshes={};
    for(const name of names){const mesh=root.scene.getObjectByName(name);if(!mesh)continue;const material=mesh.material;meshes[name]={material:material.uuid,color:material.color?.getHexString(),opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite,geometry:mesh.geometry.uuid};}
    const flows={};root.scene.traverse(node=>{if(/^flow:.*:marker$/.test(node.name))flows[node.name]=node.position.toArray()});
    const model=root.scene.getObjectByName('ModelInstance');let bounds=null;
    if(model){const threeUrl=performance.getEntriesByType('resource').find(r=>r.name.includes('/three.js')).name;const {Box3,Vector3}=await import(threeUrl);const box=new Box3().setFromObject(model);bounds={center:box.getCenter(new Vector3()).toArray(),size:box.getSize(new Vector3()).toArray()};}
    return {scene:root.scene.uuid,meshes,flows,bounds,target:root.controls.target.toArray(),position:root.camera.position.toArray(),memory:{...root.gl.info.memory},frames:root.gl.info.render.frame,drawCalls:root.gl.info.render.calls};
  });
}
async function pointAtNode(page,name) {
  const point=await page.evaluate(async name=>{
    const url=performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js')).name;
    const {_roots}=await import(url),canvas=document.querySelector('canvas'),root=_roots.get(canvas).store.getState(),node=root.scene.getObjectByName(name);
    const point=node.getWorldPosition(node.position.clone()).project(root.camera),rect=canvas.getBoundingClientRect();return {x:rect.x+(point.x+1)*rect.width/2,y:rect.y+(1-point.y)*rect.height/2};
  },name);return point;
}
async function openParts(page){if(!await page.locator('.parts-panel').isVisible())await secondary(page,'รายการชิ้นส่วน');}

(async () => {
  await fs.mkdir(output, { recursive: true });
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  await test('Start Demo enters in place, repeated/keyboard entry keeps viewport and Canvas', async (page,{errors,failures})=>{
    for(const width of [1440,1280,768,390,320]){
      await page.setViewportSize({width,height:width<600?844:1050});await ready(page);
      assert(await page.getByRole('slider').isDisabled());
      const initial=await state(page,'capture');
      for(const selector of width>1100?['.nav-cta','.hero-cta','.hero-cta']:['.hero-cta','.hero-cta']){
        await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(250);
        const before=await page.evaluate(()=>({y:scrollY,hash:location.hash,top:document.querySelector('#simulator').getBoundingClientRect().top}));
        await page.locator(selector).click();await page.waitForTimeout(500);
        const after=await page.evaluate(()=>({y:scrollY,hash:location.hash,top:document.querySelector('#simulator').getBoundingClientRect().top}));
        assert.deepEqual(after,before,`Start Demo must not scroll at ${width}`);
        assert.equal(await page.locator('#simulator').getAttribute('data-demo-mode'),'true');
        assert.equal(await page.locator('#sheet-content').getAttribute('aria-hidden'),'true');
        assert(await page.getByRole('slider').isEnabled());
        const current=await state(page);assert.equal(current.scene,initial.scene);assert.deepEqual(current.geometryIds,initial.geometryIds);
        assert.equal(await page.locator('canvas').count(),1);
        assert(await page.locator('canvas').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}));
        assert(await page.locator('#simulator').evaluate(el=>el===document.activeElement));
      }
      await page.locator('.hero-cta').focus();await page.keyboard.press('Enter');await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>scrollY),0);
      await page.mouse.click(10,105);await page.screenshot({path:path.join(output,`demo-${width}.png`),fullPage:true});
    }
    assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  });
  await test('Unified step state: compact navigation, per-step progress and viewer metadata', async (page,{errors,failures})=>{
    const fixtures=[0,1,2].map(i=>({id:`ui-${i}`,title:`UI step ${i+1}`,subtitle:'UI fixture only',description:`Interface fixture ${i+1}, not scientific data`,formulas:i===1?[[{kind:'text',text:'UI'},{kind:'sub',text:'2'}]]:[],outputs:[`UI output ${i+1}`],activeParts:[],flowPaths:[],cameraFocus:null,timeline:{start:i/3,end:(i+1)/3}}));
    await page.route('**/src/data/process-steps.json*',route=>route.fulfill({contentType:'application/javascript',body:'export default '+JSON.stringify(fixtures)}));
    await ready(page);await page.locator('.hero-cta').click();const initial=await state(page);
    await page.getByRole('slider').fill('800');await page.locator('.hero-cta').click();assert.equal(await page.getByRole('slider').inputValue(),'800');
    await page.getByRole('button',{name:'ถัดไป',exact:true}).scrollIntoViewIfNeeded();const y=await page.evaluate(()=>scrollY);
    await page.getByRole('button',{name:'ถัดไป',exact:true}).click();assert.equal(await page.evaluate(()=>scrollY),y);
    assert.equal(await page.locator('#compact-process-title').innerText(),'UI step 2');assert.equal(await page.getByRole('slider').inputValue(),'0');
    assert.equal(await page.locator('.canvas-wrap').getAttribute('data-active-step'),'ui-1');
    await page.getByRole('button',{name:'ดูรายละเอียด',exact:true}).click();await page.waitForTimeout(300);
    assert.match(await page.locator('.outputs').innerText(),/UI output 2/);assert.equal(await page.locator('.formula sub').innerText(),'2');
    assert.equal(await page.locator('.outputs .small-note').count(),0);
    assert.equal(await page.locator('.sheet-columns article').nth(1).locator('.small-note').count(),0);
    await page.getByRole('slider').fill('1000');await page.getByRole('slider').fill('10');assert.equal(await page.locator('#process-title').innerText(),'UI step 2');
    await page.getByRole('button',{name:'ก่อนหน้า',exact:true}).click();assert.equal(await page.locator('#process-title').innerText(),'UI step 1');assert.equal(await page.getByRole('slider').inputValue(),'0');
    assert.match(await page.locator('.process-explanation').innerText(),/Interface fixture 1/);
    await page.getByRole('button',{name:'ถัดไป',exact:true}).evaluate(el=>{for(let i=0;i<20;i++)el.click()});assert.equal(await page.locator('#process-title').innerText(),'UI step 3');assert(await page.getByRole('button',{name:'ถัดไป',exact:true}).isDisabled());
    assert.equal((await state(page)).scene,initial.scene);assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  });
  await test('Desktop/tablet/mobile layout, anchors, collapsed results, keyboard menu', async (page, { errors, failures }) => {
    await ready(page);
    const hero=page.locator('.viewer-heading');
    assert.deepEqual(await hero.locator(':scope > *').evaluateAll(nodes=>nodes.map(el=>el.textContent.replace(/\s+/g,' ').trim())),['DEMETER ReFeed','Turn Waste Into New Value','Start Demo']);
    assert.equal(await hero.locator('p,small,.eyebrow').count(),0);
    assert.equal(await page.locator('.viewer-toolbar button').count(),4);
    assert.equal(await page.locator('#sheet-content').getAttribute('aria-hidden'),'true');
    assert(await page.locator('#compact-process-title').isVisible());
    const compactHeight=(await page.locator('.bottom-sheet').boundingBox()).height;
    await page.getByRole('button',{name:'ดูรายละเอียด',exact:true}).click();await page.waitForTimeout(300);
    assert((await page.locator('.bottom-sheet').boundingBox()).height>compactHeight);
    assert.equal(await page.locator('.sheet-columns').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),3);
    await page.getByRole('button',{name:'ย่อรายละเอียด',exact:true}).click();
    for (const width of [1440, 1280, 1150, 1101, 1024, 768, 580, 390, 320]) {
      await page.setViewportSize({ width, height: 1050 });
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow at ${width}`);
      assert(await page.locator('canvas').isVisible());
      const canvasSize = await page.locator('canvas').boundingBox();
      assert(canvasSize.width > 100 && canvasSize.height > 200);
      const sheet=await page.locator('.bottom-sheet').boundingBox(),toolbar=await page.locator('.viewer-toolbar').boundingBox(),timeline=await page.locator('.timeline').boundingBox();
      const more=await page.locator('.viewer-more summary').boundingBox();
      assert(more.y>=toolbar.y+toolbar.height,'More must not cover Reset');
      assert(sheet.y>=toolbar.y+toolbar.height,'sheet must not cover toolbar');assert(timeline.y>=sheet.y,'timeline stays inside sheet');
      if ([1440, 768, 390].includes(width)) await page.screenshot({ path: path.join(output, `audit-${width}.png`), fullPage: true });
    }
    await page.getByRole('button', { name: 'เปิดเมนู', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.locator('.hero-cta').click();
    assert.equal(await page.locator('#sheet-content').getAttribute('aria-hidden'), 'true');
    assert.equal(new URL(page.url()).hash, '');
    assert(await page.getByRole('slider').isEnabled());
    await page.getByRole('button', { name: 'เปิดเมนู', exact: true }).click();
    await page.getByRole('navigation').getByRole('link').first().focus();
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button', { name: 'เปิดเมนู', exact: true }).evaluate(el => el === document.activeElement), true);
    for (const label of ['Overview','Research','Technology']) {
      await page.getByRole('button', { name: 'เปิดเมนู', exact: true }).click();
      const link = page.getByRole('navigation').getByRole('link', { name: label, exact: true });
      const hash = await link.getAttribute('href'); await link.click(); assert.equal(new URL(page.url()).hash, hash);
    }
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  });
  await test('Orbit, pan, zoom modes, limits, Reset, resize, scene identity and idle rendering', async (page, { errors, failures }) => {
    await ready(page); const initial = await state(page, 'capture');
    await drag(page, -110, 40); assert(!near((await state(page)).position, initial.position));
    await page.getByRole('button', { name: 'คืนมุมมองเริ่มต้น', exact: true }).click(); await page.waitForTimeout(250);
    assert(near((await state(page)).position, initial.position)); assert(near((await state(page)).target, initial.target));
    await secondary(page, 'เลื่อนมุมมอง'); await drag(page, -80, -20); await page.waitForTimeout(1000); const panned = await state(page); assert(!near(panned.target, initial.target));
    await secondary(page, 'รายการชิ้นส่วน');
    const afterPanel=await state(page); console.log('PAN RERENDER',panned.target,afterPanel.target); assert(afterPanel.target.every((value,i)=>Math.abs(value-panned.target[i])<0.02), 'UI rerender must preserve pan');
    await secondary(page, 'รายการชิ้นส่วน');
    await page.getByRole('button', { name: 'คืนมุมมองเริ่มต้น', exact: true }).click();
    await page.getByRole('button', { name: 'ซูม: ลากด้วยเมาส์ หรือใช้สองนิ้วบนจอสัมผัส', exact: true }).click();
    await drag(page, 0, -65); assert(Math.abs((await state(page)).distance - initial.distance) > 0.1);
    const canvas = page.locator('canvas'); const box = await canvas.boundingBox(); await page.mouse.move(box.x + 70, box.y + 70); await page.mouse.wheel(0, 150); await page.waitForTimeout(250);
    for (const label of ['ซูมเข้า', 'ซูมออก']) { await page.getByRole('button', { name: label, exact: true }).evaluate(el => { for (let i = 0; i < 35; i++) el.click(); }); const s = await state(page); assert(s.distance >= 2.8 - 1e-6 && s.distance <= 12 + 1e-6); }
    await page.getByRole('button', { name: 'คืนมุมมองเริ่มต้น', exact: true }).click(); await page.waitForTimeout(700);
    for (let i = 0; i < 8; i++) { await secondary(page, 'รายการชิ้นส่วน'); await page.getByRole('button', { name: 'X-Ray ตัวอย่างโครงร่าง — ยังไม่ใช่ Smart X-Ray จริง', exact: true }).click(); }
    const after = await state(page); assert.equal(after.sameScene, true); assert.deepEqual(after.geometryIds, initial.geometryIds); assert.deepEqual(after.memory, initial.memory);
    await page.waitForTimeout(700); const idle = (await state(page)).frames; await page.waitForTimeout(700); const idleDelta=(await state(page)).frames-idle; assert.equal(idleDelta,0, 'idle viewer must stop rendering');
    await page.setViewportSize({ width: 768, height: 900 }); await page.waitForTimeout(200); assert.equal((await state(page)).scene, initial.scene);
    console.log('MEASURED', JSON.stringify({ idleFramesOver700ms: idleDelta, geometries: after.memory.geometries, textures: after.memory.textures }));
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  });
  await test('Timeline boundaries, multi-step, rapid clicks, hidden tab, timer cleanup and unmount', async (page, { errors, failures }) => {
    await page.goto(base + '/tests/harness.html'); await page.getByRole('slider').waitFor(); await page.getByRole('button',{name:'Start Demo',exact:true}).click(); await page.getByRole('button',{name:'ดูรายละเอียด',exact:true}).click(); await installTimerProbe(page);
    const slider = page.getByRole('slider'); const play = () => page.getByRole('button', { name: 'เล่นตัวอย่าง UI', exact: true });
    assert(await page.getByRole('button', { name: 'ก่อนหน้า', exact: true }).isDisabled());
    await play().click(); assert.equal(await timers(page), 1); await advance(page, 1000); assert(Number(await slider.inputValue()) > 0);
    await page.getByRole('button', { name: 'ถัดไป', exact: true }).click(); assert.equal(await slider.inputValue(), '0'); assert.equal(await timers(page), 0); assert.equal(await page.locator('#process-title').innerText(), 'UI fixture 2');
    assert.equal(await page.locator('.formula sub').innerText(), '2'); assert.equal(await page.locator('.formula sup').innerText(), '+');
    await slider.fill('1000'); assert(await page.getByRole('button', { name: 'ถัดไป', exact: true }).isEnabled()); assert.equal(await page.locator('#process-title').innerText(),'UI fixture 2');
    await slider.fill('249'); assert.equal(await page.locator('#process-title').innerText(), 'UI fixture 2');
    await slider.fill('750'); assert.equal(await page.locator('#process-title').innerText(), 'UI fixture 2');
    await slider.fill('300'); assert.equal(await page.locator('#process-title').innerText(), 'UI fixture 2');
    await play().dblclick(); assert.equal(await timers(page), 0);
    await play().click(); assert.equal(await timers(page), 1);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    assert.equal(await timers(page), 0); const hiddenValue = await slider.inputValue(); await advance(page, 60000); assert.equal(await slider.inputValue(), hiddenValue);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    assert.equal(await timers(page), 1); await advance(page, 100); assert(Number(await slider.inputValue()) < Number(hiddenValue) + 10);
    await page.getByRole('button', { name: 'หยุดตัวอย่าง UI', exact: true }).click(); assert.equal(await timers(page), 0); const paused = await slider.inputValue(); await advance(page, 1000); assert.equal(await slider.inputValue(), paused);
    await slider.fill('999'); await play().click(); assert.equal(await timers(page),1); await advance(page, 500); assert.equal(await slider.inputValue(), '1000'); assert.equal(await timers(page), 0);
    await play().click(); assert.equal(await slider.inputValue(), '0'); assert.equal(await timers(page), 1);
    await page.getByRole('button', { name: 'เริ่มไทม์ไลน์ใหม่', exact: true }).click(); assert.equal(await slider.inputValue(), '0'); assert.equal(await timers(page), 0);
    await play().click(); await page.getByRole('button', { name: 'Unmount', exact: true }).click(); assert.equal(await timers(page), 0); assert.equal(await page.evaluate(() => window.auditVisibility.size), 0);
    await page.getByRole('button', { name: 'Mount', exact: true }).click(); assert.equal(await slider.inputValue(), '0'); await page.getByRole('button',{name:'Start Demo',exact:true}).click(); await play().click(); assert.equal(await timers(page), 1);
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  });
  await test('Long unbroken titles and formula tokens fit desktop and mobile', async (page, {errors, failures}) => {
    await page.goto(base+'/tests/harness.html?case=long'); await page.getByRole('button',{name:'ดูรายละเอียด',exact:true}).click();
    for(const width of [1440,768,390,320]) {
      await page.setViewportSize({width,height:1050});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.equal(await page.locator('.formula').evaluate(el=>el.scrollWidth>el.clientWidth),false);
    }
    assert.deepEqual(errors,[]); assert.deepEqual(failures,[]);
  });
  await test('Mobile touch rotate/pan and pinch zoom obey the selected mode', async (page, {errors, failures}) => {
    await page.setViewportSize({width:390,height:844}); await ready(page);
    const cdp=await page.context().newCDPSession(page);
    const b=await page.locator('canvas').boundingBox(); const x=b.x+b.width*.5,y=b.y+b.height*.65;
    async function swipe(){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*5,y:y-i*2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);}
    const start=await state(page);await swipe(); assert(!near((await state(page)).position,start.position));
    await page.getByRole('button',{name:'คืนมุมมองเริ่มต้น',exact:true}).click();
    await secondary(page, 'เลื่อนมุมมอง');await swipe();assert(!near((await state(page)).target,start.target));
    await page.getByRole('button',{name:'คืนมุมมองเริ่มต้น',exact:true}).click();
    await page.getByRole('button',{name:'ซูม: ลากด้วยเมาส์ หรือใช้สองนิ้วบนจอสัมผัส',exact:true}).click();const before=await state(page);await swipe();assert(near((await state(page)).position,before.position),'Zoom mode must not rotate on one-finger drag');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-25,y,id:1},{x:x+25,y,id:2}]});
    for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-25-i*5,y,id:1},{x:x+25+i*5,y,id:2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);assert(Math.abs((await state(page)).distance-before.distance)>0.1);
    assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  });
  await test('WebGL context loss/restoration provides feedback and disables camera input', async page => {
    await ready(page); await page.evaluate(() => { window.lostContextExtension = document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context'); window.lostContextExtension.loseContext(); });
    await page.locator('.context-lost').waitFor(); assert(await page.getByRole('button', { name: 'ซูมเข้า', exact: true }).isDisabled());
    await page.evaluate(() => window.lostContextExtension.restoreContext());
    await page.locator('.context-lost').waitFor({ state: 'hidden' }); assert.equal(await page.getByRole('button', { name: 'ซูมเข้า', exact: true }).isDisabled(), false);
  });
  await test('Unavailable WebGL fails locally without losing the process UI', async page => {
    await page.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.includes('webgl') ? null : original.call(this, type, ...args); }; });
    await page.goto(base); await page.getByRole('alert').waitFor(); assert(await page.getByRole('slider').isVisible()); assert.equal(await page.getByRole('button', { name: 'ซูมเข้า', exact: true }).count(), 0);
  });
  await test('Failed 3D module import is contained by the viewer boundary', async page => {
    await page.route('**/src/components/viewer/MachineViewer.tsx*', route => route.abort());
    await page.goto(base); await page.getByRole('alert').waitFor(); assert(await page.getByRole('slider').isVisible()); assert(await page.getByRole('heading', { name: 'Process overview' }).isVisible());
  });
  await test('Synthetic GLTF hierarchy selection, hover hit-test and Canvas unmount', async (page, { errors, failures }) => {
    const data = Buffer.alloc(36); [-1,-1,0,1,-1,0,0,1,0].forEach((value, i) => data.writeFloatLE(value, i * 4));
    const gltf = { asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name:'NamedAssembly',children:[1] },{name:'MeshChild',mesh:0}], meshes:[{primitives:[{attributes:{POSITION:0}}]}], buffers:[{uri:'data:application/octet-stream;base64,'+data.toString('base64'),byteLength:36}],bufferViews:[{buffer:0,byteLength:36}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-1,-1,0],max:[1,1,0]}] };
    await page.route('**/tests/part-fixture.gltf', route => route.fulfill({ json: gltf }));
    await ready(page, '/tests/harness.html?case=model');
    const c=page.locator('canvas'), box=await c.boundingBox(); await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.waitForTimeout(150); await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
    assert.equal(await page.locator('#fixture-selection').innerText(),'test-part');
    await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js')).name;const module=await import(url);const canvas=document.querySelector('canvas');window.auditCanvas=canvas;window.auditModule=module;const gl=module._roots.get(canvas).store.getState().gl;window.auditDisposeCalls=0;const dispose=gl.dispose.bind(gl);gl.dispose=()=>{window.auditDisposeCalls++;dispose()};});
    await page.getByRole('button',{name:'Unmount',exact:true}).click(); assert.equal(await c.count(),0); await page.waitForTimeout(650);
    assert.equal(await page.evaluate(()=>window.auditModule._roots.has(window.auditCanvas)),false);assert.equal(await page.evaluate(()=>window.auditDisposeCalls),1);
    assert.deepEqual(errors,[]); assert.deepEqual(failures,[]);
  });
  await test('Missing GLTF is caught by the same error boundary', async page => {
    await page.route('**/tests/missing.gltf', route => route.fulfill({status:404,body:'Missing test fixture'}));
    await page.goto(base+'/tests/harness.html?case=missing'); await page.getByRole('alert').waitFor(); assert(await page.getByRole('button',{name:'Unmount',exact:true}).isVisible());
  });
  await test('Research navigation, honest empty state, search and process filters', async (page,{errors,failures})=>{
    await ready(page);await page.getByRole('navigation').getByRole('link',{name:'Research',exact:true}).click();assert.equal(new URL(page.url()).hash,'#research');assert(await page.getByRole('heading',{name:'รอเอกสารงานวิจัยฉบับยืนยัน'}).isVisible());assert(await page.getByRole('searchbox',{name:'ค้นหางานวิจัย'}).isDisabled());
    await page.goto(base+'/tests/harness.html?case=research');const search=page.getByRole('searchbox',{name:'ค้นหางานวิจัย'});await page.locator('.research-card').first().waitFor();assert.equal(await page.locator('.research-card').count(),2);
    await search.fill('fixture A');assert.equal(await page.locator('.research-card').count(),1);await page.getByRole('combobox').selectOption('fixture-2');assert.equal(await page.locator('.research-card').count(),0);await page.getByRole('button',{name:'ล้างตัวกรอง'}).click();assert.equal(await page.locator('.research-card').count(),2);
    await page.getByRole('combobox').selectOption('fixture-2');assert.match(await page.locator('.research-card h3').innerText(),/fixture B/);assert.equal(await page.locator('.paper-links a').getAttribute('rel'),'noopener noreferrer');
    await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(output,'research-fixture-390.png'),fullPage:true});
    assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  });
  await test('Missing process metadata stays readable instead of crashing',async(page,{errors,failures})=>{
    await page.route('**/src/data/process-steps.json*',route=>route.fulfill({contentType:'application/javascript',body:'export default []'}));await ready(page);assert(await page.locator('.data-notice').isVisible());assert(await page.getByRole('heading',{name:'รอข้อมูลกระบวนการ',exact:true}).isVisible());assert.equal(await page.getByRole('slider').count(),0);assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  });
  await test('Integration validation reports invalid references, camera, parts and connections without crashing',async(page,{errors,failures})=>{
    const step={id:'validation-step',title:'Generic validation fixture',subtitle:'UI only',description:'Not scientific data',formulas:[],outputs:[],activeParts:['missing-part'],flowPaths:['missing-path'],researchIds:['missing-paper'],cameraFocus:null,timeline:{start:0,end:1,phases:[{id:'phase',start:0,end:1,activeXrayParts:['missing-shell'],flowPaths:['missing-phase-path']}]}};
    const part={id:'generic-part',nodeName:'GenericNode',label:'Generic fixture',focus:null,connectionPoints:[{id:'out',position:[0,0,0]}]};
    const flow={id:'validation-flow',partIds:['missing-part'],points:[[0,0,0],[1,0,0]],from:{partId:'generic-part',connectionId:'missing-connection'}};
    let processData=[step],partData=[part];
    for(const [file,data] of [['process-steps',()=>processData],['machine-parts',()=>partData],['flow-paths',()=>[flow]]])await page.route(`**/src/data/${file}.json*`,route=>route.fulfill({contentType:'application/javascript',body:'export default '+JSON.stringify(data())}));
    await ready(page);const notice=page.locator('.data-notice');
    for(const id of ['missing-part','missing-path','missing-paper','validation-step/phase','missing-shell','missing-phase-path','validation-flow','generic-part/missing-connection'])assert((await notice.innerText()).includes(id));
    await page.locator('.hero-cta').click();assert.equal(await page.getByRole('slider').count(),1);
    processData=[{...step,cameraFocus:{position:[1,1,1],target:[1,1,1]}}];await ready(page);assert.match(await notice.innerText(),/Invalid camera focus: validation-step/);assert.equal(await page.getByRole('slider').count(),0);
    processData=[{...step,activeParts:[],flowPaths:[],researchIds:[],timeline:{start:0,end:1}}];partData=[part,part];await ready(page);assert.match(await notice.innerText(),/Duplicate machine parts id: generic-part/);
    partData=[{...part,connectionPoints:[{id:'out',position:[0,0]}]}];await ready(page);assert.match(await notice.innerText(),/Invalid machine parts configuration: generic-part/);assert.equal(await page.locator('canvas').count(),1);
    assert.equal(new URL(page.url()).pathname,'/');assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  });
  await test('Model loading and invalid component mappings preserve the Canvas',async(page)=>{
    let release;const gate=new Promise(resolve=>{release=resolve});await routeModelFixture(page,gate);await ready(page,'/tests/harness.html?case=viewer-low');await page.locator('.model-notice[role=status]').waitFor();const initial=(await state(page)).scene;release();await page.locator('.model-notice[role=status]').waitFor({state:'hidden'});assert.equal((await state(page)).scene,initial);assert.equal((await state(page)).pixelRatio,1);assert.equal(await page.locator('canvas').count(),1);
    await page.goto(base+'/tests/harness.html?case=viewer-invalid');await page.locator('.model-notice[role=alert]').waitFor();assert.match(await page.locator('.model-notice').innerText(),/MissingNode/);await secondary(page, 'รายการชิ้นส่วน');assert(await page.getByRole('button',{name:'Missing test node',exact:true}).isDisabled());assert.equal(await page.locator('canvas').count(),1);
  });
  await test('Missing model fallback and source replacement do not remount Canvas',async page=>{
    await routeModelFixture(page);await page.route('**/tests/missing.gltf',route=>route.fulfill({status:404,body:'Missing test fixture'}));await ready(page,'/tests/harness.html?case=viewer-switch');await page.locator('.model-notice[role=alert]').waitFor();assert.match(await page.locator('.model-notice').innerText(),/ไม่พบไฟล์โมเดล GLB/);assert.equal(await page.locator('canvas').count(),1);const initial=(await state(page)).scene;await page.getByRole('button',{name:'Switch source'}).click();await page.locator('.model-notice').waitFor({state:'hidden'});assert.equal((await state(page)).scene,initial);assert.equal(await page.locator('canvas').count(),1);
  });
  await test('Generic registry, hover/selection isolation, focus interruption and repeated reset',async(page,{errors,failures})=>{
    await ready(page,'/tests/harness.html?case=integration');await page.waitForFunction(()=>document.querySelector('canvas'));await page.waitForTimeout(400);
    const initial=await infrastructure(page),originalMaterial=initial.meshes.BoxC.material;
    assert.equal(initial.meshes.ShellA.material,originalMaterial);assert.equal(initial.meshes.ExtraA.material,originalMaterial);
    const hover=await pointAtNode(page,'BoxC');await page.mouse.move(hover.x,hover.y);await page.waitForTimeout(150);
    const hovered=await infrastructure(page);assert.notEqual(hovered.meshes.BoxC.material,originalMaterial);assert.equal(hovered.meshes.ShellA.material,originalMaterial);
    await page.mouse.move(0,0);await page.waitForTimeout(100);assert.equal((await infrastructure(page)).meshes.BoxC.material,originalMaterial);
    await openParts(page);await page.getByRole('button',{name:'Generic object C',exact:true}).click();await page.waitForTimeout(800);
    assert.equal(await page.locator('#generic-selection').innerText(),'c');assert(near((await infrastructure(page)).target,[1.1,.6,0]));
    await page.getByRole('button',{name:'Generic object C',exact:true}).click();assert.equal(await page.locator('#generic-selection').innerText(),'none');assert.equal((await infrastructure(page)).meshes.BoxC.material,originalMaterial);
    await page.getByRole('button',{name:'Generic group A',exact:true}).click();
    const box=await page.locator('canvas').boundingBox();await page.mouse.move(box.x+box.width*.55,box.y+box.height*.55);await page.mouse.down();
    const interrupted=await infrastructure(page);await page.waitForTimeout(500);assert(near((await infrastructure(page)).position,interrupted.position));assert(near((await infrastructure(page)).target,interrupted.target));await page.mouse.up();
    await page.getByRole('button',{name:'คืนมุมมองเริ่มต้น',exact:true}).click();await page.waitForTimeout(150);assert(near((await infrastructure(page)).position,initial.position));assert.equal(await page.locator('#generic-selection').innerText(),'none');
    for(let i=0;i<5;i++){await page.getByRole('button',{name:'Generic object C',exact:true}).click();await page.getByRole('button',{name:'คืนมุมมองเริ่มต้น',exact:true}).click()}
    await page.waitForTimeout(300);assert(near((await infrastructure(page)).position,initial.position));assert.equal((await infrastructure(page)).meshes.ShellA.material,originalMaterial);
    assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  });
  await test('Outgoing camera focus stops on step change and immediate deselection',async(page,{errors,failures})=>{
    await ready(page,'/tests/harness.html?case=integration');await page.waitForTimeout(400);
    const initial=await infrastructure(page);await page.getByRole('button',{name:'Start Demo',exact:true}).click();
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('ถัดไป')).click());
    await page.waitForFunction(()=>document.querySelector('.canvas-wrap').dataset.activeStep==='generic-2');
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('ก่อนหน้า')).click());
    await page.waitForFunction(()=>document.querySelector('.canvas-wrap').dataset.activeStep==='generic-1');
    const switched=await infrastructure(page);await page.waitForTimeout(650);
    assert(near((await infrastructure(page)).position,switched.position),'outgoing step autofocus must stop');assert(near((await infrastructure(page)).target,switched.target));
    await openParts(page);await page.getByRole('button',{name:'Generic object C',exact:true}).click();
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Generic object C').click());
    await page.waitForFunction(()=>document.querySelector('#generic-selection').textContent==='none');
    const deselected=await infrastructure(page);await page.waitForTimeout(650);assert(near((await infrastructure(page)).position,deselected.position),'deselection must cancel pending focus');
    await page.getByRole('button',{name:'คืนมุมมองเริ่มต้น',exact:true}).click();await page.waitForTimeout(150);assert(near((await infrastructure(page)).position,initial.position));assert(near((await infrastructure(page)).target,initial.target));
    assert.equal((await infrastructure(page)).scene,initial.scene);assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  });
  await test('Timeline X-Ray shells, click-through, multiple reversible flow paths and bounded resources',async(page,{errors,failures})=>{
    await ready(page,'/tests/harness.html?case=integration');await page.waitForTimeout(400);
    const original=await infrastructure(page);assert.deepEqual(original.flows,{});
    await page.getByRole('button',{name:'Start Demo',exact:true}).click();await page.waitForTimeout(150);
    let current=await infrastructure(page);assert.equal(current.meshes.ShellA.opacity,.18);assert.equal(current.meshes.InsertB.transparent,false);assert.equal(current.meshes.BoxC.material,original.meshes.BoxC.material);
    const inside=await pointAtNode(page,'InsertB');await page.mouse.click(inside.x,inside.y);assert.equal(await page.locator('#generic-selection').innerText(),'b');
    await page.getByRole('button',{name:'คืนมุมมองเริ่มต้น',exact:true}).click();
    const slider=page.getByRole('slider');await slider.fill('750');await page.waitForTimeout(120);const forward=await infrastructure(page);
    assert.equal(Object.keys(forward.flows).length,2);assert(near(forward.flows['flow:path-a:marker'],[.5,1.9,0]));assert.equal(forward.meshes.ShellA.material,original.meshes.ShellA.material);assert.equal(await page.locator('.canvas-wrap').getAttribute('data-phase-ids'),'late');
    await slider.fill('100');await page.waitForTimeout(100);current=await infrastructure(page);assert.equal(Object.keys(current.flows).length,1);assert.equal(current.meshes.ShellA.opacity,.18);
    await slider.fill('750');await page.waitForTimeout(100);assert.deepEqual((await infrastructure(page)).flows,forward.flows);
    const warmed=await infrastructure(page);
    for(let i=0;i<15;i++){await slider.fill('100');await slider.fill('750')}
    await page.waitForTimeout(250);const after=await infrastructure(page);assert.deepEqual(after.memory,warmed.memory);assert.equal(after.meshes.BoxC.material,original.meshes.BoxC.material);
    await page.waitForTimeout(500);const idle=await infrastructure(page);await page.waitForTimeout(500);assert.equal((await infrastructure(page)).frames,idle.frames);
    await secondary(page,'แสดงผิวปกติ');assert.equal((await infrastructure(page)).meshes.InsertB.material,original.meshes.InsertB.material);assert.deepEqual((await infrastructure(page)).flows,forward.flows);
    await page.getByRole('button',{name:'ถัดไป',exact:true}).click();await page.waitForTimeout(800);assert.equal(await slider.inputValue(),'0');assert(near((await infrastructure(page)).target,[1.1,.6,0]));
    await page.getByRole('button',{name:'ก่อนหน้า',exact:true}).click();assert.equal(await slider.inputValue(),'0');assert.equal(await page.locator('.canvas-wrap').getAttribute('data-phase-ids'),'early');assert.equal((await infrastructure(page)).meshes.ShellA.opacity,.18);
    console.log('PHASE2_MEASURED',JSON.stringify({warmed:warmed.memory,after:after.memory,drawCalls:after.drawCalls,idleFramesOver500ms:0}));
    await page.screenshot({path:path.join(output,'generic-xray-desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(output,'generic-xray-mobile.png'),fullPage:true});
    assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  });
  await test('Static part visuals stay GPU-idle while the UI timeline plays',async(page,{errors,failures})=>{
    await ready(page,'/tests/harness.html?case=integration&static=1');await page.getByRole('button',{name:'Start Demo',exact:true}).click();await page.waitForTimeout(500);
    const before=await infrastructure(page);await page.getByRole('button',{name:'เล่นตัวอย่าง UI',exact:true}).click();await page.waitForTimeout(800);
    const after=await infrastructure(page);console.log('STATIC_PLAYBACK_FRAMES',after.frames-before.frames);assert.equal(after.frames,before.frames,'progress without visual changes must not redraw the static model or contact shadows');
    await page.getByRole('button',{name:'หยุดตัวอย่าง UI',exact:true}).click();assert.deepEqual(after.flows,{});assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  });
  await test('Explicit normalized bounds, invalid model fallback and repeated Canvas disposal',async(page)=>{
    await ready(page,'/tests/harness.html?case=integration-normalized');await page.waitForTimeout(300);const normalized=await infrastructure(page);assert(near(normalized.bounds.center,[0,0,0]));assert(Math.abs(Math.max(...normalized.bounds.size)-3)<1e-5);
    for(let i=0;i<3;i++){
      await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js')).name;const mod=await import(url),canvas=document.querySelector('canvas');window.oldCanvas=canvas;window.rootsForTest=mod._roots;window.disposeCount=0;const gl=mod._roots.get(canvas).store.getState().gl,dispose=gl.dispose.bind(gl);gl.dispose=()=>{window.disposeCount++;dispose()}});
      await page.getByRole('button',{name:'Unmount',exact:true}).click();await page.waitForTimeout(650);assert.equal(await page.locator('canvas').count(),0);assert.equal(await page.evaluate(()=>window.rootsForTest.has(window.oldCanvas)),false);assert.equal(await page.evaluate(()=>window.disposeCount),1);
      await page.getByRole('button',{name:'Mount',exact:true}).click();await page.locator('canvas').waitFor();await page.waitForTimeout(350);assert.equal(await page.locator('canvas').count(),1);
    }
    await page.route('**/tests/part-fixture.gltf',route=>route.fulfill({contentType:'model/gltf+json',body:'{"asset": invalid JSON'}));await ready(page,'/tests/harness.html?case=viewer-low');await page.locator('.model-notice[role=alert]').waitFor();assert.equal(await page.locator('canvas').count(),1);assert.match(await page.locator('.model-notice').innerText(),/โหลดโมเดล GLB ไม่สำเร็จ/);
  });
  await fs.writeFile(path.join(output,'browser-audit.json'),JSON.stringify({results,warnings:[...warnings]},null,2));
  console.log('WARNINGS',JSON.stringify([...warnings]));
  console.log(`PASS: ${results.length} browser suites`);
})().catch(async error=>{console.error(error);await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'browser-audit.json'),JSON.stringify({results,error:error.message,warnings:[...warnings]},null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();});





