// ==========================================
// MUZIRIS AI CONCIERGE WIDGET
// ==========================================

// MAKE SURE THIS IS YOUR ACTUAL GOOGLE APPS SCRIPT URL!
const MUZIRIS_API_URL = "https://script.google.com/macros/s/AKfycbyGaJlZrB05JP2BFCBHs9yCEV5BFex6sX7dIBte64s-KcF35NMnnnq5ppyMCztXzLOe4g/exec";

// 1. INJECT THE CHAT HTML & CSS INTO THE PAGE
const botHTML = `
<style>
  #muziris-ai-btn { position: fixed; bottom: 20px; right: 20px; background: linear-gradient(135deg, #D4AF37 0%, #b89225 100%); width: 60px; height: 60px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.5); z-index: 9998; transition: 0.3s; border: 2px solid #000; }
  #muziris-ai-btn:hover { transform: scale(1.1); }
  #muziris-ai-btn svg { fill: #000; width: 30px; height: 30px; }
  
  #muziris-chat-window { position: fixed; bottom: 90px; right: 20px; width: 350px; height: 500px; background: #151922; border: 1px solid #D4AF37; border-radius: 12px; display: none; flex-direction: column; box-shadow: 0 15px 35px rgba(0,0,0,0.8); z-index: 9999; overflow: hidden; font-family: 'Lato', sans-serif;}
  
  .m-chat-header { background: #0b0e14; padding: 15px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; color: #D4AF37; }
  .m-chat-title { font-family: 'Cinzel', serif; font-size: 16px; font-weight: bold; letter-spacing: 2px; }
  .m-close-btn { color: #888; cursor: pointer; font-size: 20px; font-weight: bold; }
  .m-close-btn:hover { color: #fff; }
  
  .m-chat-body { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #0b0e14; }
  
  .m-msg { max-width: 80%; padding: 10px 15px; border-radius: 8px; font-size: 13px; line-height: 1.5; }
  .m-msg-ai { background: #1e2430; color: #e0e0e0; align-self: flex-start; border-bottom-left-radius: 0; border: 1px solid #333;}
  .m-msg-user { background: #D4AF37; color: #000; align-self: flex-end; border-bottom-right-radius: 0; font-weight: bold;}
  
  .m-chat-footer { padding: 15px; background: #151922; border-top: 1px solid #333; display: flex; flex-direction: column; gap: 10px; }
  .m-input-row { display: flex; gap: 10px; }
  #m-chat-input { flex: 1; padding: 10px; background: #0b0e14; border: 1px solid #444; color: #fff; border-radius: 4px; outline: none; }
  #m-chat-input:focus { border-color: #D4AF37; }
  #m-send-btn { background: #D4AF37; color: #000; border: none; padding: 10px 15px; border-radius: 4px; font-weight: bold; cursor: pointer; }
  
  .m-human-btn { background: transparent; border: 1px dashed #D4AF37; color: #D4AF37; padding: 8px; border-radius: 4px; font-size: 11px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; text-align: center; transition: 0.3s;}
  .m-human-btn:hover { background: #D4AF37; color: #000; }
  
  .typing-indicator { color: #888; font-size: 11px; font-style: italic; display: none; margin-left: 5px;}
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
  <div class="typing-indicator" id="m-typing">AI is typing...</div>
  <div class="m-chat-footer">
    <div class="m-input-row">
      <input type="text" id="m-chat-input" placeholder="Type your message..." onkeypress="handleEnter(event)">
      <button id="m-send-btn" onclick="sendChatMessage()">Send</button>
    </div>
    <div class="m-human-btn" onclick="handOffToHuman()">Agent</div>
  </div>
</div>
`;

// Inject into the body when the page loads
document.addEventListener("DOMContentLoaded", function() {
  document.body.insertAdjacentHTML('beforeend', botHTML);
  
  // Try to hide default Tawk.to widget on load (we only want it to show when requested)
  setTimeout(() => {
    if (typeof Tawk_API !== 'undefined' && Tawk_API.hideWidget) {
      Tawk_API.hideWidget();
    }
  }, 2000);
});

// 2. CHAT LOGIC
function toggleMuzirisChat() {
  const chat = document.getElementById('muziris-chat-window');
  chat.style.display = chat.style.display === 'flex' ? 'none' : 'flex';
}

function handleEnter(e) {
  if (e.key === 'Enter') sendChatMessage();
}

function sendChatMessage() {
  const input = document.getElementById('m-chat-input');
  const message = input.value.trim();
  if (!message) return;

  // Add User Message to UI
  addMessageToUI(message, 'user');
  input.value = '';
  
  // Show Typing
  document.getElementById('m-typing').style.display = 'block';

  // Send to Google Apps Script
  fetch(MUZIRIS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'chatBot', message: message })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('m-typing').style.display = 'none';
    
    if (data.reply) {
      // Check if the AI decided to hand off to a human!
      if (data.reply.includes("[HANDOFF_TO_TAWK]")) {
        let cleanReply = data.reply.replace("[HANDOFF_TO_TAWK]", "").trim();
        addMessageToUI(cleanReply, 'ai');
        setTimeout(handOffToHuman, 1500); // Wait 1.5 seconds, then pop Tawk.to
      } else {
        addMessageToUI(data.reply, 'ai');
      }
    } else {
      addMessageToUI("I'm sorry, my servers are currently analyzing market data. Please try again.", 'ai');
    }
  })
  .catch(err => {
    document.getElementById('m-typing').style.display = 'none';
    addMessageToUI("Connection lost. Please check your internet.", 'ai');
  });
}

function addMessageToUI(text, sender) {
  const history = document.getElementById('m-chat-history');
  const msgDiv = document.createElement('div');
  msgDiv.className = `m-msg m-msg-${sender}`;
  msgDiv.innerText = text;
  history.appendChild(msgDiv);
  history.scrollTop = history.scrollHeight; // Auto-scroll to bottom
}

// 3. THE TAWK.TO HANDOFF MAGIC
function handOffToHuman() {
  // Hide the AI Window and Button
  document.getElementById('muziris-chat-window').style.display = 'none';
  document.getElementById('muziris-ai-btn').style.display = 'none';
  
  // Wake up Tawk.to
  if (typeof Tawk_API !== 'undefined') {
    Tawk_API.showWidget();
    Tawk_API.maximize();
  } else {
    alert("Live agents are currently offline. Please leave a message via the contact form.");
  }
}
