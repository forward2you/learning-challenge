(function(root){
  'use strict';
  const packs = typeof module!=='undefined'&&module.exports
    ? [require('./v1-content.js'),require('./unit-two.js'),require('./chinese-rest.js'),require('./math-rest.js'),require('./english-rest.js')]
    : [root.V1ContentPack,root.UnitTwoPack,root.ChineseRestPack,root.MathRestPack,root.EnglishRestPack];
  const catalog={title:'三年级上册 · 全单元及实践复习精选',contentVersion:'2026.09.20',packs};
  if(typeof module!=='undefined'&&module.exports) module.exports=catalog;
  else root.ContentCatalog=catalog;
})(typeof globalThis!=='undefined'?globalThis:this);
