'use strict';
(()=>{
 const dialog=document.getElementById('sourcing-dialog'),sourceForm=document.getElementById('custom-source-form');let trigger;
 const value=id=>document.getElementById(id)?.value.trim()||'';
 const originalButtons=new WeakMap();
 function reset(form){delete form.dataset.received;const button=form.querySelector('[type="submit"]');button.disabled=false;if(originalButtons.has(button))button.innerHTML=originalButtons.get(button);const status=form.id==='custom-source-form'?document.getElementById('source-preview'):form.querySelector('.enquiry-status');if(status)status.hidden=true;}
 function open(prefill='',origin=document.activeElement){trigger=origin;sourceForm.reset();reset(sourceForm);document.getElementById('source-product').value=prefill;dialog.showModal();document.getElementById('source-product').focus();}
 window.MuzirisSourcing={open};
 document.querySelectorAll('[data-open-sourcing]').forEach(button=>button.addEventListener('click',event=>open('',event.currentTarget)));
 document.getElementById('sourcing-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{if(trigger?.isConnected)trigger.focus();});
 function payload(form){
  if(form.id==='custom-source-form')return{name:value('source-name'),company:value('source-company'),phone:value('source-phone'),email:value('source-email'),message:['[Custom sourcing request]','Product: '+value('source-product'),'Quantity: '+(value('source-quantity')||'Not specified'),'Canadian delivery location: '+(value('source-location')||'Not specified'),'Reference: '+(value('source-reference')||'Not provided'),'Requirements: '+(value('source-details')||'Not specified')].join('\n')};
  const prefix=form.id==='quote-form'?'quote':'contact';return{name:value(prefix+'-name'),company:value(prefix+'-company'),phone:value(prefix+'-phone'),email:value(prefix+'-email'),message:prefix==='contact'?value('contact-message'):['[Product Request: '+(value('quote-product')||'Custom sourcing enquiry')+']','Quantity: '+(value('quote-quantity')||'Not specified'),'Canadian delivery location: '+(value('quote-destination')||'Not specified'),'Reference: '+(value('quote-reference')||'Not provided'),value('quote-message')].join('\n')};
 }
 document.addEventListener('submit',async event=>{
  const form=event.target;if(!(form instanceof HTMLFormElement)||!['custom-source-form','contact-form','quote-form'].includes(form.id))return;
  event.preventDefault();event.stopImmediatePropagation();if(form.dataset.received==='true'||!form.reportValidity())return;
  const button=form.querySelector('[type="submit"]');if(button.disabled)return;if(!originalButtons.has(button))originalButtons.set(button,button.innerHTML);
  let status=form.id==='custom-source-form'?document.getElementById('source-preview'):form.querySelector('.enquiry-status');if(!status){status=document.createElement('p');status.className='enquiry-status';form.append(status);}status.hidden=false;status.setAttribute('role','status');status.textContent='Sending your enquiry…';button.disabled=true;button.textContent='Sending…';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{const response=await fetch('https://muziris-api.onrender.com/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload(form)),signal:controller.signal});const body=await response.json();if(!response.ok||body.success!==true)throw Error('Enquiry not acknowledged');form.dataset.received='true';status.textContent='Your enquiry has been received. Our team will review your requirements.';button.textContent='Enquiry received';}
  catch{status.setAttribute('role','alert');status.textContent='We could not confirm your submission. Your details have been kept; please try again.';button.disabled=false;button.innerHTML=originalButtons.get(button);}
  finally{clearTimeout(timer);status.tabIndex=-1;status.scrollIntoView({block:'nearest',behavior:'instant'});status.focus({preventScroll:true});}
 },true);
 document.addEventListener('input',event=>{const form=event.target.closest('form');if(form?.dataset.received==='true')reset(form);});
})();
