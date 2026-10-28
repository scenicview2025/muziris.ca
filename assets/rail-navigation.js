'use strict';
(()=>{
 const menu=document.getElementById('rail-menu'),buttons=[document.getElementById('rail-menu-toggle'),document.getElementById('rail-mobile-toggle')];let opener;
 function open(event){opener=event.currentTarget;menu.showModal();buttons.forEach(button=>button.setAttribute('aria-expanded','true'));document.querySelector('#rail-menu-links a').focus();}
 buttons.forEach(button=>button.addEventListener('click',open));
 document.getElementById('rail-menu-close').addEventListener('click',()=>menu.close());
 menu.addEventListener('close',()=>{buttons.forEach(button=>button.setAttribute('aria-expanded','false'));if(opener?.isConnected)opener.focus();});
 menu.addEventListener('click',event=>{if(event.target===menu)menu.close();});
 menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>menu.close()));
 document.getElementById('rail-request-sourcing').addEventListener('click',()=>{const origin=opener;menu.close();setTimeout(()=>window.MuzirisSourcing.open('',origin),0);});
 function active(){const home=location.pathname.endsWith('/index.html')||location.pathname.endsWith('/'),hash=location.hash;const current=!home?'products':hash==='#sourcing'?'sourcing':hash==='#logistics'?'logistics':hash==='#contact'?'contact':hash==='#services'?'services':'home';for(const link of document.querySelectorAll('[data-rail-section]')){const selected=link.dataset.railSection===current||(link.dataset.railSection==='services'&&['sourcing','logistics'].includes(current));if(selected)link.setAttribute('aria-current',current==='products'?'page':'location');else link.removeAttribute('aria-current');}}
 active();addEventListener('hashchange',active);
 matchMedia('(max-width:900px)').addEventListener('change',()=>{if(menu.open)menu.close();});
})();
