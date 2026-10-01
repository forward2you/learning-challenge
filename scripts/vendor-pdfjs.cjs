// Reproducible conversion of the installed self-contained ESM bundles to classic scripts.
// Upstream globals already expose the public APIs. Only module syntax is changed.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=process.argv[2];
if(!source)throw new Error('Provide the installed pdfjs-dist directory');
const target=path.join(__dirname,'../vendor/pdfjs');fs.mkdirSync(target,{recursive:true});
const version=JSON.parse(fs.readFileSync(path.join(source,'package.json'))).version;
if(version!=='5.6.205')throw new Error('This transform is verified only for 5.6.205');
const hashes={};
for(const [input,output] of [['legacy/build/pdf.min.mjs','pdf.js'],['legacy/build/pdf.worker.min.mjs','pdf.worker.js']]) {
 const original=fs.readFileSync(path.join(source,input),'utf8');
 if(!/export\{[^{}]+\};\s*$/.test(original))throw new Error('Unexpected export structure');
 const transformed=original.replace(/export\{[^{}]+\};\s*$/,'').replaceAll('import.meta.url','__pdfModuleURL');
 if(transformed.includes('import.meta'))throw new Error('Unexpected module metadata');
 fs.writeFileSync(path.join(target,output),'// Modified for local classic-script loading; upstream license retained below.\n(function(){const __pdfModuleURL=document.currentScript.src;\n'+transformed+'\n})();\n');
 hashes[input]=crypto.createHash('sha256').update(original).digest('hex');
}
const data={};
for(const [dir,kind] of [['cmaps','cMapUrl'],['standard_fonts','standardFontDataUrl']]) {
 data[kind]={};
 for(const filename of fs.readdirSync(path.join(source,dir))) {
   if(filename.includes('LICENSE')) {fs.copyFileSync(path.join(source,dir,filename),path.join(target,dir+'-'+filename));continue;}
   data[kind][filename]=fs.readFileSync(path.join(source,dir,filename)).toString('base64');
 }
}
fs.writeFileSync(path.join(target,'binary-data.js'),'globalThis.PDFBinaryData='+JSON.stringify(data)+';\n');
fs.copyFileSync(path.join(source,'LICENSE'),path.join(target,'LICENSE'));
fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify({name:'pdfjs-dist',version,sourceHashes:hashes,changes:'Classic-script wrapper, final export removed, import.meta.url captured from currentScript. CMaps and standard fonts base64 bundled.',files:fs.readdirSync(target).filter(f=>f!=='manifest.json').map(file=>({file,bytes:fs.statSync(path.join(target,file)).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(target,file))).digest('hex')}))},null,2)+'\n');
