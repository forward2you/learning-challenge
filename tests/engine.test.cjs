const test = require('node:test');
const assert = require('node:assert/strict');
const e = require('../src/engine.js');
for (const type of ['addition','small','large']) for (const level of ['easy','medium','hard']) {
  test(`${type}/${level}: entire bank obeys arithmetic and ranges; rounds unique`, () => {
    for (const q of e.pool(type, level)) {
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 10000);
      assert.equal(q.answer, q.op === '+' ? q.a + q.b : q.op === '×' ? q.a * q.b : q.a / q.b);
      if (type === 'addition') {
        assert.ok(q.a >= 10 && q.a <= 999 && q.b >= 10 && q.b <= 999);
        if (level === 'easy') { assert.ok(q.a % 10 + q.b % 10 < 10); assert.ok(q.a + q.b < 100); }
        if (level === 'medium') assert.ok(q.a < 100 && q.b < 100);
        if (level === 'hard') assert.ok(q.a >= 100 || q.b >= 100);
      } else {
        assert.ok(q.b >= 1 && q.b <= (level === 'easy' ? 5 : 9));
        assert.ok(type === 'small' ? q.a >= 1 && q.a <= 9 : q.a >= 10 && q.a <= 99);
        if (q.op === '÷') assert.equal(q.a % q.b, 0);
      }
      assert.ok(e.hint(q).includes(String(q.answer)));
    }
    for (let i = 0; i < 20; i++) { const r = e.round(type, level); assert.equal(r.length,10); assert.equal(new Set(r.map(q => `${q.a}${q.op}${q.b}`)).size,10); }
  });
}
test('grading rejects blank, negative, decimal, overlong and nonnumeric answers', () => {
  const q = {answer:12};
  assert.ok(e.grade(q,'12')); assert.ok(e.grade(q,'0012'));
  for (const x of ['', ' ', '-12', '12.0', '12x','00012','13']) assert.equal(e.grade(q,x),false);
});
test('history ignores invalid entries and retains latest 20', () => {
  const valid = {type:'addition',level:'easy',mode:'practice',score:8,seconds:14,date:'2026-09-15T00:00:00Z'};
  assert.deepEqual(e.cleanHistory(null),[]);
  assert.deepEqual(e.cleanHistory([null,{}, {...valid,score:11},{...valid,seconds:-1},{...valid,date:'bad'}, {...valid,type:'<script>'}]),[]);
  const records = Array.from({length:25},(_,i)=>({...valid,seconds:i}));
  assert.equal(e.cleanHistory(records).length,20); assert.equal(e.cleanHistory(records)[0].seconds,5);
});
test('invalid configuration rejected', () => { assert.throws(()=>e.round('bad','easy')); });
