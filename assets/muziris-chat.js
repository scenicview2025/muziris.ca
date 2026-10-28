'use strict';
// Catalogue chat reuses the deployed chat controller without adding a page-wide CSS framework.
(() => {
    const init = () => {
        if (document.getElementById('ai-chat-toggle')) return;
        document.body.insertAdjacentHTML('beforeend', "<div class=\"muziris-chat\">\n<button id=\"ai-chat-toggle\" class=\"m-chat-toggle\" type=\"button\" aria-label=\"Open MUZIRIS chat\" aria-controls=\"ai-chat-window\" aria-expanded=\"false\">\n <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" aria-hidden=\"true\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z\"/></svg>\n</button>\n<section id=\"ai-chat-window\" class=\"m-chat-window hidden\" aria-label=\"MUZIRIS sourcing assistant\">\n <header class=\"m-chat-header\"><span>MUZIRIS AI EXPERT</span><button id=\"ai-chat-close\" type=\"button\" aria-label=\"Close MUZIRIS chat\">×</button></header>\n <div id=\"ai-chat-messages\" class=\"m-chat-messages\" aria-label=\"Conversation\">\n  <div id=\"ai-chat-welcome\" class=\"m-chat-message\" aria-live=\"polite\" aria-atomic=\"true\">\n   <span id=\"ai-welcome-visual\" aria-hidden=\"true\">Welcome to MUZIRIS! How can I help you today?</span><span id=\"ai-welcome-announcement\" class=\"sr-only\"></span>\n  </div>\n </div>\n <footer class=\"m-chat-footer\">\n  <div class=\"m-chat-input-row\"><input id=\"ai-chat-input\" type=\"text\" autocomplete=\"off\" aria-label=\"Message to MUZIRIS assistant\" placeholder=\"Ask about sourcing or shipping…\"><button id=\"ai-chat-send\" type=\"button\" aria-label=\"Send chat message\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" aria-hidden=\"true\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M14 5l7 7m0 0l-7 7m7-7H3\"/></svg></button></div>\n  <button id=\"ai-chat-enquiry\" class=\"m-chat-enquiry\" type=\"button\">Review enquiry</button>\n </footer>\n</section></div>");
        const RENDER_API_URL = 'https://muziris-api.onrender.com';
        const aiToggleBtn = document.getElementById('ai-chat-toggle');
        const aiCloseBtn = document.getElementById('ai-chat-close');
        const chatWindow = document.getElementById('ai-chat-window');
        const messagesContainer = document.getElementById('ai-chat-messages');
        const inputField = document.getElementById('ai-chat-input');
        const sendChatBtn = document.getElementById('ai-chat-send');

        let chatHistory = [];
        inputField.maxLength = 4000;
        const enquiryDraft = {};

        const welcomeText = 'Welcome to MUZIRIS! How can I help you today?';
        const welcomeMessage = document.getElementById('ai-chat-welcome');
        const welcomeVisual = document.getElementById('ai-welcome-visual');
        const welcomeAnnouncement = document.getElementById('ai-welcome-announcement');
        let welcomeStarted = false;
        let welcomeFinished = false;
        let welcomeTimer;

        const finishWelcome = () => {
            if (welcomeFinished) return;
            welcomeFinished = true;
            clearTimeout(welcomeTimer);
            welcomeVisual.textContent = welcomeText;
            welcomeAnnouncement.textContent = welcomeText;
            welcomeMessage.removeAttribute('aria-busy');
        };

        const startWelcome = () => {
            if (welcomeStarted) return;
            welcomeStarted = true;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                finishWelcome();
                return;
            }
            let characters = 0;
            welcomeVisual.textContent = '';
            welcomeMessage.setAttribute('aria-busy', 'true');
            const typeCharacter = () => {
                welcomeVisual.textContent = welcomeText.slice(0, ++characters);
                if (characters < welcomeText.length) {
                    welcomeTimer = setTimeout(typeCharacter, 24);
                } else {
                    finishWelcome();
                }
            };
            typeCharacter();
        };

        let finishActiveReply = null;
        const finishReplyTyping = () => {
            if (finishActiveReply) finishActiveReply();
        };

        const toggleChat = () => {
            chatWindow.classList.toggle('hidden');
            chatWindow.classList.toggle('flex');
            const isOpen = !chatWindow.classList.contains('hidden');
            aiToggleBtn.setAttribute('aria-expanded', String(isOpen));
            if (isOpen) {
                startWelcome();
                setTimeout(() => inputField.focus(), 100);
            } else if (welcomeStarted) {
                finishWelcome();
                finishReplyTyping();
            }
        };

        // Let a customer start immediately without waiting for the welcome to finish.
        inputField.addEventListener('input', () => {
            if (welcomeStarted) finishWelcome();
            finishReplyTyping();
        });

        aiToggleBtn.addEventListener('click', toggleChat);
        aiCloseBtn.addEventListener('click', toggleChat);

        const addMessageToUI = (text, isUser) => {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'm-chat-message' + (isUser ? ' m-chat-user' : '');
            if (isUser) {
                msgDiv.textContent = text;
            } else {
                finishReplyTyping();
                const visual = document.createElement('span');
                visual.setAttribute('aria-hidden', 'true');
                const announcement = document.createElement('span');
                announcement.className = 'sr-only';
                msgDiv.setAttribute('role', 'status');
                msgDiv.setAttribute('aria-live', 'polite');
                msgDiv.setAttribute('aria-atomic', 'true');
                msgDiv.style.whiteSpace = 'pre-wrap';
                msgDiv.append(visual, announcement);
                const characters = Array.from(text);
                // Keep longer replies moving while using the welcome's typing cadence.
                const step = Math.max(1, Math.ceil(characters.length / 180));
                let position = 0;
                let timer;
                let finished = false;
                const showText = value => {
                    const following = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 64;
                    visual.textContent = value;
                    if (following) messagesContainer.scrollTop = messagesContainer.scrollHeight;
                };
                const finish = () => {
                    if (finished) return;
                    finished = true;
                    clearTimeout(timer);
                    showText(text);
                    announcement.textContent = text;
                    msgDiv.removeAttribute('aria-busy');
                    if (finishActiveReply === finish) finishActiveReply = null;
                };
                const typeCharacters = () => {
                    position = Math.min(characters.length, position + step);
                    showText(characters.slice(0, position).join(''));
                    if (position < characters.length) timer = setTimeout(typeCharacters, 24);
                    else finish();
                };
                messagesContainer.appendChild(msgDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                if (chatWindow.classList.contains('hidden') ||
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    finish();
                } else {
                    finishActiveReply = finish;
                    msgDiv.setAttribute('aria-busy', 'true');
                    typeCharacters();
                }
                return;
            }
            messagesContainer.appendChild(msgDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        const handleSend = async () => {
            const text = inputField.value.trim();
            if (!text || sendChatBtn.disabled) return;
            finishWelcome();
            finishReplyTyping();

            inputField.value = '';
            inputField.disabled = true;
            sendChatBtn.disabled = true;

            addMessageToUI(text, true);

            // Add Loading dots
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'ai-loading';
            loadingDiv.className = 'm-chat-thinking';
            loadingDiv.setAttribute('role', 'status');
            loadingDiv.setAttribute('aria-label', 'Assistant is thinking');
            loadingDiv.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
            messagesContainer.appendChild(loadingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            try {
                const response = await fetch(`${RENDER_API_URL}/api/public-web-chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, chatHistory: chatHistory.slice(-20) }),
                    signal: AbortSignal.timeout(60000)
                });

                const result = await response.json();
                if (!response.ok || result.success !== true ||
                    typeof result.reply !== 'string' || !result.reply.trim()) {
                    throw Object.assign(new Error('Chat service unavailable'), {status: response.status});
                }

                const replyText = result.reply.trim();
                addMessageToUI(replyText, false);
                // Keep drafts in memory; visitors explicitly open, review and submit the existing form.
                if (result.draft && typeof result.draft === 'object') {
                    for (const field of ['name','company','email','phone','message','product','quantity','destination']) {
                        if (typeof result.draft[field] === 'string' && result.draft[field].trim()) {
                            enquiryDraft[field] = result.draft[field].trim();
                        }
                    }
                }
                chatHistory.push({ role: 'user', parts: [{ text }] });
                chatHistory.push({ role: 'model', parts: [{ text: replyText }] });
                chatHistory = chatHistory.slice(-20);
            } catch (error) {
                if (!inputField.value) inputField.value = text;
                addMessageToUI(
                    error.status === 429
                        ? 'Our assistant is busy right now. Please try again later, or use the enquiry form to reach our team.'
                        : error.name === 'TimeoutError'
                            ? 'The assistant is taking longer than expected. Please try again or use the contact form.'
                            : 'The assistant is temporarily unavailable. Please try again or use the contact form.',
                    false
                );
            } finally {
                loadingDiv.remove();
                inputField.disabled = false;
                sendChatBtn.disabled = false;
                inputField.focus();
            }
        };

        sendChatBtn.addEventListener('click', handleSend);
        inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });


        aiCloseBtn.addEventListener('click', () => aiToggleBtn.focus());
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !chatWindow.classList.contains('hidden') &&
                chatWindow.contains(document.activeElement)) {
                toggleChat();
                aiToggleBtn.focus();
            }
        });
        document.getElementById('ai-chat-enquiry').addEventListener('click', event => {
            if (!window.MuzirisSourcing?.open) return;
            finishWelcome();
            finishReplyTyping();
            window.MuzirisSourcing.open(enquiryDraft.product || '', event.currentTarget);
            const targets = {name:'source-name',company:'source-company',email:'source-email',phone:'source-phone',
                product:'source-product',quantity:'source-quantity',destination:'source-location',message:'source-details'};
            for (const [field,id] of Object.entries(targets)) {
                const element = document.getElementById(id);
                if (element && enquiryDraft[field]) {
                    element.value = enquiryDraft[field].slice(0, element.maxLength > 0 ? element.maxLength : 2500);
                }
            }
        });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
