const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../data/catalog.js');
const pack = require('../data/unit-two.js');
const api = require('../src/content/registry.js');

test('second-unit pack contains 45 reviewed questions with PDF and printed page references',()=>{
  assert.deepEqual(api.validatePack(pack),{valid:true,errors:[]});
  assert.equal(pack.questions.length,45);
  assert.ok(pack.questions.every(q=>q.source.pdfPage>0&&Number(q.source.page)>0&&q.explanation));
  assert.equal(new Set(catalog.packs.slice(0,2).flatMap(p=>p.questions.map(q=>q.id))).size,75);
});

for(const subject of ['chinese','math','english']) test(`${subject}: independent unit counts, no cross-unit questions, varied ten-of-fifteen rounds`,()=>{
  const registry=api.createRegistry(catalog.packs);
  const scope={subject,grade:3,semester:1,unitIds:['unit-2']};
  assert.deepEqual(registry.listUnits({subject}).map(u=>u.id).slice(0,2),['unit-1','unit-2']);
  assert.equal(registry.questions({...scope,unitIds:['unit-1']}).length,10);
  assert.equal(registry.questions(scope).length,15);
  const first=registry.round(scope,10,()=>0),last=registry.round(scope,10,()=>0.999);
  assert.equal(new Set(first.map(q=>q.id)).size,10);
  assert.ok(first.every(q=>q.subject===subject&&q.unitId==='unit-2'));
  assert.notDeepEqual(first.map(q=>q.id).sort(),last.map(q=>q.id).sort());
});

test('option shuffle preserves correct text and original source over every published question',()=>{
  const before=JSON.stringify(catalog);
  const registry=api.createRegistry(catalog.packs);
  const source=catalog.packs.flatMap(p=>p.questions);
  for(const subject of ['chinese','math','english']) for(const unitId of ['unit-1','unit-2']) {
    const scope={subject,unitIds:[unitId]};
    const items=registry.round(scope,registry.questions(scope).length,()=>0);
    for(const q of items){
      const original=source.find(item=>item.id===q.id);
      assert.equal(q.options[q.answerIndex],original.options[original.answerIndex]);
      assert.equal(q.answerIndex,3); // Deterministic zero RNG moves source index zero to the end.
      assert.deepEqual([...q.options].sort(),[...original.options].sort());
    }
  }
  assert.equal(JSON.stringify(catalog),before);
});

test('measurement answers match independently calculated conversions and comparisons',()=>{
  const expected=['10毫米','10厘米','50毫米','8分米','30分米','65毫米','毫米','分米','米','1000米','3000米','5千米','千米','1千米','3分米比25厘米长'];
  assert.deepEqual(pack.questions.filter(q=>q.subject==='math').map(q=>q.options[q.answerIndex]),expected);
});

test('duplicate options are rejected before entering a round',()=>{
  const bad=JSON.parse(JSON.stringify(pack));bad.questions[0].options[1]=bad.questions[0].options[0];
  assert.ok(api.validatePack(bad).errors.some(e=>e.includes('选项重复')));
});
