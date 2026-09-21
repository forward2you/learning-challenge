const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../data/catalog.js');
const api = require('../src/content/registry.js');
const sessions = require('../src/core/quiz-session.js');
const content = require('../src/content.js');
const registry = api.createRegistry(catalog.packs);
const all = catalog.packs.flatMap(p=>p.questions);

test('all published chapters are registered: 8 Chinese, 8 math, 6 English plus five practice/review entries',()=>{
  assert.equal(registry.valid,true,registry.errors.join('\n'));
  assert.equal(all.length,390);
  assert.equal(new Set(all.map(q=>q.id)).size,390);
  for(const [subject,count] of [['chinese',8],['math',8],['english',6]]) {
    const units=registry.listUnits({subject});
    assert.deepEqual(units.filter(u=>u.id.startsWith('unit-')).map(u=>u.id),Array.from({length:count},(_,i)=>`unit-${i+1}`));
  }
  assert.equal(registry.listUnits().length,27);
  assert.deepEqual(registry.listUnits({subject:'math'}).filter(u=>!u.id.startsWith('unit-')).map(u=>u.id),['practice-campus','practice-pairing','practice-calendar','review']);
  assert.ok(registry.listUnits({subject:'english'}).some(u=>u.id==='revision'));
});

for(const unit of registry.listUnits()) test(`whole chapter ${unit.subject}/${unit.id}: content, shuffled answer integrity, full round`,()=>{
  const scope={subject:unit.subject,grade:3,semester:1,unitIds:[unit.id]};
  const bank=registry.questions(scope);
  assert.equal(bank.length,unit.id==='unit-1'?10:15);
  assert.equal(new Set(bank.map(q=>q.prompt)).size,bank.length);
  for(const q of bank) {
    assert.equal(new Set(q.options).size,4);
    assert.ok(q.source.bookId&&Number(q.source.page)>0&&q.explanation);
    if(q.packId.endsWith('-remaining'))assert.equal(q.source.pdfPage,Number(q.source.page)+(q.subject==='math'?4:5));
  }
  const original=JSON.stringify(catalog);
  const round=registry.round(scope,10,()=>0);
  const session=sessions.create(round);
  for(let i=0;i<10;i++) {
    const q=sessions.current(session),source=bank.find(x=>x.id===q.id);
    assert.equal(q.options[q.answerIndex],source.options[source.answerIndex]);
    assert.equal(q.unitId,unit.id);
    sessions.select(session,i===0?(q.answerIndex+1)%4:q.answerIndex);
    assert.equal(sessions.submit(session,content.grade).accepted,true);
    assert.equal(sessions.submit(session,content.grade).accepted,false);
    sessions.advance(session);
  }
  assert.equal(sessions.result(session).score,9);
  assert.equal(session.answers.filter(a=>!a.correct).length,1);
  assert.equal(JSON.stringify(catalog),original);
});

// Independent arithmetic parser; evaluates only numbers, four operations and parentheses.
function calculate(expression) {
  const normalized=expression.replaceAll('＋','+').replaceAll('－','-').replaceAll('×','*').replaceAll('÷','/').replaceAll('（','(').replaceAll('）',')');
  const tokens=normalized.match(/\d+(?:\.\d+)?|[()+*/-]/g);let at=0;
  function atom(){const t=tokens[at++];if(t==='('){const n=sum();assert.equal(tokens[at++],')');return n;}assert.match(t,/^\d+(?:\.\d+)?$/);return Number(t);}
  function product(){let n=atom();while(['*','/'].includes(tokens[at])){const op=tokens[at++],b=atom();n=op==='*'?n*b:n/b;}return n;}
  function sum(){let n=product();while(['+','-'].includes(tokens[at])){const op=tokens[at++],b=product();n=op==='+'?n+b:n-b;}return n;}
  const value=sum();assert.equal(at,tokens.length);return value;
}
test('numeric expression questions independently compute to exactly one offered answer',()=>{
  let checked=0;
  for(const q of all.filter(q=>q.subject==='math')){
    const m=q.prompt.match(/^计算\s*([\d.＋－×÷（）()+*/ -]+)，结果是多少？$/);
    if(!m)continue;
    const expected=calculate(m[1]);
    const matching=q.options.map((x,i)=>Math.abs(Number(x)-expected)<1e-8?i:-1).filter(i=>i>=0);
    assert.deepEqual(matching,[q.answerIndex],q.id+' '+q.prompt);checked++;
  }
  assert.ok(checked>=30,`Only ${checked} expressions checked`);
});

test('application word problems and calendar answers agree with independent calculations',()=>{
  const expected={
    'math-unit-3-010':(120+98+102)+'本','math-unit-3-011':(850-250-180)+'个',
    'math-unit-3-012':(300-85-115)+'页','math-unit-3-013':(775-632)+'千米',
    'math-unit-6-011':20*4+'个','math-unit-6-012':13*3+'元','math-unit-6-013':180/9+'次','math-unit-6-014':66/3+'棵',
    'math-unit-7-013':((1540+420)/100).toFixed(2)+'元','math-unit-7-014':((500-230)/100).toFixed(2)+'元',
    'math-unit-8-004':(8+6+4)+'人','math-unit-8-014':(20-7-8)+'人',
    'math-practice-pairing-006':2*4+'种','math-practice-pairing-011':2+'种',
    'math-practice-calendar-005':new Date(Date.UTC(2024,2,0)).getUTCDate()+'天',
    'math-practice-calendar-009':(new Date(Date.UTC(2026,7,0)).getUTCDate()+new Date(Date.UTC(2026,8,0)).getUTCDate())+'天',
    'math-review-003':(150-40*3)+'元'
  };
  for(const [id,answer] of Object.entries(expected)){const q=all.find(q=>q.id===id);assert.ok(q,id);assert.equal(q.options[q.answerIndex],answer,id);}
});
