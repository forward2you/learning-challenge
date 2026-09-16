'use strict';
const app = document.getElementById('app');
const engine = window.MathGame;
const key = 'learning-challenge.history.v1';
const names = { addition: '加法森林', small: '口诀溪流', large: '乘除山坡' };
const levelNames = { easy: '热身', medium: '进阶', hard: '挑战' };
let config = { type: 'addition', level: 'easy', mode: 'practice' };
const restored = engine.readHistory(() => localStorage, key);
let state = 'home', questions = [], answers = [], input = '', elapsed = 0, started = 0, history = restored.history, storageOK = restored.status !== 'unavailable';
let historyNotice = restored.status === 'recovered' ? '部分旧成绩无法读取，已跳过异常记录，仍然可以正常玩。' : restored.status === 'unavailable' ? '浏览器暂时无法读取成绩，仍然可以正常玩。' : '';
let advanceTimer = null;
function cancelAdvance() { clearTimeout(advanceTimer); advanceTimer = null; }
function nextQuestion() {
  cancelAdvance();
  if (state !== 'feedback') return;
  if (answers.length === 10) { finish(); return; }
  input = ''; state = 'question'; started = performance.now(); play(); focusTitle();
}
function button(label, action, cls = '') { return `<button class="${cls}" data-action="${action}">${label}</button>`; }
function focusTitle() { app.querySelector('h1')?.focus(); }
function home() {
  cancelAdvance();
  state = 'home';
  const recent = history.at(-1);
  app.innerHTML = `<section class="intro"><div><span class="eyebrow">CHAPTER 01 · 数学小探险</span><h1 tabindex="-1">脑袋热个身，<br>出发去闯关！</h1><p>10道口算，一次小冒险。<br>慢慢想也没关系，每一题都是进步。</p><div class="chips"><span>✦ 每轮10题</span><span>⌨ 支持键盘</span><span>♡ 不怕答错</span></div></div><div class="landscape" aria-hidden="true"><span class="sun"></span><span class="hill back"></span><span class="hill front"></span><span class="flag">⚑</span><span class="path"></span><span class="camp">口算营地<br><b>10</b> 个小挑战</span></div></section>
  <section class="setup card"><div class="section-heading"><h2>今天去哪里？</h2><span>选一个营地就能出发</span></div><div class="destinations">${Object.entries(names).map(([id, name], i) => `<button data-type="${id}" class="destination ${config.type === id ? 'selected' : ''}" aria-pressed="${config.type === id}"><span class="icon">${['🌳','💧','⛰'][i]}</span><b>${name}</b><small>${['两位数 · 三位数加法','一位数 × ÷ 一位数','两位数 × ÷ 一位数'][i]}</small></button>`).join('')}</div><div class="options"><label>难度<select id="level">${Object.entries(levelNames).map(([v,n]) => `<option value="${v}" ${config.level === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label>玩法<select id="mode"><option value="practice" ${config.mode === 'practice' ? 'selected' : ''}>轻松练习 · 不计时</option><option value="challenge" ${config.mode === 'challenge' ? 'selected' : ''}>挑战自己 · 记录用时</option></select></label>${button('开始冒险 →', 'start', 'primary')}</div><p class="note">${config.type === 'addition' ? '热身：两位数不进位；进阶：两位数加法；挑战：包含三位数。' : '热身使用1—5的小因子；进阶和挑战使用1—9。除法都能整除。'}</p></section><div class="history">${recent ? `上次冒险：${names[recent.type]} · ${recent.score}/10题正确。今天也按自己的节奏来。` : '你的第一枚冒险足迹，等着你来点亮。'}${historyNotice ? `<br>${historyNotice}` : ''}</div>`;
}
function start() { cancelAdvance(); questions = engine.round(config.type, config.level); answers = []; elapsed = 0; input = ''; state = 'question'; started = performance.now(); play(); focusTitle(); }
function play() {
  const q = questions[answers.length];
  app.innerHTML = `<section class="game-head">${button('← 返回营地','leave','text-button')}<span>${names[config.type]} · ${levelNames[config.level]}</span><span id="timer">${config.mode === 'challenge' ? '0秒' : '慢慢想，不着急'}</span></section><div class="progress" aria-label="第${answers.length + 1}题，共10题">${questions.map((_,i) => `<span class="${i < answers.length ? (answers[i].correct ? 'done' : 'review') : i === answers.length ? 'current' : ''}">${i + 1}</span>`).join('')}</div><section class="play-grid"><div class="question card"><span class="eyebrow">第 ${answers.length + 1} / 10 题</span><h1 tabindex="-1">${q.a} ${q.op} ${q.b} <span>= ?</span></h1><div id="answer" class="answer" role="status" aria-label="当前答案">输入你的答案</div><div id="feedback" aria-live="polite"><p class="muted">想好了，就按「提交答案」</p></div></div><div class="keypad card"><p>点一点，填答案</p><div class="keys">${[1,2,3,4,5,6,7,8,9].map(n => button(n, String(n))).join('')}${button('清空','clear','small')}${button(0,'0')}${button('⌫','delete')}</div><div id="submit-area">${button('提交答案 ↵','submit','primary wide')}</div><small>键盘数字输入 · Enter 提交 · 退格删除</small></div></section>`;
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
  // Keep feedback focus away from actionable controls during the transition.
  document.getElementById('answer').setAttribute('tabindex','-1'); document.getElementById('answer').focus(); tick();
}
function finish() {
  cancelAdvance();
  state = 'result'; const score = answers.filter(a => a.correct).length;
  const record = { ...config, score, seconds: Math.round(elapsed / 1000), date: new Date().toISOString() };
  history = engine.cleanHistory([...history, record]);
  try { localStorage.setItem(key, JSON.stringify(history)); storageOK = true; historyNotice = ''; }
  catch { storageOK = false; historyNotice = '最近成绩仅在本次打开期间保留，刷新或关闭后可能丢失。'; }
  app.innerHTML = `<section class="result card"><span class="eyebrow">冒险完成 · 每一步都算数</span><div class="badge" aria-hidden="true">✦</div><h1 tabindex="-1">${score === 10 ? '这次，全部拿下！' : '又完成了一次小冒险！'}</h1><div class="score">${score}<span> / 10题正确</span></div><p>${config.mode === 'challenge' ? `答题用时 ${record.seconds}秒 · ` : ''}${score === 10 ? '带着这份信心，继续探索吧。' : '把下面的小方法带走，下次再试试。'}</p><p class="note">${storageOK ? '成绩已保存在当前浏览器。' : '本次成绩未能保存，但不影响继续玩。'}</p><div class="result-actions">${button('再来一轮 →','restart','primary')}${button('返回营地','home','secondary')}</div></section>${score < 10 ? `<section class="review-list"><h2>带走这些小方法</h2>${answers.filter(a => !a.correct).map(a => `<article class="card"><b>${a.q.a} ${a.q.op} ${a.q.b} = ${a.q.answer}</b><span>你的答案：${a.value}</span><p>${engine.hint(a.q)}</p></article>`).join('')}</section>` : ''}`;
  focusTitle();
}
app.addEventListener('change', e => { if (e.target.id === 'level' || e.target.id === 'mode') config[e.target.id] = e.target.value; });
app.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.type) { config.type = b.dataset.type; home(); app.querySelector(`[data-type="${config.type}"]`).focus(); return; }
  const action = b.dataset.action;
  if (action === 'start' || action === 'restart') start();
  else if (action === 'submit') submit();
  else if (action === 'home') { home(); focusTitle(); }
  else if (action === 'leave' && window.confirm('要结束这一轮并返回营地吗？本轮成绩不会保存。')) { home(); focusTitle(); }
  else entry(action);
});
document.addEventListener('keydown', e => {
  if (e.repeat && e.key === 'Enter' && (state === 'question' || state === 'feedback')) { e.preventDefault(); return; }
  if (state !== 'question' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  if (/^\d$/.test(e.key)) { e.preventDefault(); entry(e.key); }
  else if (e.key === 'Backspace') { e.preventDefault(); entry('delete'); }
  else if (e.key === 'Enter') { e.preventDefault(); submit(); }
});
home();
