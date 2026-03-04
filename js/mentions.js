/* Nature.co — mentions.js */

(function () {

  const SPECIAL_MENTIONS = [
    { id: '@here',     label: '@here',     desc: 'Çevrimiçi olanları etiketle', icon: '🟢' },
    { id: '@all',      label: '@all',      desc: 'Odadaki herkesi etiketle',    icon: '📢' },
    { id: '@everyone', label: '@everyone', desc: 'Tüm üyelere bildirim gönder', icon: '🔔' },
  ];

  let _box = null, _active = false, _start = -1, _items = [], _idx = 0, _inp = null;

  // CSS
  const s = document.createElement('style');
  s.textContent = `
    #mentionBox { display:none; position:absolute; bottom:calc(100% + 6px); left:0; right:0;
      background:var(--bg2); border:1px solid var(--border); border-radius:14px;
      overflow:hidden; max-height:220px; overflow-y:auto; z-index:9999;
      box-shadow:0 8px 32px rgba(0,0,0,.5); }
    #mentionBox.show { display:block; }
    .mi { display:flex; align-items:center; gap:10px; padding:9px 14px; cursor:pointer;
      transition:background .1s; border-bottom:1px solid var(--border); }
    .mi:last-child { border-bottom:none; }
    .mi:hover, .mi.sel { background:var(--surface); }
    .mi-av { width:28px; height:28px; border-radius:7px; display:flex; align-items:center;
      justify-content:center; font-size:.7rem; font-weight:900; color:#fff; flex-shrink:0; }
    .mi-av.sp { background:var(--surface2); font-size:1rem; }
    .mi-name { font-size:.85rem; font-weight:800; color:var(--text-hi); flex:1; }
    .mi-desc { font-size:.72rem; color:var(--muted); }
    .mi-dot { width:7px; height:7px; border-radius:50%; background:var(--green); flex-shrink:0; }
    .msg-mention { color:#7ec8e3; background:rgba(126,200,227,.12); border-radius:4px; padding:1px 4px; font-weight:700; }
    .msg-mention.me { color:#ffd166; background:rgba(255,209,102,.15); }
    .msg-mention.sp { color:#a8e6a3; background:rgba(168,230,163,.12); }
  `;
  document.head.appendChild(s);

  function mc(str) {
    if (typeof strColor === 'function') return strColor(str);
    let h = 0; for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h<<5)-h);
    return 'hsl('+(Math.abs(h)%360)+',60%,45%)';
  }

  // Firebase hazır olana kadar bekle, sonra üyeleri çek
  function waitForDb(cb, tries) {
    tries = tries || 0;
    if (window._db) { cb(); return; }
    if (tries > 40) return; // 20 saniye max
    setTimeout(function() { waitForDb(cb, tries + 1); }, 500);
  }

  async function getMembers() {
    const roomId = window._deskRoom || window._cRoom;
    if (!roomId || !window._db) return [];
    const cached = (window._roomMembersCache || {})[roomId];
    if (cached && cached.length) return cached;
    try {
      const snap = await window._db.ref('rooms/' + roomId).once('value');
      const room = snap.val() || {};
      const members = room.members || [];
      if (!window._roomMembersCache) window._roomMembersCache = {};
      window._roomMembersCache[roomId] = members;
      return members;
    } catch(e) { return []; }
  }

  async function show(query) {
    const q = (query||'').toLowerCase();
    const members = await getMembers();
    const online = window._online || {};
    const cu = window._cu || '';

    const users = members
      .filter(u => u !== cu && (!q || u.toLowerCase().includes(q)))
      .sort((a,b) => { const ao=!!online[a], bo=!!online[b]; return ao!==bo ? (ao?-1:1) : a.localeCompare(b); })
      .slice(0,8)
      .map(u => ({ label:'@'+u, isOnline:!!online[u], color:mc(u), ini:u.slice(0,2).toUpperCase() }));

    const specials = SPECIAL_MENTIONS.filter(s => !q || s.label.toLowerCase().includes(q));

    _items = [...specials.map(s=>({...s,isSp:true})), ...users];
    _idx = 0;

    if (!_items.length) { hide(); return; }
    render();
    _box.classList.add('show');
    _active = true;
  }

  function render() {
    if (!_box) return;
    _box.innerHTML = _items.map(function(item, i) {
      if (item.isSp) {
        return '<div class="mi'+(i===_idx?' sel':'')+'" onmousedown="event.preventDefault()" onclick="window.__mention('+i+')">'
          +'<div class="mi-av sp">'+item.icon+'</div>'
          +'<div class="mi-name">'+item.label+'</div>'
          +'<div class="mi-desc">'+item.desc+'</div></div>';
      }
      return '<div class="mi'+(i===_idx?' sel':'')+'" onmousedown="event.preventDefault()" onclick="window.__mention('+i+')">'
        +'<div class="mi-av" style="background:'+item.color+'">'+item.ini+'</div>'
        +'<div class="mi-name">'+item.label+'</div>'
        +(item.isOnline?'<div class="mi-dot"></div>':'')+
        '</div>';
    }).join('');
  }

  function hide() {
    if (_box) _box.classList.remove('show');
    _active = false; _start = -1; _items = [];
  }

  function ensureBox() {
    if (_box) return;
    _box = document.createElement('div');
    _box.id = 'mentionBox';
    const wrap = document.getElementById('slashSuggestWrap');
    if (wrap) { wrap.appendChild(_box); return; }
    const inpWrap = document.querySelector('.inp-wrap');
    if (inpWrap) { inpWrap.style.position='relative'; inpWrap.appendChild(_box); return; }
    document.body.appendChild(_box);
  }

  window.__mention = function(idx) {
    if (!_inp) return;
    const item = _items[idx]; if (!item) return;
    const before = _inp.value.slice(0, _start);
    const after  = _inp.value.slice(_inp.selectionStart);
    _inp.value = before + item.label + ' ' + after;
    const pos = _start + item.label.length + 1;
    _inp.setSelectionRange(pos, pos);
    _inp.focus();
    hide();
    if (typeof autoResize === 'function') autoResize(_inp);
  };

  function onInput(inp) {
    _inp = inp;
    const val = inp.value, cur = inp.selectionStart;
    let start = -1;
    for (let i = cur-1; i >= 0; i--) {
      if (val[i] === '@') { start = i; break; }
      if (val[i] === ' ' || val[i] === '\n') break;
    }
    if (start === -1) { hide(); return; }
    const q = val.slice(start+1, cur);
    if (q.includes(' ')) { hide(); return; }
    _start = start;
    show(q);
  }

  function onKey(e) {
    if (!_active || !_items.length) return false;
    if (e.key === 'ArrowDown') { e.preventDefault(); _idx=(_idx+1)%_items.length; render(); return true; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); _idx=(_idx-1+_items.length)%_items.length; render(); return true; }
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); window.__mention(_idx); return true; }
    if (e.key === 'Escape') { hide(); return true; }
    return false;
  }

  window.triggerMentionFromBtn = function() {
    const inp = (typeof IS_DESKTOP==='function' && IS_DESKTOP())
      ? document.getElementById('deskInp')
      : document.getElementById('msgInp');
    if (!inp) return;
    inp.focus();
    const pos = inp.selectionStart;
    inp.value = inp.value.slice(0,pos) + '@' + inp.value.slice(pos);
    inp.setSelectionRange(pos+1, pos+1);
    onInput(inp);
  };

  window.highlightMentions = function(text) {
    const cu = window._cu || '';
    return text.replace(/@(here|all|everyone|[\w\u00C0-\u024F]+)/g, function(m, n) {
      return '<span class="msg-mention '+(n===cu?'me':['here','all','everyone'].includes(n)?'sp':'')+'">' + m + '</span>';
    });
  };

  window._roomMembersCache = window._roomMembersCache || {};
  window.cacheRoomMembers = function(roomId, members) {
    window._roomMembersCache[roomId] = members || [];
  };

  function hookInp(inp) {
    if (!inp || inp._mHooked) return;
    inp._mHooked = true;
    inp.addEventListener('input', function() { onInput(inp); });
    inp.addEventListener('keydown', function(e) { onKey(e); });
    inp.addEventListener('blur', function() { setTimeout(hide, 150); });
  }

  function init() {
    ensureBox();
    hookInp(document.getElementById('msgInp'));
    hookInp(document.getElementById('deskInp'));

    // onMsgKey wrap — Firebase hazır olunca
    waitForDb(function() {
      const origMsg = window.onMsgKey;
      window.onMsgKey = function(e) { if (onKey(e)) return; if (origMsg) origMsg(e); };
      const origDesk = window.onDeskMsgKey;
      window.onDeskMsgKey = function(e) { if (onKey(e)) return; if (origDesk) origDesk(e); };
    });

    // @ butonunu güncelle
    document.querySelectorAll('.ii').forEach(function(btn) {
      if (btn.textContent.trim() === '@') {
        btn.onclick = window.triggerMentionFromBtn;
        btn.title = 'Birini etiketle';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 800);

})();
