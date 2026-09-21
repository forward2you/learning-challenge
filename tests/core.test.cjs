const test = require('node:test');
const assert = require('node:assert/strict');
const sessions = require('../src/core/quiz-session.js');
const storage = require('../src/platform/storage.js');

const questions = Array.from({length:2}, (_, index) => ({id:`q${index}`,answerIndex:index}));

test('quiz session owns selection, locking, advancing and final result', () => {
  const session = sessions.create(questions);
  assert.equal(sessions.current(session).id,'q0');
  assert.equal(sessions.select(session,0),true);
  const first=sessions.submit(session,(question,answer)=>question.answerIndex===answer);
  assert.equal(first.accepted,true);assert.equal(first.answer.correct,true);
  assert.equal(sessions.submit(session,()=>true).reason,'locked');
  assert.deepEqual(sessions.advance(session),{advanced:true,complete:false});
  assert.equal(sessions.current(session).id,'q1');assert.equal(session.selection,null);
  sessions.select(session,0);sessions.submit(session,(question,answer)=>question.answerIndex===answer);
  assert.deepEqual(sessions.advance(session),{advanced:true,complete:true});
  assert.equal(sessions.result(session).score,1);
});

test('quiz session rejects invalid operations and premature result', () => {
  const session=sessions.create(questions);
  assert.equal(sessions.select(session,5),false);
  assert.equal(sessions.submit(session,()=>true).reason,'empty');
  assert.deepEqual(sessions.advance(session),{advanced:false,complete:false});
  assert.throws(()=>sessions.result(session),/尚未完成/);
  assert.throws(()=>sessions.create([]),/至少一道题/);
});

test('storage adapter distinguishes ok, recovered, unavailable and write failure', () => {
  const map=new Map();const adapter=storage.create(()=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)}));
  assert.deepEqual(adapter.read('x',value=>Array.isArray(value)?value.filter(Number.isInteger):[]),{value:[],status:'ok'});
  map.set('x','[1,"bad"]');assert.deepEqual(adapter.read('x',value=>Array.isArray(value)?value.filter(Number.isInteger):[]),{value:[1],status:'recovered'});
  assert.equal(adapter.write('x',[2]).saved,true);assert.equal(map.get('x'),'[2]');
  const denied=storage.create(()=>{throw new Error('denied')});assert.equal(denied.read('x',()=>[]).status,'unavailable');assert.equal(denied.write('x',[]).saved,false);
});
