(function(){
  'use strict';
  if(location.hash!=='#content-manager')return;
  const $=id=>document.getElementById(id),api=window.KnowledgeStore;
  const restored=api.load(()=>localStorage);let items=restored.items,reader=null,displayed=null,source=null,rawText='',editing=null,busy=false;
  const message=text=>{$('knowledge-notice').textContent=text;};
  function list(){
    $('knowledge-list').replaceChildren();
    for(const item of items){
      const li=document.createElement('li'),b=document.createElement('button');
      b.textContent=`${item.reviewStatus==='approved'?'已审核':'待审核'} · ${item.title} · 教材第${item.source.printedPage}页`;
      b.addEventListener('click',()=>{if(busy)return;editing=item.id;source={...item.source};rawText=item.rawText;form(item);message('已打开保存的资料。审核前请打开同一教材的对应PDF页。');});li.append(b);$('knowledge-list').append(li);
    }
    if(!items.length)$('knowledge-list').textContent='还没有知识资料。';
  }
  function form(item){
    $('knowledge-form').hidden=false;
    for(const [key,id] of Object.entries({subject:'subject',grade:'grade',semester:'semester',bookTitle:'book',edition:'edition',unit:'unit',title:'title',text:'text'}))$('knowledge-'+id).value=item[key]??'';
    $('knowledge-printed').value=item.source.printedPage??'';
    $('knowledge-raw').value=rawText;
    $('knowledge-source').textContent=`来源：${source.fileName} · PDF第${source.pdfPage}/${source.totalPages}页 · 文件校验 ${source.sha256.slice(0,12)}…`;
    $('pdf-image').hidden=!displayed||displayed.sha256!==source.sha256||displayed.pdfPage!==source.pdfPage;
  }
  function lock(value){busy=value;for(const id of ['pdf-file','pdf-number','pdf-go','pdf-prev','pdf-next','knowledge-approve'])$(id).disabled=value;}
  async function showPage(number){
    lock(true);$('pdf-status').textContent='正在读取这一页…';$('pdf-image').replaceChildren();displayed=null;
    $('knowledge-form').hidden=true;
    try {
      const result=await reader.page(number);displayed=result.source;source={...result.source};rawText=result.rawText;editing=null;
      $('pdf-image').append(result.canvas);$('pdf-number').value=number;
      const previousBook=$('knowledge-book').value,knownSameBook=$('knowledge-source').dataset.hash===source.sha256;
      form({subject:$('knowledge-subject').value,grade:Number($('knowledge-grade').value),semester:Number($('knowledge-semester').value),
        bookTitle:knownSameBook?previousBook:source.fileName.replace(/\.pdf$/i,''),edition:knownSameBook?$('knowledge-edition').value:'',
        unit:knownSameBook?$('knowledge-unit').value:'',title:'',text:rawText,source});
      $('knowledge-source').dataset.hash=source.sha256;
      $('pdf-status').textContent=`共${source.totalPages}页，当前第${number}页。`+(rawText.trim().length<20?'本页可提取文字很少，可能为图片页，请对照原图手工录入。':'已提取文字层；请检查错字、拼音、顺序和遗漏。');
      message('新条目尚未保存。翻页或离开前，请先保存当前校对内容。');
    }catch(error){$('pdf-status').textContent=error.message;message('该页没有导入，已保存的资料保持不变。');}
    finally{lock(false);}
  }
  $('pdf-file').addEventListener('change',async()=>{
    const file=$('pdf-file').files[0];if(!file||busy)return;
    lock(true);$('pdf-status').textContent='正在本地读取文件和核对来源…';
    try{
      const next=await window.LocalPDFReader.open(file);if(reader)await reader.close();reader=next;
      $('pdf-navigation').hidden=false;$('pdf-number').max=reader.source.totalPages;
      await showPage(1);
    }catch(error){$('pdf-status').textContent=error.message;}
    finally{lock(false);$('pdf-file').value='';}
  });
  $('pdf-navigation').addEventListener('submit',event=>{event.preventDefault();if(!busy)showPage(Number($('pdf-number').value));});
  $('pdf-prev').addEventListener('click',()=>{if(!busy&&displayed?.pdfPage>1)showPage(displayed.pdfPage-1);});
  $('pdf-next').addEventListener('click',()=>{if(!busy&&displayed&&displayed.pdfPage<displayed.totalPages)showPage(displayed.pdfPage+1);});
  function current(){
    if(!$('knowledge-form').reportValidity())throw new Error('请补全知识资料与教材页码');
    const item={id:editing||crypto.randomUUID(),subject:$('knowledge-subject').value,grade:Number($('knowledge-grade').value),semester:Number($('knowledge-semester').value),
      bookTitle:$('knowledge-book').value,edition:$('knowledge-edition').value,unit:$('knowledge-unit').value,title:$('knowledge-title').value,text:$('knowledge-text').value,
      rawText,source:{...source,printedPage:$('knowledge-printed').value},reviewStatus:'draft'};
    api.validate([item]);return item;
  }
  function save(review){
    try{
      let item=current();
      if(review){if(!displayed||displayed.sha256!==source.sha256||displayed.pdfPage!==source.pdfPage)throw new Error('请先打开同一教材对应的PDF页，对照原图后再审核');item=api.approve(item);}
      const next=editing?items.map(i=>i.id===editing?item:i):[...items,item];api.save(()=>localStorage,next);items=next;editing=item.id;list();
      message(review?'知识条目已审核并保存；尚未编成练习题。':'已保存为待审核知识资料。');
    }catch(error){message(error.message);}
  }
  $('knowledge-form').addEventListener('submit',event=>{event.preventDefault();if(!busy)save(false);});
  $('knowledge-form').addEventListener('input',()=>message('当前编辑内容尚未保存，再次保存时需重新审核。'));
  $('knowledge-approve').addEventListener('click',()=>{if(!busy)save(true);});
  $('knowledge-export').addEventListener('click',()=>{
    const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(api.pack(items),null,2)],{type:'application/json'}));
    a.href=url;a.download='learning-knowledge.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $('knowledge-import').addEventListener('change',async()=>{
    const file=$('knowledge-import').files[0];if(!file)return;
    try{if(file.size>2*1024*1024)throw new Error('知识文件超过2 MiB');const next=api.merge(items,api.parse(await file.text()));api.save(()=>localStorage,next);items=next;list();message('知识资料已导入并保存，全部导入项需要重新审核。');}
    catch(error){message(error.message+'；原有资料未改变。');}
    finally{$('knowledge-import').value='';}
  });
  list();if(restored.notice)message(restored.notice);
})();
