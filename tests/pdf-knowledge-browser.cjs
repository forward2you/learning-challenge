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
    const out=path.join(root,'docs/validation/pdf-knowledge-browser');fs.mkdirSync(out,{recursive:true});
    const reports=[];
    await page.goto(base+'/#content-manager');
    const bookDir=path.resolve(root,'../课本');
    for(const [file,subject,pages] of [
      ['26秋·语文三年级上册电子课本(1).pdf','chinese',[119]],
      ['人教PEP版·英语三年级上册.pdf','english',[88]],
      ['26秋三年级上册北师大数学课本.pdf','math',[6,17,45,54,79]]
    ]) {
      const started=Date.now();
      await page.locator('#pdf-file').setInputFiles(path.join(bookDir,file));
      await page.waitForFunction(()=>/共\d+页/.test(document.querySelector('#pdf-status').textContent),null,{timeout:90000});
      const loadMs=Date.now()-started;
      for(const number of pages) {
        const start=Date.now();await page.locator('#pdf-number').fill(String(number));await page.locator('#pdf-go').click();
        await page.waitForFunction(n=>document.querySelector('#pdf-status').textContent.includes(`当前第${n}页`),number,{timeout:90000});
        const raw=await page.locator('#knowledge-raw').inputValue();
        assert.ok(await page.locator('#pdf-image canvas').count());
        await page.locator('#pdf-image canvas').screenshot({path:path.join(out,`${subject}-${number}.png`)});
        reports.push({subject,pdfPage:number,rawCharacters:raw.length,rawSample:raw.slice(0,150),loadMs,pageMs:Date.now()-start});
        if(subject==='chinese'){assert.ok(raw.includes('山坡'));assert.ok(raw.includes('学校'));}
        if(subject==='english'){assert.ok(raw.includes('name'));assert.ok(raw.includes('nice'));}
        if(subject==='math'){assert.equal(raw.length,0);assert.match(await page.locator('#pdf-status').innerText(),/手工录入/);}
        const summaries={6:'买1个6元的蛋糕和4个3元的面包：6＋3×4＝18（元）。',17:'1分米＝10厘米；1厘米＝10毫米。',45:'从不同位置观察同一物体，看到的样子可能不同。',54:'角有一个顶点和两条边。',79:'3.15元是3元1角5分。'};
        await page.locator('#knowledge-subject').selectOption(subject);
        await page.locator('#knowledge-edition').fill('测试资料；版本待核对');
        await page.locator('#knowledge-unit').fill(subject==='math'?'样本页面':'第一单元附表');
        await page.locator('#knowledge-printed').fill(String(number-(subject==='math'?4:5)));
        await page.locator('#knowledge-title').fill(`验收样本 ${subject}-${number}`);
        await page.locator('#knowledge-text').fill(subject==='math'?summaries[number]:subject==='chinese'?'山坡 学校 飘扬 课文 声音 招引 热闹 古老 粗壮 枝干 洁白':'name 名字；nice 令人愉快的、友好的。');
        await page.locator('#knowledge-form button[type="submit"]').click();
        assert.match(await page.locator('#knowledge-notice').innerText(),/待审核/);
        await page.locator('#knowledge-approve').click();assert.match(await page.locator('#knowledge-notice').innerText(),/已审核并保存/);
        if(subject==='chinese'){
          await page.locator('#knowledge-text').fill('山坡 学校 飘扬');await page.locator('#knowledge-form button[type="submit"]').click();
          assert.match(await page.locator('#knowledge-list li').first().innerText(),/待审核/);
          await page.locator('#knowledge-approve').click();
        }
        console.log('PAGE',subject,number,raw.length);
      }
    }
    assert.equal(await page.locator('#knowledge-list li').count(),7);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('learning-challenge.knowledge.v1')));
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/content/source-manifest.json')));
    for(const item of saved.items){assert.equal(item.source.sha256,manifest.sources.find(s=>path.basename(s.file)===item.source.fileName).sha256);assert.equal(item.reviewStatus,'approved');}
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.locator('#knowledge-form').screenshot({path:path.join(out,'knowledge-mobile.png')});
    // A saved entry cannot be re-approved against a different book/page currently shown.
    await page.locator('#knowledge-list button').first().click();await page.locator('#knowledge-approve').click();
    assert.match(await page.locator('#knowledge-notice').innerText(),/同一教材对应/);
    await page.locator('#knowledge-list button').last().click();
    await page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new Error('QuotaExceededError');};});
    await page.locator('#knowledge-form button[type="submit"]').click();assert.match(await page.locator('#knowledge-notice').innerText(),/保存失败/);
    await page.evaluate(()=>{Storage.prototype.setItem=window.originalSet;});
    const pending=page.waitForEvent('download');await page.locator('#knowledge-export').click();const download=await pending;
    await download.saveAs(path.join(out,'knowledge-test-backup.json'));
    assert.equal(JSON.parse(fs.readFileSync(path.join(out,'knowledge-test-backup.json'))).items.length,7);
    await page.locator('#pdf-file').setInputFiles({name:'bad.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7 broken')});
    await page.waitForFunction(()=>document.querySelector('#pdf-status').textContent.includes('PDF无法读取'));
    assert.equal(await page.locator('#knowledge-list li').count(),7);
    await page.locator('#knowledge-import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')});
    await page.waitForFunction(()=>document.querySelector('#knowledge-notice').textContent.includes('原有资料未改变'));
    await page.reload();assert.equal(await page.locator('#knowledge-list li').count(),7);
    const heapBytes=await page.evaluate(()=>performance.memory?.usedJSHeapSize??null);
    await page.evaluate(()=>localStorage.removeItem('learning-challenge.knowledge.v1'));await page.reload();
    await page.locator('#knowledge-import').setInputFiles(path.join(out,'knowledge-test-backup.json'));
    await page.waitForFunction(()=>document.querySelectorAll('#knowledge-list li').length===7);
    assert.ok((await page.locator('#knowledge-list').innerText()).includes('待审核'));
    assert.ok(!(await page.locator('#knowledge-list').innerText()).includes('已审核'));
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({date:new Date().toISOString(),browser:await browser.version(),reports,heapBytes,flowChecks:["edit revokes approval","source hash matches real PDF","wrong page cannot approve","storage denied","JSON export","damaged PDF","damaged JSON preserves records","reload","import resets review","390px layout"],pageErrors:errors,externalRequests:external},null,2));
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    console.log(JSON.stringify(reports,null,2));
  } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
