const {chromium}=require(process.env.DMR_PLAYWRIGHT_MODULE||'playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage();
    await page.goto(pathToFileURL(path.resolve('tmp/pdfs/research-compendium/compendium.html')).href);
    await page.evaluate(()=>document.fonts.ready);
    const issues=await page.locator('.page').evaluateAll(pages=>pages.flatMap((p,i)=>{
      const footer=p.querySelector('footer').getBoundingClientRect();
      return [...p.children].filter(c=>!['HEADER','FOOTER','H1'].includes(c.tagName)).filter(c=>c.getBoundingClientRect().bottom>footer.top-6).map(c=>({page:i+1,tag:c.tagName,bottom:c.getBoundingClientRect().bottom,footer:footer.top}));
    }));
    if(issues.length)throw new Error(JSON.stringify(issues));
    await page.pdf({path:'output/pdf/DMR_Research_Compendium_TH.pdf',format:'A4',printBackground:true,preferCSSPageSize:true,tagged:true,outline:true});
    console.log('PDF rendered; no content/footer collisions.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
