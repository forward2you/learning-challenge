// Runs against an isolated loopback server; never changes the user's browser profile.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/wei.feng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const catalog = require('../data/catalog.js');
const registry = require('../src/content/registry.js').createRegistry(catalog.packs);
const allQuestions = catalog.packs.flatMap(pack=>pack.questions);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};

async function run() {
  const server = http.createServer((req,res)=>{
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file = path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if (!file.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
    if(pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
    fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(error?'Missing':data);});
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
    const page = await browser.newPage({viewport:{width:1280,height:900}});
    const errors=[],external=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',req=>{if(!req.url().startsWith(base+'/'))external.push(req.url());});
    const out=path.join(root,'docs/validation/workshop-browser');fs.mkdirSync(out,{recursive:true});
    const sample=JSON.parse(fs.readFileSync(path.join(root,'data/content-template.json')));
    const file=pack=>({name:'sample.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(pack))});
    await page.goto(base+'/content-manager.html');
    await page.locator('#import-file').setInputFiles(file(sample));
    await page.waitForFunction(()=>document.querySelector('#editor').hidden===false);
    assert.equal(await page.locator('#activate').isDisabled(),true);
    await page.locator('#approve').click();
    await page.locator('#prompt').fill(sample.questions[0].prompt+' ');
    await page.locator('button[type="submit"]').click();
    assert.match(await page.locator('#review-progress').innerText(),/已审核 0/);
    // A malformed replacement must leave the current draft in place.
    await page.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')});
    await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('原有内容没有改变'));
    assert.equal(await page.locator('#question-list option').count(),10);
    for(let i=0;i<10;i++){await page.locator('#question-list').selectOption(String(i));await page.locator('#approve').click();}
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:path.join(out,'review-mobile.png'),fullPage:true});
    const downloadPromise=page.waitForEvent('download');await page.locator('#export-draft').click();
    const download=await downloadPromise;await download.saveAs(path.join(out,'exported-test-pack.json'));
    assert.equal(JSON.parse(fs.readFileSync(path.join(out,'exported-test-pack.json'))).questions.length,10);
    // Quota failure must not claim success or replace stored contents.
    await page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('QuotaExceededError');};});
    await page.locator('#activate').click();assert.match(await page.locator('#notice').innerText(),/保存失败/);
    await page.evaluate(()=>{Storage.prototype.setItem=window.originalSet;});
    await page.locator('#activate').click();assert.match(await page.locator('#notice').innerText(),/已保存并加入/);
    await page.reload();assert.match(await page.locator('#installed').innerText(),/local-chinese-review/);
    await page.goto(base);await page.locator('[data-subject="chinese"]').click();
    await page.locator('#scope-unit').selectOption('local-review');
    assert.match(await page.locator('.scope-summary').innerText(),/10道题/);
    await page.locator('[data-action="startQuiz"]').click();
    for(let i=0;i<10;i++){
      await page.locator('[data-action="quizSubmit"]').waitFor();
      const prompt=(await page.locator('.quiz-card h1').innerText()).trim();
      const q=sample.questions.find(q=>q.prompt===prompt);assert.ok(q,prompt);
      const displayed=await page.locator('.choice').allTextContents();
      let selected=displayed.findIndex(t=>t.slice(1)===q.options[q.answerIndex]);assert.ok(selected>=0);
      if(i===0)selected=(selected+1)%4;
      // Exercise the keyboard path as well as automatic advancement.
      await page.keyboard.press(String(selected+1));await page.keyboard.press('Enter');
      await page.waitForFunction(n=>n===10 ? !!document.querySelector('.score') : document.querySelector('.progress')?.getAttribute('aria-label')===`第${n+1}题，共10题`,i+1);
    }
    assert.match(await page.locator('.score').innerText(),/^9/);
    assert.equal(await page.locator('.review-list article').count(),1);
    const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('learning-challenge.quiz-history.v1')));
    assert.equal(history.at(-1).contentVersion,'1');assert.deepEqual(history.at(-1).unitIds,['local-review']);
    await page.screenshot({path:path.join(out,'practice-result.png'),fullPage:true});
    // A new content version keeps the old version, and existing results stay pinned to v1.
    sample.contentVersion='2';await page.goto(base+'/content-manager.html');
    await page.locator('#import-file').setInputFiles(file(sample));await page.waitForFunction(()=>!document.querySelector('#editor').hidden);
    for(let i=0;i<10;i++){await page.locator('#question-list').selectOption(String(i));await page.locator('#approve').click();}
    await page.locator('#activate').click();assert.match(await page.locator('#notice').innerText(),/已保存并加入/);
    assert.equal(await page.locator('#installed li').count(),2);
    await page.goto(base);assert.match(await page.locator('.v1-status').innerText(),/9\/10/);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('learning-challenge.quiz-history.v1')).at(-1).contentVersion),'1');
    await page.evaluate(()=>localStorage.setItem('learning-challenge.content-archive.v1','{broken'));
    await page.reload();assert.match(await page.locator('.system-notice').innerText(),/本地题库无法读取/);
    await page.locator('[data-subject="chinese"]').click();assert.equal(await page.locator('#scope-unit option').count(),8);
    await page.goto(base+'/content-manager.html');
    await page.locator('#import-file').setInputFiles(file(sample));await page.waitForFunction(()=>!document.querySelector('#editor').hidden);
    for(let i=0;i<10;i++){await page.locator('#question-list').selectOption(String(i));await page.locator('#approve').click();}
    await page.locator('#activate').click();assert.match(await page.locator('#notice').innerText(),/已保存并加入/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('learning-challenge.content-archive.v1.recovery')),'{broken');
    await page.reload();assert.equal(await page.locator('#installed li').count(),1);
    assert.deepEqual(errors,[]);assert.deepEqual(external.filter(url=>!url.startsWith('blob:')),[]);
    const result={date:new Date().toISOString(),browser:await browser.version(),checks:['import','review reset','bad file preserves draft','390px layout','JSON export','quota failure','activation','reload','10 questions with keyboard and automatic next','wrong answer review','version archive','history keeps version','corrupt storage fallback','restore with damaged archive backup'],pageErrors:errors,externalRequests:external};
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
  } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
