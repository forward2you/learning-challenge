const test=require('node:test');
const assert=require('node:assert/strict');
const api=require('../src/content/workshop');
const catalog=require('../data/catalog');
const template=require('../data/content-template.json');
const fresh=()=>api.parse(JSON.stringify(template));
const reviewed=()=>{let p=fresh();p.questions.forEach((q,i)=>{p=api.approve(p,i);});return p;};

test('imported review claims are reset; edits revoke approval without changing original',()=>{
 const p=reviewed();const draft=api.parse(JSON.stringify(p));assert.ok(draft.questions.every(q=>q.reviewStatus==='draft'));
 const changed=api.edit(p,0,{prompt:'新的题干'});assert.equal(changed.questions[0].reviewStatus,'draft');assert.equal(p.questions[0].reviewStatus,'approved');
 assert.throws(()=>api.install([],changed,catalog.packs),/逐题审核/);
});
test('invalid imports reject unknown schemas, duplicate IDs, missing answers, bad pages and bounds',()=>{
 assert.throws(()=>api.parse('{bad'),/JSON/);assert.throws(()=>api.parse(' '.repeat(2*1024*1024+1)),/MiB/);
 for(const mutate of [p=>p.schemaVersion=99,p=>p.questions[1].id=p.questions[0].id,p=>delete p.questions[0].answerIndex,p=>p.questions[0].source.page='0',p=>p.questions[0].source.pdfPage=-1,p=>p.questions[0].source.page='9-2',p=>p.units[0].grade=7,p=>p.questions[0].learningGoal='',p=>p.questions=[null],p=>p.questions=[]]) {
   const p=fresh();mutate(p);assert.throws(()=>api.parse(JSON.stringify(p)));
 }
});
test('old built-in drafts without PDF pages can be imported but must add pages before review',()=>{
 const p=api.parse(JSON.stringify(catalog.packs[0]));assert.throws(()=>api.approve(p,0),/PDF/);
});
test('install preserves immutable builtins, unique scopes and question identities',()=>{
 const p=reviewed();assert.equal(api.install([],p,catalog.packs).length,1);
 const collision=structuredClone(p);collision.packId=catalog.packs[0].packId;assert.throws(()=>api.install([],collision,catalog.packs),/只读/);
 collision.packId=p.packId;collision.questions[0].id=catalog.packs[0].questions[0].id;assert.throws(()=>api.install([],collision,catalog.packs),/ID/);
 collision.questions[0].id=p.questions[0].id;collision.units[0].id='unit-2';collision.questions.forEach(q=>q.unitId='unit-2');assert.throws(()=>api.install([],collision,catalog.packs),/单元已存在/);
});
test('new version retains previous content and activates latest version on reload',()=>{
 const p=reviewed(), a=api.install([],p,catalog.packs);assert.throws(()=>api.install(a,p,catalog.packs),/版本/);
 const next=structuredClone(p);next.contentVersion='2';next.questions[0].prompt='修改后的题干';
 const archive=api.install(a,next,catalog.packs);const store=new Map();const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 api.save(()=>storage,archive);const result=api.load(()=>storage,catalog.packs);
 assert.equal(result.archive.length,2);assert.equal(result.packs.length,1);assert.equal(result.packs[0].contentVersion,'2');assert.equal(result.archive[0].questions[0].prompt,p.questions[0].prompt);
});
test('bad storage falls back and denied writes preserve previous saved content',()=>{
 for(const value of ['{bad','{}',JSON.stringify([fresh()])]) {const r=api.load(()=>({getItem:()=>value}),catalog.packs);assert.equal(r.packs.length,0);assert.ok(r.notice);}
 const original=JSON.stringify([reviewed()]);let raw=original;
 const denied={getItem:()=>raw,setItem:()=>{throw new Error('QuotaExceededError');}};
 assert.throws(()=>api.save(()=>denied,[reviewed()]),/保存失败/);assert.equal(raw,original);
 assert.equal(api.load(()=>{throw new Error('SecurityError');},catalog.packs).packs.length,0);
});
test('custom prompt and options render as text in game and review',()=>{
 const views=require('../src/features/views');const p=reviewed();const q=p.questions[0];q.prompt='<img src=x onerror=alert(1)>';q.options[0]='<script>bad</script>';q.explanation='<b>text</b>';
 const html=views.quizQuestion({session:{questions:[q],index:0,answers:[],selection:0},unit:p.units[0],subject:'chinese',subjectNames:{chinese:'语文'},subjectIcons:{chinese:''},feedback:{correct:true,selected:0}});
 assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('<script>'));
 const review=views.quizReview([{question:q,selected:0}]);assert.ok(!review.includes('<img'));assert.ok(review.includes('&lt;b&gt;'));
});
test('restoring from a corrupt archive backs up original bytes before replacing and fails safely',()=>{
 const store=new Map([[api.KEY,'{broken']]);const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 api.commit(()=>storage,reviewed(),catalog.packs);
 assert.equal(store.get(api.KEY+'.recovery'),'{broken');assert.equal(api.load(()=>storage,catalog.packs).packs.length,1);
 storage.setItem(api.KEY,'{broken-again');storage.setItem=()=>{throw new Error('QuotaExceededError');};
 assert.throws(()=>api.commit(()=>storage,reviewed(),catalog.packs),/取消保存/);assert.equal(store.get(api.KEY),'{broken-again');
});
