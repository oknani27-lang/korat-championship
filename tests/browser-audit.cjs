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
  if (process.env.DMR_TEST_FILTER && !name.includes(process.env.DMR_TEST_FILTER)) return;
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
async function ready(page, url = '/') {
  await page.goto(base + url); await page.locator('canvas').waitFor();
  // Application checks wait for the real asset; harness cases may intentionally hold a loading request.
  if (url === '/' && await page.locator('.canvas-wrap[data-model-state]').count()) await page.locator('.canvas-wrap:not([data-model-state=loading])').waitFor();
  await page.waitForTimeout(400);
}
async function secondary(page, name) {
  await page.locator('.viewer-more summary').click();
  await page.getByRole('button', { name, exact: true }).click();
  assert.equal(await page.locator('.viewer-more').getAttribute('open'),null);
}
async function settledCamera(page) {
  // Wait for damping to finish on slow software GPUs before comparing camera state.
  await page.evaluate(async () => {
    delete window.auditSettledPose; delete window.auditSettledSince;
    const url = performance.getEntriesByType('resource').find(r => r.name.includes('/@react-three_fiber.js')).name;
    const { _roots } = await import(url);
    window.auditCameraStore = _roots.get(document.querySelector('canvas')).store;
  });
  await page.waitForFunction(() => {
    const root = window.auditCameraStore.getState();
    const pose = [...root.camera.position.toArray(), ...root.controls.target.toArray()];
    if (!window.auditSettledPose || pose.some((value,i) => Math.abs(value-window.auditSettledPose[i]) > 1e-7)) {
      window.auditSettledPose = pose;
      window.auditSettledSince = performance.now();
    }
    return performance.now() - window.auditSettledSince >= 500;
  }, null, { polling: 100, timeout: 30000 });
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
const timers = page => page.evaluate(() => [...window.auditTimers.values()].filter(ms => ms === 33).length);
async function routeModelFixture(page, gate) {
  const data=Buffer.alloc(36);[-1,-1,0,1,-1,0,0,1,0].forEach((value,i)=>data.writeFloatLE(value,i*4));
  const gltf={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:'NamedAssembly',children:[1]},{name:'MeshChild',mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],buffers:[{uri:'data:application/octet-stream;base64,'+data.toString('base64'),byteLength:36}],bufferViews:[{buffer:0,byteLength:36}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-1,-1,0],max:[1,1,0]}]};
  await page.route('**/tests/part-fixture.gltf',async route=>{if(gate)await gate;await route.fulfill({json:gltf})});
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  await test('Start Demo enters in place, repeated/keyboard entry keeps viewport and Canvas', async (page,{errors,failures})=>{
    for(const width of [1440,1280,768,390,320]){
      await page.setViewportSize({width,height:width<600?844:1050});await ready(page);
      assert(await page.getByRole('slider').isDisabled());
      const initial=await state(page,'capture');
      assert.equal(await page.getByRole('button',{name:'Start Demo',exact:true}).count(),1);
      for(const selector of ['.nav-cta','.nav-cta']){
        await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(250);
        const before=await page.evaluate(()=>({y:scrollY,hash:location.hash,top:document.querySelector('#simulator').getBoundingClientRect().top}));
        await page.locator(selector).click();await page.waitForTimeout(500);
        const after=await page.evaluate(()=>({y:scrollY,hash:location.hash,top:document.querySelector('#simulator').getBoundingClientRect().top}));
        assert.deepEqual(after,before,`Start Demo must not scroll at ${width}`);
        assert.equal(await page.locator('#simulator').getAttribute('data-demo-mode'),'true');
        assert.equal(await page.locator('#sheet-content').getAttribute('aria-hidden'),null);
        assert(await page.getByRole('slider').isEnabled());
        const current=await state(page);assert.equal(current.scene,initial.scene);assert.deepEqual(current.geometryIds,initial.geometryIds);
        assert.equal(await page.locator('canvas').count(),1);
        assert(await page.locator('canvas').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}));
        assert(await page.locator('#simulator').evaluate(el=>el===document.activeElement));
      }
      await page.locator('.nav-cta').focus();await page.keyboard.press('Enter');await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>scrollY),0);
      await page.mouse.click(10,105);await page.screenshot({path:path.join(output,`demo-${width}.png`),fullPage:true});
    }
    assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  });
  await test('Unified step state: expanded navigation, global seconds and viewer metadata', async (page,{errors,failures})=>{
    const fixtures=[0,1,2].map(i=>({id:`ui-${i}`,title:`UI step ${i+1}`,subtitle:'UI fixture only',description:`Interface fixture ${i+1}, not scientific data`,formulas:i===1?[[{kind:'text',text:'UI'},{kind:'sub',text:'2'}]]:[],outputs:[`UI output ${i+1}`],activeParts:[],flowPaths:[],cameraFocus:null,timeline:{start:i/3,end:(i+1)/3}}));
    await page.route('**/src/data/process-steps.json*',route=>route.fulfill({contentType:'application/javascript',body:'export default '+JSON.stringify(fixtures)}));
    await ready(page);await page.locator('.nav-cta').click();const initial=await state(page);
    await page.getByRole('slider').fill('8');await page.locator('.nav-cta').click();assert(Number(await page.getByRole('slider').inputValue())>=8);
    await page.getByRole('button',{name:'ถัดไป',exact:true}).scrollIntoViewIfNeeded();const y=await page.evaluate(()=>scrollY);
    await page.getByRole('button',{name:'ถัดไป',exact:true}).click();assert.equal(await page.evaluate(()=>scrollY),y);
    assert.equal(await page.locator('#process-title').innerText(),'UI step 2');assert(Number(await page.getByRole('slider').inputValue())>=20);
    assert.equal(await page.locator('.canvas-wrap').getAttribute('data-active-step'),'ui-1');

    assert.match(await page.locator('.outputs').innerText(),/UI output 2/);assert.equal(await page.locator('.formula sub').innerText(),'2');
    assert.equal(await page.locator('.outputs .small-note').count(),0);
    assert.equal(await page.locator('.sheet-columns article').nth(1).locator('.small-note').count(),0);
    await page.getByRole('slider').fill('35');await page.getByRole('slider').fill('21');assert.equal(await page.locator('#process-title').innerText(),'UI step 2');
    await page.getByRole('button',{name:'ก่อนหน้า',exact:true}).click();assert.equal(await page.locator('#process-title').innerText(),'UI step 1');assert(Number(await page.getByRole('slider').inputValue())<1);
    assert.match(await page.locator('.process-explanation').innerText(),/Interface fixture 1/);
    await page.getByRole('button',{name:'ถัดไป',exact:true}).evaluate(el=>{for(let i=0;i<20;i++)el.click()});assert.equal(await page.locator('#process-title').innerText(),'UI step 3');assert(await page.getByRole('button',{name:'ถัดไป',exact:true}).isDisabled());
    assert.equal((await state(page)).scene,initial.scene);assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  });
  await test('Desktop/tablet/mobile layout, anchors, expanded results, keyboard menu', async (page, { errors, failures }) => {
    await ready(page);
    assert.equal(await page.title(),'REGENA — DMR Process Explorer');
    assert.equal(await page.locator('.brand').getAttribute('aria-label'),'REGENA หน้าหลัก');
    assert.match(await page.locator('footer').innerText(),/REGENA · DMR System/);
    assert.equal(await page.locator('.viewer-heading,.hero-cta').count(),0);
    assert.equal(await page.getByText('Turn Waste Into New Value',{exact:true}).count(),0);
    assert.equal(await page.locator('.navbar').getByRole('button',{name:'Start Demo',exact:true}).count(),1);
    assert.equal(await page.locator('.viewer-toolbar button').count(),4);
    assert.equal(await page.locator('#sheet-content').getAttribute('aria-hidden'),null);
    assert(await page.locator('#process-title').isVisible());


    assert.equal(await page.locator('.sheet-toggle,.compact-summary,.chemistry-popup').count(),0);
    assert.equal(await page.locator('.sheet-columns').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2);

    for (const width of [1440, 1280, 1150, 1101, 1024, 768, 580, 390, 320]) {
      await page.setViewportSize({ width, height: 1050 });
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow at ${width}`);
      assert(await page.locator('canvas').isVisible());
      const canvasSize = await page.locator('canvas').boundingBox();
      assert(canvasSize.width > 100 && canvasSize.height > (width<=580?180:200), `usable canvas at ${width}`);
      const sheet=await page.locator('.bottom-sheet').boundingBox(),toolbar=await page.locator('.viewer-toolbar').boundingBox(),timeline=await page.locator('.timeline').boundingBox();
      const more=await page.locator('.viewer-more summary').boundingBox();
      assert(more.x>=toolbar.x+toolbar.width-1,'More follows the horizontal toolbar');
      assert(Math.abs((more.y+more.height/2)-(toolbar.y+toolbar.height/2))<2,'More shares the toolbar row');
      assert(toolbar.y>=canvasSize.y+canvasSize.height,'controls sit below the model');
      assert(sheet.y>=toolbar.y+toolbar.height,'sheet must not cover toolbar');assert(timeline.y>=sheet.y,'timeline stays inside sheet');
      if ([1440, 768, 390].includes(width)) await page.screenshot({ path: path.join(output, `audit-${width}.png`), fullPage: true });
    }
    await page.getByRole('button', { name: 'เปิดเมนู', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.locator('.nav-cta').click();
    assert.equal(await page.locator('#sheet-content').getAttribute('aria-hidden'), null);
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
    await secondary(page, 'เลื่อนมุมมอง'); await drag(page, -80, -20); await settledCamera(page); const panned = await state(page); assert(!near(panned.target, initial.target));
    await secondary(page, 'รายการชิ้นส่วน');
    // OrbitControls can retain sub-threshold damping after its change events stop.
    const afterPanel=await state(page); assert(afterPanel.target.every((value,i)=>Math.abs(value-panned.target[i])<0.005), 'UI rerender must preserve settled pan: '+JSON.stringify({before:panned.target,after:afterPanel.target}));
    await secondary(page, 'รายการชิ้นส่วน');
    await page.getByRole('button', { name: 'คืนมุมมองเริ่มต้น', exact: true }).click();
    await page.getByRole('button', { name: 'ซูม: ลากด้วยเมาส์ หรือใช้สองนิ้วบนจอสัมผัส', exact: true }).click();
    await drag(page, 0, -65); assert(Math.abs((await state(page)).distance - initial.distance) > 0.1);
    const canvas = page.locator('canvas'); const box = await canvas.boundingBox(); await page.mouse.move(box.x + 70, box.y + 70); await page.mouse.wheel(0, 150); await page.waitForTimeout(250);
    for (const label of ['ซูมเข้า', 'ซูมออก']) {
      await page.getByRole('button', { name: label, exact: true }).evaluate(el => { for (let i = 0; i < 35; i++) el.click(); });
      const s = await state(page);
      const limits = await page.evaluate(async () => {
        const url=performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js')).name;
        const { _roots }=await import(url);const c=_roots.get(document.querySelector('canvas')).store.getState().controls;
        return [c.minDistance,c.maxDistance];
      });
      assert(s.distance >= limits[0] - 1e-6 && s.distance <= limits[1] + 1e-6);
    }
    await page.getByRole('button', { name: 'คืนมุมมองเริ่มต้น', exact: true }).click(); await page.waitForTimeout(700);
    for (let i = 0; i < 8; i++) {
      await secondary(page, 'รายการชิ้นส่วน');
      const xray=page.getByRole('button', { name: 'X-Ray ตัวอย่างโครงร่าง — ยังไม่ใช่ Smart X-Ray จริง', exact: true });
      if(await xray.isEnabled()) await xray.click(); else assert(await xray.isDisabled());
    }
    const after = await state(page); assert.equal(after.sameScene, true); assert.deepEqual(after.geometryIds, initial.geometryIds); assert.deepEqual(after.memory, initial.memory);
    await page.waitForTimeout(700); const idle = (await state(page)).frames; await page.waitForTimeout(700); const idleDelta=(await state(page)).frames-idle; assert.equal(idleDelta,0, 'idle viewer must stop rendering');
    await page.setViewportSize({ width: 768, height: 900 }); await page.waitForTimeout(200); assert.equal((await state(page)).scene, initial.scene);
    console.log('MEASURED', JSON.stringify({ idleFramesOver700ms: idleDelta, geometries: after.memory.geometries, textures: after.memory.textures }));
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  });
  await test('Timeline boundaries, multi-step, rapid clicks, hidden tab, timer cleanup and unmount', async (page, { errors, failures }) => {
    await page.goto(base + '/tests/harness.html'); await page.getByRole('slider').waitFor(); await installTimerProbe(page);
    const slider=page.getByRole('slider'),start=()=>page.getByRole('button',{name:'Start Demo',exact:true});
    assert(await page.getByRole('button',{name:'ก่อนหน้า',exact:true}).isDisabled());
    await start().click();assert.equal(await timers(page),1);await advance(page,1000);assert(Number(await slider.inputValue())>0);
    await page.getByRole('button',{name:'ถัดไป',exact:true}).click();assert(Number(await slider.inputValue())>=15);assert.equal(await timers(page),1);
    assert.equal(await page.locator('#process-title').innerText(),'UI fixture 2');
    assert.equal(await page.locator('.formula sub').innerText(),'2');assert.equal(await page.locator('.formula sup').innerText(),'+');
    await slider.fill('60');assert(await page.getByRole('button',{name:'ถัดไป',exact:true}).isDisabled());assert.equal(await timers(page),0);
    await slider.fill('14.94');assert.equal(await page.locator('#process-title').innerText(),'UI fixture 1');
    await slider.fill('45');assert.equal(await page.locator('#process-title').innerText(),'UI fixture 3');
    await slider.fill('18');await start().dblclick();assert.equal(await timers(page),1);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
    assert.equal(await timers(page),0);const hiddenValue=await slider.inputValue();await advance(page,60000);assert.equal(await slider.inputValue(),hiddenValue);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
    assert.equal(await timers(page),1);await advance(page,100);assert(Number(await slider.inputValue())<Number(hiddenValue)+1);
    await slider.fill('20');assert.equal(await timers(page),0);await advance(page,1000);assert.equal(await slider.inputValue(),'20');
    await slider.fill('59.94');await start().click();await advance(page,500);assert.equal(await slider.inputValue(),'60');assert.equal(await timers(page),0);
    await start().click();assert(Number(await slider.inputValue())<1);assert.equal(await timers(page),1);
    await page.getByRole('button',{name:'เริ่มไทม์ไลน์ใหม่',exact:true}).click();assert(Number(await slider.inputValue())<1);assert.equal(await timers(page),1);
    assert.equal(await page.locator('.sheet-toggle,.compact-summary').count(),0);
    await page.getByRole('button',{name:'Unmount',exact:true}).click();assert.equal(await timers(page),0);assert.equal(await page.evaluate(()=>window.auditVisibility.size),0);
    await page.getByRole('button',{name:'Mount',exact:true}).click();await start().click();assert.equal(await timers(page),1);
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  });
  await test('Long unbroken titles and formula tokens fit desktop and mobile', async (page, {errors, failures}) => {
    await page.goto(base+'/tests/harness.html?case=long'); await page.locator('.formula').waitFor();
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
    await page.goto(base); await page.getByRole('alert').waitFor(); assert(await page.getByRole('slider').isVisible()); assert(await page.getByRole('heading', { name: 'ภาพรวมเครื่อง', exact:true }).isVisible());
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
  await test('Empty and invalid process metadata stay readable instead of crashing',async(page,{errors,failures})=>{
    let fixture='export default []';
    await page.route('**/src/data/process-steps.json*',route=>route.fulfill({contentType:'application/javascript',body:fixture}));
    await ready(page);
    await page.locator('.data-notice').waitFor();
    assert.match(await page.locator('.data-notice').innerText(),/At least one process step is required/);
    assert(await page.getByRole('heading',{name:'รอข้อมูลกระบวนการ',exact:true}).isVisible());
    assert.equal(await page.getByRole('slider').count(),0);
    fixture='export default null';
    await ready(page);
    await page.locator('.data-notice').waitFor();
    assert.match(await page.locator('.data-notice').innerText(),/Invalid process steps configuration/);
    assert(await page.getByRole('heading',{name:'รอข้อมูลกระบวนการ',exact:true}).isVisible());
    assert.equal(await page.getByRole('slider').count(),0);
    assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  });
  await test('Model loading and invalid component mappings preserve the Canvas',async(page)=>{
    let release;const gate=new Promise(resolve=>{release=resolve});await routeModelFixture(page,gate);await ready(page,'/tests/harness.html?case=viewer-low');await page.locator('.model-notice[role=status]').waitFor();const initial=(await state(page)).scene;release();await page.locator('.model-notice[role=status]').waitFor({state:'hidden'});assert.equal((await state(page)).scene,initial);assert.equal((await state(page)).pixelRatio,1);assert.equal(await page.locator('canvas').count(),1);
    await page.goto(base+'/tests/harness.html?case=viewer-invalid');await page.locator('.model-notice[role=alert]').waitFor();assert.match(await page.locator('.model-notice').innerText(),/MissingNode/);await secondary(page, 'รายการชิ้นส่วน');assert(await page.getByRole('button',{name:'Missing test node',exact:true}).isDisabled());assert.equal(await page.locator('canvas').count(),1);
  });
  await test('Missing model fallback and source replacement do not remount Canvas',async page=>{
    await routeModelFixture(page);await page.route('**/tests/missing.gltf',route=>route.fulfill({status:404,body:'Missing test fixture'}));await ready(page,'/tests/harness.html?case=viewer-switch');await page.locator('.model-notice[role=alert]').waitFor();assert.match(await page.locator('.model-notice').innerText(),/ไม่พบไฟล์โมเดล GLB/);assert.equal(await page.locator('canvas').count(),1);const initial=(await state(page)).scene;await page.getByRole('button',{name:'Switch source'}).click();await page.locator('.model-notice').waitFor({state:'hidden'});assert.equal((await state(page)).scene,initial);assert.equal(await page.locator('canvas').count(),1);
  });
  await fs.writeFile(path.join(output,'browser-audit.json'),JSON.stringify({results,warnings:[...warnings]},null,2));
  console.log('WARNINGS',JSON.stringify([...warnings]));
  console.log(`PASS: ${results.length} browser suites`);
})().catch(async error=>{console.error(error);await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'browser-audit.json'),JSON.stringify({results,error:error.message,warnings:[...warnings]},null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();});




