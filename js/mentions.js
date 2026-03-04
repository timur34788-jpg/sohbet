/* Nature.co — mentions.js */
/* Slack benzeri @ mention sistemi */

(function () {

  const SPECIAL_MENTIONS = [
    { id: '@here',     label: '@here',     desc: 'Çevrimiçi olanları etiketle',  icon: '🟢' },
    { id: '@all',      label: '@all',      desc: 'Odadaki herkesi etiketle',      icon: '📢' },
    { id: '@everyone', label: '@everyone', desc: 'Tüm üyelere bildirim gönder',   icon: '🔔' },
  ];

  let _mentionBox    = null;
  let _mentionActive = false;
  let _mentionStart  = -1;
  let _mentionItems  = [];
  let _mentionIdx    = 0;
  let _activeInp     = null;

  const style = document.createElement('style');
  style.textContent = `
    #mentionBox {
      display: none; position: absolute;
      bottom: calc(100% + 6px); left: 0; right: 0;
      background: var(--bg2); border: 1px solid var(--border);
      border-radius: 14px; overflow: hidden; max-height: 240px;
      overflow-y: auto; z-index: 9999;
      box-shadow: 0 8px 32px rgba(0,0,0,.5);
    }
    #mentionBox.show { display: block; }
    .mention-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 14px; cursor: pointer; transition: background .1s;
      border-bottom: 1px solid var(--border);
    }
    .mention-item:last-child { border-bottom: none; }
    .mention-item:hover, .mention-item.active { background: var(--surface); }
    .mention-av {
      width: 28px; height: 28px; border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      font-size: .7rem; font-weight: 900; color: #fff; flex-shrink: 0;
    }
    .mention-av.special { background: var(--surface2); font-size: 1rem; }
    .mention-name { font-size: .85rem; font-weight: 800; color: var(--text-hi); flex: 1; }
    .mention-desc { font-size: .72rem; color: var(--muted); }
    .mention-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); flex-shrink: 0; }
    .msg-mention { color: #7ec8e3; background: rgba(126,200,227,.12); border-radius: 4px; padding: 1px 4px; font-weight: 700; }
    .msg-mention.me { color: #ffd166; background: rgba(255,209,102,.15); }
    .msg-mention.special { color: #a8e6a3; background: rgba(168,230,163,.12); }
  `;
  document.head.appendChild(style);

  function mColor(str) {
    if (typeof strColor === 'function') return strColor(str);
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return 'hsl(' + (Math.abs(h) % 360) + ',60%,45%)';
  }

  function getCurrentRoomId() {
    return window._deskRoom || window._cRoom || null;
  }

  async function getMembers() {
    const roomId = getCurrentRoomId();
    if (!roomId) return [];
    const cached = (window._roomMembersCache || {})[roomId];
    if (cached && cached.length) return cached;
    try {
      if (!window._db) return [];
      const snap = await window._db.ref('rooms/' + roomId).once('value');
      const room = snap.val();
      if (!room) return [];
      const members = room.members || [];
      if (!window._roomMembersCache) window._roomMembersCache = {};
      window._roomMembersCache[roomId] = members;
      return members;
    } catch (e) { return []; }
  }

  async function updateMentionBox(query) {
    const q = (query || '').toLowerCase();
    const members = await getMembers();
    const onlineMap = window._online || {};
    const cu = window._cu || '';

    const userItems = members
      .filter(u => u !== cu)
      .filter(u => !q || u.toLowerCase().includes(q))
      .sort((a, b) => {
        const ao = !!onlineMap[a], bo = !!onlineMap[b];
        if (ao !== bo) return ao ? -1 : 1;
        return a.localeCompare(b);
      })
      .slice(0, 8)
      .map(u => ({
        id: '@' + u, label: '@' + u,
        isOnline: !!onlineMap[u], isUser: true,
        color: mColor(u), initials: u.slice(0, 2).toUpperCase(),
      }));

    const specialItems = SPECIAL_MENTIONS
      .filter(s => !q || s.label.toLowerCase().includes(q))
      .map(s => ({ ...s, isSpecial: true }));

    _mentionItems = [...specialItems, ...userItems];
    _mentionIdx = 0;

    if (!_mentionItems.length) { hideMentionBox(); return; }

    ensureBox();
    renderMentionBox();
    _mentionBox.classList.add('show');
    _mentionActive = true;
  }

  function renderMentionBox() {
    if (!_mentionBox) return;
    _mentionBox.innerHTML = _mentionItems.map((item, i) => {
      if (item.isSpecial) {
        return '<div class="mention-item ' + (i === _mentionIdx ? 'active' : '') + '" onmousedown="event.preventDefault()" onclick="window._selectMention(' + i + ')">'
          + '<div class="mention-av special">' + item.icon + '</div>'
          + '<div class="mention-name">' + item.label + '</div>'
          + '<div class="mention-desc">' + item.desc + '</div>'
          + '</div>';
      }
      return '<div class="mention-item ' + (i === _mentionIdx ? 'active' : '') + '" onmousedown="event.preventDefault()" onclick="window._selectMention(' + i + ')">'
        + '<div class="mention-av" style="background:' + item.color + '">' + item.initials + '</div>'
        + '<div class="mention-name">' + item.label + '</div>'
        + (item.isOnline ? '<div class="mention-dot"></div>' : '')
        + '</div>';
    }).join('');
  }

  function hideMentionBox() {
    if (_mentionBox) _mentionBox.classList.remove('show');
    _mentionActive = false;
    _mentionStart = -1;
    _mentionItems = [];
  }

  function ensureBox() {
    if (_mentionBox) return;
    _mentionBox = document.createElement('div');
    _mentionBox.id = 'mentionBox';
    const wrap = document.getElementById('slashSuggestWrap');
    if (wrap) {
      wrap.appendChild(_mentionBox);
    } else {
      const inpWrap = document.querySelector('.inp-wrap');
      if (inpWrap) { inpWrap.style.position = 'relative'; inpWrap.appendChild(_mentionBox); }
      else document.body.appendChild(_mentionBox);
    }
  }

  window._selectMention = function (idx) {
    if (!_activeInp) return;
    const item = _mentionItems[idx];
    if (!item) return;
    const val    = _activeInp.value;
    const before = val.slice(0, _mentionStart);
    const after  = val.slice(_activeInp.selectionStart);
    _activeInp.value = before + item.label + ' ' + after;
    const pos = _mentionStart + item.label.length + 1;
    _activeInp.setSelectionRange(pos, pos);
    _activeInp.focus();
    hideMentionBox();
    if (typeof autoResize === 'function') autoResize(_activeInp);
  };

  function onMentionInput(inp) {
    _activeInp = inp;
    const val = inp.value;
    const cur = inp.selectionStart;
    let start = -1;
    for (let i = cur - 1; i >= 0; i--) {
      if (val[i] === '@') { start = i; break; }
      if (val[i] === ' ' || val[i] === '\n') break;
    }
    if (start === -1) { hideMentionBox(); return; }
    const query = val.slice(start + 1, cur);
    if (query.includes(' ')) { hideMentionBox(); return; }
    _mentionStart = start;
    updateMentionBox(query);
  }

  function onMentionKeydown(e) {
    if (!_mentionActive || !_mentionItems.length) return false;
    if (e.key === 'ArrowDown') { e.preventDefault(); _mentionIdx = (_mentionIdx + 1) % _mentionItems.length; renderMentionBox(); return true; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); _mentionIdx = (_mentionIdx - 1 + _mentionItems.length) % _mentionItems.length; renderMentionBox(); return true; }
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); window._selectMention(_mentionIdx); return true; }
    if (e.key === 'Escape') { hideMentionBox(); return true; }
    return false;
  }

  window.triggerMentionFromBtn = function () {
    const inp = (typeof IS_DESKTOP === 'function' && IS_DESKTOP())
      ? document.getElementById('deskInp')
      : document.getElementById('msgInp');
    if (!inp) return;
    inp.focus();
    const pos = inp.selectionStart;
    inp.value = inp.value.slice(0, pos) + '@' + inp.value.slice(pos);
    inp.setSelectionRange(pos + 1, pos + 1);
    onMentionInput(inp);
  };

  window.highlightMentions = function (text) {
    const cu = window._cu || '';
    return text.replace(/@(here|all|everyone|[\w\u00C0-\u024F]+)/g, function(match, name) {
      const isMe = name === cu;
      const isSpecial = ['here','all','everyone'].includes(name);
      return '<span class="msg-mention ' + (isMe ? 'me' : isSpecial ? 'special' : '') + '">' + match + '</span>';
    });
  };

  window._roomMembersCache = window._roomMembersCache || {};
  window.cacheRoomMembers = function (roomId, members) {
    window._roomMembersCache[roomId] = members || [];
  };

  function hookInput(inp) {
    if (!inp || inp._mentionHooked) return;
    inp._mentionHooked = true;
    inp.addEventListener('input', function() { onMentionInput(inp); });
    inp.addEventListener('keydown', function(e) { onMentionKeydown(e); });
    inp.addEventListener('blur', function() { setTimeout(hideMentionBox, 150); });
  }

  function init() {
    ensureBox();
    hookInput(document.getElementById('msgInp'));
    hookInput(document.getElementById('deskInp'));

    // onMsgKey wrap
    const origMsg = window.onMsgKey;
    window.onMsgKey = function(e) { if (onMentionKeydown(e)) return; if (origMsg) origMsg(e); };
    const origDesk = window.onDeskMsgKey;
    window.onDeskMsgKey = function(e) { if (onMentionKeydown(e)) return; if (origDesk) origDesk(e); };

    // @ butonunu güncelle
    document.querySelectorAll('.ii').forEach(function(btn) {
      if (btn.textContent.trim() === '@') {
        btn.onclick = window.triggerMentionFromBtn;
        btn.title = 'Birini etiketle';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 800);
  }

})();
