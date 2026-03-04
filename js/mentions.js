/* Nature.co — mentions.js */
/* Slack benzeri @ mention sistemi */

(function () {

  // ── Özel mention hedefleri (@here, @all vb.) ──
  const SPECIAL_MENTIONS = [
    { id: '@here',     label: '@here',     desc: 'Şu an çevrimiçi olanları etiketle',  icon: '🟢' },
    { id: '@all',      label: '@all',      desc: 'Odadaki herkesi etiketle',            icon: '📢' },
    { id: '@everyone', label: '@everyone', desc: 'Tüm üyelere bildirim gönder',         icon: '🔔' },
  ];

  // ── State ──
  let _mentionBox    = null;
  let _mentionActive = false;
  let _mentionStart  = -1;   // @ işaretinin textarea'daki indexi
  let _mentionItems  = [];   // şu an listelenen öğeler
  let _mentionIdx    = 0;    // seçili satır
  let _activeInp     = null; // hangi textarea aktif

  // ── CSS Enjeksiyonu ──
  const style = document.createElement('style');
  style.textContent = `
    #mentionBox {
      display: none;
      position: absolute;
      bottom: calc(100% + 6px);
      left: 0; right: 0;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      max-height: 240px;
      overflow-y: auto;
      z-index: 200;
      box-shadow: 0 8px 32px rgba(0,0,0,.5);
    }
    #mentionBox.show { display: block; }
    #mentionBox::-webkit-scrollbar { width: 4px; }
    #mentionBox::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

    .mention-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 14px;
      cursor: pointer;
      transition: background .1s;
      border-bottom: 1px solid var(--border);
    }
    .mention-item:last-child { border-bottom: none; }
    .mention-item:hover,
    .mention-item.active { background: var(--surface); }

    .mention-av {
      width: 28px; height: 28px;
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      font-size: .7rem; font-weight: 900; color: #fff;
      flex-shrink: 0;
    }
    .mention-av.special {
      background: var(--surface2);
      font-size: 1rem;
    }
    .mention-name {
      font-size: .85rem;
      font-weight: 800;
      color: var(--text-hi);
      flex: 1;
    }
    .mention-desc {
      font-size: .72rem;
      color: var(--muted);
    }
    .mention-online-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--green);
      flex-shrink: 0;
    }

    /* Mesajlarda mention rengi */
    .msg-mention {
      color: #7ec8e3;
      background: rgba(126,200,227,.12);
      border-radius: 4px;
      padding: 1px 4px;
      font-weight: 700;
      cursor: pointer;
    }
    .msg-mention.me {
      color: #ffd166;
      background: rgba(255,209,102,.15);
    }
    .msg-mention.special {
      color: #a8e6a3;
      background: rgba(168,230,163,.12);
    }
  `;
  document.head.appendChild(style);

  // ── Mention kutusunu oluştur ──
  function ensureBox() {
    if (_mentionBox) return;
    _mentionBox = document.createElement('div');
    _mentionBox.id = 'mentionBox';
    // slashSuggestWrap içine ekle (aynı konumlandırma context'i)
    const wrap = document.getElementById('slashSuggestWrap');
    if (wrap) wrap.appendChild(_mentionBox);
    else document.body.appendChild(_mentionBox);
  }

  // ── Renk üretici (config.js'deki strColor ile aynı mantık) ──
  function mentionColor(str) {
    if (typeof strColor === 'function') return strColor(str);
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return `hsl(${h % 360},60%,45%)`;
  }

  // ── Oda üyelerini al ──
  function getRoomMembers() {
    try {
      // Önce mevcut oda verilerinden dene
      const inp = IS_DESKTOP ? IS_DESKTOP() : window.innerWidth >= 768;
      const roomId = inp ? (window._deskRoom || window._cRoom) : window._cRoom;
      if (!roomId || !window._db) return [];

      // Anlık önbellekten al (async olmadan)
      const cached = window._roomMembersCache && window._roomMembersCache[roomId];
      if (cached) return cached;
      return [];
    } catch (e) { return []; }
  }

  // ── Mention listesini güncelle ──
  function updateMentionBox(query) {
    ensureBox();
    const q = query.toLowerCase();

    const members = getRoomMembers();
    const onlineMap = window._online || {};

    // Kullanıcıları filtrele
    let userItems = members
      .filter(u => u !== window._cu)
      .filter(u => !q || u.toLowerCase().includes(q))
      .sort((a, b) => {
        // Çevrimiçi olanlar üste
        const ao = !!onlineMap[a], bo = !!onlineMap[b];
        if (ao !== bo) return ao ? -1 : 1;
        return a.localeCompare(b);
      })
      .slice(0, 8)
      .map(u => ({
        id: '@' + u,
        label: '@' + u,
        isOnline: !!onlineMap[u],
        isUser: true,
        color: mentionColor(u),
        initials: (u.slice(0, 2)).toUpperCase(),
      }));

    // Özel mention'ları filtrele
    let specialItems = SPECIAL_MENTIONS
      .filter(s => !q || s.id.includes(q))
      .map(s => ({ ...s, isSpecial: true }));

    _mentionItems = [...specialItems, ...userItems];
    _mentionIdx   = 0;

    if (!_mentionItems.length) {
      hideMentionBox();
      return;
    }

    renderMentionBox();
    _mentionBox.classList.add('show');
    _mentionActive = true;
  }

  function renderMentionBox() {
    _mentionBox.innerHTML = _mentionItems.map((item, i) => {
      if (item.isSpecial) {
        return `<div class="mention-item ${i === _mentionIdx ? 'active' : ''}"
          onmousedown="event.preventDefault()" onclick="window._selectMention(${i})">
          <div class="mention-av special">${item.icon}</div>
          <div class="mention-name">${item.label}</div>
          <div class="mention-desc">${item.desc}</div>
        </div>`;
      }
      return `<div class="mention-item ${i === _mentionIdx ? 'active' : ''}"
        onmousedown="event.preventDefault()" onclick="window._selectMention(${i})">
        <div class="mention-av" style="background:${item.color}">${item.initials}</div>
        <div class="mention-name">${item.label}</div>
        ${item.isOnline ? '<div class="mention-online-dot"></div>' : ''}
      </div>`;
    }).join('');
  }

  function hideMentionBox() {
    if (_mentionBox) _mentionBox.classList.remove('show');
    _mentionActive = false;
    _mentionStart  = -1;
    _mentionItems  = [];
  }

  // ── Mention seç ──
  window._selectMention = function (idx) {
    if (!_activeInp) return;
    const item = _mentionItems[idx];
    if (!item) return;

    const val   = _activeInp.value;
    const before = val.slice(0, _mentionStart);
    const after  = val.slice(_activeInp.selectionStart);

    _activeInp.value = before + item.label + ' ' + after;

    // İmleci mention'dan sonraya taşı
    const pos = _mentionStart + item.label.length + 1;
    _activeInp.setSelectionRange(pos, pos);
    _activeInp.focus();

    hideMentionBox();

    // resize tetikle
    if (typeof autoResize === 'function') autoResize(_activeInp);
  };

  // ── Input olayını dinle ──
  function onMentionInput(inp) {
    _activeInp = inp;
    const val = inp.value;
    const cur = inp.selectionStart;

    // @ işaretini geriye doğru ara
    let start = -1;
    for (let i = cur - 1; i >= 0; i--) {
      if (val[i] === '@') { start = i; break; }
      if (val[i] === ' ' || val[i] === '\n') break;
    }

    if (start === -1) { hideMentionBox(); return; }

    const query = val.slice(start + 1, cur);
    // Boşluk içeriyorsa mention değil
    if (query.includes(' ')) { hideMentionBox(); return; }

    _mentionStart = start;
    updateMentionBox(query);
  }

  // ── Klavye navigasyonu ──
  function onMentionKeydown(e) {
    if (!_mentionActive) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _mentionIdx = (_mentionIdx + 1) % _mentionItems.length;
      renderMentionBox();
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      _mentionIdx = (_mentionIdx - 1 + _mentionItems.length) % _mentionItems.length;
      renderMentionBox();
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      window._selectMention(_mentionIdx);
      return true;
    }
    if (e.key === 'Escape') {
      hideMentionBox();
      return true;
    }
    return false;
  }

  // ── @ butonuna tıklayınca tetikle ──
  function triggerMentionFromBtn() {
    const inp = (typeof IS_DESKTOP === 'function' && IS_DESKTOP())
      ? document.getElementById('deskInp')
      : document.getElementById('msgInp');
    if (!inp) return;
    inp.focus();
    const pos = inp.selectionStart;
    inp.value = inp.value.slice(0, pos) + '@' + inp.value.slice(pos);
    inp.setSelectionRange(pos + 1, pos + 1);
    onMentionInput(inp);
  }
  window.triggerMentionFromBtn = triggerMentionFromBtn;

  // ── Mesaj metninde @mention'ları renklendir ──
  function highlightMentions(text) {
    const cu = window._cu || '';
    return text.replace(/@(here|all|everyone|[\w\u00C0-\u024F]+)/g, (match, name) => {
      const isMe      = name === cu;
      const isSpecial = ['here','all','everyone'].includes(name);
      const cls       = isMe ? 'me' : (isSpecial ? 'special' : '');
      return `<span class="msg-mention ${cls}">${match}</span>`;
    });
  }
  window.highlightMentions = highlightMentions;

  // ── Oda üyelerini önbelleğe al ──
  window._roomMembersCache = {};

  function cacheRoomMembers(roomId, members) {
    window._roomMembersCache[roomId] = members || [];
  }
  window.cacheRoomMembers = cacheRoomMembers;

  // ── Input hook'larını bağla ──
  function hookInput(inp) {
    if (!inp || inp._mentionHooked) return;
    inp._mentionHooked = true;

    inp.addEventListener('input', () => onMentionInput(inp));

    inp.addEventListener('keydown', (e) => {
      if (onMentionKeydown(e)) return;
    });

    inp.addEventListener('blur', () => {
      // Küçük gecikme — click olayının önce çalışmasına izin ver
      setTimeout(hideMentionBox, 150);
    });
  }

  // ── Sayfa yüklendikten sonra hook'ları bağla ──
  function init() {
    ensureBox();

    const msgInp  = document.getElementById('msgInp');
    const deskInp = document.getElementById('deskInp');
    hookInput(msgInp);
    hookInput(deskInp);

    // @ butonunu güncelle
    const atBtns = document.querySelectorAll('.ii');
    atBtns.forEach(btn => {
      if (btn.textContent.trim() === '@') {
        btn.onclick = triggerMentionFromBtn;
        btn.title   = 'Birini etiketle';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 500);
  }

  // ── onMsgKey ve onDeskMsgKey hook'u ──
  // Mevcut fonksiyonları wrap ederek ArrowUp/Down/Enter/Tab'ı yakala
  const _origOnMsgKey = window.onMsgKey;
  window.onMsgKey = function (e) {
    if (onMentionKeydown(e)) return;
    if (_origOnMsgKey) _origOnMsgKey(e);
  };

  const _origOnDeskMsgKey = window.onDeskMsgKey;
  window.onDeskMsgKey = function (e) {
    if (onMentionKeydown(e)) return;
    if (_origOnDeskMsgKey) _origOnDeskMsgKey(e);
  };

})();
