const {chromium}=require(process.env.DMR_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const base=process.env.DMR_TEST_URL||'http://127.0.0.1:5175';
const output=path.resolve('test-results/process-chemistry');
const samples=[['intake',4,2],['conditioning',8,1],['separation',13,0],['nitrification',19,2],['hold',24,0],['formulation',28,0],['cultivation',32,1],['harvest',40,0],['recovery',46,0],['washing',49,0],['processing',53,0],['packing',58,0]];
let browser;const results=[];
(async()=>{
  await fs.mkdir(output,{recursive:true});
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const width of [1440,768,390,320]){
    const page=await browser.newPage({viewport:{width,height:width<600?844:1050}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(base);await page.locator('.canvas-wrap[data-model-state=ready]').waitFor({timeout:45000});
    assert(await page.locator('#sheet-content').isVisible());
    assert.equal(await page.locator('.sheet-toggle,.compact-summary,.chemistry-popup').count(),0);
    const canvas=await page.locator('canvas').boundingBox(),bar=await page.locator('.viewer-toolbar').boundingBox(),side=await page.locator('.process-details').boundingBox(),model=await page.locator('#simulator').boundingBox();
    assert(bar.y>=canvas.y+canvas.height);assert.equal(await page.locator('.viewer-toolbar').evaluate(el=>getComputedStyle(el).flexDirection),'row');
    if(width>1000)assert(side.x>=model.x+model.width);else assert(side.y>=model.y+model.height);
    assert.equal(await page.locator('#results .process-chemistry,#results .process-inset').count(),0);
    assert.equal(await page.locator('.process-details .process-chemistry').count(),1);
    await page.locator('.nav-cta').click();assert.equal(await page.locator('#results').getAttribute('data-playing'),'true');
    for(const [id,seconds,formulaCount]of samples){
      await page.getByRole('slider').fill(String(seconds));
      const panel=page.locator('.process-chemistry');
      await page.waitForFunction(id=>document.querySelector('.process-chemistry')?.dataset.step===id,id);
      assert.equal(await panel.locator('.formula').count(),formulaCount,id);
      assert(await panel.locator('.process-explanation').isVisible());
      assert(await panel.locator('.chemical-scope').isVisible());
      assert.equal(await page.locator('#sheet-content').getAttribute('inert'),null);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width} ${id}`);
      for(const formula of await panel.locator('.formula').all())assert(await formula.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
      if(id==='nitrification'||id==='cultivation'){
        assert(await panel.locator('.formula sub').count()>0);
        assert(await panel.locator('.chemical-sources a').count()>0);
      }
      if(id==='conditioning'){
        await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,`inline-${width}.png`),fullPage:true});
        await page.locator('.stage-layout').screenshot({path:path.join(output,`details-${width}.png`)});
      }
      if(['nitrification','hold','formulation','cultivation','harvest','recovery','washing','processing','packing'].includes(id)){
        await page.locator('.stage-layout').screenshot({path:path.join(output,`${id}-${width}.png`)});
        if(['harvest','recovery','washing'].includes(id))assert.equal(await page.locator('.harvest-inset').getAttribute('data-stage'),id);
        else if(!['processing','packing'].includes(id))assert.equal(await page.locator('.growth-inset').getAttribute('data-stage'),id);
        else assert.equal(await page.locator('.finishing-inset').getAttribute('data-stage'),id);
      }
    }
    await page.getByRole('slider').fill('8');await page.getByRole('button',{name:'ถัดไป',exact:true}).click();
    assert.equal(await page.locator('#results').getAttribute('data-playing'),'true');
    assert.equal(await page.locator('.process-chemistry').getAttribute('data-step'),'separation');
    assert.equal(await page.locator('canvas').count(),1);assert.deepEqual(errors,[]);
    await page.getByRole('slider').fill('59.95');await page.clock.install();await page.locator('.nav-cta').click();await page.clock.runFor(300);
    assert.equal(await page.locator('#results').getAttribute('data-playhead'),'60.000');assert.equal(await page.locator('#results').getAttribute('data-playing'),'false');
    assert.equal(await page.locator('.process-chemistry').getAttribute('data-step'),'packing');
    results.push({width,result:'PASS',stages:samples.length});console.log('PASS inline chemistry',width);await page.close();
  }
  await fs.writeFile(path.join(output,'report.json'),JSON.stringify({results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
