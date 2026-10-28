'use strict';
(() => {
 const $ = id => document.getElementById(id);
 const input=$('catalogue-search'), grid=$('category-grid'), panel=$('search-results'), status=$('result-status');
 const clear=$('search-clear'), empty=$('empty-state'), suggestions=$('category-suggestions'), results=$('product-results');
 let data={categories:[],entries:[]}, timer, trigger;
 const arrow=()=>{const el=document.createElement('span');el.textContent='→';el.setAttribute('aria-hidden','true');return el;};
 function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
 function link(text,href,className){const a=el('a',className,text);a.href=safeHref(href);return a;}
 function safeHref(href){const u=new URL(href,location.href);if(u.origin!==location.origin||!/(?:products|paper-packaging|wooden-shipping)\.html$/.test(u.pathname))throw new Error('Invalid catalogue link');return u.pathname.split('/').pop()+u.search+u.hash;}
 function imageUrl(url){if(!url.startsWith('https://res.cloudinary.com/dh6lyhlki/image/upload/'))throw new Error('Invalid catalogue image');return url.replace('/image/upload/','/image/upload/f_auto,q_auto,w_540,c_limit/');}
 function openSourcing(prefill,source){window.MuzirisSourcing.open(prefill,source);}
 $('empty-sourcing').addEventListener('click',event=>openSourcing(input.value.trim(),event.currentTarget));
 function buildCategories(){
  grid.replaceChildren();
  data.categories.forEach((category,index)=>{
   const card=el('article','category-card');card.dataset.categoryId=category.id;
   const artLink=link('',category.href,'category-art-link');artLink.setAttribute('aria-label','Explore '+category.title);
   const art=el('div','category-art'+(category.images.length===1?' has-one':category.images.length===2?' has-two':''));
   category.images.slice(0,3).forEach((image,i)=>{const img=el('img');img.src=imageUrl(image.url);img.alt=i===0?(image.alt||category.title):'';img.loading=index<3?'eager':'lazy';img.decoding='async';img.width=540;img.height=405;art.append(img);});
   artLink.append(art);card.append(artLink);
   const body=el('div','card-content');body.append(el('p','card-eyebrow',category.eyebrow||'Sourcing category'));
   const h=el('h3');h.append(link(category.title,category.href));body.append(h,el('p','card-description',category.description));
   const sub=el('div','subcategory-links');sub.setAttribute('aria-label',category.title+' subcategories');
   category.subcategories.slice(0,3).forEach(item=>sub.append(link(item.label,item.href)));body.append(sub);
   const explore=link('Explore category',category.href,'explore-link');explore.append(arrow());body.append(explore);card.append(body);grid.append(card);
  });
  const custom=el('article','sourcing-card');const mark=el('span','sourcing-mark','↗');mark.setAttribute('aria-hidden','true');
  custom.append(mark,el('p','eyebrow','YOUR NEXT SOURCING REQUEST'),el('h3','', 'Something else in mind?'),el('p','', 'Tell us about the product you need. We’ll review the specification and supplier options with you.'));
  const button=el('button','light-button','Request custom sourcing');button.type='button';button.append(arrow());button.addEventListener('click',event=>openSourcing('',event.currentTarget));custom.append(button);grid.append(custom);
 }
 function normalize(value){return String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/\bpaper\s+board\b/g,'paperboard').replace(/[^a-z0-9]+/g,' ').trim();}
 function stem(word){return ({boxes:'box',cases:'case',indices:'index',mailing:'mailer',mailers:'mailer'})[word]||(word.length>3&&!word.endsWith('ss')?word.replace(/s$/,''):word);}
 function tokens(value){return normalize(value).split(/\s+/).filter(Boolean).map(stem);}
 function matches(value,terms){const words=tokens(value);return terms.every(term=>words.some(word=>word.includes(term)));}
 function runSearch(){
  const query=input.value.trim(),terms=tokens(query);clear.hidden=!query;
  if(!query){grid.hidden=false;panel.hidden=true;empty.hidden=true;status.textContent=data.categories.length+' categories · explore a range or search a product type';$('browse-heading').textContent='Browse by category';return;}
  const cats=data.categories.filter(c=>matches([c.title,c.description,...(c.keywords||[]),...c.subcategories.map(s=>s.label)].join(' '),terms));
  const entries=data.entries.filter(p=>matches([p.name,p.subcategory,...(p.keywords||[])].join(' '),terms));
  grid.hidden=true;empty.hidden=cats.length>0||entries.length>0;panel.hidden=!empty.hidden;
  $('browse-heading').textContent='Search the catalogue';
  status.textContent=entries.length?(entries.length+' matching '+(entries.length===1?'entry':'entries')+' for “'+query+'”'):cats.length?(cats.length+' matching '+(cats.length===1?'category':'categories')+' for “'+query+'”'):'No listed matches for “'+query+'”';
  suggestions.replaceChildren();results.replaceChildren();
  if(cats.length){suggestions.append(el('span','','Explore a category:'));cats.forEach(c=>suggestions.append(link(c.title,c.href)));}
  for(const item of entries){
   const category=data.categories.find(c=>c.id===item.categoryId);
   const row=link('',item.href,'search-result'),text=el('div');text.append(el('p','result-name',item.name),el('p','result-breadcrumb',(category?.title||'Catalogue')+(item.subcategory?' / '+item.subcategory:'')));
   const right=el('div','result-right');if(item.kind)right.append(el('span','result-kind',item.kind));right.append(arrow());row.append(text,right);results.append(row);
  }
 }
 function clearSearch(){clearTimeout(timer);input.value='';runSearch();input.focus();}
 clear.addEventListener('click',clearSearch);$('empty-clear').addEventListener('click',clearSearch);
 input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(runSearch,120);});
 input.addEventListener('keydown',event=>{if(event.key==='Escape'&&input.value){event.preventDefault();clearSearch();}});
 document.querySelectorAll('[data-query]').forEach(button=>button.addEventListener('click',()=>{input.value=button.dataset.query;runSearch();input.focus();}));
 fetch('assets/catalogue-data.json').then(response=>{if(!response.ok)throw new Error('Catalogue unavailable');return response.json();}).then(value=>{
  if(!Array.isArray(value.categories)||!Array.isArray(value.entries))throw new Error('Invalid catalogue');
  data=value;buildCategories();const initial=new URLSearchParams(location.search).get('q');if(initial)input.value=initial.slice(0,120);runSearch();
 }).catch(()=>{status.textContent='Catalogue could not load';grid.append(el('p','load-error','The catalogue could not load. You can still use Request sourcing to prepare a draft request.'));});
})();

