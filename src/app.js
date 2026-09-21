'use strict';
const app = document.getElementById('app');
const engine = window.MathGame;
const content = window.ContentEngine;
const contentPack = window.ContentCatalog || window.V1ContentPack;
const registry = content.createRegistry(contentPack.packs || [contentPack]);
const quizEngine = window.QuizSessionEngine;
const storage = window.StorageAdapter.create(() => localStorage);
const views = window.AppViews;
const arithmeticKey = 'learning-challenge.history.v1';
const quizKey = 'learning-challenge.quiz-history.v1';
const names = { addition: '加法森林', small: '口诀溪流', large: '乘除山坡' };
const levelNames = { easy: '热身', medium: '进阶', hard: '挑战' };
const subjectNames = { chinese: '语文花园', math: '数学工坊', english: '英语岛' };
const subjectIcons = { chinese: '📖', math: '🧩', english: '💬' };

let config = { type: 'addition', level: 'easy', mode: 'practice' };
const restored = storage.read(arithmeticKey, engine.cleanHistory);
const quizRestored = storage.read(quizKey, content.cleanHistory);
const packValidation = registry;
let state = 'home', questions = [], answers = [], input = '', elapsed = 0, started = 0;
let history = restored.value, storageOK = restored.status !== 'unavailable';
let historyNotice = restored.status === 'recovered' ? '部分旧口算成绩无法读取，已跳过异常记录。' : restored.status === 'unavailable' ? '浏览器暂时无法读取口算成绩。' : '';
let quizHistory = quizRestored.value, quizStorageOK = quizRestored.status !== 'unavailable';
let quizNotice = quizRestored.status === 'recovered' ? '部分旧三科成绩无法读取，已跳过异常记录。' : quizRestored.status === 'unavailable' ? '浏览器暂时无法读取三科成绩。' : '';
let quizSubject = 'chinese', quizSession = null;
let quizScope = { subject: 'chinese', grade: 3, semester: 1, unitIds: ['unit-1'], questionTypes: ['single-choice'] };
let advanceTimer = null;

function cancelAdvance() { clearTimeout(advanceTimer); advanceTimer = null; }
function focusTitle() { app.querySelector('h1')?.focus(); }

function nextQuestion() {
  cancelAdvance();
  if (state === 'feedback') {
    if (answers.length === 10) { finish(); return; }
    input = ''; state = 'question'; started = performance.now(); play(); focusTitle();
  } else if (state === 'quizFeedback') {
    const outcome = quizEngine.advance(quizSession);
    if (outcome.complete) { finishQuiz(); return; }
    state = 'quizQuestion'; playQuiz(); focusTitle();
  }
}

function home() {
  cancelAdvance();
  state = 'home';
  const recent = history.at(-1);
  const recentQuiz = quizHistory.at(-1);
  const notices = [historyNotice, quizNotice, packValidation.valid ? '' : `内容包暂不可用：${packValidation.errors[0]}`].filter(Boolean);
  app.innerHTML = views.home({pack:contentPack,packValid:packValidation.valid,subjectNames,subjectIcons,recentQuiz,recentArithmetic:recent,arithmeticNames:names,notices});
  focusTitle();
}

function arithmeticSetup() {
  cancelAdvance(); state = 'arithmeticSetup';
  const recent = history.at(-1);
  app.innerHTML = views.arithmeticSetup({config,names,levelNames,recent,notice:historyNotice});
  focusTitle();
}

function scopeSetup(subject) {
  cancelAdvance(); state = 'scopeSetup'; quizSubject = subject;
  const grades = registry.listGrades({ subject });
  if (!grades.includes(quizScope.grade)) quizScope.grade = grades[0];
  const semesters = registry.listSemesters({ subject, grade: quizScope.grade });
  if (!semesters.includes(quizScope.semester)) quizScope.semester = semesters[0];
  quizScope.subject = subject;
  const units = registry.listUnits({ subject, grade: quizScope.grade, semester: quizScope.semester });
  if (!units.some(unit => quizScope.unitIds.includes(unit.id))) quizScope.unitIds = units.length ? [units[0].id] : [];
  app.innerHTML = views.scopeSetup({subject,subjectNames,subjectIcons,grades,semesters,units,scope:quizScope,questionCount:registry.questions(quizScope).length});
  focusTitle();
}

function start() { cancelAdvance(); questions = engine.round(config.type, config.level); answers = []; elapsed = 0; input = ''; state = 'question'; started = performance.now(); play(); focusTitle(); }
function play() {
  const q = questions[answers.length];
  app.innerHTML = views.arithmeticQuestion({question:q,questions,answers,config,names,levelNames});
  tick();
}
function tick() { const el = document.getElementById('timer'); if (el && config.mode === 'challenge') el.textContent = `${Math.floor((elapsed + (state === 'question' ? performance.now() - started : 0)) / 1000)}秒`; }
setInterval(tick, 250);
function entry(action) {
  if (state !== 'question') return;
  if (/^\d$/.test(action)) { if (input.length < 4) input = input === '0' ? action : input + action; }
  else if (action === 'delete') input = input.slice(0,-1);
  else if (action === 'clear') input = '';
  const el = document.getElementById('answer'); el.textContent = input || '输入你的答案'; el.classList.toggle('filled', !!input);
}
function submit() {
  if (state !== 'question') return;
  if (!input) { document.getElementById('feedback').innerHTML = '<p>先填一个答案，再提交哦。</p>'; return; }
  elapsed += performance.now() - started;
  const q = questions[answers.length], correct = engine.grade(q, input);
  answers.push({ q, value: Number(input), correct }); state = 'feedback';
  document.getElementById('feedback').innerHTML = `<div class="feedback ${correct ? 'success' : 'try'}"><b>${correct ? '✦ 答对啦！' : '再学会一招！'}</b><p>${correct ? `${q.a} ${q.op} ${q.b} = ${q.answer}` : engine.hint(q)}</p></div>`;
  app.querySelectorAll('.keys button').forEach(b => b.disabled = true);
  document.getElementById('submit-area').innerHTML = `<button class="primary wide" disabled>${answers.length === 10 ? '正在整理成绩…' : '即将进入下一题…'}</button>`;
  advanceTimer = setTimeout(nextQuestion, correct ? 600 : 1800);
  document.getElementById('answer').setAttribute('tabindex','-1'); document.getElementById('answer').focus(); tick();
}
function finish() {
  cancelAdvance(); state = 'result'; const score = answers.filter(a => a.correct).length;
  const record = { ...config, score, seconds: Math.round(elapsed / 1000), date: new Date().toISOString() };
  history = engine.cleanHistory([...history, record]);
  const saved = storage.write(arithmeticKey, history);
  storageOK = saved.saved;
  if (storageOK) historyNotice = '';
  else historyNotice = '最近口算成绩仅在本次打开期间保留，刷新或关闭后可能丢失。';
  app.innerHTML = views.resultCard({score,prefix:config.mode === 'challenge' ? `答题用时 ${record.seconds}秒 · ` : '',saved:storageOK,restartAction:'restart',label:'口算'}) + wrongArithmetic();
  focusTitle();
}
function wrongArithmetic() {
  const wrong = answers.filter(a => !a.correct);
  return views.arithmeticReview(wrong,engine.hint);
}

function startQuiz(subjectOrScope = quizScope) {
  cancelAdvance();
  const scope = typeof subjectOrScope === 'string' ? { subject: subjectOrScope, grade: 3, semester: 1, unitIds: ['unit-1'], questionTypes: ['single-choice'] } : { ...subjectOrScope, unitIds: subjectOrScope.unitIds.slice(), questionTypes: subjectOrScope.questionTypes.slice() };
  quizScope = scope; quizSubject = scope.subject;
  try { quizSession = quizEngine.create(registry.round(scope, 10)); }
  catch (error) { state = 'error'; quizSession = null; app.innerHTML = views.error(error.message); focusTitle(); return; }
  state = 'quizQuestion'; playQuiz(); focusTitle();
}
function playQuiz(feedback = null) {
  const unit = registry.listUnits(quizScope).find(item => quizScope.unitIds.includes(item.id));
  app.innerHTML = views.quizQuestion({session:quizSession,unit,subject:quizSubject,subjectNames,subjectIcons,feedback});
}
function selectQuiz(index) {
  if (state !== 'quizQuestion' || !quizEngine.select(quizSession, index)) return;
  app.querySelectorAll('.choice').forEach((choice, i) => { choice.classList.toggle('selected', i === index); choice.setAttribute('aria-pressed', String(i === index)); });
}
function submitQuiz() {
  if (state !== 'quizQuestion') return;
  const outcome = quizEngine.submit(quizSession, content.grade);
  if (!outcome.accepted && outcome.reason === 'empty') { document.getElementById('quiz-feedback').innerHTML = '<p class="quiz-warning">先选择一个答案，再提交哦。</p>'; return; }
  if (!outcome.accepted) return;
  state = 'quizFeedback';
  playQuiz({ selected: outcome.answer.selected, correct: outcome.answer.correct });
  app.querySelector('h1')?.focus();
  advanceTimer = setTimeout(nextQuestion, outcome.answer.correct ? 600 : 1800);
}
function finishQuiz() {
  cancelAdvance(); state = 'quizResult'; const result = quizEngine.result(quizSession), score = result.score, quizAnswers = result.answers;
  const record = { subject: quizSubject, score, contentVersion: [...new Set(quizSession.questions.map(q => q.contentVersion))].join('|'), grade: quizScope.grade, semester: quizScope.semester, unitIds: quizScope.unitIds.slice(), date: new Date().toISOString() };
  quizHistory = content.cleanHistory([...quizHistory, record]);
  const saved = storage.write(quizKey, quizHistory);
  quizStorageOK = saved.saved;
  if (quizStorageOK) quizNotice = '';
  else quizNotice = '最近三科成绩仅在本次打开期间保留，刷新或关闭后可能丢失。';
  const wrong = quizAnswers.filter(answer => !answer.correct);
  app.innerHTML = views.resultCard({score,prefix:`${subjectNames[quizSubject]} · `,saved:quizStorageOK,restartAction:'quizRestart',label:subjectNames[quizSubject]}) + views.quizReview(wrong);
  focusTitle();
}

app.addEventListener('change', event => {
  if (event.target.id === 'level' || event.target.id === 'mode') config[event.target.id] = event.target.value;
  else if (event.target.id === 'scope-grade') { quizScope.grade = Number(event.target.value); scopeSetup(quizSubject); }
  else if (event.target.id === 'scope-semester') { quizScope.semester = Number(event.target.value); scopeSetup(quizSubject); }
  else if (event.target.id === 'scope-unit') { quizScope.unitIds = [event.target.value]; scopeSetup(quizSubject); }
});
app.addEventListener('click', event => {
  const target = event.target.closest('button'); if (!target) return;
  if (target.dataset.subject) { scopeSetup(target.dataset.subject); return; }
  if (target.dataset.type) { config.type = target.dataset.type; arithmeticSetup(); app.querySelector(`[data-type="${config.type}"]`)?.focus(); return; }
  if (target.dataset.option !== undefined) { selectQuiz(Number(target.dataset.option)); return; }
  const action = target.dataset.action;
  if (action === 'start' || action === 'restart') start();
  else if (action === 'arithmeticSetup') { arithmeticSetup(); focusTitle(); }
  else if (action === 'scopeSetup') scopeSetup(quizSubject);
  else if (action === 'startQuiz') startQuiz();
  else if (action === 'submit') submit();
  else if (action === 'quizSubmit') submitQuiz();
  else if (action === 'quizRestart') startQuiz(quizScope);
  else if (action === 'home') home();
  else if (action === 'leave' && window.confirm('要结束这一轮并返回口算设置吗？本轮成绩不会保存。')) arithmeticSetup();
  else entry(action);
});
document.addEventListener('keydown', event => {
  if (event.repeat && event.key === 'Enter' && ['question','feedback','quizQuestion','quizFeedback'].includes(state)) { event.preventDefault(); return; }
  if (state === 'quizQuestion' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    if (/^[1-4]$/.test(event.key)) { event.preventDefault(); selectQuiz(Number(event.key) - 1); }
    else if (event.key === 'Enter') { event.preventDefault(); submitQuiz(); }
    return;
  }
  if (state !== 'question' || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (/^\d$/.test(event.key)) { event.preventDefault(); entry(event.key); }
  else if (event.key === 'Backspace') { event.preventDefault(); entry('delete'); }
  else if (event.key === 'Enter') { event.preventDefault(); submit(); }
});
home();
