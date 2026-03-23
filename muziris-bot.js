// ==========================================
// ELITE MUZIRIS AI CONCIERGE WIDGET (v3.0 - Node.js Powered)
// ==========================================

// 🟢 CHANGED: Now points directly to your elite Render server!
const MUZIRIS_API_URL = "https://muziris-api.onrender.com/api/public-web-chat";

// 1. INJECT HIGH-END UI & CSS
const botHTML = `
<style>
  #muziris-ai-btn { position: fixed; bottom: 20px; right: 20px; background: linear-gradient(135deg, #D4AF37 0%, #b89225 100%); width: 60px; height: 60px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.5); z-index: 9998; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 2px solid #000; }
  #muziris-ai-btn:hover { transform: scale(1.1); }
  #muziris-ai-btn svg { fill: #000; width: 30px; height: 30px; }
  
  #muziris-chat-window { position: fixed; bottom: 90px; right: 20px; width: 350px; height: 500px; background: #151922; border: 1px solid #D4AF37; border-radius: 12px; display: none; flex-direction: column; box-shadow: 0 20px 40px rgba(0,0,0,0.8); z-index: 9999; overflow: hidden; font-family: 'Lato', sans-serif; opacity: 0; transition: opacity 0.3s ease; }
  
  .m-chat-header { background: #0b0e14; padding: 15px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; color: #D4AF37; }
  .m-chat-title { font-family: 'Cinzel', serif; font-size: 16px; font-weight: bold; letter-spacing: 2px; }
  .m-close-btn { color: #888; cursor: pointer; font-size: 24px; font-weight: bold; line-height: 1; transition: 0.2s; }
  .m-close-btn:hover { color: #fff; transform: rotate(90deg); }
  
  .m-chat-body { flex: 1; padding: 20px 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; background: #0b0e14; }
  
  .m-msg { max-width: 85%; padding: 12px 16px; border-radius: 8px; font-size: 13.5px; line-height: 1.5; animation: popIn 0.3s ease forwards; opacity: 0; transform: translateY(10px); }
  @keyframes popIn { to { opacity: 1; transform: translateY(0); } }
  
  .m-msg-ai { background: #1e2430; color: #e0e0e0; align-self: flex-start; border-bottom-left-radius: 0; border: 1px solid #333; box-shadow: 2px 2px 10px rgba(0,0,0,0.2); }
  .m-msg-user { background: linear-gradient(135deg, #D4AF37 0%, #b89225 100%); color: #000; align-self: flex-end; border-bottom-right-radius: 0; font-weight: bold; box-shadow: -2px 2px 10px rgba(212, 175, 55, 0.2); }
  
  .m-system-msg { align-self: center; font-size: 11px; color: #888; font-style: italic; letter-spacing: 1px; animation: pulse 1.5s infinite; margin-top: 5px; }
  @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
  
  .m-chat-footer { padding: 15px; background: #151922; border-top: 1px solid #333; display: flex; flex-direction: column; gap: 10px; }
  .m-input-row { display: flex; gap: 10px; }
  #m-chat-input { flex: 1; padding: 12px; background: #0b0e14; border: 1px solid #444; color: #fff; border-radius: 6px; outline: none; font-family: 'Lato', sans-serif; transition: 0.3s; }
  #m-chat-input:focus { border-color: #D4AF37; box-shadow: 0 0 5px rgba(212,175,55,0.3); }
  #m-send-btn { background: #D4AF37; color: #000; border: none; padding: 0 20px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; }
  #m-send-btn:hover { background: #b89225; }
  
  .m-human-btn { background: transparent; border: 1px dashed #D4AF37; color: #D4AF37; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; text-align: center; transition: 0.3s;}
  .m-human-btn:hover { background: #D4AF37; color: #000; }
  
  /* Bouncing Dots Thinking Indicator */
  .thinking-indicator { display: none; align-self: flex-start; background: #1e2430; padding: 12px 16px; border-radius: 8px; border-bottom-left-radius: 0; border: 1px solid #333; margin-bottom: 5px; }
  .thinking-indicator span { display: inline-block; width: 6px; height: 6px; background: #D4AF37; border-radius: 50%; margin: 0 2px; animation: bounce 1.4s infinite ease-in-out both; }
  .thinking-indicator span:nth-child(1) { animation-delay: -0.32s; }
  .thinking-indicator span:nth-child(2) { animation-delay: -0.16s; }
  @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
</style>

<div id="muziris-ai-btn" onclick="toggleMuzirisChat()">
  <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/><circle cx="8" cy="10" r="1.5"/><circle cx="12" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/></svg>
</div>

<div id="muziris-chat-window">
  <div class="m-chat-header">
    <div class="m-chat-title">AI Concierge</div>
    <div class="m-close-btn" onclick="toggleMuzirisChat()">×</div>
  </div>
  <div class="m-chat-body" id="m-chat-history">
    <div class="m-msg m-msg-ai">Hello! I am the Muziris AI Concierge. How can I help you with your global sourcing today?</div>
  </div>
  
  <div class="thinking-indicator" id="m-thinking">
    <span></span><span></span><span></span>
  </div>
  
  <div class="m-chat-footer">
    <div class="m-input-row">
      <input type="text" id="m-chat-input" placeholder="Type your message..." onkeypress="handleEnter(event)">
      <button id="m-send-btn" onclick="sendChatMessage()">Send</button>
    </div>
    <div class="m-human-btn" onclick="triggerManualHandoff()">Request Live Agent</div>
  </div>
</div>
`;

// Inject into body and aggressively hide Tawk.to
document.addEventListener("DOMContentLoaded", function() {
  document.body.insertAdjacentHTML('beforeend', botHTML);
  
  // Keep Tawk.to hidden until we explicitly call it
  const hideTawk = setInterval(() => {
    if (typeof Tawk_API !== 'undefined' && Tawk_API.hideWidget) {
      Tawk_API.hideWidget();
      clearInterval(hideTawk);
    }
  }, 500);
});

// 2. CORE LOGIC & ANIMATIONS
function toggleMuzirisChat() {
  const chat = document.getElementById('muziris-chat-window');
  if (chat.style.display === 'flex') {
    chat.style.opacity = '0';
    setTimeout(() => chat.style.display = 'none', 300);
  } else {
    chat.style.display = 'flex';
    setTimeout(() => chat.style.opacity = '1', 10);
  }
}

function handleEnter(e) {
  if (e.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
  const input = document.getElementById('m-chat-input');
  const message = input.value.trim();
  if (!message) return;

  // Add User Message
  addMessageToUI(message, 'user');
  input.value = '';
  
  // Show High-End Thinking Animation
  const thinkingUI = document.getElementById('m-thinking');
  const history = document.getElementById('m-chat-history');
  thinkingUI.style.display = 'block';
  history.scrollTop = history.scrollHeight;

  try {
    // Grab the current page URL path (e.g., "/join.html" or "/suppliers.html")
    const currentPath = window.location.pathname;

    // ==========================================
    // PAGE-SPECIFIC AI TRAINING / CONTEXT
    // ==========================================
    let hiddenContext = "";
    
    if (currentPath.includes("suppliers.html")) {
      hiddenContext = `[SYSTEM NOTE: The user is currently on the Muziris Supplier Portal. Keep your answers brief, professional, and directly related to this portal. 
      PORTAL RULES TO REMEMBER:
      - Login: Users need their Supplier ID and last 4 digits of their phone. If they aren't registered, tell them to apply at muziris.ca/join.
      - Editing Products: Tell them to click "View Active Listings" at the top of the page, then click a product to load it into the form for editing.
      - Bulk Upload: Tell them to click "Launch Bulk Upload Portal" at the top.
      - Pricing Matrix (Step 2): Explain they can add variants (Color, Size) using the "Type" dropdown. 
      - Incoterms (Step 2): Recommend EXW (Ex Works) for Small/Medium businesses without export licenses. Otherwise, FOB or CIF are common.
      - Images (Step 3): The "Hero" image must have a white background. Max image size is 25MB.
      - AI Tools: The form has "Auto-Tagline" and "Auto-Write" buttons to help them write descriptions based on the Product Name and Category.]\n\nUser says: `;
    } else if (currentPath.includes("join.html")) {
      hiddenContext = `[SYSTEM NOTE: The user is on the main Join page deciding whether to register.]\n\nUser says: `;
    } else if (currentPath.includes("how-it-works.html")) {
      hiddenContext = `[SYSTEM NOTE: The user is on the 'How It Works' page. Explain our 5 step process: 1. Secure Onboarding, 2. AI Matching & RFQs, 3. Escrow Funded Production, 4. Automated Freight, 5. Guaranteed Payout.]\n\nUser says: `;
    } else if (currentPath.includes("zero-risk.html")) {
      hiddenContext = `[SYSTEM NOTE: The user is on the 'Zero-Risk Expansion' page. Pitch our financial model: 1. Zero upfront listing fees or subscriptions. 2. We only make money by applying a transactional margin to the buyer's invoice when an escrow contract is signed. 3. Zero payment risk due to 100% Escrow funding before production.]\n\nUser says: `;
    } else if (currentPath.includes("concierge.html")) {
      hiddenContext = `[SYSTEM NOTE: The user is on the 'Trade Concierge' page. Emphasize that our AI works 24/7 in over 40 languages to capture leads, but complex negotiations and logistics are handled by a dedicated human Muziris Procurement Specialist.]\n\nUser says: `;
    }

    const finalMessageForAI = hiddenContext ? (hiddenContext + message) : message;
    const response = await fetch(MUZIRIS_API_URL, {
      method: 'POST',
      // 🟢 CHANGED: Now uses standard JSON headers so Render understands it!
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'chatBot', 
        message: finalMessageForAI,
        currentPage: currentPath 
      })
    });
    
    const data = await response.json();
    
    thinkingUI.style.display = 'none';
    
    if (data.reply) {
      const isHandoff = data.reply.includes("[HANDOFF_TO_TAWK]");
      const cleanReply = data.reply.replace("[HANDOFF_TO_TAWK]", "").trim();
      
      // Type out the AI's response smoothly
      await typeWriterEffect(cleanReply);
      
      if (isHandoff) {
        executeCinematicHandoff();
      }
    } else {
      await typeWriterEffect("I'm sorry, I am currently analyzing market data. Please try again.");
    }
  } catch (err) {
    thinkingUI.style.display = 'none';
    await typeWriterEffect("Secure connection lost. Please check your internet.");
  }
}

// 3. TYPEWRITER EFFECT
function typeWriterEffect(text) {
  return new Promise((resolve) => {
    const history = document.getElementById('m-chat-history');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'm-msg m-msg-ai';
    history.appendChild(msgDiv);
    
    let i = 0;
    function type() {
      if (i < text.length) {
        msgDiv.innerHTML += text.charAt(i);
        i++;
        history.scrollTop = history.scrollHeight;
        setTimeout(type, 15); // Adjust typing speed here (lower is faster)
      } else {
        resolve();
      }
    }
    type();
  });
}

// Instant message for user text
function addMessageToUI(text, sender) {
  const history = document.getElementById('m-chat-history');
  const msgDiv = document.createElement('div');
  msgDiv.className = `m-msg m-msg-${sender}`;
  msgDiv.innerText = text;
  history.appendChild(msgDiv);
  history.scrollTop = history.scrollHeight;
}

// 4. THE CINEMATIC HANDOFF SEQUENCE
function triggerManualHandoff() {
  addMessageToUI("I would like to speak to a live agent, please.", 'user');
  setTimeout(() => {
    executeCinematicHandoff();
  }, 500);
}

function executeCinematicHandoff() {
  const history = document.getElementById('m-chat-history');
  
  // 1. Show the pulsing system message
  const sysMsg = document.createElement('div');
  sysMsg.className = 'm-system-msg';
  sysMsg.innerText = "Establishing secure connection to Live Agent...";
  history.appendChild(sysMsg);
  history.scrollTop = history.scrollHeight;
  
  // Disable input while transferring
  document.getElementById('m-chat-input').disabled = true;
  document.getElementById('m-send-btn').disabled = true;
  
  // 2. The 3-second cinematic pause, then execute Tawk.to
  setTimeout(() => {
    document.getElementById('muziris-chat-window').style.display = 'none';
    document.getElementById('muziris-ai-btn').style.display = 'none';
    
    if (typeof Tawk_API !== 'undefined') {
      Tawk_API.showWidget(); // Unhide Tawk
      Tawk_API.maximize();   // Pop it open
    } else {
      alert("Live agents are currently offline. Please leave a message.");
    }
  }, 3000); // 3000ms = 3 second pause
}
