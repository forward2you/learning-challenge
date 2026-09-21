const test = require('node:test');
const assert = require('node:assert/strict');
const content = require('../src/content.js');
const pack = require('../data/v1-content.js');
const registryApi = require('../src/content/registry.js');

test('V1 content pack validates and contains ten approved questions per subject', () => {
  assert.deepEqual(content.validatePack(pack), { valid: true, errors: [] });
  for (const subject of content.SUBJECTS) {
    const questions = content.questionsFor(pack, subject);
    assert.equal(questions.length, 10);
    assert.ok(questions.every(item => item.reviewStatus === 'approved'));
  }
});

test('V1 rounds are unique, subject-scoped and deterministic with injected random', () => {
  for (const subject of content.SUBJECTS) {
    const round = content.round(pack, subject, 10, () => 0);
    assert.equal(round.length, 10);
    assert.equal(new Set(round.map(item => item.id)).size, 10);
    assert.ok(round.every(item => item.subject === subject));
  }
});

test('V1 grading accepts only the exact integer option index', () => {
  const question = pack.questions[0];
  assert.equal(content.grade(question, question.answerIndex), true);
  assert.equal(content.grade(question, String(question.answerIndex)), false);
  assert.equal(content.grade(question, (question.answerIndex + 1) % 4), false);
  assert.equal(content.grade(question, null), false);
});

test('content validation rejects duplicates, unreviewed items and broken sources', () => {
  const clone = JSON.parse(JSON.stringify(pack));
  clone.questions[1].id = clone.questions[0].id;
  clone.questions[2].reviewStatus = 'draft';
  clone.questions[3].source.bookId = 'missing-book';
  const result = content.validatePack(clone);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('重复')));
  assert.ok(result.errors.some(error => error.includes('尚未审核')));
  assert.ok(result.errors.some(error => error.includes('来源无效')));
});

test('content history keeps latest twenty valid records and safely reads failures', () => {
  const valid = { subject:'chinese', score:8, contentVersion:pack.contentVersion, date:'2026-09-16T00:00:00Z' };
  const records = Array.from({length:25}, (_, index) => ({...valid, score:index % 11}));
  const cleaned = content.cleanHistory(records);
  assert.equal(cleaned.length, 20);
  assert.deepEqual(content.readHistory(() => ({getItem:()=>'bad'}), 'key'), {history:[],status:'recovered'});
  assert.deepEqual(content.readHistory(() => { throw new Error('denied'); }, 'key'), {history:[],status:'unavailable'});
});

test('content registry derives grades, semesters, subjects and units from metadata', () => {
  const registry = registryApi.createRegistry([pack]);
  assert.equal(registry.valid, true);
  assert.deepEqual(registry.listGrades(), [3]);
  assert.deepEqual(registry.listSemesters({grade:3}), [1]);
  assert.deepEqual(registry.listSubjects({grade:3,semester:1}), ['chinese','math','english']);
  assert.deepEqual(registry.listUnits({subject:'math',grade:3,semester:1}).map(unit => unit.id), ['unit-1']);
});

test('content registry filters by complete scope and never borrows another unit', () => {
  const registry = registryApi.createRegistry([pack]);
  const valid = registry.questions({subject:'chinese',grade:3,semester:1,unitIds:['unit-1'],questionTypes:['single-choice']});
  assert.equal(valid.length,10);
  assert.equal(registry.questions({subject:'chinese',grade:3,semester:1,unitIds:['unit-2'],questionTypes:['single-choice']}).length,0);
  assert.throws(() => registry.round({subject:'chinese',grade:3,semester:1,unitIds:['unit-2'],questionTypes:['single-choice']},10),/题目不足/);
});

test('registry unit labels remain available when a complete scope includes unitIds', () => {
  const registry = registryApi.createRegistry([pack]);
  const units = registry.listUnits({subject:'english',grade:3,semester:1,unitIds:['unit-1'],questionTypes:['single-choice']});
  assert.equal(units.length,1);
  assert.equal(units[0].title,'Making friends');
});

test('registry accepts another grade and semester without borrowing first-unit questions', () => {
  const other = JSON.parse(JSON.stringify(pack));
  other.packId = 'grade-four-second-semester';
  other.units.forEach(unit => { unit.grade=4;unit.semester=2;unit.id='unit-2'; });
  other.questions.forEach(q => { q.grade=4;q.semester=2;q.unitId='unit-2';q.id='g4-'+q.id; });
  const registry = registryApi.createRegistry([pack,other]);
  assert.equal(registry.valid,true);
  assert.deepEqual(registry.listGrades({subject:'math'}),[3,4]);
  assert.deepEqual(registry.listSemesters({subject:'math',grade:4}),[2]);
  const round = registry.round({subject:'math',grade:4,semester:2,unitIds:['unit-2']});
  assert.ok(round.every(q=>q.grade===4&&q.semester===2&&q.unitId==='unit-2'));
});

test('malformed question is rejected without throwing and zero count cannot start', () => {
  const broken = {...pack,questions:[null]};
  assert.equal(registryApi.validatePack(broken).valid,false);
  assert.throws(()=>registryApi.createRegistry([pack]).round({subject:'math'},0),/正整数/);
});
