(function(root){
  'use strict';
  // Authored row: [prompt, four options (source answer first), explanation, book page, goal].
  function create({subject,book,offset,groups}) {
    return {
      schemaVersion:1,packId:`g3s1-${subject}-remaining`,contentVersion:'2026.09.20-a',
      title:`${book.title} · 剩余章节精选`,books:[book],
      units:groups.map(g=>({id:g.id,subject,grade:3,semester:1,label:g.label,title:g.title,order:g.order,sectionKind:g.kind||'unit'})),
      questions:groups.flatMap(g=>g.rows.map(([prompt,options,explanation,page,goal],i)=>({
        id:`${subject}-${g.id}-${String(i+1).padStart(3,'0')}`,subject,grade:3,semester:1,unitId:g.id,type:'single-choice',
        prompt,options,answerIndex:0,explanation,learningGoal:goal||g.title,
        source:{bookId:book.id,page:String(page),pdfPage:page+offset,section:g.label+' · '+g.title},reviewStatus:'approved'
      })))
    };
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={create};else root.PackFactory={create};
})(typeof globalThis!=='undefined'?globalThis:this);
