(function (root) {
  'use strict';
  function create(questions) {
    if (!Array.isArray(questions) || questions.length === 0) throw new TypeError('答题会话需要至少一道题');
    return { questions: questions.slice(), index: 0, selection: null, answers: [], status: 'question' };
  }
  function current(session) { return session.questions[session.index]; }
  function select(session, answerIndex) {
    if (session.status !== 'question' || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) return false;
    session.selection = answerIndex; return true;
  }
  function submit(session, grader) {
    if (session.status !== 'question') return { accepted: false, reason: 'locked' };
    if (session.selection === null) return { accepted: false, reason: 'empty' };
    const question = current(session), correct = grader(question, session.selection);
    const answer = { question, selected: session.selection, correct };
    session.answers.push(answer); session.status = 'feedback';
    return { accepted: true, answer };
  }
  function advance(session) {
    if (session.status !== 'feedback') return { advanced: false, complete: session.status === 'complete' };
    if (session.index === session.questions.length - 1) { session.status = 'complete'; return { advanced: true, complete: true }; }
    session.index += 1; session.selection = null; session.status = 'question';
    return { advanced: true, complete: false };
  }
  function result(session) {
    if (session.status !== 'complete') throw new Error('答题会话尚未完成');
    return { total: session.questions.length, score: session.answers.filter(answer => answer.correct).length, answers: session.answers.slice() };
  }
  const api = { create, current, select, submit, advance, result };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QuizSessionEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
