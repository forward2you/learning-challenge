const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const engine = require('../src/engine.js');
const script = fs.readFileSync(require.resolve('../src/app.js'), 'utf8');
const historyKey = 'learning-challenge.history.v1';

// Minimal host for production controller logic, not a browser/DOM emulator.
// Real rendering, native button behavior and mobile input are checked separately.
function harness({ raw = null, denied = false, writeDenied = false, restoredStorage } = {}) {
  let clock = 0, timerId = 0;
  const timers = new Map();
  const handlers = {}, nodes = {}, store = restoredStorage || new Map(raw === null ? [] : [[historyKey, raw]]);
  const makeNode = () => ({ innerHTML: '', textContent: '', disabled: false, classList: { toggle() {} }, setAttribute() {}, focus() {} });
  for (const id of ['app','answer','feedback','submit-area','timer']) nodes[id] = makeNode();
  const keys = Array.from({length:12},makeNode);
  nodes.app.querySelector = () => makeNode();
  nodes.app.querySelectorAll = () => keys;
  nodes.app.addEventListener = (name, handler) => { handlers[`app:${name}`] = handler; };
  const document = { getElementById: id => nodes[id] || null, addEventListener: (name, handler) => { handlers[name] = handler; } };
  const storage = { getItem: key => store.get(key) ?? null, setItem(key,value) { if (writeDenied) throw new Error('QuotaExceededError'); store.set(key,value); } };
  const questions = Array.from({length:10},(_,i)=>({a:20+i,b:12,op:'+',answer:32+i}));
  const context = vm.createContext({ document, window:{ MathGame:{...engine,round:()=>questions.map(q=>({...q}))},confirm:()=>true }, performance:{now:()=>clock},setInterval(){},setTimeout(fn,delay){const id=++timerId;timers.set(id,{fn,at:clock+delay});return id;},clearTimeout(id){timers.delete(id);},Date });
  Object.defineProperty(context,'localStorage',{get(){if(denied)throw new Error('SecurityError');return storage;}});
  vm.runInContext(script,context);
  return {
    nodes,store,keys,
    get: expression => vm.runInContext(expression,context),
    advance(ms) {
      const end = clock + ms;
      while (true) {
        const due = [...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
        if (!due) break;
        clock = due[1].at; timers.delete(due[0]); due[1].fn();
      }
      clock=end; vm.runInContext('tick()',context);
    },
    click(action) { handlers['app:click']({target:{closest:()=>({dataset:{action}})}}); },
    choose(id,value) { handlers['app:change']({target:{id,value}}); },
    key(key,extra={}) { let prevented=false; handlers.keydown({key,preventDefault(){prevented=true;},...extra}); return prevented; },
    answer(value) { for(const ch of String(value)) this.key(ch); this.key('Enter'); },
    complete({wrong=0}={}) { for(let i=0;i<10;i++){this.answer(i<wrong ? 0 : 32+i);this.advance(i<wrong ? 1800 : 600);} }
  };
}

test('application: empty input, max digits, delete, clear, zero and unsupported keys',()=>{
 const h=harness();h.click('start');h.click('submit');assert.equal(h.get('answers.length'),0);assert.match(h.nodes.feedback.innerHTML,/先填/);
 for(const key of '12345')h.key(key);assert.equal(h.get('input'),'1234');h.key('Backspace');assert.equal(h.get('input'),'123');
 h.click('clear');h.click('0');h.click('0');assert.equal(h.get('input'),'0');h.click('3');assert.equal(h.get('input'),'3');
 h.key('.');h.key('-');h.key('a');h.key('9',{ctrlKey:true});assert.equal(h.get('input'),'3');
 h.click('delete');assert.equal(h.get('input'),'');assert.equal(h.get('state'),'question');
});
test('application: wrong answer, duplicate submits and held Enter do not skip feedback',()=>{
 const h=harness();h.click('start');h.answer(0);assert.equal(h.get('answers.length'),1);assert.equal(h.get('answers[0].correct'),false);assert.match(h.nodes.feedback.innerHTML,/再学会一招/);
 h.click('submit');h.key('Enter');h.key('9');assert.equal(h.get('answers.length'),1);assert.equal(h.get('input'),'0');assert.equal(h.get('state'),'feedback');
 assert.equal(h.key('Enter',{repeat:true}),true);assert.equal(h.get('state'),'feedback');assert.ok(h.keys.every(k=>k.disabled));
 h.advance(1799);assert.equal(h.get('state'),'feedback');h.advance(1);assert.equal(h.get('state'),'question');assert.equal(h.get('input'),'');assert.equal(h.get('answers.length'),1);
});
test('application: timer counts question time only and new round resets it',()=>{
 const h=harness();h.choose('mode','challenge');h.click('start');
 for(let i=0;i<10;i++){
  h.advance(2000);h.answer(32+i);const seconds=h.nodes.timer.textContent;h.advance(599);assert.equal(h.nodes.timer.textContent,seconds);assert.equal(h.get('state'),'feedback');h.advance(1);
 }
 assert.equal(h.get('state'),'result');assert.equal(h.get('history[0].seconds'),20);assert.match(h.nodes.app.innerHTML,/答题用时 20秒/);
 h.click('restart');assert.equal(h.get('elapsed'),0);assert.equal(h.get('answers.length'),0);assert.equal(h.get('config.mode'),'challenge');
});
test('application: completed round saves once, shows correct score and survives reload',()=>{
 const h=harness();h.click('start');h.complete({wrong:2});assert.equal(h.get('state'),'result');assert.equal(h.get('history.length'),1);assert.equal(h.get('history[0].score'),8);assert.match(h.nodes.app.innerHTML,/你的答案：0/);
 h.click('next');h.click('submit');assert.equal(h.get('history.length'),1);
 const reopened=harness({restoredStorage:h.store});assert.equal(reopened.get('history[0].score'),8);assert.match(reopened.nodes.app.innerHTML,/8\/10题正确/);
});
test('application: denied storage cannot block completion or claim permanent saving',()=>{
 const h=harness({denied:true});assert.match(h.nodes.app.innerHTML,/无法读取成绩/);h.click('start');h.complete();assert.equal(h.get('state'),'result');assert.match(h.nodes.app.innerHTML,/未能保存/);
 h.click('home');assert.match(h.nodes.app.innerHTML,/仅在本次打开期间保留/);assert.equal(h.get('history[0].score'),10);
});
test('application: read allowed but writes denied produces accurate result and home notice',()=>{
 const h=harness({writeDenied:true});h.click('start');h.complete();assert.match(h.nodes.app.innerHTML,/未能保存/);assert.equal(h.store.size,0);h.click('home');assert.match(h.nodes.app.innerHTML,/刷新或关闭后可能丢失/);
});
test('application: malformed JSON and invalid structured histories recover with a notice',()=>{
 for(const raw of ['{broken','{}','[null,{}]']){
  const h=harness({raw});assert.match(h.nodes.app.innerHTML,/已跳过异常记录/);h.click('start');h.complete();assert.match(h.nodes.app.innerHTML,/成绩已保存/);assert.equal(JSON.parse(h.store.get(historyKey)).length,1);
 }
});
test('application: latest twenty completed rounds retained in chronological order',()=>{
 const valid={type:'addition',level:'easy',mode:'practice',score:3,seconds:1,date:'2026-09-15T00:00:00Z'};
 const h=harness({raw:JSON.stringify(Array.from({length:20},(_,i)=>({...valid,seconds:i})))});h.click('start');h.complete();
 const records=JSON.parse(h.store.get(historyKey));assert.equal(records.length,20);assert.equal(records[0].seconds,1);assert.equal(records.at(-1).score,10);
});
test('application: leaving an unfinished round does not save partial scores',()=>{
 const h=harness();h.click('start');h.answer(32);h.click('leave');assert.equal(h.get('state'),'home');assert.equal(h.store.size,0);assert.equal(h.get('history.length'),0);
});
test('application: practice mode never displays elapsed challenge time',()=>{
 const h=harness();h.click('start');h.advance(10000);assert.match(h.nodes.app.innerHTML,/慢慢想，不着急/);h.complete();assert.doesNotMatch(h.nodes.app.innerHTML,/答题用时/);
});

test('automatic transition: exiting feedback cancels the pending next question',()=>{
 const h=harness();h.click('start');h.answer(32);h.advance(200);h.click('leave');h.advance(5000);assert.equal(h.get('state'),'home');assert.equal(h.store.size,0);
 h.click('start');h.advance(1000);assert.equal(h.get('answers.length'),0);assert.equal(h.get('state'),'question');
});
test('automatic transition: tenth wrong answer opens results once after its full delay',()=>{
 const h=harness();h.click('start');for(let i=0;i<9;i++){h.answer(32+i);h.advance(600);}
 h.answer(0);h.advance(1799);assert.equal(h.get('state'),'feedback');assert.equal(h.get('history.length'),0);h.advance(1);assert.equal(h.get('state'),'result');assert.equal(h.get('history[0].score'),9);h.advance(10000);assert.equal(h.get('history.length'),1);
});
