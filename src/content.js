(function (root) {
  'use strict';
  const registryApi = typeof module !== 'undefined' && module.exports ? require('./content/registry.js') : root.ContentRegistry;
  const { SUBJECTS, validatePack, createRegistry } = registryApi;

  function questionsFor(pack, subject) {
    const registry = createRegistry([pack]);
    return registry.questions({ subject, grade: 3, semester: 1, unitIds: ['unit-1'], questionTypes: ['single-choice'] });
  }
  function round(pack, subject, count = 10, random = Math.random) {
    return createRegistry([pack]).round({ subject, grade: 3, semester: 1, unitIds: ['unit-1'], questionTypes: ['single-choice'] }, count, random);
  }
  function grade(question, answerIndex) { return Number.isInteger(answerIndex) && answerIndex === question.answerIndex; }
  function cleanHistory(value) {
    if (!Array.isArray(value)) return [];
    return value.filter(entry => entry && SUBJECTS.includes(entry.subject) && Number.isInteger(entry.score) && entry.score >= 0 && entry.score <= 10 && typeof entry.contentVersion === 'string' && typeof entry.date === 'string' && Number.isFinite(Date.parse(entry.date))).slice(-20).map(entry => ({ subject: entry.subject, score: entry.score, contentVersion: entry.contentVersion, grade: entry.grade || 3, semester: entry.semester || 1, unitIds: Array.isArray(entry.unitIds) ? entry.unitIds.slice() : ['unit-1'], date: entry.date }));
  }
  function readHistory(getStorage, key) {
    let raw;
    try { raw = getStorage().getItem(key); }
    catch { return { history: [], status: 'unavailable' }; }
    if (raw === null) return { history: [], status: 'ok' };
    try {
      const value = JSON.parse(raw), cleaned = cleanHistory(value);
      const validCount = Array.isArray(value) ? value.reduce((count, entry) => count + cleanHistory([entry]).length, 0) : 0;
      return { history: cleaned, status: Array.isArray(value) && validCount === value.length ? 'ok' : 'recovered' };
    } catch { return { history: [], status: 'recovered' }; }
  }
  const api = { SUBJECTS, validatePack, createRegistry, questionsFor, round, grade, cleanHistory, readHistory };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ContentEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
