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
    const reports=[];
    const snapshots=path.join(root,'docs/validation/full-semester-browser');fs.mkdirSync(snapshots,{recursive:true});
    for(const [subject,width,height] of [['chinese',1280,900],['math',390,844],['english',768,1024]]) for(const unit of registry.listUnits({subject})) {
      const unitId=unit.id;
      await page.setViewportSize({width,height});await page.goto(base);
      await page.locator(`[data-subject="${subject}"]`).click();
      assert.equal(await page.locator('#scope-grade').inputValue(),'3');
      assert.equal(await page.locator('#scope-unit').inputValue(),'unit-1');
      assert.equal(await page.locator('#scope-unit option').count(),registry.listUnits({subject}).length);
      await page.locator('#scope-unit').selectOption(unitId);
      const poolSize=registry.questions({subject,unitIds:[unitId]}).length;
      assert.ok((await page.locator('.scope-summary').innerText()).includes(`${poolSize}道题`));
      await page.screenshot({path:path.join(snapshots,`${subject}-${unitId}-scope.png`),fullPage:true});
      await page.locator('[data-action="startQuiz"]').click();
      const ids=new Set();
      for(let i=0;i<10;i++){
        await page.locator('[data-action="quizSubmit"]').waitFor();
        const prompt=await page.locator('.quiz-card h1').innerText();
        const q=allQuestions.find(q=>q.subject===subject&&q.unitId===unitId&&q.prompt===prompt);assert.ok(q,prompt);
        assert.ok(!ids.has(q.id));ids.add(q.id);
        if(i===0){
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
          await page.screenshot({path:path.join(snapshots,`${subject}-${unitId}-question.png`),fullPage:true});
        }
        const displayed=await page.locator('.choice').allTextContents();
        const answerIndex=displayed.findIndex(text=>text.slice(1)===q.options[q.answerIndex]);
        assert.ok(answerIndex>=0);
        const answer=i===0?(answerIndex+1)%4:answerIndex;
        await page.locator(`[data-option="${answer}"]`).click();
        await page.locator('[data-action="quizSubmit"]').click();
        await page.waitForFunction(n=>{
          const progress=document.querySelector('.progress');
          return n===10 ? !!document.querySelector('.score') : progress?.getAttribute('aria-label')===`第${n+1}题，共10题`;
        },i+1);
      }
      assert.match(await page.locator('.score').innerText(),/^9/);
      assert.equal(await page.locator('.review-list article').count(),1);
      const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('learning-challenge.quiz-history.v1')).at(-1));
      assert.deepEqual(saved.unitIds,[unitId]);
      await page.reload();assert.match(await page.locator('.v1-status').innerText(),/9\/10/);
      reports.push({subject,unitId,width,height,poolSize,score:9,questions:10});
      console.log(`PASS ${subject}/${unitId}`);
    }
    await page.goto(base);await page.locator('[data-action="arithmeticSetup"]').click();await page.locator('[data-action="start"]').click();
    for(let i=0;i<10;i++){
      const text=await page.locator('.question h1').innerText();const m=text.match(/(\d+)\s*\+\s*(\d+)/);assert.ok(m);
      for(const digit of String(+m[1]+ +m[2]))await page.locator(`[data-action="${digit}"]`).click();
      await page.locator('[data-action="submit"]').click();
      await page.waitForFunction(n=>n===10?!!document.querySelector('.score'):document.querySelector('.progress')?.getAttribute('aria-label')===`第${n+1}题，共10题`,i+1);
    }
    assert.match(await page.locator('.score').innerText(),/^10/);
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    const result={date:new Date().toISOString(),browser:browser.version(),reports,arithmeticScore:10,pageErrors:errors,externalRequests:external};
    fs.writeFileSync(path.join(snapshots,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
