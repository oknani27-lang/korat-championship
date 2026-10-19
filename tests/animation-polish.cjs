const {chromium}=require(process.env.DMR_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const phase=process.env.DMR_POLISH_PHASE||'after';
const output=path.resolve('test-results/animation-polish',phase);
let browser;
async function measure(page){return page.evaluate(async()=>{
  if(!window.polishStore){const url=performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js')).name;const {_roots}=await import(url);window.polishStore=_roots.get(document.querySelector('canvas')).store;}
  const root=window.polishStore.getState(),svg=document.querySelector('.process-inset > svg');
  const box=svg?.viewBox.baseVal;
  const clippedLabels=svg?[...svg.querySelectorAll('text')].filter(el=>{const b=el.getBBox(),matrix=svg.getCTM().inverse().multiply(el.getCTM());return [[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].some(([x,y])=>{const p=new DOMPoint(x,y).matrixTransform(matrix);return p.x<box.x-.5||p.y<box.y-.5||p.x>box.x+box.width+.5||p.y>box.y+box.height+.5;});}).map(el=>el.textContent):[];
  const card=document.querySelector('.details-card:last-child'),last=card.querySelector('.inset-caption:last-child');
  return {calls:root.gl.info.render.calls,triangles:root.gl.info.render.triangles,memory:{...root.gl.info.memory},frame:root.gl.info.render.frame,
    svg:svg?{width:svg.getBoundingClientRect().width,height:svg.getBoundingClientRect().height,viewBox:svg.getAttribute('viewBox')}:null,
    clippedLabels,card:{height:card.clientHeight,scrollHeight:card.scrollHeight,lastCaptionBottom:last?.getBoundingClientRect().bottom,cardBottom:card.getBoundingClientRect().bottom},
    overflow:document.documentElement.scrollWidth>innerWidth,scene:root.scene.uuid,schematic:svg?.outerHTML};
});}
async function seek(page,t){await page.getByRole('slider').fill(String(t));await page.waitForTimeout(200);}
(async()=>{
  await fs.mkdir(output,{recursive:true});
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const results=[];
  for(const [width,height]of [[1366,768],[390,844]]){
    const page=await browser.newPage({viewport:{width,height}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(process.env.DMR_TEST_URL||'http://127.0.0.1:5175');await page.locator('.canvas-wrap[data-model-state=ready]').waitFor({timeout:45000});
    await page.locator('.nav-cta').click();const samples=[];
    // GPU geometry uploads are lazy for invisible batches; compare only after all existing batches have rendered once.
    for(const t of [3.7,5.3,11.5,33.2])await seek(page,t);
    for(const t of [8,19,33,38.8,46,49,53,58,60]){
      await seek(page,t);const m=await measure(page);assert(!m.overflow);
      await page.locator('.stage-layout').screenshot({path:path.join(output,`workspace-${t}-${width}.png`)});
      await page.locator('.process-details').screenshot({path:path.join(output,`details-${t}-${width}.png`)});
      if(phase==='after'){
        assert.deepEqual(m.clippedLabels,[],`SVG labels clipped at ${t}s`);
        await page.locator('.details-card:last-child').evaluate(card=>{card.scrollTop=card.scrollHeight;});
        const end=await measure(page);if(end.card.lastCaptionBottom)assert(end.card.lastCaptionBottom<=end.card.cardBottom+1);
        await page.locator('.details-card:last-child').evaluate(card=>{card.scrollTop=0;});
      }
      samples.push({time:t,...m,schematic:undefined});
    }
    const idle=await measure(page);await page.waitForTimeout(700);const later=await measure(page);assert.equal(later.frame,idle.frame);
    const initial=await measure(page);
    for(const t of [3,6,11,17,23,26,30,38,44,48,51,56,60]){
      for(const offset of [-.01,0,.01]){if(t+offset>60)continue;await seek(page,t+offset);if(t+offset>=3)assert(await page.locator('.process-inset > svg').count());}
    }
    assert.deepEqual((await measure(page)).memory,initial.memory);
    if(phase==='after'){
      const states={};
      for(const t of [4,8,13,19,24,28,33,40,46,49,53,58,60]){
        await seek(page,t);states[t]=(await measure(page)).schematic;
        const region=page.locator('.process-inset');assert(await region.locator('.route-summary').count());
        assert(await region.locator('.scope-label').count());
        await page.getByRole('button',{name:'เล่นการนำเสนอ',exact:true}).click();await page.waitForTimeout(100);await page.getByRole('button',{name:'หยุดการนำเสนอ',exact:true}).click();
        const frozen=await measure(page);await page.waitForTimeout(100);assert.equal((await measure(page)).schematic,frozen.schematic);
      }
      for(const t of [60,58,53,49,46,40,33,28,24,19,13,8,4]){await seek(page,t);assert.equal((await measure(page)).schematic,states[t]);}
      assert.equal((await measure(page)).scene,initial.scene);
    }
    assert.deepEqual(errors,[]);results.push({width,height,samples,idleFrames:later.frame-idle.frame,errors});
    console.log('PASS polish',phase,width);await page.close();
  }
  await fs.writeFile(path.join(output,'report.json'),JSON.stringify({phase,renderer:'Chrome headless SwiftShader; no hardware FPS claim',results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});

