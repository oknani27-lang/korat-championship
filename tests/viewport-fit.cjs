const {chromium}=require(process.env.DMR_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const output='test-results/viewport-fit';
let browser;
(async()=>{
  await fs.mkdir(output,{recursive:true});
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const viewports=[[1520,860],[1440,900],[1366,768],[1280,720],[1180,820],[1024,768],[768,1024],[430,932],[390,844],[360,800],[320,740],[844,390],[960,540],[1280,600]];
  for(const [width,height]of viewports){
    const page=await browser.newPage({viewport:{width,height},hasTouch:width<=1000,isMobile:width<=1000});
    await page.goto(process.env.DMR_TEST_URL||'http://127.0.0.1:5175');await page.locator('.canvas-wrap[data-model-state=ready]').waitFor({timeout:45000});
    assert(await page.getByRole('button',{name:'เล่นการนำเสนอ',exact:true}).isDisabled());
    await page.locator('.nav-cta').click();
    await page.getByRole('button',{name:'หยุดการนำเสนอ',exact:true}).click();
    const paused=await page.locator('#results').getAttribute('data-playhead');
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#results').getAttribute('data-playhead'),paused);
    await page.getByRole('button',{name:'เล่นการนำเสนอ',exact:true}).click();
    await page.waitForTimeout(200);
    assert(Number(await page.locator('#results').getAttribute('data-playhead'))>Number(paused));
    await page.getByRole('button',{name:'หยุดการนำเสนอ',exact:true}).click();
    for(const seconds of [0,8,13,19,24,28,32,40,46,49,53,58,60]){
      await page.getByRole('slider').fill(String(seconds));
      await page.evaluate(()=>scrollTo(0,0));
      const rects=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}};return {next:rect('.step-buttons'),sheet:rect('#results'),header:rect('.navbar'),canvas:rect('canvas'),bar:rect('.viewer-controls'),overflow:document.documentElement.scrollWidth>innerWidth};});
      assert(!rects.overflow,`${width}: overflow`);
      assert(rects.bar.top>=rects.canvas.bottom,`${width}: toolbar overlaps canvas`);
      if(width>1000&&height>=700)assert(rects.sheet.bottom<=height,`${width}x${height} at ${seconds}s: sheet ends at ${rects.sheet.bottom}`);
      if(width<=1000&&height>600){const mobileOrder=await page.evaluate(()=>({sheet:document.querySelector('#results').getBoundingClientRect().top,details:document.querySelector('.process-details').getBoundingClientRect().top}));assert(mobileOrder.sheet<mobileOrder.details,`${width}x${height}: process controls should be directly below the model before long details`)}
      if(width>=360&&width<=580&&height>=800){const next=await page.locator('.step-buttons').boundingBox();assert(next.y>=0&&next.y+next.height<=height,`${width}x${height}: Next/Previous should be visible without scrolling`)}
      if(seconds===19)await page.screenshot({path:`${output}/fit-${width}-${height}.png`});
    }
    const touch=await page.evaluate(()=>({targets:[...document.querySelectorAll('.viewer-controls button,.process-controls button,.process-controls input')].map(el=>{const r=el.getBoundingClientRect();return {name:el.getAttribute('aria-label')||el.textContent?.trim(),width:r.width,height:r.height}}).filter(target=>target.width>0&&target.height>0),orientation:screen.orientation?.type||'unknown'}));
    if(width<=1000)assert(touch.targets.every(target=>target.width>=32&&target.height>=32),`${width}x${height}: undersized visible interactive target ${JSON.stringify(touch.targets.filter(target=>target.width<32||target.height<32))}`);
    assert.equal(await page.evaluate(()=>matchMedia('(orientation:landscape)').matches),width>height,`${width}x${height}: orientation media query`);
    await page.getByRole('button',{name:'เล่นการนำเสนอ',exact:true}).click();
    assert(Number(await page.locator('#results').getAttribute('data-playhead'))<1);
    assert.equal(await page.locator('#results').getAttribute('data-playing'),'true');
    await page.getByRole('button',{name:'หยุดการนำเสนอ',exact:true}).click();
    await page.getByRole('button',{name:'ถัดไป',exact:true}).click();
    assert.equal(await page.locator('#results').getAttribute('data-playing'),'true');
    console.log('PASS viewport fit',width,height);await page.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
