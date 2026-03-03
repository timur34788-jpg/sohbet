/* Nature.co — search.js */
/* Otomatik bölümlendi */

/* ── Evrensel Arama ── */

let _gsFilter = 'all';
function openGlobalSearch(){
  const modal=document.getElementById('globalSearchModal');
  if(!modal) return;
  modal.style.display='flex';
  setTimeout(()=>{ const inp=document.getElementById('globalSearchInp'); if(inp){inp.focus();inp.value='';} },50);
  runGlobalSearch('');
}
function closeGlobalSearch(){
  const modal=document.getElementById('globalSearchModal');
  if(modal) modal.style.display='none';
}
function setGsFilter(f, btn){
  _gsFilter=f;
  document.querySelectorAll('.gs-filter-btn').forEach(b=>b.classList.remove('gs-filter-act'));
  if(btn) btn.classList.add('gs-filter-act');
  const inp=document.getElementById('globalSearchInp');
  runGlobalSearch(inp?inp.value:'');
}
function runGlobalSearch(q){
  const box=document.getElementById('globalSearchResults');
  if(!box) return;
  q=q.trim().toLowerCase();
  if(!q){ box.innerHTML='<div style="text-align:center;padding:32px;color:var(--muted);font-size:.85rem;">Aramaya başlayın...</div>'; return; }
  let html='';
  const strCol=typeof strColor==='function'?strColor:(s=>'#5b9bd5');
  const ini=typeof initials==='function'?initials:(s=>s.slice(0,2).toUpperCase());
  // Kullanıcılar
  if(_gsFilter==='all'||_gsFilter==='users'){
    if(_db){
      dbRef('users').once('value').then(snap=>{
        const users=snap.val()||{};
        const matched=Object.entries(users).filter(([u])=>u.toLowerCase().includes(q)).slice(0,5);
        let h=matched.length?'<div class="gs-section-title">👤 Kişiler</div>':'';
        matched.forEach(([u,d])=>{
          const online=typeof _onlineUsers!=='undefined'&&_onlineUsers&&_onlineUsers[u];
          h+=`<div class="gs-result-item" onclick="closeGlobalSearch();openUserProfileModal('${u}')">
            <div class="gs-result-av" style="background:${strCol(u)}">${ini(u)}</div>
            <div class="gs-result-info">
              <div class="gs-result-name">${u}</div>
              <div class="gs-result-sub">${d&&d.bio?d.bio.slice(0,40):'Kullanıcı'}</div>
            </div>
            <span class="gs-chip" style="background:${online?'rgba(34,197,94,.15)':'rgba(107,114,128,.15)'};color:${online?'#22c55e':'#6b7280'}">${online?'Online':'Offline'}</span>
          </div>`;
        });
        if(!matched.length) h+='';
        appendGsSection(h);
      }).catch(()=>{});
    }
  }
  // Odalar
  if(_gsFilter==='all'||_gsFilter==='rooms'){
    if(_db){
      dbRef('rooms').once('value').then(snap=>{
        const rooms=snap.val()||{};
        const matched=Object.values(rooms).filter(r=>r&&r.name&&r.name.toLowerCase().includes(q)).slice(0,5);
        let h=matched.length?'<div class="gs-section-title">🏠 Odalar</div>':'';
        matched.forEach(r=>{
          const ic=r.type==='dm'?'💬':r.type==='group'?'👥':'#';
          h+=`<div class="gs-result-item" onclick="closeGlobalSearch();if(typeof IS_DESKTOP==='function'&&IS_DESKTOP()){deskOpenRoom('${r.id}');}else{openChat('${r.id}','${r.name||''}','${r.type||'channel'}','')}">
            <div class="gs-result-av" style="background:${strCol(r.name||r.id)}">${ic}</div>
            <div class="gs-result-info">
              <div class="gs-result-name">${r.name||r.id}</div>
              <div class="gs-result-sub">${(r.members||[]).length||0} üye · ${r.type==='group'?'Grup':'Kanal'}</div>
            </div>
            <span class="gs-chip" style="background:rgba(91,155,213,.15);color:#5b9bd5">Oda</span>
          </div>`;
        });
        appendGsSection(h);
      }).catch(()=>{});
    }
  }
  // Forum
  if(_gsFilter==='all'||_gsFilter==='forum'){
    if(_db){
      dbRef('forum/posts').once('value').then(snap=>{
        const posts=snap.val()||{};
        const matched=Object.values(posts).filter(p=>p&&p.text&&p.text.toLowerCase().includes(q)).slice(0,3);
        let h=matched.length?'<div class="gs-section-title">📋 Forum</div>':'';
        matched.forEach(p=>{
          h+=`<div class="gs-result-item" onclick="closeGlobalSearch();switchMainTab('forum')">
            <div class="gs-result-av" style="background:${strCol(p.user||'x')}">${ini(p.user||'?')}</div>
            <div class="gs-result-info">
              <div class="gs-result-name">${(p.text||'').slice(0,50)}</div>
              <div class="gs-result-sub">${p.user||''} · ${typeof formatDate==='function'?formatDate(new Date(p.ts)):''}</div>
            </div>
            <span class="gs-chip" style="background:rgba(139,92,246,.15);color:#8b5cf6">Forum</span>
          </div>`;
        });
        appendGsSection(h);
      }).catch(()=>{});
    }
  }
}
let _gsSections=[];
function appendGsSection(html){
  if(!html) return;
  const box=document.getElementById('globalSearchResults');
  if(!box) return;
  if(box.innerHTML.includes('Aramaya başlayın')||box.innerHTML.includes('Sonuç bulunamadı')) box.innerHTML='';
  box.innerHTML+=html;
  if(!box.innerHTML.trim()) box.innerHTML='<div style="text-align:center;padding:32px;color:var(--muted);font-size:.85rem;">Sonuç bulunamadı</div>';
}
// Cmd+K / Ctrl+K arama kısayolu
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();openGlobalSearch();}
  if(e.key==='Escape'){closeGlobalSearch();closeNotifCenter();}
});


/* ── Bildirim Merkezi ── */

let _notifs=[];
function openNotifCenter(triggerEl){
  const modal=document.getElementById('notifCenterModal');
  const panel=document.getElementById('notifCenterPanel');
  if(!modal||!panel) return;

  // Request permission when user explicitly opens notifications
  if('Notification' in window && Notification.permission === 'default'){
    requestNotifPermissionFromSettings();
  }

  const isMobile = window.innerWidth < 768;

  if(isMobile){
    // Mobilde: sayfanın üst kısmında tam genişlik panel
    const safeTop = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--safe-top')) || 0;
    panel.style.left     = '12px';
    panel.style.right    = '12px';
    panel.style.width    = 'calc(100vw - 24px)';
    panel.style.maxWidth = 'calc(100vw - 24px)';
    panel.style.top      = (safeTop + 58) + 'px';
    panel.style.position = 'absolute';
  } else {
    // Masaüstü: bell butonunun hizasında
    const btn = triggerEl || document.getElementById('deskBellBtn');
    if(btn){
      const r = btn.getBoundingClientRect();
      const panelW = 360;
      let left = r.right - panelW;
      if(left < 8) left = 8;
      if(left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8;
      panel.style.left  = left + 'px';
      panel.style.top   = (r.bottom + 6) + 'px';
      panel.style.right = 'auto';
      panel.style.width = '';
      panel.style.maxWidth = '';
    }
  }

  modal.style.display='flex';
  renderNotifCenter();

  // Dışına tıklayınca kapat
  requestAnimationFrame(()=>{
    const close = (e)=>{
      if(!panel.contains(e.target) && !e.target.closest('#deskBellBtn')){
        closeNotifCenter();
        document.removeEventListener('mousedown', close);
      }
    };
    document.addEventListener('mousedown', close);
  });
}
function closeNotifCenter(){
  const modal=document.getElementById('notifCenterModal');
  if(modal) modal.style.display='none';
}
function _notifKey(){ return 'nc_notifs_' + (_cu || 'guest'); }
function addNotif(type, title, sub, action){
  const notif={id:Date.now(),type,title,sub,action,ts:Date.now(),read:false};
  _notifs.unshift(notif);
  if(_notifs.length>50) _notifs=_notifs.slice(0,50);
  updateNotifBadge();
  // Kaydet
  try{localStorage.setItem(_notifKey(),JSON.stringify(_notifs.slice(0,20)));}catch(e){}
}
function loadNotifs(){
  try{const saved=localStorage.getItem(_notifKey());if(saved)_notifs=JSON.parse(saved);}catch(e){}
  updateNotifBadge();
}
function updateNotifBadge(){
  const unread=_notifs.filter(n=>!n.read).length;
  const dot=document.getElementById('mobNotifDot');
  const deskDot=document.getElementById('deskNotifDot');
  const countEl=document.getElementById('ncUnreadCount');
  if(dot) dot.style.display=unread>0?'block':'none';
  if(deskDot) deskDot.style.display=unread>0?'block':'none';
  if(countEl){countEl.style.display=unread>0?'inline':'none';countEl.textContent=unread;}
}
function markAllNotifsRead(){
  _notifs.forEach(n=>n.read=true);
  try{localStorage.setItem(_notifKey(),JSON.stringify(_notifs));}catch(e){}
  updateNotifBadge();
  renderNotifCenter();
}
function clearAllNotifs(){
  _notifs=[];
  try{localStorage.removeItem(_notifKey());}catch(e){}
  updateNotifBadge();
  renderNotifCenter();
}
function renderNotifCenter(){
  const box=document.getElementById('notifCenterList');
  if(!box) return;
  loadNotifs();
  if(!_notifs.length){
    box.innerHTML='<div style="text-align:center;padding:32px;color:var(--muted);font-size:.85rem;">📭 Bildirim yok</div>';
    return;
  }
  const icons={msg:'💬',friend:'👥',forum:'📋',system:'⚙️',call:'📞'};
  const colors={msg:'rgba(91,155,213,.15)',friend:'rgba(34,197,94,.15)',forum:'rgba(139,92,246,.15)',system:'rgba(245,158,11,.15)',call:'rgba(239,68,68,.15)'};
  box.innerHTML=_notifs.map(n=>`
    <div class="nc-item${n.read?'':' unread'}" onclick="notifClick('${n.id}')">
      <div class="nc-icon" style="background:${colors[n.type]||colors.system}">${icons[n.type]||'🔔'}</div>
      <div class="nc-text">
        <div class="nc-title">${n.title}</div>
        <div class="nc-sub">${n.sub||''}</div>
      </div>
      <div class="nc-time">${fmtNotifTime(n.ts)}</div>
      ${!n.read?'<div class="nc-unread-dot"></div>':''}
    </div>`).join('');
}
function notifClick(id){
  const n=_notifs.find(x=>x.id==id);
  if(!n) return;
  n.read=true;
  try{localStorage.setItem(_notifKey(),JSON.stringify(_notifs));}catch(e){}
  updateNotifBadge();
  closeNotifCenter();
  if(n.action) try{n.action();}catch(e){}
}
function fmtNotifTime(ts){
  const diff=Date.now()-ts;
  if(diff<60000) return 'Az önce';
  if(diff<3600000) return Math.floor(diff/60000)+'dk';
  if(diff<86400000) return Math.floor(diff/3600000)+'sa';
  return Math.floor(diff/86400000)+'g';
}

