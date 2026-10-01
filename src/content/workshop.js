(function(root) {
  'use strict';
  const registry = typeof module !== 'undefined' && module.exports ? require('./registry.js') : root.ContentRegistry;
  const KEY = 'learning-challenge.content-archive.v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const scopeKey = u => `${u.subject}:${u.grade}:${u.semester}:${u.id}`;
  function validate(pack) {
    if (!pack || !Array.isArray(pack.questions) || !pack.questions.length || pack.questions.length > 1000) throw new Error('内容包需要1—1000道题');
    const check = registry.validatePack({...pack, questions:pack.questions.map(q => q && ({...q, reviewStatus:'approved'}))});
    if (!check.valid) throw new Error(check.errors[0]);
    if (!pack.packId.trim() || !pack.contentVersion.trim()) throw new Error('包ID与版本不能为空');
    for (const unit of pack.units) {
      if (unit.grade < 1 || unit.grade > 6 || typeof unit.title !== 'string' || !unit.title.trim()) throw new Error('请填写小学年级和单元标题');
    }
    for (const q of pack.questions) {
      if (!['draft','approved'].includes(q.reviewStatus)) throw new Error('审核状态无效');
      if (typeof q.learningGoal !== 'string' || !q.learningGoal.trim()) throw new Error('题目缺少学习要求');
      if (!/^\d+(?:[-—]\d+)?$/.test(String(q.source.page)) || Number(String(q.source.page).split(/[-—]/)[0]) < 1 || (q.source.pdfPage !== undefined && (!Number.isInteger(q.source.pdfPage) || q.source.pdfPage < 1))) throw new Error('教材页码和PDF页码必须为正整数（教材页可为范围）');
      if (q.reviewStatus === 'approved' && q.source.pdfPage === undefined) throw new Error('审核前请补充PDF页码');
      const pages = String(q.source.page).split(/[-—]/).map(Number);
      if (pages.length === 2 && pages[1] < pages[0]) throw new Error('教材页码范围倒置');
    }
    return pack;
  }
  function parse(text) {
    if (new TextEncoder().encode(text).length > 2 * 1024 * 1024) throw new Error('文件超过2 MiB，请拆分内容包');
    let pack;
    try { pack = JSON.parse(text); } catch { throw new Error('文件不是有效的JSON内容包'); }
    // Files are always untrusted drafts, even when exported as approved elsewhere.
    if (Array.isArray(pack?.questions)) pack.questions = pack.questions.map(q => q && ({...q, reviewStatus:'draft'}));
    return validate(pack);
  }
  function edit(pack, index, changes) {
    const next = clone(pack);
    if (!next.questions[index]) throw new Error('题目不存在');
    const q = next.questions[index];
    for (const key of ['prompt','options','answerIndex','explanation','learningGoal','source']) if (key in changes) q[key] = clone(changes[key]);
    q.reviewStatus = 'draft';
    return validate(next);
  }
  function approve(pack, index) {
    const next = clone(validate(pack));
    if (!next.questions[index]) throw new Error('题目不存在');
    next.questions[index].reviewStatus = 'approved';
    return validate(next);
  }
  function install(archive, pack, builtins) {
    validate(pack);
    if (pack.questions.some(q => q.reviewStatus !== 'approved')) throw new Error('请先逐题审核全部题目');
    if (builtins.some(p => p.packId === pack.packId)) throw new Error('内置包只读，请使用新的包ID和单元ID');
    if (archive.some(p => p.packId === pack.packId && p.contentVersion === pack.contentVersion)) throw new Error('这个版本已保存，更新时请填写新版本号');
    const others = [...builtins, ...archive.filter(p => p.packId !== pack.packId)];
    const ids = new Set(others.flatMap(p => p.questions.map(q => q.id)));
    const scopes = new Set(others.flatMap(p => p.units.map(scopeKey)));
    if (pack.questions.some(q => ids.has(q.id))) throw new Error('题目ID与其他内容包重复');
    if (pack.units.some(u => scopes.has(scopeKey(u)))) throw new Error('单元已存在，请使用独立单元ID');
    return [...archive, clone(pack)];
  }
  function active(archive) {
    const current = new Map();
    for (const p of archive) current.set(p.packId,p);
    return [...current.values()];
  }
  function load(getStorage, builtins) {
    let raw;
    try {
      raw = getStorage().getItem(KEY);
      if (raw === null) return {archive:[], packs:[], notice:''};
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('档案结构错误');
      let archive = [];
      for (const p of parsed) archive = install(archive,p,builtins);
      return {archive, packs:active(archive), notice:''};
    } catch { return {archive:[], packs:[], damagedRaw:raw, notice:'本地题库无法读取，当前使用内置题库。请到内容管理重新导入备份。'}; }
  }
  function save(getStorage, archive) {
    try { getStorage().setItem(KEY,JSON.stringify(archive)); }
    catch { throw new Error('保存失败，原有题库未被替换。请导出备份，检查浏览器存储空间或权限。'); }
  }
  function commit(getStorage, pack, builtins) {
    const current=load(getStorage,builtins);
    if(current.notice && typeof current.damagedRaw !== 'string') throw new Error('无法访问浏览器存储，请恢复存储权限后重试。');
    const archive=install(current.archive,pack,builtins);
    if(typeof current.damagedRaw === 'string') {
      try { getStorage().setItem(KEY+'.recovery',current.damagedRaw); }
      catch { throw new Error('异常题库无法备份，已取消保存，原有数据没有改变。'); }
    }
    save(getStorage,archive);
    return archive;
  }
  const api = {KEY,validate,parse,edit,approve,install,active,load,save,commit};
  if(typeof module !== 'undefined' && module.exports) module.exports=api; else root.ContentWorkshop=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
