(function(root){
  'use strict';
  let ready;
  function script(path){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=path;el.onload=resolve;el.onerror=()=>{el.remove();reject(new Error('本地PDF组件无法加载，请检查离线包是否完整'));};document.head.append(el);});}
  async function loadLibrary(){
    if(!ready)ready=(async()=>{
      await script('vendor/pdfjs/pdf.worker.js');await script('vendor/pdfjs/pdf.js');await script('vendor/pdfjs/binary-data.js');
      if(!root.pdfjsLib||!root.pdfjsWorker||!root.PDFBinaryData)throw new Error('当前浏览器不支持PDF预览组件，请使用更新的浏览器');
    })().catch(error=>{ready=null;throw error;});
    return ready;
  }
  class LocalBinaryData {
    async fetch({kind,filename}){
      const data=root.PDFBinaryData[kind]?.[filename];if(!data)throw new Error('所需PDF资源未包含在离线包中');
      return Uint8Array.from(atob(data),c=>c.charCodeAt(0));
    }
  }
  async function open(file){
    if(!file||file.size<5||file.size>100*1024*1024)throw new Error('请选择不超过100 MiB的PDF文件');
    const buffer=await file.arrayBuffer(),bytes=new Uint8Array(buffer);
    if(!new TextDecoder('ascii').decode(bytes.subarray(0,1024)).includes('%PDF-'))throw new Error('文件不是有效PDF');
    if(!root.crypto?.subtle)throw new Error('当前浏览器无法生成来源校验信息，请更换支持本地文件校验的浏览器');
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),b=>b.toString(16).padStart(2,'0')).join('');
    await loadLibrary();
    const loading=root.pdfjsLib.getDocument({data:bytes,isEvalSupported:false,useWasm:false,useWorkerFetch:false,
      isOffscreenCanvasSupported:false,isImageDecoderSupported:false,enableXfa:false,BinaryDataFactory:LocalBinaryData,
      cMapPacked:true,useSystemFonts:false,verbosity:0});
    let doc;
    try{doc=await loading.promise;}catch(error){await loading.destroy();throw new Error(error.name==='PasswordException'?'该PDF需要密码，本轮暂不支持加密教材':'PDF无法读取，文件可能损坏或格式不受支持');}
    return {
      source:{fileName:file.name,sha256:hash,totalPages:doc.numPages},
      async page(number){
        if(!Number.isInteger(number)||number<1||number>doc.numPages)throw new Error(`PDF页码应为1—${doc.numPages}`);
        const page=await doc.getPage(number),text=await page.getTextContent();
        const rawText=text.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('').trim();
        const base=page.getViewport({scale:1}),scale=Math.min(1.5,1400/base.width,Math.sqrt(4000000/(base.width*base.height))),viewport=page.getViewport({scale});
        const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
        await page.render({canvasContext:canvas.getContext('2d'),viewport,annotationMode:root.pdfjsLib.AnnotationMode.DISABLE}).promise;
        page.cleanup();return {canvas,rawText,source:{...this.source,pdfPage:number}};
      },
      close:()=>doc.destroy()
    };
  }
  root.LocalPDFReader={open};
})(globalThis);
