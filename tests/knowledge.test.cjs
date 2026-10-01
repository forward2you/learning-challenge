const test=require('node:test'),assert=require('node:assert/strict'),api=require('../src/content/knowledge');
const fresh=()=>({id:'k-1',subject:'chinese',grade:3,semester:1,unit:'第一单元',title:'词语',bookTitle:'语文三上',edition:'版本待核对',text:'山坡 学校',rawText:'山坡 学校',source:{fileName:'教材.pdf',sha256:'a'.repeat(64),pdfPage:119,printedPage:'114',totalPages:123},reviewStatus:'draft'});
test('knowledge preserves source independently of question bank; edits and imports revoke review',()=>{
 const p=fresh(),q=api.approve(p);assert.equal(p.reviewStatus,'draft');assert.equal(q.reviewStatus,'approved');
 const edited=api.edit(q,{text:'山坡 学校 飘扬',source:{sha256:'wrong'}});assert.equal(edited.reviewStatus,'draft');assert.deepEqual(edited.source,q.source);
 const imported=api.parse(JSON.stringify(api.pack([q])));assert.equal(imported[0].reviewStatus,'draft');assert.equal(imported[0].reviewedAt,undefined);assert.deepEqual(imported[0].source,q.source);
});
test('knowledge rejects duplicate IDs, missing source, page bounds and missing metadata',()=>{
 assert.throws(()=>api.validate([fresh(),fresh()]),/重复/);
 for(const modify of [p=>p.source.sha256='bad',p=>p.source.pdfPage=124,p=>p.source.printedPage='0',p=>p.grade=7,p=>p.semester=3,p=>p.text='',p=>p.edition='',p=>p.rawText=null,p=>p.reviewStatus='approved']){const p=fresh();modify(p);assert.throws(()=>api.validate([p]));}
});
test('knowledge import is bounded, validated and does not overwrite collisions',()=>{
 assert.throws(()=>api.parse('{bad'),/JSON/);assert.throws(()=>api.parse(JSON.stringify({schemaVersion:2,kind:'learning-knowledge',items:[]})),/格式/);
 assert.throws(()=>api.parse(' '.repeat(2*1024*1024+1)),/MiB/);
 const existing=[fresh()];assert.throws(()=>api.merge(existing,[fresh()]),/取消导入/);assert.equal(existing.length,1);
 assert.equal(api.merge(existing,[{...fresh(),id:'k-2'}]).length,2);
});
test('knowledge saves and reloads reviewed source without storing PDF bytes',()=>{
 const memory=new Map(),store={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
 api.save(()=>store,[api.approve(fresh())]);const result=api.load(()=>store);assert.equal(result.items[0].reviewStatus,'approved');assert.deepEqual(result.items[0].source,fresh().source);assert.ok(!memory.get(api.KEY).includes('data:'));
});
test('knowledge denied write, corrupt restore and denied read preserve original data',()=>{
 const memory=new Map([[api.KEY,'{broken']]),store={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
 assert.ok(api.load(()=>store).notice);api.save(()=>store,[fresh()]);assert.equal(memory.get(api.KEY+'.recovery'),'{broken');
 const old=memory.get(api.KEY);store.setItem=()=>{throw new Error('QuotaExceededError');};assert.throws(()=>api.save(()=>store,[]),/保存失败/);assert.equal(memory.get(api.KEY),old);
 assert.throws(()=>api.save(()=>({getItem:()=>{throw new Error('SecurityError');},setItem:()=>assert.fail('must not write')}),[]),/取消保存/);
});
test('vendored PDF assets match the pinned manifest and carry licenses',()=>{
 const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),base=path.join(__dirname,'../vendor/pdfjs'),manifest=require('../vendor/pdfjs/manifest.json');
 assert.equal(manifest.version,'5.6.205');for(const entry of manifest.files){const bytes=fs.readFileSync(path.join(base,entry.file));assert.equal(bytes.length,entry.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);}
 assert.ok(manifest.files.some(f=>f.file==='LICENSE'));assert.ok(manifest.files.some(f=>f.file==='standard_fonts-LICENSE_LIBERATION'));
});
