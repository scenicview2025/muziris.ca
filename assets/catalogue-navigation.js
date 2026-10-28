'use strict';
(() => {
 async function initialize() {
  let data;
  try { const response=await fetch('assets/catalogue-data.json');if(!response.ok)return;data=await response.json(); } catch { return; }
  const names=new Map(data.entries.map(item=>[item.name.replace(/\s+/g,' ').trim(),item]));
  let scrolled=false;
  function assign() {
   for(const card of document.querySelectorAll('#catalog-renderer article')) {
    const name=card.querySelector('h3')?.textContent.replace(/\s+/g,' ').trim();
    const item=names.get(name);
    if(item){card.id='product-'+item.id;card.style.scrollMarginTop='96px';}
   }
   let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
   if(!scrolled&&/^(product-|catalog-category-)/.test(id)) {
    const target=document.getElementById(id);
    if(target){target.scrollIntoView({block:'start',behavior:'instant'});target.tabIndex=-1;target.focus({preventScroll:true});scrolled=true;}
   }
  }
  addEventListener('hashchange',()=>{scrolled=false;assign();});
  assign();
  new MutationObserver(assign).observe(document.getElementById('catalog-renderer')||document.body,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
