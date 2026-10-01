(function(root){
  'use strict';
  const KEY='learning-challenge.knowledge.v1', MAX_BYTES=2*1024*1024;
  const copy=x=>JSON.parse(JSON.stringify(x));
  const string=(value,max=30000)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
  function validate(items) {
    if(!Array.isArray(items)||items.length>500)throw new Error('知识条目最多500条');
    const ids=new Set();
    for(const item of items){
      if(!item||!string(item.id,150)||ids.has(item.id))throw new Error('知识条目ID无效或重复');
      ids.add(item.id);
      if(!['chinese','math','english'].includes(item.subject)||!Number.isInteger(item.grade)||item.grade<1||item.grade>6||![1,2].includes(item.semester))throw new Error('请选择有效的学科、年级和学期');
      for(const key of ['unit','title','bookTitle','edition'])if(!string(item[key],200))throw new Error('请填写单元、标题、教材名称和版本说明');
      if(!string(item.text)||typeof item.rawText!=='string'||item.rawText.length>30000)throw new Error('请填写校对文字（最多30000字）');
      const s=item.source;
      if(!s||!string(s.fileName,300)||!/^[a-f0-9]{64}$/.test(s.sha256)||!Number.isInteger(s.totalPages)||s.totalPages<1||!Number.isInteger(s.pdfPage)||s.pdfPage<1||s.pdfPage>s.totalPages||!/^\d+$/.test(s.printedPage)||Number(s.printedPage)<1)throw new Error('来源缺失或页码无效；教材页码需手动核对');
      if(!['draft','approved'].includes(item.reviewStatus))throw new Error('知识审核状态无效');
      if(item.reviewStatus==='approved'&&(!string(item.reviewedAt)||Number.isNaN(Date.parse(item.reviewedAt))))throw new Error('审核时间缺失');
    }
    if(new TextEncoder().encode(JSON.stringify(items)).length>MAX_BYTES)throw new Error('知识库超过2 MiB，请分批导出归档');
    return items;
  }
  function edit(item,changes){
    const next=copy(item);
    for(const key of ['subject','grade','semester','unit','title','bookTitle','edition','text'])if(key in changes)next[key]=copy(changes[key]);
    if('printedPage' in changes)next.source.printedPage=changes.printedPage;
    next.reviewStatus='draft';delete next.reviewedAt;validate([next]);return next;
  }
  function approve(item,now=new Date().toISOString()){
    const next={...copy(item),reviewStatus:'approved',reviewedAt:now};validate([next]);return next;
  }
  function pack(items){validate(items);return {schemaVersion:1,kind:'learning-knowledge',items:copy(items)};}
  function parse(text){
    if(new TextEncoder().encode(text).length>MAX_BYTES)throw new Error('文件超过2 MiB');
    let parsed;try{parsed=JSON.parse(text);}catch{throw new Error('知识文件不是有效JSON');}
    if(parsed?.schemaVersion!==1||parsed.kind!=='learning-knowledge'||!Array.isArray(parsed.items))throw new Error('不支持的知识文件格式');
    const items=parsed.items.map(item=>{if(!item)return item;const q={...item,reviewStatus:'draft'};delete q.reviewedAt;return q;});
    return validate(items);
  }
  function merge(existing,incoming){
    const ids=new Set(existing.map(i=>i.id));
    if(incoming.some(i=>ids.has(i.id)))throw new Error('存在相同ID的知识条目，已取消导入；请直接编辑现有条目');
    return validate([...copy(existing),...copy(incoming)]);
  }
  function load(getStorage){
    let raw;
    try{raw=getStorage().getItem(KEY);if(raw===null)return {items:[],notice:''};const p=JSON.parse(raw);if(p?.schemaVersion!==1||p.kind!=='learning-knowledge')throw new Error();return {items:validate(p.items),notice:''};}
    catch{return {items:[],damagedRaw:raw,notice:'知识资料暂时无法读取，原数据保留。可重新导入备份，保存时会先备份异常原数据。'};}
  }
  function save(getStorage,items){
    const value=JSON.stringify(pack(items)),current=load(getStorage);
    if(current.notice&&typeof current.damagedRaw!=='string')throw new Error('无法读取浏览器存储，已取消保存。请先恢复存储权限。');
    try {
      if(current.notice&&typeof current.damagedRaw==='string')getStorage().setItem(KEY+'.recovery',current.damagedRaw);
      getStorage().setItem(KEY,value);
    } catch{throw new Error('知识资料保存失败，原有数据未替换。请导出备份并检查存储空间或权限。');}
  }
  const api={KEY,validate,edit,approve,pack,parse,merge,load,save};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KnowledgeStore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
