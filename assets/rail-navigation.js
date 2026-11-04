'use strict';
(() => {
 const menu=document.getElementById('rail-menu');
 const buttons=[document.getElementById('rail-menu-toggle'),document.getElementById('rail-mobile-toggle')].filter(Boolean);
 if(!menu||!buttons.length)return;
 let opener;
 function open(event){
  opener=event.currentTarget;
  menu.showModal();
  buttons.forEach(button=>button.setAttribute('aria-expanded','true'));
  document.querySelector('#rail-menu-links a')?.focus();
 }
 buttons.forEach(button=>button.addEventListener('click',open));
 document.getElementById('rail-menu-close')?.addEventListener('click',()=>menu.close());
 menu.addEventListener('close',()=>{
  buttons.forEach(button=>button.setAttribute('aria-expanded','false'));
  if(opener?.isConnected)opener.focus();
 });
 menu.addEventListener('click',event=>{
  if(event.target===menu||event.target.closest('a[href]'))menu.close();
 });
 document.getElementById('rail-request-sourcing')?.addEventListener('click',()=>{
  const origin=opener;
  menu.close();
  setTimeout(()=>window.MuzirisSourcing.open('',origin),0);
 });
 function active(){
  const home=location.pathname.endsWith('/index.html')||location.pathname.endsWith('/');
  const hash=location.hash;
  const current=!home?'products':hash==='#sourcing'?'sourcing':hash==='#logistics'?'logistics':hash==='#contact'?'contact':hash==='#services'?'services':'home';
  for(const link of document.querySelectorAll('[data-rail-section]')){
   const selected=link.dataset.railSection===current||(link.dataset.railSection==='services'&&['sourcing','logistics'].includes(current));
   if(selected)link.setAttribute('aria-current',current==='products'?'page':'location');
   else link.removeAttribute('aria-current');
  }
  for(const link of menu.querySelectorAll('[data-catalogue-link]')){
   const target=new URL(link.href);
   const selected=target.pathname===location.pathname&&target.hash===location.hash;
   if(selected)link.setAttribute('aria-current',target.hash?'location':'page');
   else link.removeAttribute('aria-current');
  }
 }
 function safeHref(value){
  const url=new URL(value,location.href);
  if(url.origin!==location.origin||!/(?:products|paper-packaging|wooden-shipping)\.html$/.test(url.pathname)||url.search)throw new Error('Invalid category link');
  if(url.hash&&!/^#(?:catalog-category-\d+|product-[a-z0-9-]+)$/.test(url.hash))throw new Error('Invalid subcategory anchor');
  return url.pathname.split('/').pop()+url.hash;
 }
 function makeLink(label,href,className){
  const link=document.createElement('a');
  link.textContent=label;
  link.href=safeHref(href);
  link.className=className;
  link.dataset.catalogueLink='';
  return link;
 }
 async function buildCatalogue(){
  const primary=document.querySelector('#rail-menu-links a[data-rail-section="products"]');
  const fallback=menu.querySelector('.rail-menu-categories');
  if(!primary)return;
  try{
   const response=await fetch('assets/catalogue-data.json',{cache:'no-cache'});
   if(!response.ok)throw new Error('Catalogue unavailable');
   const data=await response.json();
   if(!Array.isArray(data.categories)||!data.categories.length)throw new Error('No categories');
   const tree=document.createElement('div');
   tree.id='rail-catalogue-tree';
   tree.className='rail-catalogue-tree';
   tree.hidden=true;
   tree.setAttribute('role','group');
   tree.setAttribute('aria-label','Catalogue categories and subcategories');
   const ids=new Set();
   for(const category of data.categories){
    if(!/^[a-z][a-z0-9-]*$/.test(category.id)||ids.has(category.id)||typeof category.title!=='string'||!Array.isArray(category.subcategories))throw new Error('Invalid category');
    ids.add(category.id);
    const group=document.createElement('details');
    group.className='rail-category';
    group.dataset.categoryId=category.id;
    const summary=document.createElement('summary');
    summary.textContent=category.title;
    const contents=document.createElement('div');
    contents.className='rail-category-content';
    contents.append(makeLink('View all '+category.title,category.href,'rail-category-overview'));
    const links=document.createElement('div');
    links.className='rail-subcategory-links';
    for(const subcategory of category.subcategories){
     if(typeof subcategory.label!=='string'||!subcategory.label.trim())throw new Error('Invalid subcategory');
     links.append(makeLink(subcategory.label,subcategory.href,'rail-subcategory-link'));
    }
    contents.append(links);
    group.append(summary,contents);
    tree.append(group);
    group.addEventListener('toggle',()=>{
     if(group.open)for(const sibling of tree.querySelectorAll('.rail-category'))if(sibling!==group)sibling.open=false;
    });
   }
   const row=document.createElement('div');
   row.className='rail-catalogue-row';
   const toggle=document.createElement('button');
   toggle.type='button';
   toggle.id='rail-catalogue-toggle';
   toggle.className='rail-catalogue-toggle';
   toggle.setAttribute('aria-expanded','false');
   toggle.setAttribute('aria-controls',tree.id);
   toggle.setAttribute('aria-label','Show catalogue categories');
   toggle.addEventListener('click',()=>{
    const expanded=toggle.getAttribute('aria-expanded')!=='true';
    toggle.setAttribute('aria-expanded',String(expanded));
    toggle.setAttribute('aria-label',expanded?'Hide catalogue categories':'Show catalogue categories');
    tree.hidden=!expanded;
   });
   const restoreCatalogFocus=document.activeElement===primary;
   primary.replaceWith(row);
   row.append(primary,toggle);
   row.after(tree);
   if(restoreCatalogFocus)primary.focus({preventScroll:true});
   if(fallback)fallback.hidden=true;
   active();
  }catch{
   // Keep the original category links available if the catalogue cannot load.
  }
 }
 active();
 addEventListener('hashchange',active);
 matchMedia('(max-width:900px)').addEventListener('change',()=>{if(menu.open)menu.close();});
 buildCatalogue();
})();
