/**
 * Skye Wealth — Chat Widget
 * WhatsApp-style lead gen widget
 *
 * ⚠️  Update WA_NUMBER below with your WhatsApp business number
 *     Format: country code + number, no spaces or +
 *     Example: 61412345678
 */

(function () {
  const WA_NUMBER  = '61400000000'; // ← REPLACE with your WhatsApp number
  const WA_DEFAULT = encodeURIComponent("Hi Skye! I'd like to chat about my insurance cover.");

  const REPLIES = [
    {
      text: "What cover do I actually need?",
      msg:  "Hi Skye, I'm not sure what type of insurance cover I need. Can you help me work it out?",
    },
    {
      text: "Review my existing cover",
      msg:  "Hi Skye, I'd like to get a review of my existing insurance cover.",
    },
    {
      text: "Something has changed in my life",
      msg:  "Hi Skye, I've recently had a life change and want to check my insurance still makes sense.",
    },
    {
      text: "Just exploring my options",
      msg:  "Hi Skye, I'm just exploring my insurance options and would love some guidance.",
    },
  ];

  // ─── Build DOM ─────────────────────────────────────────────────
  const widget = document.createElement('div');
  widget.id = 'chat-widget';
  widget.innerHTML = `
    <button class="chat-trigger" id="chat-trigger" aria-label="Chat about your cover">
      <div class="chat-pulse"></div>
      <div class="chat-notif" id="chat-notif"></div>

      <!-- Chat icon -->
      <svg class="chat-icon-chat" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>

      <!-- Close icon -->
      <svg class="chat-icon-close" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>

      <span class="chat-label">Chat about your cover?</span>
    </button>

    <div class="chat-panel" id="chat-panel" role="dialog" aria-label="Chat with Skye Wealth">

      <div class="chat-header">
        <div class="chat-header-left">
          <img src="logo-text.svg" class="chat-header-logo" alt="Skye Wealth">
          <div>
            <div class="chat-header-name">Skye Wealth</div>
            <div class="chat-header-status">
              <span class="chat-online-dot"></span>
              Usually replies in minutes
            </div>
          </div>
        </div>
        <button class="chat-header-close" id="chat-close" aria-label="Close chat">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>

      <div class="chat-body" id="chat-body">
        <div class="chat-msg-row">
          <div class="chat-avatar">J</div>
          <div id="chat-bubble-slot">
            <div class="chat-typing" id="chat-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-replies" id="chat-replies"></div>

      <div class="chat-footer">
        <a
          href="https://wa.me/${WA_NUMBER}?text=${WA_DEFAULT}"
          class="chat-wa-btn"
          id="chat-wa-btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Open WhatsApp
        </a>
      </div>
    </div>
  `;

  document.body.appendChild(widget);

  // ─── References ────────────────────────────────────────────────
  const trigger   = document.getElementById('chat-trigger');
  const panel     = document.getElementById('chat-panel');
  const closeBtn  = document.getElementById('chat-close');
  const notif     = document.getElementById('chat-notif');
  const typingEl  = document.getElementById('chat-typing');
  const slot      = document.getElementById('chat-bubble-slot');
  const repliesEl = document.getElementById('chat-replies');
  const waBtn     = document.getElementById('chat-wa-btn');

  let isOpen      = false;
  let hasAnimated = false;

  // ─── Entrance ──────────────────────────────────────────────────
  // Delay on index.html (after splash) vs other pages
  const hasSplash = !!document.getElementById('splash');
  const entranceDelay = hasSplash ? 3200 : 1200;

  setTimeout(() => {
    trigger.classList.add('is-visible');
  }, entranceDelay);

  // Notification dot appears a few seconds after trigger
  setTimeout(() => {
    notif.classList.add('is-visible');
  }, entranceDelay + 3000);

  // ─── Open / Close ──────────────────────────────────────────────
  function open() {
    isOpen = true;
    trigger.classList.add('is-open');
    panel.classList.add('is-open');
    notif.classList.remove('is-visible');

    if (!hasAnimated) {
      hasAnimated = true;
      animateConversation();
    }
  }

  function close() {
    isOpen = false;
    trigger.classList.remove('is-open');
    panel.classList.remove('is-open');
  }

  trigger.addEventListener('click', () => (isOpen ? close() : open()));
  closeBtn.addEventListener('click', close);

  // Close on outside click
  document.addEventListener('click', e => {
    if (isOpen && !widget.contains(e.target)) close();
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) close();
  });

  // ─── Conversation animation ────────────────────────────────────
  function animateConversation() {
    // After 1.4s typing → show message
    setTimeout(() => {
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      bubble.innerHTML = `Hey there! 👋<br>I'm Jam from Skye Wealth.<br>What's on your mind about cover?`;

      typingEl.style.transition = 'opacity .2s ease, transform .2s ease';
      typingEl.style.opacity    = '0';
      typingEl.style.transform  = 'scale(.85)';

      setTimeout(() => {
        slot.replaceChild(bubble, typingEl);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            bubble.classList.add('is-visible');
          });
        });

        // Stagger reply buttons in
        setTimeout(() => {
          REPLIES.forEach((reply, i) => {
            const btn = document.createElement('button');
            btn.className = 'chat-reply';
            btn.textContent = reply.text;
            repliesEl.appendChild(btn);

            setTimeout(() => {
              btn.classList.add('is-visible');
            }, i * 90);

            btn.addEventListener('click', () => selectReply(reply, btn));
          });
        }, 300);

      }, 200);
    }, 1400);
  }

  function selectReply(reply, selectedBtn) {
    // Update WhatsApp link with selected message
    waBtn.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(reply.msg)}`;

    // Visual selection
    repliesEl.querySelectorAll('.chat-reply').forEach(b => {
      b.classList.remove('is-selected');
      b.classList.add('is-dimmed');
    });
    selectedBtn.classList.remove('is-dimmed');
    selectedBtn.classList.add('is-selected');

    // Bounce WA button
    waBtn.classList.remove('is-ready');
    void waBtn.offsetWidth; // reflow to restart animation
    waBtn.classList.add('is-ready');

    // Open WhatsApp after a brief moment
    setTimeout(() => window.open(waBtn.href, '_blank'), 350);
  }
})();
