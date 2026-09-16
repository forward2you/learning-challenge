(function (root) {
  'use strict';
  const TYPES = ['addition', 'small', 'large'];
  const LEVELS = ['easy', 'medium', 'hard'];
  function pool(type, level) {
    if (!TYPES.includes(type) || !LEVELS.includes(level)) throw new Error('无效题库配置');
    const result = [];
    const push = (a, op, b) => result.push({ a, op, b, answer: op === '+' ? a + b : op === '×' ? a * b : a / b });
    if (type === 'addition') {
      // Build a bounded, broad bank rather than allocating all 980,100 pairs.
      for (let a = level === 'hard' ? 100 : 10; a <= (level === 'hard' ? 999 : 99); a++) {
        for (let b = 10; b <= 99; b++) {
          if (level !== 'easy' || (a % 10 + b % 10 < 10 && Math.floor(a / 10) + Math.floor(b / 10) < 10)) push(a, '+', b);
        }
      }
      if (level === 'hard') for (let a = 100; a <= 999; a += 7) for (let b = 100; b <= 999; b += 11) push(a, '+', b);
    } else {
      const max = level === 'easy' ? 5 : 9;
      for (let a = type === 'small' ? 1 : 10; a <= (type === 'small' ? max : 99); a++) {
        for (let b = 1; b <= max; b++) {
          push(a, '×', b);
          if (a % b === 0) push(a, '÷', b);
        }
      }
    }
    return result;
  }
  function round(type, level, random = Math.random) {
    const bank = pool(type, level);
    for (let i = 0; i < 10; i++) {
      const j = i + Math.floor(random() * (bank.length - i));
      [bank[i], bank[j]] = [bank[j], bank[i]];
    }
    return bank.slice(0, 10);
  }
  function grade(question, input) {
    return /^\d{1,4}$/.test(input) && Number(input) === question.answer;
  }
  function hint(q) {
    if (q.op === '÷') return `想一想：${q.b} × 几 = ${q.a}？所以 ${q.a} ÷ ${q.b} = ${q.answer}。`;
    if (q.op === '×') {
      if (q.a < 10) return `用乘法口诀想一想：${q.a} × ${q.b} = ${q.answer}。`;
      const tens = Math.floor(q.a / 10) * 10;
      return `拆开算：${tens} × ${q.b} = ${tens * q.b}，${q.a % 10} × ${q.b} = ${(q.a % 10) * q.b}，再相加得到 ${q.answer}。`;
    }
    const tens = Math.floor(q.b / 10) * 10;
    return `先算 ${q.a} + ${tens} = ${q.a + tens}，再加 ${q.b % 10}，得到 ${q.answer}。`;
  }
  function cleanHistory(value) {
    if (!Array.isArray(value)) return [];
    return value.filter(x => x && TYPES.includes(x.type) && LEVELS.includes(x.level) && ['practice', 'challenge'].includes(x.mode) && Number.isInteger(x.score) && x.score >= 0 && x.score <= 10 && Number.isFinite(x.seconds) && x.seconds >= 0 && typeof x.date === 'string' && Number.isFinite(Date.parse(x.date))).slice(-20).map(x => ({ type: x.type, level: x.level, mode: x.mode, score: x.score, seconds: x.seconds, date: x.date }));
  }
  function readHistory(getStorage, key) {
    let raw;
    try { raw = getStorage().getItem(key); }
    catch { return { history: [], status: 'unavailable' }; }
    if (raw === null) return { history: [], status: 'ok' };
    try {
      const value = JSON.parse(raw);
      const cleaned = cleanHistory(value);
      const validCount = Array.isArray(value) ? value.reduce((count, entry) => count + cleanHistory([entry]).length, 0) : 0;
      const recovered = !Array.isArray(value) || validCount !== value.length;
      return { history: cleaned, status: recovered ? 'recovered' : 'ok' };
    } catch { return { history: [], status: 'recovered' }; }
  }
  const api = { pool, round, grade, hint, cleanHistory, readHistory };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MathGame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
