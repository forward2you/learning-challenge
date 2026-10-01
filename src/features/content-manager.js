(function() {
  'use strict';
  window.addEventListener('hashchange',()=>location.reload());
  if(location.hash !== '#content-manager') return;
  document.getElementById('app').hidden=true;
  document.getElementById('content-manager').hidden=false;
  const api = window.ContentWorkshop, builtins = window.ContentCatalog.packs;
  const $ = id => document.getElementById(id);
  let draft = null, index = 0, dirty = false, generation = 0;
  const notify = message => { $('notice').textContent = message; };
  function attempt(action) { try { action(); } catch(error) { notify(error.message); } }
  function download(pack) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(pack,null,2)],{type:'application/json'}));
    const a = document.createElement('a');
    a.href=url; a.download='learning-content.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function listInstalled() {
    const result=api.load(()=>localStorage,builtins);
    $('installed').replaceChildren();
    if (result.notice) notify(result.notice);
    for(const pack of result.archive) {
      const li=document.createElement('li');
      const current=result.packs.includes(pack);
      li.append(document.createTextNode(`${pack.packId} · ${pack.contentVersion} · ${pack.questions.length}题 · ${current?'当前版本':'历史版本'} `));
      const button=document.createElement('button'); button.textContent='导出备份';
      button.addEventListener('click',()=>download(pack));li.append(button);$('installed').append(li);
    }
    if (!result.archive.length) $('installed').textContent='尚无自定义题库，内置390题可以照常练习。';
  }
  for(const pack of builtins) $('builtin-pack').add(new Option(pack.title || pack.packId,pack.packId));
  for(let i=0;i<4;i++) {
    const label=document.createElement('label');label.textContent=`选项${i+1}`;
    const input=document.createElement('input');input.id=`option-${i}`;input.required=true;
    label.append(input);$('options').append(label);
  }
  function render() {
    $('editor').hidden=false;
    $('pack-id').value=draft.packId; $('pack-version').value=draft.contentVersion;
    $('question-list').replaceChildren();
    draft.questions.forEach((q,i)=>$('question-list').add(new Option(`${i+1}. ${q.reviewStatus==='approved'?'已审核':'待审核'} · ${q.prompt.slice(0,45)}`,String(i))));
    $('question-list').value=String(index);
    const q=draft.questions[index], book=draft.books.find(b=>b.id===q.source.bookId);
    $('source-book').textContent=`来源：${book.title || book.id}；核对原教材后再审核。`;
    $('prompt').value=q.prompt; $('explanation').value=q.explanation;
    $('learning-goal').value=q.learningGoal; $('answer-index').value=String(q.answerIndex);
    q.options.forEach((value,i)=>$(`option-${i}`).value=value);
    $('source-page').value=q.source.page; $('pdf-page').value=q.source.pdfPage ?? '';
    const count=draft.questions.filter(q=>q.reviewStatus==='approved').length;
    $('review-progress').textContent=`已审核 ${count} / ${draft.questions.length} 题`;
    $('activate').disabled=count!==draft.questions.length;
    dirty=false;
  }
  function saveEdits() {
    if(!dirty) return;
    if(!$('question-form').reportValidity()) throw new Error('请补全题目内容');
    draft=api.edit(draft,index,{
      prompt:$('prompt').value, options:[0,1,2,3].map(i=>$(`option-${i}`).value),
      answerIndex:Number($('answer-index').value),explanation:$('explanation').value,
      learningGoal:$('learning-goal').value,
      source:{...draft.questions[index].source,page:$('source-page').value,pdfPage:Number($('pdf-page').value)}
    }); dirty=false;
  }
  function version() {
    if(!$('pack-version').value.trim()) throw new Error('请填写内容版本');
    draft.contentVersion=$('pack-version').value.trim();
  }
  $('question-form').addEventListener('input',()=>{dirty=true;$('activate').disabled=true;$('review-progress').textContent='当前题有未保存修改，保存后需要重新审核。';});
  $('question-form').addEventListener('submit',event=>{event.preventDefault();attempt(()=>{saveEdits();version();render();notify('修改已保留在当前页面，请审核或导出备份。');});});
  $('question-list').addEventListener('change',()=>{
    const next=Number($('question-list').value);
    try {saveEdits();version();index=next;render();} catch(error) {$('question-list').value=String(index);notify(error.message);}
  });
  $('approve').addEventListener('click',()=>attempt(()=>{saveEdits();version();draft=api.approve(draft,index);render();notify(`第${index+1}题已审核。请继续选择下一题。`);}));
  $('export-draft').addEventListener('click',()=>attempt(()=>{saveEdits();version();download(draft);render();notify('已生成备份文件；重新导入时需要再次审核。');}));
  $('export-builtin').addEventListener('click',()=>download(builtins.find(p=>p.packId===$('builtin-pack').value)));
  $('activate').addEventListener('click',()=>attempt(()=>{
    saveEdits();version();
    api.commit(()=>localStorage,draft,builtins);listInstalled();render();
    notify('已保存并加入练习。返回学习营地选择对应单元；不足10题的范围仍不可开始。');
  }));
  $('import-file').addEventListener('change',async()=>{
    const file=$('import-file').files[0], token=++generation;
    if(!file) return;
    try {
      if(file.size>2*1024*1024) throw new Error('文件超过2 MiB，请拆分内容包');
      const next=api.parse(await file.text());
      if(token!==generation)return;
      draft=next;index=0;render();notify('导入成功，全部题目均为待审核。修改仅在当前页面保留，请及时导出备份。');
    } catch(error) {if(token===generation)notify(error.message+'；原有内容没有改变。');}
    finally {if(token===generation)$('import-file').value='';}
  });
  listInstalled();
})();
