(function (root) {
  'use strict';
  const SUBJECTS = ['chinese', 'math', 'english'];
  const TYPES = ['single-choice'];
  const unique = values => [...new Set(values)];
  const orderNumbers = (a, b) => a - b;

  function validatePack(pack) {
    const errors = [];
    if (!pack || pack.schemaVersion !== 1) errors.push('不支持的内容包版本');
    if (!pack || typeof pack.packId !== 'string' || !pack.packId) errors.push('内容包缺少ID');
    if (!pack || typeof pack.contentVersion !== 'string' || !pack.contentVersion) errors.push('内容包缺少版本');
    if (!pack || !Array.isArray(pack.books) || !Array.isArray(pack.units) || !Array.isArray(pack.questions)) errors.push('内容包结构不完整');
    if (errors.length) return { valid: false, errors };
    const books = new Set();
    for (const book of pack.books) {
      if (!book || typeof book.id !== 'string' || !book.id) errors.push('教材缺少ID');
      else if (books.has(book.id)) errors.push(`教材ID重复：${book.id}`);
      else books.add(book.id);
    }
    const unitKeys = new Set();
    for (const unit of pack.units) {
      const key = unit && `${unit.subject}:${unit.grade}:${unit.semester}:${unit.id}`;
      if (!unit || !SUBJECTS.includes(unit.subject) || !Number.isInteger(unit.grade) || ![1,2].includes(unit.semester) || typeof unit.id !== 'string' || !unit.id || typeof unit.label !== 'string' || !unit.label) errors.push('单元元数据无效');
      else if (unitKeys.has(key)) errors.push(`单元重复：${key}`);
      else unitKeys.add(key);
    }
    const ids = new Set();
    for (const item of pack.questions) {
      const label = item && item.id || '未知题目';
      if (!item || typeof item !== 'object') { errors.push('题目结构无效'); continue; }
      if (!item || typeof item.id !== 'string' || !item.id) errors.push('题目缺少ID');
      else if (ids.has(item.id)) errors.push(`题目ID重复：${item.id}`);
      else ids.add(item.id);
      if (!SUBJECTS.includes(item.subject)) errors.push(`${label}学科无效`);
      if (!Number.isInteger(item.grade) || ![1,2].includes(item.semester) || typeof item.unitId !== 'string' || !item.unitId) errors.push(`${label}范围无效`);
      if (!unitKeys.has(`${item.subject}:${item.grade}:${item.semester}:${item.unitId}`)) errors.push(`${label}未关联有效单元`);
      if (!TYPES.includes(item.type)) errors.push(`${label}题型无效`);
      if (typeof item.prompt !== 'string' || !item.prompt.trim()) errors.push(`${label}缺少题干`);
      if (!Array.isArray(item.options) || item.options.length !== 4 || item.options.some(option => typeof option !== 'string' || !option.trim())) errors.push(`${label}选项无效`);
      else if (new Set(item.options.map(option => option.trim())).size !== item.options.length) errors.push(`${label}选项重复`);
      if (!Number.isInteger(item.answerIndex) || item.answerIndex < 0 || item.answerIndex > 3) errors.push(`${label}答案无效`);
      if (typeof item.explanation !== 'string' || !item.explanation.trim()) errors.push(`${label}缺少解析`);
      if (item.reviewStatus !== 'approved') errors.push(`${label}尚未审核`);
      if (!item.source || !books.has(item.source.bookId) || !String(item.source.page || '').trim()) errors.push(`${label}来源无效`);
    }
    return { valid: errors.length === 0, errors };
  }

  function createRegistry(packs) {
    if (!Array.isArray(packs)) throw new TypeError('内容包列表无效');
    const errors = [], validPacks = [], packIds = new Set();
    for (const pack of packs) {
      const result = validatePack(pack);
      if (pack && packIds.has(pack.packId)) errors.push(`内容包ID重复：${pack.packId}`);
      else if (pack) packIds.add(pack.packId);
      if (result.valid && !errors.some(error => error === `内容包ID重复：${pack && pack.packId}`)) validPacks.push(pack);
      else errors.push(...result.errors.map(error => `${pack && pack.packId || '未知内容包'}：${error}`));
    }
    const questions = validPacks.flatMap(pack => pack.questions.map(item => ({ ...item, packId: pack.packId, contentVersion: pack.contentVersion })));
    const units = validPacks.flatMap(pack => pack.units.map(unit => ({ ...unit, packId: pack.packId, contentVersion: pack.contentVersion })));
    const matches = (item, filter = {}) => (!filter.subject || item.subject === filter.subject) && (!filter.grade || item.grade === filter.grade) && (!filter.semester || item.semester === filter.semester) && (!filter.unitIds || filter.unitIds.includes(item.unitId)) && (!filter.questionTypes || filter.questionTypes.includes(item.type));
    return {
      valid: errors.length === 0,
      errors,
      packs: validPacks.slice(),
      listGrades: filter => unique(units.filter(unit => !filter || !filter.subject || unit.subject === filter.subject).map(unit => unit.grade)).sort(orderNumbers),
      listSemesters: filter => unique(units.filter(unit => matches(unit, { ...filter, semester: null, unitIds: null, questionTypes: null })).map(unit => unit.semester)).sort(orderNumbers),
      listSubjects: filter => unique(units.filter(unit => matches(unit, { ...filter, questionTypes: null, unitIds: null })).map(unit => unit.subject)),
      listUnits: filter => units.filter(unit => matches({ ...unit, unitId: unit.id }, { ...filter, questionTypes: null }))
        .map(unit => ({ ...unit }))
        .sort((a,b)=>(a.order ?? Number(a.id.replace('unit-','')))-(b.order ?? Number(b.id.replace('unit-','')))),
      questions: filter => questions.filter(item => matches(item, filter) && item.reviewStatus === 'approved').map(item => ({ ...item, options: item.options.slice() })),
      round(filter, count = 10, random = Math.random) {
        if (!Number.isInteger(count) || count < 1) throw new Error('题量必须为正整数');
        const bank = this.questions(filter);
        if (bank.length < count) throw new Error(`题目不足：当前范围只有${bank.length}道审核题，需要${count}道`);
        for (let i = 0; i < count; i++) {
          const j = i + Math.floor(random() * (bank.length - i));
          [bank[i], bank[j]] = [bank[j], bank[i]];
        }
        return bank.slice(0, count).map(question => {
          const indices = question.options.map((_,index) => index);
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [indices[i],indices[j]] = [indices[j],indices[i]];
          }
          return {...question, options: indices.map(index => question.options[index]), answerIndex: indices.indexOf(question.answerIndex)};
        });
      }
    };
  }

  const api = { SUBJECTS, TYPES, validatePack, createRegistry };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ContentRegistry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
