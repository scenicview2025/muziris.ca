/* MUZIRIS public enquiries. No Firebase credentials or direct database access in the browser. */
(() => {
  const script = document.currentScript;
  const api = script?.dataset.api || 'https://muziris-api.onrender.com';
  const consentText = 'I agree that MUZIRIS may contact me about this enquiry.';
  const chatConsent = consentText + ' I also agree to share this conversation with the team.';
  const fields = ['name','company','email','phone','product','quantity','destination','timing','message'];
  const ready = () => {
    const byId = id => document.getElementById(id);
    function status(parent) {
      const el = document.createElement('p');
      el.className = 'm-enquiry-status'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
      parent.append(el); return el;
    }
    function addConsent(form, text) {
      const label = document.createElement('label'); label.className = 'm-enquiry-consent';
      const check = document.createElement('input'); check.type = 'checkbox'; check.required = true;
      check.name = 'enquiry-consent';
      const span = document.createElement('span'); span.textContent = text;
      label.append(check, span); form.append(label);
      const trap = document.createElement('input'); trap.type = 'text'; trap.name = 'website';
      trap.tabIndex = -1; trap.autocomplete = 'off'; trap.setAttribute('aria-hidden','true');
      trap.className = 'm-enquiry-trap'; form.append(trap);
      return {check, trap};
    }
    function createSubmitter() {
      let lastPayload, submissionId;
      return async payload => {
        const serialized = JSON.stringify(payload);
        // Keep the same key after an ambiguous timeout or retry, and change it only when details change.
        if (serialized !== lastPayload) {
          const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
          const storageKey = 'muziris-enquiry-' + Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2,'0')).join('');
          try {
            submissionId = sessionStorage.getItem(storageKey) || crypto.randomUUID();
            sessionStorage.setItem(storageKey, submissionId);
          } catch { submissionId = crypto.randomUUID(); }
          lastPayload = serialized;
        }
        const response = await fetch(api + '/api/contact', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({...payload, submissionId}), signal: AbortSignal.timeout(45000)
        });
        const result = await response.json();
        if (!response.ok || result.success !== true || result.saved !== true || !result.reference) {
          throw new Error(response.status < 500 && result.error ? result.error :
            'We could not confirm your enquiry was saved. Please retry with the same details.');
        }
        return result;
      };
    }
    function wireForm(prefix, source) {
      const form = byId(prefix === 'contact' ? 'contact-form' : 'quote-form');
      if (!form) return;
      const submit = form.querySelector('button[type="submit"]');
      const {check, trap} = addConsent(form, consentText);
      form.insertBefore(check.parentElement, submit);
      const note = status(form);
      const send = createSubmitter();
      const max = {name:160, company:180, email:254, phone:64, message:5000};
      for (const [key, length] of Object.entries(max)) {
        const input = byId(prefix + '-' + key); if (input) input.maxLength = length;
      }
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (submit.disabled || !form.reportValidity()) return;
        const value = key => byId(prefix + '-' + key)?.value.trim() || '';
        const payload = Object.fromEntries(['name','company','phone','email','message'].map(key => [key,value(key)]));
        Object.assign(payload, {source, sourcePage: location.pathname, consent:check.checked, website:trap.value});
        if (source === 'products') payload.product = value('product');
        const original = submit.innerHTML; submit.disabled = true; submit.textContent = 'SAVING ENQUIRY…';
        note.textContent = 'Saving your enquiry…';
        // Freeze submitted values so response/reset cannot discard edits made during the request.
        const controls = [...form.querySelectorAll('input,textarea')];
        controls.forEach(el => el.readOnly = true); check.disabled = true;
        try {
          const result = await send(payload);
          note.textContent = 'Your enquiry has been saved. Reference: ' + result.reference;
          // Keep details visible until the visitor chooses to edit or close; avoid accidental duplicate resubmission.
          submit.textContent = 'ENQUIRY SAVED';
          form.dataset.saved = 'true';
          form.addEventListener('input', () => {
            if (form.dataset.saved === 'true') {
              delete form.dataset.saved; submit.disabled = false; submit.innerHTML = original; note.textContent = '';
            }
          }, {once:true});
        } catch (error) {
          note.textContent = error.name === 'TimeoutError' || error instanceof TypeError
            ? 'We could not confirm your enquiry was saved. Your details are still here. Retry with the same details to avoid a duplicate.'
            : error.message;
          submit.disabled = false; submit.innerHTML = original;
        } finally {
          controls.forEach(el => el.readOnly = false); check.disabled = false;
        }
      });
    }
    wireForm('contact', 'homepage'); wireForm('quote', 'products');
    const win = byId('ai-chat-window');
    if (!win) return;
    const toggle = () => {
      const opening = win.classList.contains('hidden');
      win.classList.toggle('hidden'); win.classList.toggle('flex');
      byId('ai-chat-toggle').setAttribute('aria-expanded', String(opening));
      if (opening) (review.hidden ? byId('ai-chat-input') : review.querySelector('input')).focus();
    };
    byId('ai-chat-toggle').setAttribute('aria-label','Open sourcing assistant');
    byId('ai-chat-close').setAttribute('aria-label','Close sourcing assistant');
    byId('ai-chat-toggle').addEventListener('click', toggle);
    byId('ai-chat-close').addEventListener('click', toggle);
    const messages = byId('ai-chat-messages');
    messages.setAttribute('aria-live','polite');
    const input = byId('ai-chat-input'); input.maxLength = 4000; input.setAttribute('aria-label','Message to sourcing assistant');
    const sendButton = byId('ai-chat-send'); sendButton.setAttribute('aria-label','Send message');
    const inputRow = input.parentElement;
    const reviewButton = document.createElement('button');
    reviewButton.type = 'button'; reviewButton.className = 'm-enquiry-review'; reviewButton.textContent = 'Review enquiry';
    const helper = document.createElement('p'); helper.className = 'm-enquiry-help';
    helper.textContent = 'For a quote or follow-up, review your details and agree to share them with our team.';
    inputRow.insertAdjacentElement('afterend',reviewButton); reviewButton.insertAdjacentElement('afterend',helper);
    const review = document.createElement('form'); review.className = 'm-enquiry-form'; review.hidden = true;
    const heading = document.createElement('h3'); heading.textContent = 'Review your enquiry';
    const introduction = document.createElement('p');
    introduction.textContent = 'Check the draft details below. Nothing is submitted until you agree and choose Send enquiry.';
    review.append(heading, introduction);
    const labels = {name:'Your name *',company:'Company',email:'Email',phone:'Phone',product:'Product / specifications',
      quantity:'Quantity',destination:'Delivery destination',timing:'Desired timing',message:'What do you need? *'};
    const inputs = {};
    for (const key of fields) {
      const label = document.createElement('label'); label.textContent = labels[key];
      const el = document.createElement(key === 'message' ? 'textarea' : 'input');
      if (key !== 'message') el.type = key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text';
      el.name = key; el.id = 'chat-enquiry-' + key;
      el.maxLength = ({name:160,company:180,email:254,phone:64,message:5000,quantity:160,timing:200})[key] || 300;
      el.required = key === 'name' || key === 'message';
      if (['name','company','email','phone'].includes(key)) el.autocomplete = {name:'name',company:'organization',email:'email',phone:'tel'}[key];
      el.addEventListener('input', () => { el.dataset.edited = 'true'; });
      label.append(el); review.append(label); inputs[key] = el;
    }
    const contactHint = document.createElement('p'); contactHint.textContent = 'Please provide an email address or phone number for follow-up.';
    review.append(contactHint);
    const consent = addConsent(review, chatConsent);
    const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = 'Send enquiry';
    const back = document.createElement('button'); back.type = 'button'; back.textContent = 'Back to chat';
    back.className = 'm-enquiry-back';
    review.append(submit, back); const note = status(review); win.append(review);
    let history = [], draft = {}, busy = false;
    const showReview = show => {
      review.hidden = !show; messages.hidden = show; messages.style.display = show ? 'none' : '';
      inputRow.style.display = show ? 'none' : ''; reviewButton.hidden = show; helper.hidden = show;
    };
    reviewButton.addEventListener('click', () => {
      for (const key of fields) if (!inputs[key].dataset.edited && draft[key]) inputs[key].value = draft[key];
      showReview(true); inputs.name.focus();
    });
    back.addEventListener('click', () => {showReview(false); input.focus();});
    const addMessage = (text, isUser) => {
      const el = document.createElement('div');
      el.className = 'm-enquiry-message ' + (isUser ? 'm-enquiry-user' : '');
      el.textContent = text; messages.append(el); messages.scrollTop = messages.scrollHeight;
    };
    const handleSend = async () => {
      const text = input.value.trim(); if (!text || busy) return;
      busy = true; input.disabled = true; sendButton.disabled = true; reviewButton.disabled = true;
      input.value = ''; addMessage(text, true);
      const waiting = document.createElement('div'); waiting.className = 'm-enquiry-help';
      waiting.textContent = 'Thinking…'; messages.append(waiting);
      try {
        const response = await fetch(api + '/api/public-web-chat', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({message:text, chatHistory:history.slice(-20)}),
          signal:AbortSignal.timeout(60000)
        });
        const data = await response.json();
        if (!response.ok || data.success !== true || typeof data.reply !== 'string') throw new Error('Chat unavailable');
        addMessage(data.reply, false);
        history.push({role:'user',parts:[{text}]},{role:'model',parts:[{text:data.reply}]});
        history = history.slice(-20);
        if (data.draft && typeof data.draft === 'object') {
          for (const key of fields) if (typeof data.draft[key] === 'string' && data.draft[key].trim()) draft[key] = data.draft[key];
        }
      } catch {
        addMessage('The assistant is temporarily unavailable. Use Review enquiry to send your requirements to our team.', false);
        if (!inputs.message.dataset.edited) draft.message = [draft.message, text].filter(Boolean).join('\n').slice(0,5000);
      } finally {
        waiting.remove(); busy = false; input.disabled = false; sendButton.disabled = false; reviewButton.disabled = false;
        if (!win.classList.contains('hidden')) input.focus();
      }
    };
    sendButton.addEventListener('click', handleSend);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.isComposing) {event.preventDefault(); handleSend();}
    });
    const sendEnquiry = createSubmitter();
    review.addEventListener('submit', async event => {
      event.preventDefault();
      if (submit.disabled || !review.reportValidity()) return;
      if (!inputs.email.value.trim() && !inputs.phone.value.trim()) {
        note.textContent = 'Enter an email address or phone number for follow-up.'; inputs.email.focus(); return;
      }
      const payload = Object.fromEntries(fields.map(key => [key,inputs[key].value.trim()]));
      Object.assign(payload, {source:'chat', sourcePage:location.pathname, consent:consent.check.checked, website:consent.trap.value,
        transcript:history.map(turn => ({role:turn.role,text:turn.parts[0].text}))});
      submit.disabled = true; back.disabled = true; note.textContent = 'Saving your enquiry…';
      Object.values(inputs).forEach(el => el.readOnly = true); consent.check.disabled = true;
      try {
        const result = await sendEnquiry(payload);
        note.textContent = 'Your enquiry has been saved. Reference: ' + result.reference;
        submit.textContent = 'Enquiry saved';
        addMessage('Your enquiry has been saved for our team. Reference: ' + result.reference, false);
        review.addEventListener('input', () => {submit.disabled = false; submit.textContent = 'Send enquiry'; note.textContent = '';}, {once:true});
      } catch (error) {
        note.textContent = error.name === 'TimeoutError' || error instanceof TypeError
          ? 'We could not confirm your enquiry was saved. Your details are still here; please retry with the same details.' : error.message;
        submit.disabled = false;
      } finally {
        back.disabled = false; Object.values(inputs).forEach(el => el.readOnly = false); consent.check.disabled = false;
      }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();

