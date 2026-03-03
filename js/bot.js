/* Nature.co — desktop.js */
/* Otomatik bölümlendi */

/* ══════════════════════════════════════════
   DESKTOP ENGINE
══════════════════════════════════════════ */

// IS_DESKTOP: gerçek masaüstü/tablet tespiti
// Telefon yatayda döndüğünde yanlış desktop moda GEÇMESİN
// Math.min(screen.width, screen.height) → cihazın portrait genişliği
// Telefon: 320-430px → < 768 = ASLA masaüstü
// iPad/Tablet: 768px+ → masaüstü olabilir
// Desktop: her zaman >= 768
const IS_DESKTOP = () => {
  const minScreenDim = Math.min(screen.width || 0, screen.height || 0);
  // Eğer cihaz gerçekten küçükse (telefon) → her zaman mobil
  if (minScreenDim > 0 && minScreenDim < 600) return false;
  return window.innerWidth >= 768;
};

let _deskRoom = null;
let _deskNav = 'home';
let _deskMembersOpen = true;
let _deskStopMsg = null;

function initDesktop() {
  if (!IS_DESKTOP()) return;
  document.getElementById('desktopShell').style.display = 'flex';
  document.getElementById('loginScreen').style.display = 'none';
  // Redirect onLoginSuccess to desktop init
}

function deskOnLogin() {
  if (!IS_DESKTOP()) return;
  document.getElementById('desktopShell').style.display = 'flex';
  // Hide all mobile screens
  document.querySelectorAll('.screen').forEach(s => { s.style.display = 'none'; s.classList.remove('active'); });

  // Kendi fotoğrafını cache'e yükle sonra avatarı set et
  if(_db && _cu){
    dbRef('users/'+_cu+'/photoURL').once('value').then(s=>{
      const url=s.val();
      if(url) _avatarCache[_cu]=url;
      const railUser=document.getElementById('deskRailUser');
      if(railUser){
        railUser.innerHTML='<div class="sdot"></div>';
        railUser.style.background=strColor(_cu);
        if(url) _applyAvatarPhoto(railUser,url);
        else railUser.insertAdjacentText('afterbegin',initials(_cu));
        if(!railUser.querySelector('.sdot')){const d=document.createElement('div');d.className='sdot';railUser.appendChild(d);}
      }
      // Sidebar header avatar
      const sideAv=document.getElementById('deskSidebarAvatar');
      if(sideAv){
        sideAv.style.background=strColor(_cu);
        if(url) _applyAvatarPhoto(sideAv,url);
        else { sideAv.insertAdjacentText('afterbegin',initials(_cu)); }
      }
    });
  }
  // rb-admin görünürlüğü onLoginSuccess._finalizeAdminStatus ile yönetiliyor

  deskNav('home');
  setTimeout(()=>applyTabIcons(true), 100);
}

function deskNav(tab) {
  if (!IS_DESKTOP()) return;
  _deskNav = tab;
  if(typeof _updateURL === 'function') _updateURL(tab);
  closeEmoji();

  // Update rail active state
  document.querySelectorAll('.rail-btn').forEach(b => b.classList.remove('act'));
  const rbEl = document.getElementById('rb-' + tab);
  if (rbEl) rbEl.classList.add('act');

  const sidebar = document.getElementById('deskSidebar');
  const sideTitle = document.getElementById('deskSidebarTitle');
  const sideSub = document.getElementById('deskSidebarSub');

  // Hide chat, show appropriate content
  document.getElementById('deskEmptyState').style.display = 'flex';
  document.getElementById('deskChatArea').style.display = 'none';
  document.getElementById('deskPanelContent').style.display = 'none';

  if (tab === 'home') {
    sidebar.style.display = 'flex';
    sideTitle.textContent = 'Nature.co';
    sideSub.textContent = 'Kanallar & Gruplar';
    deskLoadRoomList();
    // Sidebar açık = kulübe görünür (uyuyorsa)
    if (window._natureBotInstance && window._natureBotInstance.isSleeping) {
      window._natureBotInstance.showKennel();
      window._natureBotInstance.showZzz();
    }
  } else if (tab === 'forum') {
    sidebar.style.display = 'none';
    // Sidebar gizli = kulübeyi gizle
    if (window._natureBotInstance) {
      window._natureBotInstance.hideKennel();
      window._natureBotInstance.hideZzz();
    }
    document.getElementById('deskEmptyState').style.display = 'none';
    document.getElementById('deskPanelContent').style.display = 'flex';
    document.getElementById('deskPanelContent').style.flexDirection = 'column';
    deskLoadForum();
  } else if (tab === 'friends') {
    sidebar.style.display = 'none';
    document.getElementById('deskEmptyState').style.display = 'none';
    document.getElementById('deskPanelContent').style.display = 'flex';
    document.getElementById('deskPanelContent').style.flexDirection = 'column';
    deskLoadFriendsPanel();
  } else if (tab === 'profile') {
    sidebar.style.display = 'none';
    document.getElementById('deskEmptyState').style.display = 'none';
    document.getElementById('deskPanelContent').style.display = 'flex';
    document.getElementById('deskPanelContent').style.flexDirection = 'column';
    deskLoadProfile();
  } else if (tab === 'admin') {
    sidebar.style.display = 'none';
    document.getElementById('deskEmptyState').style.display = 'none';
    document.getElementById('deskPanelContent').style.display = 'flex';
    document.getElementById('deskPanelContent').style.flexDirection = 'column';
    deskLoadAdmin();
  } else if (tab === 'games') {
    sidebar.style.display = 'none';
    document.getElementById('deskEmptyState').style.display = 'none';
    document.getElementById('deskPanelContent').style.display = 'flex';
    document.getElementById('deskPanelContent').style.flexDirection = 'column';
    deskLoadGames();
  } else if (tab === 'watch') {
    sidebar.style.display = 'none';
    document.getElementById('deskEmptyState').style.display = 'none';
    document.getElementById('deskPanelContent').style.display = 'flex';
    document.getElementById('deskPanelContent').style.flexDirection = 'column';
    deskLoadWatch();
  } else if (tab === 'botHome') {
    sidebar.style.display = 'flex';
    const _bhBot = window._natureBotInstance;
    sideTitle.textContent = '🌿 Robot Evi';
    if (_bhBot) {
      if (_bhBot.isSleeping) {
        sideSub.textContent = 'NatureBot uyandırılıyor...';
        _bhBot.wakeUp();
      } else {
        sideSub.textContent = 'NatureBot yuvaya gönderildi 😴';
        _bhBot.goToKennel();
      }
    } else {
      sideSub.textContent = "NatureBot'un yaşam alanı";
    }
    const sideList = document.getElementById('deskSidebarList');
    if (sideList) sideList.innerHTML = '<div style="padding:20px 16px;color:var(--muted);font-size:.8rem;text-align:center;line-height:1.6;">🌿 Kulübeye tıklayarak<br>robotu uyandırabilirsin!</div>';
  }
  setTimeout(()=>applyTabIcons(true), 0);
}

function deskLoadRoomList(q) {
  if (!_db) return;
  dbRef('rooms').once('value').then(snap => {
    const rooms = snap.val() || {};
    const all = Object.values(rooms);
    loadRoomOrder();
    const ch = deskApplyOrder(all.filter(r => r.type === 'channel'));
    const grMember = deskApplyOrder(all.filter(r => r.type === 'group' && (r.members || []).includes(_cu)));
    const grHidden = _isAdmin ? deskApplyOrder(all.filter(r => r.type === 'group' && !(r.members || []).includes(_cu))) : [];
    const dm = deskApplyOrder(all.filter(r => r.type === 'dm' && (r.members || []).includes(_cu) && !((r.hiddenBy||[]).includes(_cu))));

    const filter = q ? q.toLowerCase() : '';
    const matchF = name => !filter || (name || '').toLowerCase().includes(filter);

    let h = '';

    if (!filter) {
      // NatureBot özel satır
      h += `<div class="dsk-sec-hdr"><span class="chev">▸</span>NatureBot</div>`;
      h += `<div class="dsk-row" onclick="if(window._natureBotInstance){window._natureBotInstance.el.click();}else{startNatureBot&&startNatureBot();}" style="position:relative;">
        <div class="dsk-row-ic" style="display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(16,185,129,0.9)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><rect x="7" y="4" width="10" height="7" rx="2"/><circle cx="9" cy="15" r="1.5" fill="rgba(16,185,129,0.9)" stroke="none"/><circle cx="15" cy="15" r="1.5" fill="rgba(16,185,129,0.9)" stroke="none"/><path d="M9.5 8H7m3.5 0h3m3.5 0H14"/></svg></div>
        <div class="dsk-row-name" style="color:var(--accent);">NatureBot</div>
        <div style="font-size:.65rem;color:rgba(16,185,129,.55);font-weight:700;margin-left:auto;padding-right:4px;letter-spacing:.05em;">AI</div>
      </div>`;

      // Channels
      if (ch.length) {
        h += `<div class="dsk-sec-hdr"><span class="chev">▸</span>Kanallar<span class="sec-add-btn" onclick="event.stopPropagation();if(_isAdmin)adminTab('rooms')" title="Kanal oluştur (Admin)">＋</span></div>`;
        ch.filter(r => matchF(r.name)).forEach(r => { h += deskRoomRow(r, false, false); });
      }

      // My groups
      const myGr = grMember.filter(r => matchF(r.name));
      const hiddenGr = grHidden.filter(r => matchF(r.name));
      if (myGr.length || hiddenGr.length || _isAdmin) {
        h += '<div class="dsk-sec-hdr"><span class="chev">▸</span>Gruplar<span class="sec-add-btn" onclick="event.stopPropagation();openCreateGroupModal()" title="Grup oluştur">＋</span></div>';
        myGr.forEach(r => { h += deskRoomRow(r, true, false); });
        hiddenGr.forEach(r => { h += deskRoomRow(r, false, true); });
      }

      // DMs
      h += '<div class="dsk-sec-hdr"><span class="chev">▸</span>Direkt Mesajlar<span class="sec-add-btn" onclick="event.stopPropagation();openDMModal()" title="Yeni DM">＋</span></div>';
      if (dm.length) {
        dm.forEach(r => { h += deskDmRow(r); });
      } else {
        h += '<div style="padding:4px 14px;font-size:.78rem;color:var(--muted)">＋ ile yeni mesaj başlat</div>';
      }
    } else {
      // Search results
      const allMatch = all.filter(r => r.type !== 'dm' && matchF(r.name));
      const dmMatch = dm.filter(r => {
        const other = (r.members || []).find(m => m !== _cu) || '';
        return matchF(other);
      });
      allMatch.forEach(r => { h += deskRoomRow(r, (r.members || []).includes(_cu), _isAdmin && !(r.members || []).includes(_cu)); });
      dmMatch.forEach(r => { h += deskDmRow(r); });
      if (!allMatch.length && !dmMatch.length) h = '<div style="padding:16px;color:var(--muted);font-size:.82rem;text-align:center">Sonuç bulunamadı</div>';
    }

    document.getElementById('deskSideList').innerHTML = h || '<div style="padding:16px;color:var(--muted);font-size:.82rem">Henüz oda yok.</div>';
    setTimeout(initDeskDnd, 50);
  });
}

function deskRoomRow(r, isMyGroup, isHiddenAdmin) {
  const unread = _unread[r.id] || 0;
  const icon = r.type === 'group' ? '👥' : '#';
  const isActive = _deskRoom === r.id;
  const last = _lastMsg[r.id] || {};
  const prevText = last.text ? (last.text.length > 42 ? last.text.slice(0,42)+'…' : last.text) : (last.file ? '📎 Dosya' : '');
  const prevUser = last.user || '';
  const onlineCount = r.type==='group'
    ? (r.members||[]).filter(m=>!!_online[m]).length
    : Object.keys(_online||{}).length;
  const popup = `<div class="room-preview-popup">
    <div class="rpp-name">${icon} ${esc(r.name||r.id)}</div>
    ${prevText ? `<div class="rpp-msg">${prevUser?`<b style="color:var(--text-hi)">${esc(prevUser)}:</b> `:''} ${esc(prevText)}</div>` : ''}
    <div class="rpp-meta"><div class="rpp-dot"></div><span>${onlineCount} çevrimiçi</span></div>
  </div>`;
  return '<div class="dsk-row' + (isActive ? ' act' : '') + '" data-id="' + r.id + '" style="position:relative" onclick="deskOpenRoom(this.dataset.id)">' +
    '<div class="dsk-drag-handle" onclick="event.stopPropagation()">⠿</div>' +
    '<div class="dsk-row-ic">' + icon + '</div>' +
    '<div class="dsk-row-name">' + esc(r.name || r.id) + '</div>' +
    (isHiddenAdmin ? '<span class="dsk-spy-tag">👁</span>' : '') +
    (unread ? '<div class="dsk-row-badge">' + unread + '</div>' : '') +
    popup +
    '</div>';
}

function deskDmRow(r) {
  const other = (r.members || []).find(m => m !== _cu) || '?';
  const on = !!_online[other];
  const unread = _unread[r.id] || 0;
  const isActive = _deskRoom === r.id;
  return '<div class="dsk-row dsk-dm-row' + (isActive ? ' act' : '') + '" data-id="' + r.id + '" onclick="deskOpenRoom(this.dataset.id)">' +
    '<div class="dsk-row-av" style="background:' + strColor(other) + '">' + initials(other) +
    '<div class="r-dot ' + (on ? 'on' : 'off') + '"></div></div>' +
    '<div class="dsk-row-name">' + esc(other) + '</div>' +
    (unread ? '<div class="dsk-row-badge">' + unread + '</div>' : '') +
    `<div class="dsk-dm-close" onclick="event.stopPropagation();closeDmConversation('${r.id}')" title="Kapat"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></div>` +
    '</div>';
}

function deskSearch(q) {
  if (_deskNav === 'home') deskLoadRoomList(q);
  else if (_deskNav === 'friends') deskLoadFriendsList(q);
}

function deskOpenRoom(roomId) {
  if (_deskStopMsg) { _deskStopMsg(); _deskStopMsg = null; }
  _deskRoom = roomId;
  clearUnreadBadge(roomId);
  _currentMsgBox = 'deskMsgs';
  markRoomRead(roomId);
  listenReads(roomId);

  // Highlight active row
  document.querySelectorAll('.dsk-row').forEach(r => r.classList.remove('act'));
  const activeRows = document.querySelectorAll('[onclick*="' + roomId + '"]');
  activeRows.forEach(r => r.classList.add('act'));

  // Show chat area
  document.getElementById('deskEmptyState').style.display = 'none';
  document.getElementById('deskPanelContent').style.display = 'none';
  const ca = document.getElementById('deskChatArea');
  ca.style.display = 'flex';
  ca.style.flexDirection = 'column';
  ca.style.flex = '1';
  ca.style.overflow = 'hidden';

  // Also sync mobile _cRoom for sending
  _cRoom = roomId;
  listenPinBar(roomId);

  const msgs = document.getElementById('deskMsgs');
  msgs.innerHTML = '<div class="ld"><span></span><span></span><span></span></div>';

  // ── Mesajları HEMEN dinlemeye başla — oda verisini bekleme ──
  const ref = dbRef('msgs/' + roomId);
  const h = snap2 => { if (_deskRoom !== roomId) return; deskRenderMsgs(snap2.val()); };
  ref.on('value', h);
  let _deskNotifFirst = true;
  const notifRef = dbRef('msgs/' + roomId);
  const notifH = snap2 => {
    if(_deskNotifFirst){ _deskNotifFirst=false; return; }
    const msg = snap2.val();
    if(msg) checkAndNotify(roomId, msg);
  };
  notifRef.on('child_added', notifH);
  _deskStopMsg = () => { ref.off('value', h); notifRef.off('child_added', notifH); };

  // ── Oda verisi paralel yükle (header/ayarlar için) ──
  dbRef('rooms/' + roomId).once('value').then(snap => {
    const room = snap.val();
    if (!room || _deskRoom !== roomId) return;
    const isHiddenAdmin = _isAdmin && room.type === 'group' && !(room.members || []).includes(_cu);

    // Update header
    const ic = document.getElementById('deskChatHdrIcon');
    if (room.type === 'dm') {
      const other = (room.members || []).find(m => m !== _cu) || '?';
      ic.textContent = initials(other); ic.style.background = strColor(other);
      document.getElementById('deskChatHdrName').textContent = other;
      document.getElementById('deskChatHdrSub').textContent = _online[other] ? '🟢 Çevrimiçi' : 'Çevrimdışı';
      document.getElementById('deskCallAudio').style.display = 'flex';
      document.getElementById('deskCallVideo').style.display = 'flex';
      document.getElementById('deskCallScreen').style.display = (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) ? 'flex' : 'none';
      document.getElementById('deskToggleMembers').style.display = 'none';
    } else {
      ic.textContent = room.type === 'group' ? '👥' : '#';
      ic.style.background = room.type === 'group' ? 'linear-gradient(135deg,#9b72ff,#c4a7ff)' : 'var(--surface2)';
      document.getElementById('deskChatHdrName').textContent = room.name || roomId;
      document.getElementById('deskChatHdrSub').textContent = room.type === 'group' ? (room.members || []).length + ' üye' : 'Kanal';
      document.getElementById('deskCallAudio').style.display = 'none';
      document.getElementById('deskCallVideo').style.display = 'none';
      document.getElementById('deskCallScreen').style.display = 'none';
      document.getElementById('deskToggleMembers').style.display = room.type === 'group' ? 'flex' : 'none';
    }

    // Spy banner
    const spyBanner = document.getElementById('deskSpyBanner');
    const mobileSpyBanner = document.getElementById('adminSpyBanner');
    const spyContent = `<span style="font-size:.82rem;color:#f5a623;font-weight:700;">\u{1F441} G\u00f6zetleme Modu</span><button onclick="adminJoinGroup()" style="margin-left:auto;background:rgba(245,166,35,.2);border:1px solid rgba(245,166,35,.4);color:#f5a623;border-radius:6px;padding:4px 14px;font-size:.78rem;font-weight:700;cursor:pointer;">Gruba Kat\u0131l</button>`;
    if (isHiddenAdmin) {
      spyBanner.innerHTML = spyContent;
      spyBanner.style.display = 'flex';
      if (mobileSpyBanner) { mobileSpyBanner.innerHTML = spyContent; }
      document.getElementById('deskInputArea').style.display = 'none';
    } else {
      spyBanner.style.display = 'none';
      document.getElementById('deskInputArea').style.display = 'block';
      const inp = document.getElementById('deskInp');
      if (inp) inp.placeholder = (room.locked && !_isAdmin) ? '🔒 Bu oda kilitli' : 'Mesaj yaz...';
    }

    // Load members panel
    if (room.type === 'group' && _deskMembersOpen) {
      deskLoadMembers(room);
    } else {
      document.getElementById('deskMemberPanel').classList.add('hidden');
    }

    // Update placeholder for locked rooms
    if (room.locked && !_isAdmin) {
      document.getElementById('deskInp').disabled = true;
      document.getElementById('deskSendBtn').disabled = true;
      document.getElementById('deskInp').placeholder = '🔒 Bu oda kilitli';
    } else {
      document.getElementById('deskInp').disabled = false;
      document.getElementById('deskSendBtn').disabled = false;
    }
  });
}

function deskRenderMsgs(msgsObj) {
  const box = document.getElementById('deskMsgs');
  if (!box) return;
  const wasAtBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 100;
  const msgs = msgsObj ? Object.entries(msgsObj).map(([k,v]) => ({...v, _key: k})).sort((a,b) => a.ts - b.ts) : [];
  if (!msgs.length) {
    box.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--muted);font-size:.85rem">Henüz mesaj yok. İlk mesajı gönder!</div>';
    return;
  }
  let h = '', lastDate = '', lastUser = '', lastTs = 0;
  msgs.forEach(m => {
    try {
      if (m.sys) { h += '<div class="msg-sys">' + esc(m.text) + '</div>'; lastUser = ''; return; }
      const own = m.user === _cu;
      const d = new Date(m.ts || 0);
      const ds = formatDate(d);
      if (ds !== lastDate) { h += '<div style="text-align:center;margin:12px 0 8px;"><span style="background:var(--surface2);color:var(--muted);font-size:.72rem;border-radius:100px;padding:2px 12px;font-weight:700;">' + ds + '</span></div>'; lastDate = ds; lastUser = ''; }
      const gap = (m.ts - lastTs) > 300000;
      const first = m.user !== lastUser || gap;
      lastUser = m.user; lastTs = m.ts;
      let content = '';
      if (m.file) {
        if (m.file.type && m.file.type.startsWith('image/')) content = m.file.isEmoji ? '<img src="' + m.file.data + '" style="width:48px;height:48px;border-radius:6px;vertical-align:middle;">' : '<img class="msg-img" src="' + m.file.data + '" onclick="zoomImg(this.src)" loading="lazy" style="max-width:300px;border-radius:8px;margin-top:4px;display:block;">';
        else if (m.file.type && m.file.type.startsWith('video/')) content = '<video controls style="max-width:300px;border-radius:8px;margin-top:4px"><source src="' + m.file.data + '" type="' + m.file.type + '"></video>';
        else content = '<div class="msg-file-card" onclick="downloadDataUrl(\'' + m.file.data + '\',\'' + esc(m.file.name||'dosya') + '\')"><div class="msg-file-icon">📄</div><div class="msg-file-info"><div class="msg-file-name">' + esc(m.file.name) + '</div><div class="msg-file-size">' + fmtSize(m.file.size) + '</div></div><div style="margin-left:auto;font-size:1rem;color:var(--muted);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14m-7-7 7 7 7-7"/></svg></div></div>';
      } else {
        const safeText = linkify(esc(m.text || ''));
        content = own ? '<div class="ob">' + safeText + '</div>' : '<div class="mb-text">' + safeText + '</div>';
      }
      const meta = first ? '<div class="mb-meta"><div class="mb-name" style="color:' + strColor(m.user) + '">' + esc(own ? _cu : m.user) + '</div><div class="mb-ts">' + fmtTime(m.ts) + (own ? getMsgStatusSvg('sent') : '') + '</div></div>' :
        (own ? '<div class="mb-meta mb-meta-mini"><div class="mb-ts">' + fmtTime(m.ts) + getMsgStatusSvg('sent') + '</div></div>' : '');
      const reactionsHtml = buildReactionsHtml(_deskRoom, m._key, m.reactions);
       const avMenuBtnDesk = '<button class="mb-av-menu-btn" data-room="' + _deskRoom + '" data-key="' + m._key + '" data-own="' + own + '" data-admin="' + _isAdmin + '" data-text="' + esc(m.text||'').replace(/"/g,'&quot;') + '" onclick="showMsgMenuAtBtn(event)"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg></button>';




       h += '<div class="mb ' + (own ? 'own' : '') + ' ' + (first ? 'first' : '') + '" data-key="' + m._key + '"' + (own ? ' data-ts="' + m.ts + '"' : '') + '>' +
         '<div class="av ' + (first ? '' : 'ghost') + '" style="background:' + strColor(m.user) + '">' + initials(m.user) + '</div>' +
         (own ? avMenuBtnDesk : '') +
         '<div class="mb-body">' + meta + content + reactionsHtml + '</div>' +
         (own ? '' : avMenuBtnDesk) +
         '</div>';
    } catch(e) {}
  });
  const prevKeys = new Set(Array.from(box.querySelectorAll('.mb[data-key]')).map(el=>el.dataset.key));
  box.innerHTML = h;
  if (wasAtBottom) box.scrollTop = box.scrollHeight;
  // Sadece YENİ gelen mesajlara pop animasyonu
  box.querySelectorAll('.mb[data-key]').forEach(el=>{
    if(!prevKeys.has(el.dataset.key)){
      el.classList.add('pop-in');
      setTimeout(()=>el.classList.remove('pop-in'), 400);
    }
  });
  // Hover tooltip ekle
  if (typeof window._addTimestampTooltips === 'function') {
    // tüm mesajlara ts ekle
    msgs.forEach(m => {
      const el = box.querySelector('.mb[data-key="' + m._key + '"]');
      if (el && !el.dataset.ts) el.dataset.ts = m.ts;
    });
    window._addTimestampTooltips();
  }
  if(_deskRoom){markRoomRead(_deskRoom);updateMsgStatuses(_deskRoom);}
}
function deskLoadMembers(room) {
  const panel = document.getElementById('deskMemberPanel');
  const list = document.getElementById('deskMemberList');
  panel.classList.remove('hidden');
  const members = room.members || [];
  const online = members.filter(u => _online[u]);
  const offline = members.filter(u => !_online[u]);
  let h = '';
  if (online.length) {
    h += '<div style="font-size:.65rem;font-weight:900;color:var(--muted);padding:6px 8px 2px;text-transform:uppercase;letter-spacing:.06em;">Çevrimiçi — ' + online.length + '</div>';
    online.forEach(u => { h += deskMemberRow(u, true); });
  }
  if (offline.length) {
    h += '<div style="font-size:.65rem;font-weight:900;color:var(--muted);padding:10px 8px 2px;text-transform:uppercase;letter-spacing:.06em;">Çevrimdışı — ' + offline.length + '</div>';
    offline.forEach(u => { h += deskMemberRow(u, false); });
  }
  list.innerHTML = h;
}

function deskMemberRow(u, online) {
  return '<div class="desk-member-row">' +
    '<div class="desk-m-av" style="background:' + strColor(u) + '">' + initials(u) +
    '<div class="r-dot ' + (online ? 'on' : 'off') + '"></div></div>' +
    '<div class="desk-m-name">' + esc(u) + '</div>' +
    (online ? '<div style="width:7px;height:7px;border-radius:50%;background:var(--green);flex-shrink:0;"></div>' : '') +
    '</div>';
}

function toggleDeskMembers() {
  _deskMembersOpen = !_deskMembersOpen;
  const panel = document.getElementById('deskMemberPanel');
  panel.classList.toggle('hidden', !_deskMembersOpen);
}

function deskLoadFriendsList(q) {
  const list = document.getElementById('deskSideList');
  list.innerHTML = '<div class="ld"><span></span><span></span><span></span></div>';
  dbRef('users').once('value').then(snap => {
    const users = snap.val() || {};
    const filter = (q || '').toLowerCase();
    const all = Object.keys(users).filter(u => {
      if(u === _cu) return false;
      if(users[u].banned) return false;
      if(filter && !u.toLowerCase().includes(filter)) return false;
      return true;
    });
    if (!all.length) { list.innerHTML = '<div style="padding:16px;color:var(--muted);font-size:.82rem">Kullanıcı bulunamadı</div>'; return; }
    const onlineUsers = all.filter(u => _online[u]);
    const offlineUsers = all.filter(u => !_online[u]);
    let h = '';
    if (onlineUsers.length) {
      h += '<div class="dsk-sec-hdr"><span class="chev">▸</span>Çevrimiçi — ' + onlineUsers.length + '</div>';
      onlineUsers.forEach(u => { h += deskUserRow(u, users[u], true); });
    }
    if (offlineUsers.length) {
      h += '<div class="dsk-sec-hdr"><span class="chev">▸</span>Çevrimdışı</div>';
      offlineUsers.forEach(u => { h += deskUserRow(u, users[u], false); });
    }
    list.innerHTML = h;
  });
}

function deskUserRow(u, data, online) {
  return '<div class="dsk-row" data-u="' + u + '" onclick="startDMWithUser(this.dataset.u)">' +
    '<div class="dsk-row-av" style="background:' + strColor(u) + '">' + initials(u) +
    '<div class="r-dot ' + (online ? 'on' : 'off') + '"></div></div>' +
    '<div class="dsk-row-name">' + esc(u) + (data.origin ? ' <span style="font-size:.65rem;color:var(--muted);">' + data.origin.split(' ')[0] + '</span>' : '') + '</div>' +
    '</div>';
}

function startDMWithUser(username) {
  if (!_db || !_cu) return;
  const possible = [_cu + '_dm_' + username, username + '_dm_' + _cu];
  dbRef('rooms').once('value').then(snap => {
    const rooms = snap.val() || {};
    const existing = Object.values(rooms).find(r => r.type === 'dm' && r.members && r.members.includes(_cu) && r.members.includes(username));
    if (existing) {
      // Unhide if previously hidden
      if(existing.hiddenBy && existing.hiddenBy.includes(_cu)){
        const updated = existing.hiddenBy.filter(u=>u!==_cu);
        dbRef('rooms/'+existing.id+'/hiddenBy').set(updated.length?updated:null);
      }
      deskNav('home'); setTimeout(() => deskOpenRoom(existing.id), 200); return;
    }
    const id = [_cu, username].sort().join('_dm_');
    dbRef('rooms/' + id).set({ id, type: 'dm', members: [_cu, username], ts: Date.now() }).then(() => {
      deskNav('home');
      setTimeout(() => deskOpenRoom(id), 300);
    });
  });
}

let _deskForumCat = 'hepsi';
let _deskForumStop = null;

function deskLoadForum(cat) {
  if (cat !== undefined) _deskForumCat = cat;
  const panel = document.getElementById('deskPanelContent');
  panel.style.overflowY = 'hidden';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';

  const CAT_LABELS2 = {genel:'💬 Genel',tarih:'📜 Tarih',kultur:'🎭 Kültür',spor:'⚽ Spor',muzik:'🎵 Müzik',teknoloji:'💻 Teknoloji',soru:'❓ Soru'};
  function ftab(key,label){ return `<div class="dsk-ftab${_deskForumCat===key?' act':''}" onclick="deskLoadForum('${key}')">${label}</div>`; }

  panel.innerHTML =
    '<div class="dsk-forum-wrap" id="deskForumWrap">'+
      '<div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">'+
        '<div class="dsk-forum-topbar">'+
          ftab('hepsi','Tümü')+ftab('genel','💬 Genel')+ftab('tarih','📜 Tarih')+
          ftab('kultur','🎭 Kültür')+ftab('spor','⚽ Spor')+ftab('muzik','🎵 Müzik')+
          ftab('teknoloji','💻 Teknoloji')+ftab('soru','❓ Soru')+
        '</div>'+
        '<div class="dsk-compose">'+
          '<div style="display:flex;gap:12px;align-items:flex-start;">'+
            '<div style="width:38px;height:38px;border-radius:10px;background:'+strColor(_cu)+';display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:900;color:#fff;flex-shrink:0;">'+initials(_cu)+'</div>'+
            '<div style="flex:1;">'+
              '<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;transition:border-color .15s;" onfocusin="this.style.borderColor=\'var(--accent)\'" onfocusout="this.style.borderColor=\'var(--border)\'">'+
                '<div style="display:flex;flex-wrap:wrap;gap:1px;padding:5px 8px;border-bottom:1px solid var(--border);background:var(--surface2);align-items:center;">'+
                  '<button onclick="dbbWrap(\'b\')" title="Kalın" class="fmt-btn"><b>B</b></button>'+
                  '<button onclick="dbbWrap(\'i\')" title="İtalik" class="fmt-btn"><i>I</i></button>'+
                  '<button onclick="dbbWrap(\'u\')" title="Altı Çizili" class="fmt-btn"><u>U</u></button>'+
                  '<button onclick="dbbWrap(\'s\')" title="Üstü Çizili" class="fmt-btn"><s>S</s></button>'+
                  '<span style="width:1px;height:16px;background:var(--border);margin:0 3px;flex-shrink:0;"></span>'+
                  '<button onclick="dbbColor()" title="Renk" class="fmt-btn">🎨</button>'+
                  '<button onclick="dbbSize()" title="Boyut" class="fmt-btn" style="font-size:.78rem;font-weight:700;">Aa</button>'+
                  '<span style="width:1px;height:16px;background:var(--border);margin:0 3px;flex-shrink:0;"></span>'+
                  '<button onclick="dbbWrap(\'url\')" title="Link" class="fmt-btn">🔗</button>'+
                  '<button onclick="dbbWrap(\'img\')" title="Resim" class="fmt-btn">🖼️</button>'+
                  '<span style="width:1px;height:16px;background:var(--border);margin:0 3px;flex-shrink:0;"></span>'+
                  '<button onclick="dbbInsert(\'[list]\\n[*] \')" title="Liste" class="fmt-btn">• ≡</button>'+
                  '<button onclick="dbbWrap(\'quote\')" title="Alıntı" class="fmt-btn">❝</button>'+
                  '<button onclick="dbbWrap(\'code\')" title="Kod" class="fmt-btn" style="font-family:monospace;font-size:.8rem;">&lt;/&gt;</button>'+
                  '<button onclick="dbbWrap(\'spoiler\')" title="Spoiler" class="fmt-btn">👁️</button>'+
                  '<span style="width:1px;height:16px;background:var(--border);margin:0 3px;flex-shrink:0;"></span>'+
                  '<button onclick="toggleDbbPreview()" id="dbbPreviewBtn" title="Önizleme" class="fmt-btn" style="font-size:.75rem;font-weight:700;">👁 Önizle</button>'+
                '</div>'+
                '<textarea class="dsk-compose-inp" id="deskForumInp" placeholder="Düşüncelerini paylaş..." rows="3" oninput="this.style.height=\'auto\';this.style.height=Math.min(this.scrollHeight,300)+\'px\'"></textarea>'+
                '<div id="dbbPreviewArea" style="display:none;padding:10px 13px;min-height:50px;border-top:1px solid var(--border);font-size:.9rem;line-height:1.6;color:var(--text-hi);background:var(--bg2);word-break:break-word;"></div>'+
              '</div>'+

              '<div class="dsk-compose-footer">'+
                '<select class="dsk-cat-sel" id="deskForumCatSel">'+
                  '<option value="genel">💬 Genel</option><option value="tarih">📜 Tarih</option>'+
                  '<option value="kultur">🎭 Kültür</option><option value="spor">⚽ Spor</option>'+
                  '<option value="muzik">🎵 Müzik</option><option value="teknoloji">💻 Teknoloji</option>'+
                  '<option value="soru">❓ Soru</option>'+
                '</select>'+
                '<button class="dsk-forum-post-btn" onclick="deskSubmitForumPost()">Paylaş →</button>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="dsk-forum-feed" id="deskForumFeed"></div>'+
      '</div>';

  deskForumLoadFeed();
}

function deskForumLoadFeed() {
  if (_deskForumStop) { _deskForumStop(); _deskForumStop = null; }
  const feed = document.getElementById('deskForumFeed');
  if (!feed) return;
  const CAT_LABELS2 = {genel:'💬 Genel',tarih:'📜 Tarih',kultur:'🎭 Kültür',spor:'⚽ Spor',muzik:'🎵 Müzik',teknoloji:'💻 Teknoloji',soru:'❓ Soru'};
  let ref = dbRef('forum/posts').orderByChild('ts').limitToLast(80);
  const handler = ref.on('value', snap => {
    const feed2 = document.getElementById('deskForumFeed');
    if (!feed2) return;
    const posts = snap.val() || {};
    const arr = Object.entries(posts).map(([k,v])=>({...v,_key:k})).sort((a,b)=>b.ts-a.ts);
    const filtered = _deskForumCat==='hepsi' ? arr : arr.filter(p=>p.cat===_deskForumCat);
    feed2.innerHTML = filtered.length
      ? filtered.map(p=>deskForumEntryHTML(p)).join('')
      : '<div style="text-align:center;padding:60px 20px;color:var(--muted);"><div style="font-size:3rem;margin-bottom:12px;">📋</div><div style="font-size:1rem;font-weight:700;color:var(--text-hi);">Henüz entry yok</div><div style="margin-top:6px;font-size:.85rem;">İlk entry\'i sen yaz!</div></div>';
  });
  _deskForumStop = ()=>ref.off('value',handler);
}

function deskForumEntryHTML(p) {
  const CAT_LABELS2 = {genel:'💬 Genel',tarih:'📜 Tarih',kultur:'🎭 Kültür',spor:'⚽ Spor',muzik:'🎵 Müzik',teknoloji:'💻 Teknoloji',soru:'❓ Soru'};
  const lc=p.likes?Object.keys(p.likes).length:0, liked=!!(p.likes&&p.likes[_cu]);
  const dc=p.dislikes?Object.keys(p.dislikes).length:0, disliked=!!(p.dislikes&&p.dislikes[_cu]);
  const hc=p.hearts?Object.keys(p.hearts).length:0, hearted=!!(p.hearts&&p.hearts[_cu]);
  const comments=p.comments?Object.values(p.comments).sort((a,b)=>a.ts-b.ts):[];
  const time=new Date(p.ts||0).toLocaleString('tr-TR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const canDel=(p.user===_cu)||_isAdmin;

  let h = '<div class="dsk-entry" id="dskentry-'+p._key+'">';
  h += '<div class="dsk-entry-header">';
  h += '<div class="dsk-entry-av" style="background:'+strColor(p.user||'?')+'">'+initials(p.user||'?')+'</div>';
  h += '<div class="dsk-entry-meta">';
  h += '<div class="dsk-entry-author">'+esc(p.user||'?')+'<span class="dsk-entry-cat-badge">'+(CAT_LABELS2[p.cat]||p.cat||'')+'</span></div>';
  h += '<div class="dsk-entry-time">'+time+'</div></div>';
  h += canDel?`<button class="dsk-entry-del-btn" onclick="deskForumDeletePost('${p._key}')">🗑️</button>`:'';
  h += '</div>';
  h += '<div class="dsk-entry-body">'+(p.bbcode ? parseBBCode(p.text||'') : esc(p.text||''))+'</div>';
  h += '<div class="dsk-entry-footer">';
  h += `<button class="dsk-vote-btn${liked?' active-up':''}" onclick="forumVote('${p._key}','like')"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/></svg> ${lc}</button>`;
  h += `<button class="dsk-vote-btn${disliked?' active-down':''}" onclick="forumVote('${p._key}','dislike')"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/></svg> ${dc}</button>`;
  h += `<button class="dsk-vote-btn${hearted?' active-heart':''}" onclick="forumHeart('${p._key}')">❤️ ${hc}</button>`;
  h += `<button class="dsk-entry-reply-btn" onclick="deskToggleReply('${p._key}')"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${comments.length?comments.length+' yorum':'Yorum'}</button>`;
  h += '</div>';
  if(comments.length){
    h += '<div class="dsk-comments">';
    comments.forEach(c=>{
      const ct=new Date(c.ts||0).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
      const cDel=(c.user===_cu)||_isAdmin;
      h += '<div class="dsk-comment"><div class="dsk-comment-av" style="background:'+strColor(c.user||'?')+'">'+initials(c.user||'?')+'</div>';
      h += '<div class="dsk-comment-body"><span class="dsk-comment-author">'+esc(c.user||'?')+'</span><span class="dsk-comment-time">'+ct+'</span>';
      h += cDel?`<button onclick="deskForumDeleteComment('${p._key}','${c.key||''}')" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:.7rem;margin-left:4px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>`:'';
      h += '<div class="dsk-comment-text">'+esc(c.text||'')+'</div></div></div>';
    });
    h += '</div>';
  }
  h += '<div class="dsk-reply-area" id="dsk-reply-'+p._key+'">';
  h += `<textarea class="dsk-reply-inp" id="dsk-reply-inp-${p._key}" placeholder="Yorumunu yaz..." rows="1" oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();deskForumSendComment('${p._key}')}"></textarea>`;
  h += `<button class="dsk-reply-send" onclick="deskForumSendComment('${p._key}')">Gönder</button></div>`;
  h += '</div>';
  return h;
}

function deskToggleReply(k){
  const a=document.getElementById('dsk-reply-'+k);
  if(!a)return;
  a.classList.toggle('open');
  if(a.classList.contains('open')){const i=document.getElementById('dsk-reply-inp-'+k);if(i)i.focus();}
}
function deskForumSendComment(postKey){
  const inp=document.getElementById('dsk-reply-inp-'+postKey);
  if(!inp)return;
  const txt=inp.value.trim();if(!txt)return;
  const ck=dbRef('forum/posts/'+postKey+'/comments').push().key;
  dbRef('forum/posts/'+postKey+'/comments/'+ck).set({key:ck,user:_cu,text:txt,ts:Date.now()})
    .then(()=>{inp.value='';inp.style.height='auto';}).catch(()=>showToast('Hata.'));
}
function deskForumDeletePost(k){if(!confirm('Bu entry silinsin mi?'))return;dbRef('forum/posts/'+k).remove().catch(()=>showToast('Hata.'));}
function deskForumDeleteComment(pk,ck){dbRef('forum/posts/'+pk+'/comments/'+ck).remove().catch(()=>showToast('Hata.'));}
/* Desktop BBCode editör yardımcıları */
function dbbWrap(tag){
  const ta=document.getElementById('deskForumInp');
  if(!ta) return;
  const s=ta.selectionStart,e=ta.selectionEnd,sel=ta.value.slice(s,e);
  let open=`[${tag}]`,close=`[/${tag}]`;
  if(tag==='url'){const href=prompt('Link URL:','https://');if(!href)return;open=`[url=${href}]`;close='[/url]';}
  ta.value=ta.value.slice(0,s)+open+sel+close+ta.value.slice(e);
  ta.selectionStart=s+open.length; ta.selectionEnd=s+open.length+sel.length;
  ta.focus(); ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,300)+'px';
  if(document.getElementById('dbbPreviewArea')?.style.display!=='none') updateDbbPreview();
}
function dbbInsert(text){
  const ta=document.getElementById('deskForumInp');
  if(!ta) return;
  const s=ta.selectionStart;
  ta.value=ta.value.slice(0,s)+text+ta.value.slice(s);
  ta.selectionStart=ta.selectionEnd=s+text.length;
  ta.focus(); ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,300)+'px';
}
function dbbColor(){
  const c=prompt('Renk (örn: red, #ff0000):','red'); if(!c) return;
  const ta=document.getElementById('deskForumInp');
  const s=ta.selectionStart,e=ta.selectionEnd,sel=ta.value.slice(s,e)||'metin';
  const tag=`[color=${c}]${sel}[/color]`;
  ta.value=ta.value.slice(0,s)+tag+ta.value.slice(e);
  ta.selectionStart=ta.selectionEnd=s+tag.length; ta.focus();
}
function dbbSize(){
  const sz=prompt('Yazı boyutu (8-32):','16'); if(!sz||isNaN(sz)) return;
  const ta=document.getElementById('deskForumInp');
  const s=ta.selectionStart,e=ta.selectionEnd,sel=ta.value.slice(s,e)||'metin';
  const tag=`[size=${sz}]${sel}[/size]`;
  ta.value=ta.value.slice(0,s)+tag+ta.value.slice(e);
  ta.selectionStart=ta.selectionEnd=s+tag.length; ta.focus();
}
function toggleDbbPreview(){
  const area=document.getElementById('dbbPreviewArea');
  const btn=document.getElementById('dbbPreviewBtn');
  const ta=document.getElementById('deskForumInp');
  if(!area) return;
  if(area.style.display==='none'){
    area.style.display='block';
    if(btn){btn.style.background='var(--accent2)';btn.style.color='var(--text-hi)';}
    updateDbbPreview();
    ta.addEventListener('input',updateDbbPreview);
  } else {
    area.style.display='none';
    if(btn){btn.style.background='';btn.style.color='';}
    ta.removeEventListener('input',updateDbbPreview);
  }
}
function updateDbbPreview(){
  const ta=document.getElementById('deskForumInp');
  const area=document.getElementById('dbbPreviewArea');
  if(!ta||!area) return;
  area.innerHTML=parseBBCode(ta.value)||'<span style="color:var(--muted);font-size:.82rem">Önizleme burada görünecek...</span>';
}

function deskSubmitForumPost(){
  const inp=document.getElementById('deskForumInp');
  const txt=inp?.value.trim();
  const cat=document.getElementById('deskForumCatSel')?.value||'genel';
  if(!txt){showToast('Bir şeyler yaz!');return;}
  const btn=document.querySelector('.dsk-forum-post-btn');
  if(btn){btn.disabled=true;btn.textContent='Paylaşılıyor...';}
  const key=dbRef('forum/posts').push().key;
  dbRef('forum/posts/'+key).set({key,user:_cu,text:txt,bbcode:true,cat,ts:Date.now(),likes:{},dislikes:{},hearts:{},comments:{}})
    .then(()=>{
      showToast('Entry paylaşıldı! ✅');
      if(inp){inp.value='';inp.style.height='auto';}
      if(btn){btn.disabled=false;btn.textContent='Paylaş →';}
    }).catch(()=>{showToast('Hata.');if(btn){btn.disabled=false;btn.textContent='Paylaş →';}});
}

function deskLoadProfile() {
  const panel = document.getElementById('deskPanelContent');
  panel.style.overflowY = 'auto';
  const isAdmin = _isAdmin;
  panel.innerHTML =
    '<div style="max-width:520px;margin:0 auto;display:flex;flex-direction:column;height:100%;">' +
    // Tab bar
    '<div style="display:flex;border-bottom:1px solid var(--border);flex-shrink:0;padding:0 20px;margin-top:16px;">' +
    '<div id="dptab-profile" onclick="deskSwitchProfTab(\'profile\')" style="padding:10px 16px;font-size:.8rem;font-weight:700;color:#fff;border-bottom:2px solid var(--accent);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>Profil</div>' +
    '<div id="dptab-appearance" onclick="deskSwitchProfTab(\'appearance\')" style="padding:10px 16px;font-size:.8rem;font-weight:700;color:var(--muted);border-bottom:2px solid transparent;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>Görünüm</div>' +
    '<div id="dptab-sounds" onclick="deskSwitchProfTab(\'sounds\')" style="padding:10px 16px;font-size:.8rem;font-weight:700;color:var(--muted);border-bottom:2px solid transparent;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>Sesler</div>' +
    '<div id="dptab-account" onclick="deskSwitchProfTab(\'account\')" style="padding:10px 16px;font-size:.8rem;font-weight:700;color:var(--muted);border-bottom:2px solid transparent;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Hesap</div>' +
    '</div>' +
    // Tab: Profil
    '<div id="dppanel-profile" style="padding:0;overflow-y:auto;">' +
    // Banner
    '<div id="deskProfBanner" style="height:80px;background:linear-gradient(135deg,' + strColor(_cu) + 'aa 0%,var(--bg2) 100%);border-radius:0;flex-shrink:0;"></div>' +
    '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 20px 20px;margin-top:-40px;">' +
    // Avatar
    '<div style="position:relative;cursor:pointer;" onclick="triggerPhotoUpload()" title="Fotoğraf değiştir">' +
    '<div id="deskProfAvBig" style="width:80px;height:80px;border-radius:20px;background:' + strColor(_cu) + ';display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:900;color:#fff;background-size:cover;background-position:center;border:3px solid var(--bg2);">' + initials(_cu) + '</div>' +
    '<div style="position:absolute;bottom:-4px;right:-4px;width:24px;height:24px;background:var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg2);">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>' +
              '</div>' +
    // Online dot
    '<div style="position:absolute;bottom:2px;left:-4px;width:12px;height:12px;background:#4ade80;border-radius:50%;border:2px solid var(--bg2);"></div>' +
    '</div>' +
    // İsim + badge
    '<div style="font-size:1.1rem;font-weight:900;color:var(--text-hi);margin-top:4px;">' + esc(_cu) + (isAdmin ? ' <span style="background:var(--yellow);color:#000;font-size:.6rem;border-radius:4px;padding:2px 6px;vertical-align:middle;">Admin</span>' : '') + '</div>' +
    // İstatistik satırı
    '<div style="display:flex;width:100%;background:var(--surface);border:1px solid var(--border);border-radius:14px;margin-top:10px;overflow:hidden;">' +
    '<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid var(--border);">' +
    '<span id="deskProfMsgCount" style="display:block;font-size:1rem;font-weight:900;color:var(--text-hi);">—</span>' +
    '<span style="display:block;font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-top:2px;">Mesaj</span></div>' +
    '<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid var(--border);">' +
    '<span id="deskProfJoinDate" style="display:block;font-size:1rem;font-weight:900;color:var(--text-hi);">—</span>' +
    '<span style="display:block;font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-top:2px;">Katılım</span></div>' +
    '<div style="flex:1;padding:12px 8px;text-align:center;">' +
    '<span style="display:block;"><svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#4ade80"/></svg></span>' +
    '<span style="display:block;font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-top:2px;">Aktif</span></div>' +
    '</div>' +
    // Bio kartı
    '<div style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px;margin-top:10px;">' +
    '<div style="font-size:.72rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;display:flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:-1px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Hakkımda</div>' +
    '<textarea id="deskProfBioInp" placeholder="Kendinizi kısaca tanıtın..." maxlength="160" rows="3" ' +
    'oninput="this.style.height=\'auto\';this.style.height=Math.min(this.scrollHeight,120)+\'px\';var c=document.getElementById(\'deskBioCharCount\');if(c)c.textContent=(this.value||\'\')+.length+\'/160\';" ' +
    'style="width:100%;background:transparent;border:none;outline:none;color:var(--text-hi);font-size:.88rem;font-family:inherit;resize:none;line-height:1.5;"></textarea>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">' +
    '<span id="deskBioCharCount" style="font-size:.68rem;color:var(--muted);">0/160</span>' +
    '<button onclick="deskSaveBio()" style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:5px 14px;font-size:.78rem;font-weight:700;cursor:pointer;">Kaydet</button>' +
    '</div></div>' +
    '</div></div>' +
    // Tab: Görünüm
    '<div id="dppanel-appearance" style="padding:20px;display:none;">' +
    '<div style="font-size:.72rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">✨ Arayüz Stili</div>' +
    '<div id="uiStyleGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;margin-bottom:18px;"></div>' +
    '<div style="font-size:.72rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">🎯 Navigasyon İkonları</div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px;">' +
    '<div><div style="font-size:.85rem;font-weight:700;color:var(--text-hi);">SVG İkon Seti</div><div style="font-size:.72rem;color:var(--muted);">Vektörel ikonlar aktif</div></div>' +
    '<span style="background:rgba(34,197,94,.12);color:#4ade80;border:1px solid rgba(34,197,94,.2);font-size:.68rem;font-weight:700;border-radius:100px;padding:3px 10px;">✓ Aktif</span>' +
    '</div>' +
    '<div style="margin-top:18px;"><div style="font-size:.72rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">🎨 Özel Tema Oluştur</div><div style="background:var(--surface);border-radius:12px;border:1px solid var(--border);padding:14px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;"><div><div style="font-size:.67rem;color:var(--muted);margin-bottom:4px;">Ana Renk</div><input type="color" id="ct-accent" value="#5b9bd5" style="width:100%;height:34px;border-radius:8px;border:1px solid var(--border);cursor:pointer;padding:2px;background:var(--surface2);"></div><div><div style="font-size:.67rem;color:var(--muted);margin-bottom:4px;">Arka Plan</div><input type="color" id="ct-bg" value="#141618" style="width:100%;height:34px;border-radius:8px;border:1px solid var(--border);cursor:pointer;padding:2px;background:var(--surface2);"></div><div><div style="font-size:.67rem;color:var(--muted);margin-bottom:4px;">Yüzey</div><input type="color" id="ct-surface" value="#252830" style="width:100%;height:34px;border-radius:8px;border:1px solid var(--border);cursor:pointer;padding:2px;background:var(--surface2);"></div><div><div style="font-size:.67rem;color:var(--muted);margin-bottom:4px;">Mesaj Rengi</div><input type="color" id="ct-own" value="#2a4a7a" style="width:100%;height:34px;border-radius:8px;border:1px solid var(--border);cursor:pointer;padding:2px;background:var(--surface2);"></div></div><div style="display:flex;gap:8px;"><button onclick="applyCustomTheme()" style="flex:1;background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px;font-size:.79rem;font-weight:700;cursor:pointer;">✓ Uygula</button><button onclick="resetCustomTheme()" style="flex:1;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:8px;font-size:.79rem;font-weight:700;cursor:pointer;">↺ Sıfırla</button></div></div></div>' +
    '</div>' +
    // Tab: Sesler
    '<div id="dppanel-sounds" style="padding:20px;display:none;">' +
    '<div style="font-size:.72rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">📞 Arama Zil Sesi</div>' +
    '<div id="ringToneGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"></div>' +
    '<div style="font-size:.72rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:16px 0 10px;">🔔 Bildirim Sesi</div>' +
    '<div id="notifToneGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"></div>' +
    '</div>' +
    // Tab: Hesap
    '<div id="dppanel-account" style="padding:20px;display:none;">' +
    '<div style="display:flex;flex-direction:column;gap:8px;">' +
    (isAdmin ? '<div onclick="deskNav(\'admin\')" style="background:var(--surface2);border-radius:10px;padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:12px;" onmouseover="this.style.background=\'var(--surface)\'" onmouseout="this.style.background=\'var(--surface2)\'"><div style="font-size:1.2rem;">👑</div><div style="font-size:.9rem;font-weight:700;color:var(--text-hi);">Admin Paneli</div></div>' : '') +
    '<div onclick="openChangePassword()" style="background:var(--surface2);border-radius:10px;padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:12px;" onmouseover="this.style.background=\'var(--surface)\'" onmouseout="this.style.background=\'var(--surface2)\'"><div style="font-size:1.2rem;">🔑</div><div style="font-size:.9rem;font-weight:700;color:var(--text-hi);">Şifre Değiştir</div></div>' +
    '<div onclick="openBotPersonality()" style="background:rgba(91,155,213,.08);border:1px solid rgba(91,155,213,.2);border-radius:10px;padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:12px;"><div style="font-size:1.2rem;">🤖</div><div style="font-size:.9rem;font-weight:700;color:var(--text-hi);">Bot Kişiliği</div></div>' +
    '<div onclick="openTimeCapsule()" style="background:rgba(156,39,176,.08);border:1px solid rgba(156,39,176,.2);border-radius:10px;padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:12px;"><div style="font-size:1.2rem;">🧬</div><div style="font-size:.9rem;font-weight:700;color:var(--text-hi);">Zaman Kapsülü</div></div>' +
    '<div onclick="deskDoLogout()" style="background:rgba(224,30,90,.1);border-radius:10px;padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:12px;" onmouseover="this.style.background=\'rgba(224,30,90,.2)\'" onmouseout="this.style.background=\'rgba(224,30,90,.1)\'"><div style="font-size:1.2rem;">🚪</div><div style="font-size:.9rem;font-weight:700;color:#e01e5a;">Çıkış Yap</div></div>' +
    '</div></div>' +
    '</div>';
  const deskAv = document.getElementById('deskProfAvBig');
  if(deskAv) setAvatar(deskAv, _cu);
  setTimeout(()=>{ deskSwitchProfTab('profile'); deskLoadProfileData(); }, 50);
}

async function deskSaveBio(){
  if(!_cu||!_db) return;
  const inp = document.getElementById('deskProfBioInp');
  if(!inp) return;
  const bio = (inp.value||'').slice(0,160);
  await dbRef(wsPath('users/'+_cu+'/bio')).set(bio);
  showToast('✅ Bio kaydedildi');
}

async function deskLoadProfileData(){
  if(!_cu||!_db) return;
  // Bio yükle
  try {
    const bioSnap = await dbRef(wsPath('users/'+_cu+'/bio')).once('value');
    const bio = bioSnap.val()||'';
    const bioInp = document.getElementById('deskProfBioInp');
    if(bioInp){
      bioInp.value = bio;
      bioInp.style.height='auto';
      bioInp.style.height=Math.min(bioInp.scrollHeight,120)+'px';
      const c=document.getElementById('deskBioCharCount');
      if(c) c.textContent=bio.length+'/160';
    }
  } catch(e){}
  // Katılım tarihi + mesaj sayısı
  try {
    const userSnap = await dbRef('users/'+_cu).once('value');
    const u = userSnap.val()||{};
    const joinEl = document.getElementById('deskProfJoinDate');
    if(joinEl && u.joinedAt){
      const d = new Date(u.joinedAt);
      joinEl.textContent = (d.getMonth()+1)+'/'+d.getFullYear();
    }
    const msgEl = document.getElementById('deskProfMsgCount');
    if(msgEl){
      msgEl.textContent = u.msgCount > 999 ? Math.floor(u.msgCount/1000)+'K' : (u.msgCount||'0');
    }
  } catch(e){}
  // Banner rengini ayarla
  const banner = document.getElementById('deskProfBanner');
  if(banner) banner.style.background = 'linear-gradient(135deg,'+strColor(_cu)+'aa 0%,var(--bg2) 100%)';
  // Avatar
  const av = document.getElementById('deskProfAvBig');
  if(av) setAvatar(av, _cu);
}

function deskSwitchProfTab(tab){
  ['profile','appearance','sounds','account'].forEach(t=>{
    const btn=document.getElementById('dptab-'+t);
    const panel=document.getElementById('dppanel-'+t);
    if(btn){ btn.style.color=t===tab?'var(--text-hi)':'var(--muted)'; btn.style.borderBottom=t===tab?'2px solid var(--accent)':'2px solid transparent'; }
    if(panel) panel.style.display=t===tab?'block':'none';
  });
  if(tab==='profile') setTimeout(deskLoadProfileData, 80);
  if(tab==='appearance') { renderUiStyleGrid(); }
  if(tab==='sounds') renderToneGrids();
}

function deskLoadAdmin() {
  const panel = document.getElementById('deskPanelContent');
  const tabs = [
    { key: 'users',      label: '👥 Kullanıcı' },
    { key: 'rooms',      label: '📢 Oda' },
    { key: 'msgs',       label: '💬 Mesaj' },
    { key: 'forum',      label: '📋 Forum' },
    { key: 'announce',   label: '📣 Duyuru' },
    { key: 'games',      label: '🎮 Oyunlar' },
    { key: 'health',     label: '📊 Sistem Sağlığı' },
    { key: 'security',   label: '🛡️ Güvenlik' },
    { key: 'settings',   label: '⚙️ Ayarlar' },
    { key: 'naturebot',  label: '🤖 NatureBot' },
    { key: 'create_user', label: '➕ Üye Oluştur' },
    { key: 'invite',      label: '🔗 Davet Link' },
  ];
  const tabsHTML = tabs.map(t =>
    `<div class="dsk-atab" data-key="${t.key}" onclick="deskAdminTab('${t.key}')">${t.label}</div>`
  ).join('');

  panel.innerHTML =
    `<div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:8px;padding:16px 20px 0;flex-shrink:0;">
        <div style="font-size:1.3rem;">👑</div>
        <div style="font-size:1.05rem;font-weight:900;color:var(--text-hi);">Admin Paneli</div>
      </div>
      <div id="deskAdminTabs" style="display:flex;gap:4px;padding:12px 16px 0;flex-shrink:0;overflow-x:auto;border-bottom:1px solid var(--border);"></div>
      <div id="adminBody" style="flex:1;overflow-y:auto;padding:16px 20px;">
        <div class="ld"><span></span><span></span><span></span></div>
      </div>
    </div>`;

  // Render tabs
  const tabBar = document.getElementById('deskAdminTabs');
  tabs.forEach(t => {
    const el = document.createElement('div');
    el.textContent = t.label;
    el.dataset.key = t.key;
    el.style.cssText = 'padding:8px 14px;border-radius:8px 8px 0 0;cursor:pointer;font-size:.82rem;font-weight:700;color:var(--muted);white-space:nowrap;transition:background .1s,color .1s;';
    el.onclick = () => deskAdminTab(t.key);
    tabBar.appendChild(el);
  });

  deskAdminTab('users');
}

function deskAdminTab(tab) {
  _adminTab = tab;
  const tabBar = document.getElementById('deskAdminTabs');
  if (tabBar) {
    tabBar.querySelectorAll('div').forEach(el => {
      const isActive = el.dataset.key === tab;
      el.style.color = isActive ? 'var(--text-hi)' : 'var(--muted)';
      el.style.background = isActive ? 'var(--surface)' : 'transparent';
      el.style.borderBottom = isActive ? '2px solid var(--blue)' : '2px solid transparent';
    });
  }
  // Also sync mobile atabs if present
  document.querySelectorAll('.atab').forEach((el, i) => {
    el.classList.toggle('act', ['users','rooms','msgs','forum','announce','stats','settings'][i] === tab);
  });
  const body = document.getElementById('adminBody');
  if (!body) return;
  body.innerHTML = '<div class="ld"><span></span><span></span><span></span></div>';
  if (tab === 'users') loadAdminUsers();
  else if (tab === 'rooms') loadAdminRooms();
  else if (tab === 'msgs') loadAdminMsgs();
  else if (tab === 'forum') loadAdminForum();
  else if (tab === 'announce') loadAdminAnnounce();
  else if (tab === 'games') loadAdminGames();
  else if (tab === 'health') loadAdminSystemHealth();
  else if (tab === 'stats') loadAdminStats();
  else if (tab === 'security') loadAdminSecurity();
  else if (tab === 'settings') loadAdminSettings();
  else if (tab === 'naturebot') loadAdminNatureBot();
}


let _deskFrTab = 'friends';

function deskLoadFriendsPanel() {
  const panel = document.getElementById('deskPanelContent');
  panel.style.overflowY = 'hidden';

  const reqCount = Object.keys(_friendReqs).length;
  const badge = reqCount > 0 ? `<span style="background:var(--red);color:#fff;border-radius:100px;padding:0 7px;font-size:.65rem;font-weight:900;margin-left:5px">${reqCount}</span>` : '';

  panel.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
      <div style="padding:16px 20px 0;flex-shrink:0;">
        <div style="font-size:1.05rem;font-weight:900;color:var(--text-hi);margin-bottom:12px;">👥 Arkadaşlar</div>
        <div id="deskFrTabs" style="display:flex;gap:4px;border-bottom:1px solid var(--border);padding-bottom:0;">
          <div class="dsk-fr-tab" data-tab="friends" onclick="deskFriendsTab('friends')">👤 Arkadaşlar</div>
          <div class="dsk-fr-tab" data-tab="requests" onclick="deskFriendsTab('requests')">📩 İstekler${badge}</div>
          <div class="dsk-fr-tab" data-tab="add" onclick="deskFriendsTab('add')">🔍 Kişi Ekle</div>
        </div>
      </div>
      <div id="deskFrContent" style="flex:1;overflow-y:auto;padding:14px 20px;">
        <div class="ld"><span></span><span></span><span></span></div>
      </div>
    </div>`;

  // Inject CSS if not already present
  if (!document.getElementById('deskFrCSS')) {
    const s = document.createElement('style');
    s.id = 'deskFrCSS';
    s.textContent = `
      .dsk-fr-tab{padding:8px 14px;border-radius:8px 8px 0 0;cursor:pointer;font-size:.82rem;font-weight:700;color:var(--muted);white-space:nowrap;transition:background .1s,color .1s;border-bottom:2px solid transparent;}
      .dsk-fr-tab.act{color:var(--text-hi);background:var(--surface);border-bottom:2px solid var(--blue);}
      .dsk-fr-tab:hover:not(.act){color:var(--text);background:var(--surface2);}
      .dsk-fr-row{display:flex;align-items:center;gap:12px;padding:10px 8px;border-radius:8px;cursor:pointer;transition:background .1s;}
      .dsk-fr-row:hover{background:var(--surface2);}
      .dsk-fr-av{width:42px;height:42px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.82rem;font-weight:900;color:#fff;flex-shrink:0;position:relative;}
      .dsk-fr-av .r-dot{position:absolute;bottom:-2px;right:-2px;width:10px;height:10px;border-radius:50%;border:2px solid var(--bg2);}
      .dsk-fr-info{flex:1;min-width:0;}
      .dsk-fr-name{font-size:.92rem;font-weight:700;color:var(--text-hi);}
      .dsk-fr-status{font-size:.72rem;color:var(--muted);}
      .dsk-fr-actions{display:flex;gap:6px;flex-shrink:0;}
      .dsk-fr-btn{padding:5px 12px;border-radius:6px;border:none;font-size:.78rem;font-weight:700;cursor:pointer;}
      .dsk-fr-btn.msg{background:var(--blue);color:#fff;}
      .dsk-fr-btn.accept{background:#2ecc71;color:#fff;}
      .dsk-fr-btn.reject{background:rgba(224,85,85,.2);color:var(--red);border:1px solid rgba(224,85,85,.3);}
      .dsk-fr-btn.add{background:var(--surface2);color:var(--text);border:1px solid var(--border);}
      .dsk-fr-empty{padding:40px 20px;text-align:center;color:var(--muted);font-size:.9rem;}
      .dsk-fr-section{font-size:.72rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;padding:8px 8px 4px;}
    `;
    document.head.appendChild(s);
  }

  deskFriendsTab(_deskFrTab);
}

function deskFriendsTab(tab) {
  _deskFrTab = tab;
  document.querySelectorAll('.dsk-fr-tab').forEach(el => {
    el.classList.toggle('act', el.dataset.tab === tab);
  });
  const box = document.getElementById('deskFrContent');
  if (!box) return;
  box.innerHTML = '<div class="ld"><span></span><span></span><span></span></div>';

  if (tab === 'friends') deskLoadFriendsList_panel(box);
  else if (tab === 'requests') deskLoadFriendRequests_panel(box);
  else if (tab === 'add') deskLoadAddFriend_panel(box);
}

function deskLoadFriendsList_panel(box) {
  Promise.all([
    dbRef('friends/' + _cu).once('value'),
    dbRef('users').once('value')
  ]).then(([frSnap, usersSnap]) => {
    const friends = Object.keys(frSnap.val() || {});
    const users = usersSnap.val() || {};
    if (!friends.length) { box.innerHTML = `<div class="dsk-fr-empty">📭 Henüz arkadaşın yok.<br><br><button class="dsk-fr-btn add" style="margin-top:8px" onclick="deskFriendsTab('add')">+ Kişi Ekle</button></div>`; return; }
    const online = friends.filter(u => _online[u]);
    const offline = friends.filter(u => !_online[u]);
    let h = '';
    if (online.length) {
      h += '<div class="dsk-fr-section">Çevrimiçi — ' + online.length + '</div>';
      online.forEach(u => { h += deskFrRow(u, true, 'friend'); });
    }
    if (offline.length) {
      h += '<div class="dsk-fr-section">Çevrimdışı — ' + offline.length + '</div>';
      offline.forEach(u => { h += deskFrRow(u, false, 'friend'); });
    }
    box.innerHTML = h;
  });
}

function deskLoadFriendRequests_panel(box) {
  Promise.all([
    dbRef('friendRequests/' + _cu).once('value'),
    dbRef('friendRequestsSent/' + _cu).once('value')
  ]).then(([inSnap, outSnap]) => {
    const incoming = Object.keys(inSnap.val() || {});
    const outgoing = Object.keys(outSnap.val() || {});
    if (!incoming.length && !outgoing.length) { box.innerHTML = '<div class="dsk-fr-empty">📭 Bekleyen istek yok.</div>'; return; }
    let h = '';
    if (incoming.length) {
      h += '<div class="dsk-fr-section">Gelen İstekler — ' + incoming.length + '</div>';
      incoming.forEach(u => { h += deskFrRow(u, !!_online[u], 'incoming'); });
    }
    if (outgoing.length) {
      h += '<div class="dsk-fr-section" style="margin-top:12px">Gönderilen İstekler — ' + outgoing.length + '</div>';
      outgoing.forEach(u => { h += deskFrRow(u, !!_online[u], 'outgoing'); });
    }
    box.innerHTML = h;
  });
}

function deskLoadAddFriend_panel(box) {
  box.innerHTML = `
    <div style="margin-bottom:16px">
      <input id="deskFrSearch" class="admin-inp" placeholder="Kullanıcı adı ara..." oninput="deskSearchUsersToAdd(this.value)" autocorrect="off" autocapitalize="none" style="margin-bottom:0">
    </div>
    <div id="deskFrAddResults" style="display:flex;flex-direction:column;gap:4px;"></div>`;
  deskSearchUsersToAdd('');
}

function deskSearchUsersToAdd(q) {
  const res = document.getElementById('deskFrAddResults');
  if (!res) return;
  res.innerHTML = '<div class="ld"><span></span><span></span><span></span></div>';
  const filter = (q || '').toLowerCase();
  Promise.all([
    dbRef('users').once('value'),
    dbRef('friends/' + _cu).once('value'),
    dbRef('friendRequests/' + _cu).once('value'),
    dbRef('friendRequestsSent/' + _cu).once('value')
  ]).then(([usersSnap, frSnap, inSnap, outSnap]) => {
    const users = usersSnap.val() || {};
    const friends = Object.keys(frSnap.val() || {});
    const incoming = Object.keys(inSnap.val() || {});
    const outgoing = Object.keys(outSnap.val() || {});
    const all = Object.keys(users).filter(u => {
      if(u === _cu) return false;
      if(users[u].banned) return false;
      if(filter && !u.toLowerCase().includes(filter)) return false;
      return true;
    });
    if (!all.length) { res.innerHTML = '<div class="dsk-fr-empty">Kullanıcı bulunamadı.</div>'; return; }
    let h = '';
    all.forEach(u => {
      const on = !!_online[u];
      const isFriend = friends.includes(u);
      const isIncoming = incoming.includes(u);
      const isOutgoing = outgoing.includes(u);
      let actions = '';
      if (isFriend) actions = `<button class="dsk-fr-btn msg" onclick="deskFriendMsg('${u}')">💬 Mesaj</button>`;
      else if (isIncoming) actions = `<button class="dsk-fr-btn accept" onclick="deskAcceptReq('${u}')">✓ Kabul</button><button class="dsk-fr-btn reject" style="margin-left:4px" onclick="deskRejectReq('${u}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>`;
      else if (isOutgoing) actions = '<button class="dsk-fr-btn add" style="opacity:.6;cursor:default">İstek Gönderildi</button>';
      else actions = `<button class="dsk-fr-btn accept" onclick="deskSendFriendReq('${u}')">+ Ekle</button>`;
      h += `<div class="dsk-fr-row">
        <div class="dsk-fr-av" style="background:${strColor(u)}">${initials(u)}<div class="r-dot ${on?'on':'off'}"></div></div>
        <div class="dsk-fr-info"><div class="dsk-fr-name">${esc(u)}</div><div class="dsk-fr-status">${on?'🟢 Çevrimiçi':'Çevrimdışı'}</div></div>
        <div class="dsk-fr-actions">${actions}</div>
      </div>`;
    });
    res.innerHTML = h;
  });
}

function deskFrRow(u, online, type) {
  let actions = '';
  if (type === 'friend') {
    actions = `<button class="dsk-fr-btn msg" onclick="deskFriendMsg('${u}')">💬 Mesaj</button>`;
  } else if (type === 'incoming') {
    actions = `<button class="dsk-fr-btn accept" onclick="deskAcceptReq('${u}')">✓ Kabul</button><button class="dsk-fr-btn reject" style="margin-left:4px" onclick="deskRejectReq('${u}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>`;
  } else if (type === 'outgoing') {
    actions = '<span style="font-size:.75rem;color:var(--muted)">Bekliyor...</span>';
  }
  return `<div class="dsk-fr-row">
    <div class="dsk-fr-av" style="background:${strColor(u)}">${initials(u)}<div class="r-dot ${online?'on':'off'}"></div></div>
    <div class="dsk-fr-info"><div class="dsk-fr-name">${esc(u)}</div><div class="dsk-fr-status">${online?'🟢 Çevrimiçi':'Çevrimdışı'}</div></div>
    <div class="dsk-fr-actions">${actions}</div>
  </div>`;
}

function deskFriendMsg(u) { deskNav('home'); setTimeout(() => startDMWithUser(u), 200); }

function deskAcceptReq(from) {
  acceptFriendRequest(from);
  setTimeout(() => {
    if(document.getElementById('deskFrContent')) deskFriendsTab(_deskFrTab);
    deskUpdateFrBadge();
  }, 500);
}

function deskRejectReq(from) {
  rejectFriendRequest(from);
  setTimeout(() => {
    if(document.getElementById('deskFrContent')) deskFriendsTab(_deskFrTab);
    deskUpdateFrBadge();
  }, 500);
}

function deskSendFriendReq(to) {
  sendFriendRequest(to);
  setTimeout(() => { if(document.getElementById('deskFrAddResults')) deskSearchUsersToAdd(document.getElementById('deskFrSearch')?.value||''); }, 500);
}

function deskUpdateFrBadge() {
  const count = Object.keys(_friendReqs).length;
  // Update rail badge pill
  const pill = document.getElementById('deskFrNotif');
  if (pill) { pill.style.display = count > 0 ? 'flex' : 'none'; pill.textContent = count; }
  // Refresh panel badge if open
  if (_deskNav === 'friends' && document.getElementById('deskFrTabs')) {
    const reqTab = document.querySelector('.dsk-fr-tab[data-tab="requests"]');
    if (reqTab) {
      reqTab.innerHTML = '📩 İstekler' + (count > 0 ? `<span style="background:var(--red);color:#fff;border-radius:100px;padding:0 7px;font-size:.65rem;font-weight:900;margin-left:5px">${count}</span>` : '');
    }
  }
}

function deskDoLogout() {
  if (_deskStopMsg) { _deskStopMsg(); _deskStopMsg = null; }
  document.getElementById('desktopShell').style.display = 'none';
  doLogout();
  // After logout show login
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginScreen').classList.add('active');
}

async function sendDeskMsg() {
  if (!_db || !_cu || !_deskRoom) return;
  const inp = document.getElementById('deskInp');
  let t = inp.value.trim();
  if (!t) return;

  const roomSnap = await dbRef('rooms/' + _deskRoom).once('value');
  const roomData = roomSnap.val() || {};
  if (roomData.locked && !_isAdmin) { showToast('Bu oda kilitli.'); return; }
  // Rate limiting (desktop)
  const _now2 = Date.now();
  const muteUntil2 = _userMutedUntil || 0;
  if(muteUntil2 > _now2){ const rem=Math.ceil((muteUntil2-_now2)/60000); showToast('🔇 Susturuldunuz. '+rem+' dk kaldı.'); return; }
  if(_now2 - _msgCountReset > MSG_BURST_WINDOW){ _msgCount=0; _msgCountReset=_now2; }
  if(_now2 - _lastMsgTs < MSG_RATE_MS){ showToast('⏱ Çok hızlı gönderiyorsunuz.'); return; }
  if(_msgCount >= MSG_BURST_LIMIT){ showToast('⏱ Çok fazla mesaj gönderildi.'); return; }
  if(t.length > 2000){ showToast('Mesaj çok uzun (max 2000 karakter).'); return; }
  // Banned words
  if(_bannedWordsList && _bannedWordsList.length){
    _bannedWordsList.forEach(w=>{ if(!w)return; const re=new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'); t=t.replace(re,'***'); });
  }
  _lastMsgTs=_now2; _msgCount++;
  if (roomData.slowMode > 0 && !_isAdmin) {
    const key = '_slowlast_' + _deskRoom;
    const last = parseInt(sessionStorage.getItem(key) || 0);
    const now = Date.now();
    if (now - last < roomData.slowMode * 1000) { showToast('Yavaş mod: ' + Math.ceil((roomData.slowMode * 1000 - (now - last)) / 1000) + 's bekle.'); return; }
    sessionStorage.setItem(key, now);
  }

  const key = dbRef('msgs/' + _deskRoom).push().key;
  const msg = { key, user: _cu, text: t, ts: Date.now() };
  inp.value = ''; inp.style.height = 'auto';
  await dbRef('msgs/' + _deskRoom + '/' + key).set(msg);
}

function onDeskMsgKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const inp = document.getElementById('deskInp');
    if (inp && inp.disabled) { showToast('🔒 Bu oda kilitli.'); return; }
    sendDeskMsg();
  }
}

function deskInpResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 180) + 'px';
}

// ── Wire into existing onLoginSuccess ──
const _origOnLoginSuccess = onLoginSuccess;
onLoginSuccess = function() {
  _origOnLoginSuccess();
  if (IS_DESKTOP()) {
    setTimeout(deskOnLogin, 100);
  }
};

// On resize, switch modes — DEBOUNCED to avoid rotation glitch
let _resizeTimer = null;
let _lastWasDesktop = IS_DESKTOP();
let _lastMobileTab = 'home'; // Track last active mobile tab

window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    const nowDesktop = IS_DESKTOP();
    if (nowDesktop === _lastWasDesktop) return; // No mode change, skip
    _lastWasDesktop = nowDesktop;

    if (nowDesktop && _cu) {
      document.getElementById('desktopShell').style.display = 'flex';
      document.querySelectorAll('.screen').forEach(s => { s.style.display = 'none'; s.classList.remove('active'); });
      if (_deskRoom) deskOpenRoom(_deskRoom);
      else deskLoadRoomList();
    } else if (!nowDesktop) {
      // --- Mobile restore ---
      const shell = document.getElementById('desktopShell');
      if (shell) shell.style.display = 'none';

      if (_cu) {
        // Force-hide ALL screens first
        ['roomsScreen','forumScreen','msgsScreen','friendsScreen','profileScreen',
         'chatScreen','adminPanel','gamesScreen','watchScreen'].forEach(id => {
          const el = document.getElementById(id);
          if (el) { el.classList.remove('active'); el.style.display = ''; }
        });

        // Restore to a safe tab — never profile/chat/admin
        const safeTab = ['home','forum','watch','msgs','friends'].includes(_lastMobileTab)
          ? _lastMobileTab
          : 'home';
        switchMainTab(safeTab);
      } else {
        // showScreen misc.js'de tanımlı — yoksa fallback
        if(typeof showScreen === 'function') showScreen('loginScreen');
        else { const ls=document.getElementById('loginScreen'); if(ls){ls.style.display='flex';ls.classList.add('active');} }
      }
    }
  }, 200);
});

// Also update room list when online status changes
const _origListenOnline = listenOnline;
listenOnline = function() {
  _origListenOnline();
  // Refresh desktop member panel periodically
  if (IS_DESKTOP()) {
    setInterval(() => {
      if (_deskRoom && document.getElementById('deskMemberPanel') && !document.getElementById('deskMemberPanel').classList.contains('hidden')) {
        dbRef('rooms/' + _deskRoom).once('value').then(s => { if (s.val() && s.val().type === 'group') deskLoadMembers(s.val()); });
      }
    }, 30000);
  }
};



/* ── 14. DESKTop SOHBET SCROLL BUTONU ── */

(function(){
  function _initDeskScroll(){
    const deskMsgs = document.getElementById('deskMsgs'); // Düzeltildi: deskChatMsgs → deskMsgs
    const btn = document.getElementById('deskScrollToBottomBtn');
    if(!deskMsgs || !btn) return;
    deskMsgs.addEventListener('scroll', ()=>{
      const atBot = deskMsgs.scrollHeight - deskMsgs.scrollTop - deskMsgs.clientHeight < 60;
      btn.classList.toggle('visible', !atBot);
    });
  }
  window.deskScrollToBottom = function(){
    const b = document.getElementById('deskMsgs');
    if(b) b.scrollTo({top:b.scrollHeight, behavior:'smooth'});
    const btn = document.getElementById('deskScrollToBottomBtn');
    if(btn) btn.classList.remove('has-unread', 'visible');
  };
  setTimeout(_initDeskScroll, 1500);
  // Oda açılınca yeniden init
  const origDeskOpen = window.deskOpenRoom;
  if(origDeskOpen) window.deskOpenRoom = function(...args){
    origDeskOpen(...args);
    setTimeout(_initDeskScroll, 500);
  };
})();





/* ── Rail icons (desktop) ── */

function injectRailIcons() {
  document.querySelectorAll('.rail-btn').forEach(btn => {
    const ic = btn.querySelector('.rail-ic, [class*="rail-icon"]');
    if (!ic) return;
    const t = ic.textContent.trim();
    const svgStr = ICONS[t];
    if (svgStr) { ic.innerHTML = svgStr; ic.style.fontSize = '0'; }
  });
}

