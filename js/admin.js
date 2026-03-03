/* Nature.co — admin.js */
/* Otomatik bölümlendi */

/* ── Admin: Users ── */

async function loadAdminUsers(){
  const body=document.getElementById('adminBody');
  body.innerHTML='<div class="ld"><span></span><span></span><span></span></div>';
  const users=await adminRestGet('users').catch(()=>null)||{};
  try{
    {
    // username alanı yoksa objenin key'ini username olarak ata
    Object.entries(users).forEach(([k,v])=>{ if(v&&!v.username) v.username=k; });
    const list=Object.values(users).filter(u=>u&&u.username).sort((a,b)=>(a.username||'').localeCompare(b.username||''));
    if(!list.length){body.innerHTML='<p style="color:var(--muted)">Kullanıcı yok.</p>';return;}

    let h='<div class="admin-section">';
    // Başlık + Toplu işlem araç çubuğu
    h+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
      <div class="admin-sec-title" style="margin:0">Tüm Kullanıcılar (${list.length})</div>
      <div style="display:flex;gap:6px;align-items:center;">
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:.78rem;color:var(--muted);">
          <input type="checkbox" id="selectAllUsers" onchange="toggleSelectAllUsers(this)"> Tümünü Seç
        </label>
        <button class="a-btn red" id="bulkDeleteBtn" style="display:none;padding:6px 12px;font-size:.75rem;" onclick="bulkDeleteUsers()">🗑️ Seçilenleri Sil</button>
      </div>
    </div>`;
    h+='<div class="admin-card">';

    list.forEach(u=>{
      const isBanned=!!u.banned;
      const isAdminUser=!!u.isAdmin;
      const isMe=u.username===_cu;
      const on=!!_online[u.username];
      h+=`<div class="admin-row" id="urow-${esc(u.username)}">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
          ${!isMe?`<input type="checkbox" class="user-select-cb" data-u="${esc(u.username)}" onchange="onUserCheckChange()" style="width:16px;height:16px;cursor:pointer;flex-shrink:0;">`:'<div style="width:16px;flex-shrink:0;"></div>'}
          <div class="admin-row-av" style="background:${strColor(u.username)}">${initials(u.username)}</div>
          <div class="admin-row-info">
            <div class="admin-row-name">
              ${esc(u.username)}
              ${isAdminUser?'<span class="admin-tag">Admin</span>':''}
              ${isBanned?'<span class="banned-tag">Banlı</span>':''}
            </div>
            <div class="admin-row-sub">${on?'🟢 Çevrimiçi':'⚫ Çevrimdışı'} · ${u.origin||'—'} · 🏢 ${u._ws||'?'} · 📅 ${u.createdAt?new Date(u.createdAt).toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Bilinmiyor'}</div>
            ${u.lastIP?`<div style="font-size:11px;color:#e67e22;margin-top:2px;font-family:monospace;">🌐 ${esc(u.lastIP)}</div>`:''}
          </div>
        </div>
        <div class="admin-row-btns" style="flex-wrap:wrap;">
          <button class="a-btn" style="background:var(--surface);" onclick="adminUserDetails('${u.username}')">🔍 Detay</button>
          <button class="a-btn blue" onclick="adminEditUserProfile('${u.username}')">✏️ Düzenle</button>
          ${!isMe?`<button class="a-btn ${isBanned?'green':'red'}" onclick="adminToggleBan('${u.username}',${!isBanned})">${isBanned?'✅ Unban':'🚫 Ban'}</button>`:''}
          ${!isMe&&u.lastIP?`<button class="a-btn red" style="background:#8e44ad" onclick="adminIPBan('${u.username}','${u.lastIP||''}')">🌐 IP Ban</button>`:''}
          ${!isMe&&!isAdminUser?`<button class="a-btn yellow" onclick="adminMakeAdmin('${u.username}')">👑 Admin Yap</button>`:''}
          ${!isMe&&isAdminUser?`<button class="a-btn red" onclick="adminRemoveAdmin('${u.username}')">👑 Admin Al</button>`:''}
          ${!isMe?`<button class="a-btn" style="background:var(--surface2);" onclick="adminViewUserMessages('${u.username}')">💬 Mesajlar</button>`:''}
          ${!isMe?`<button class="a-btn blue" onclick="adminResetPassword('${u.username}')">🔑 Şifre Sıfırla</button>`:''}\n          ${!isMe?`<button class="a-btn red" onclick="adminDeleteUser('${u.username}')">🗑️ Sil</button>`:''}
        </div>
      </div>`;
    });
    h+='</div></div>';
    body.innerHTML=h;
  }}catch(e){body.innerHTML='<p style="color:var(--muted);padding:20px">Yüklenemedi: '+(e&&e.message||e)+'</p>';}
}

function onUserCheckChange(){
  const cbs=document.querySelectorAll('.user-select-cb:checked');
  const btn=document.getElementById('bulkDeleteBtn');
  if(btn) btn.style.display=cbs.length>0?'inline-block':'none';
  const all=document.querySelectorAll('.user-select-cb');
  const selAll=document.getElementById('selectAllUsers');
  if(selAll) selAll.checked=all.length>0&&cbs.length===all.length;
}

function toggleSelectAllUsers(cb){
  document.querySelectorAll('.user-select-cb').forEach(el=>el.checked=cb.checked);
  onUserCheckChange();
}

function bulkDeleteUsers(){
  const cbs=document.querySelectorAll('.user-select-cb:checked');
  const users=[...cbs].map(cb=>cb.dataset.u);
  if(!users.length) return;
  if(!confirm(users.length+' kullanıcı kalıcı olarak silinsin mi?\n\n'+users.join(', '))) return;
  Promise.all(users.flatMap(u=>[
    adminRestDelete('users/'+u),
    adminRestDelete('online/'+u),
    adminRestDelete('friends/'+u),
    adminRestDelete('friendRequests/'+u),
    adminRestDelete('friendRequestsSent/'+u),
    adminRestDelete('admins/'+u)
  ])).then(()=>{
    showToast(users.length+' kullanıcı silindi.');
    loadAdminUsers();
  }).catch(()=>showToast('Bazı silmeler başarısız oldu.'));
}

async function adminIPBan(username, ip){
  if(!ip){ showToast('IP adresi bulunamadı.'); return; }
  if(!confirm('⚠️ '+username+' kullanıcısının IP adresi yasaklansın mı?\n\nIP: '+ip+'\n\nBu IP\'den giriş yapmaya çalışan HERKESİN girişi engellenecektir!')) return;
  const key = ip.replace(/\./g,'_');
  try{
    await adminRestSet('bannedIPs/'+key,{ip:ip,bannedBy:_cu,bannedAt:Date.now(),username:username});
    await adminRestSet('users/'+username+'/banned',true);
    showToast('🌐 IP ban uygulandı: '+ip);
    loadAdminUsers();
  }catch(e){ showToast('Hata: '+e.message); }
}

async function adminIPUnban(ip){
  if(!confirm('IP yasağı kaldırılsın mı?\n\nIP: '+ip)) return;
  const key = ip.replace(/\./g,'_');
  try{
    await adminRestDelete('bannedIPs/'+key);
    showToast('✅ IP ban kaldırıldı: '+ip);
    loadAdminIPBans();
  }catch(e){ showToast('Hata.'); }
}

async function loadAdminIPBans(){
  const body = document.getElementById('adminBody');
  body.innerHTML='<div class="ld"><span></span><span></span><span></span></div>';
  try{
    const bans = await adminRestGet('bannedIPs')||{};
    const list = Object.values(bans);
    if(!list.length){
      body.innerHTML='<div class="admin-section"><p style="color:var(--muted);padding:20px">Yasaklı IP adresi yok.</p></div>';
      return;
    }
    let h='<div class="admin-section"><div class="admin-sec-title">🌐 Yasaklı IP Adresleri ('+list.length+')</div><div class="admin-card">';
    list.sort((a,b)=>b.bannedAt-a.bannedAt).forEach(b=>{
      h+=`<div class="admin-row" style="align-items:center;">
        <div style="flex:1">
          <div style="font-family:monospace;font-weight:700;color:#e67e22">${esc(b.ip)}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px">
            👤 ${esc(b.username||'?')} · 🕐 ${b.bannedAt?new Date(b.bannedAt).toLocaleString('tr-TR'):'?'}
          </div>
        </div>
        <button class="a-btn green" onclick="adminIPUnban('${esc(b.ip)}')">✅ Kaldır</button>
      </div>`;
    });
    h+='</div></div>';
    body.innerHTML=h;
  }catch(e){ body.innerHTML='<p style="color:var(--muted);padding:20px">Yüklenemedi.</p>'; }
}

async function adminToggleBan(username,ban){
  if(!confirm(`${username} kullanıcısını ${ban?'banlamak':'banı kaldırmak'} istediğinize emin misiniz?`))return;
  try{
    await adminRestSet('users/'+username+'/banned',ban);
    showToast(ban?username+' banlandı.':username+' banı kaldırıldı.');
    loadAdminUsers();
    if(ban) adminRestDelete('online/'+username).catch(()=>{});
  }catch(e){showToast('Hata: '+(e&&e.message||''));}
}
async function adminMakeAdmin(username){
  if(!confirm(`${username} kullanıcısına admin yetkisi verilsin mi?`))return;
  try{
    await Promise.all([adminRestSet('users/'+username+'/isAdmin',true),adminRestSet('admins/'+username,true)]);
    showToast(username+' artık admin.');
    loadAdminUsers();
  }catch(e){showToast('Hata oluştu.');}
}


/* ── Admin: Messages ── */

function loadAdminMsgs(){
  const body=document.getElementById('adminBody');
  // Load all rooms and messages via REST
  Promise.all([adminRestGet('rooms').catch(()=>({})),adminRestGet('msgs').catch(()=>({}))]).then(([roomsData,msgsData])=>{
    const rooms=roomsData||{};
    const roomList=Object.values(rooms);
    if(!roomList.length){body.innerHTML='<p style="color:var(--muted)">Oda yok.</p>';return;}
    const allMsgsAll=msgsData||{};
    const results=roomList.map(r=>({room:r,msgs:allMsgsAll[r.id]||{}}));
    {
      let allMsgs=[];
      results.forEach(({room,msgs})=>{
        Object.entries(msgs).forEach(([key,m])=>{
          if(!m.sys) allMsgs.push({...m,_key:key,_roomId:room.id,_roomName:room.name||room.id});
        });
      });
      allMsgs.sort((a,b)=>b.ts-a.ts);
      if(!allMsgs.length){body.innerHTML='<p style="color:var(--muted);padding:20px">Mesaj yok.</p>';return;}
      let h=`<div class="admin-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
          <div class="admin-sec-title" style="margin:0">Son Mesajlar (${allMsgs.length})</div>
          <button class="a-btn red" onclick="adminClearAllMsgs()">🗑️ Tümünü Sil</button>
        </div>
        <div class="admin-card">`;
      allMsgs.forEach(m=>{
        const txt=m.file?`📎 ${m.file.name||'Dosya'}`:m.text;
        h+=`<div class="admin-row" style="align-items:flex-start">
          <div class="admin-row-av" style="background:${strColor(m.user)};flex-shrink:0">${initials(m.user)}</div>
          <div class="admin-row-info">
            <div class="admin-msg-room"># ${esc(m._roomName)}</div>
            <div class="admin-msg-text">${esc(txt).slice(0,120)}${txt.length>120?'…':''}</div>
            <div class="admin-msg-meta">
              <div class="admin-msg-user">${esc(m.user)}</div>
              <div class="admin-msg-ts">${fmtTime(m.ts)} · ${formatDate(new Date(m.ts))}</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;margin-top:2px">
            <button class="a-btn blue" onclick="adminEditMsg('${m._roomId}','${m._key}',this)">✏️</button>
            <button class="a-btn red" onclick="adminDeleteMsgFromPanel('${m._roomId}','${m._key}')">🗑️</button>
          </div>
        </div>`;
      });
      h+='</div></div>';
      body.innerHTML=h;
    }
  }).catch(e=>{ body.innerHTML='<p style="color:var(--muted);padding:20px">Yüklenemedi.</p>'; });
}
async function adminDeleteMsgFromPanel(roomId,key){
  if(!confirm('Bu mesajı sil?'))return;
  try{
    await adminRestDelete('msgs/'+roomId+'/'+key);
    showToast('Mesaj silindi.');loadAdminMsgs();
  }catch(e){showToast('Hata.');}
}


/* ── Admin: Announce ── */

async function loadAdminAnnounce(){
  const body=document.getElementById('adminBody');
  body.innerHTML='<div class="ld"><span></span><span></span><span></span></div>';
  const rooms=await adminRestGet('rooms').catch(()=>null)||{};
  {
    const list=Object.values(rooms).filter(r=>r.type!=='dm');
    let opts=`<option value="__all__">📣 Tüm Kanallara</option>`;
    list.forEach(r=>{opts+=`<option value="${r.id}">${r.type==='group'?'👥':'#'} ${esc(r.name||r.id)}</option>`;});
    body.innerHTML=`
    <div class="admin-section">
      <div class="admin-sec-title">Duyuru Gönder</div>
      <select class="announce-select" id="announceRoom">${opts}</select>
      <textarea class="announce-textarea" id="announceText" placeholder="Duyuru metni..." rows="5"></textarea>
      <button class="admin-submit" onclick="adminSendAnnounce()">📣 Duyuruyu Gönder</button>
    </div>
    <div class="admin-section" style="margin-top:12px">
      <div class="admin-sec-title" style="margin-bottom:8px">💡 İpucu</div>
      <div style="background:var(--surface);border-radius:8px;padding:12px;font-size:.82rem;color:var(--muted);line-height:1.6">
        Duyurular sistem mesajı olarak gönderilir ve tüm kullanıcılar tarafından görülür. "Tüm Kanallara" seçeneği her kanala ayrı ayrı gönderir.
      </div>
    </div>`;
  }
}
async function adminSendAnnounce(){
  const roomVal=document.getElementById('announceRoom').value;
  const text=document.getElementById('announceText').value.trim();
  if(!text){showToast('Duyuru metni girin.');return;}
  try{
    const rooms=await adminRestGet('rooms').catch(()=>({}))||{};
    const targets=roomVal==='__all__'
      ?Object.values(rooms).filter(r=>r.type!=='dm').map(r=>r.id)
      :[roomVal];
    const key=Date.now().toString(36)+'_ann';
    await Promise.all(targets.map(rid=>adminRestSet('msgs/'+rid+'/'+key,{sys:true,text:`📣 Admin Duyurusu: ${text}`,ts:Date.now()})));
    showToast(`Duyuru ${targets.length} odaya gönderildi!`);
    document.getElementById('announceText').value='';
  }catch(e){showToast('Hata oluştu.');}
}



/* ── Admin: Rename User ── */

async function adminRenameUser(username){
  const newName = prompt(`"${username}" kullanıcısının yeni adı:`, username);
  if(!newName || newName.trim()===username) return;
  const n = newName.trim();
  if(n.length<2){showToast('En az 2 karakter!');return;}
  if(!/^[a-zA-Z0-9çğışöüÇĞİŞÖÜ _.\-]+$/.test(n)){showToast('Geçersiz karakter!');return;}
  // Copy user data to new key, delete old
  try{
    const data = await adminRestGet('users/'+username);
    if(!data){showToast('Kullanıcı bulunamadı.');return;}
    data.username = n;
    await adminRestSet('users/'+n,data);
    await adminRestDelete('users/'+username);
    showToast(`"${username}" → "${n}" olarak güncellendi.`);
    loadAdminUsers();
  }catch(e){showToast('Hata oluştu.');}
}

async function adminRemoveAdmin(username){
  if(!confirm(`${username} kullanıcısının admin yetkisi alınsın mı?`))return;
  try{
    await Promise.all([adminRestDelete('users/'+username+'/isAdmin'),adminRestDelete('admins/'+username)]);
    showToast(username+' admin yetkisi alındı.');loadAdminUsers();
  }catch(e){showToast('Hata oluştu.');}
}

async function adminResetPassword(username){
  const newPass = prompt('👤 ' + username + ' için yeni şifre girin:');
  if(!newPass || newPass.trim().length < 3){
    if(newPass !== null) alert('Şifre en az 3 karakter olmalı.');
    return;
  }
  const newHash = await hashStr(newPass.trim() + username);
  try{
    await adminRestSet('users/'+username+'/passwordHash',newHash);
    showToast('✅ ' + username + ' şifresi güncellendi!');
  }catch(e){showToast('❌ Hata oluştu.');}
}
async function adminDeleteUser(username){
  if(!confirm(username+' kullanıcısı kalıcı olarak silinsin mi? Bu işlem geri alınamaz!'))return;
  try{
    await Promise.all([adminRestDelete('users/'+username),adminRestDelete('online/'+username),adminRestDelete('friends/'+username),adminRestDelete('friendRequests/'+username),adminRestDelete('friendRequestsSent/'+username),adminRestDelete('admins/'+username)]);
    showToast('✅ '+username+' silindi.'); loadAdminUsers();
  }catch(e){ showToast('❌ Hata: '+(e&&e.message||'Bilinmiyor')); }
}


/* ── Admin: Rename Room ── */

async function adminRenameRoom(id, oldName){
  const newName = prompt(`Odanın yeni adı:`, oldName);
  if(!newName || newName.trim()===oldName) return;
  const n = newName.trim();
  if(!n){showToast('Ad boş olamaz!');return;}
  try{
    await adminRestSet('rooms/'+id+'/name',n);
    showToast(`Oda adı "${n}" olarak güncellendi.`);
    loadAdminRooms(); loadRooms();
  }catch(e){showToast('Hata oluştu.');}
}


/* ── Admin: Edit Message ── */

async function adminEditMsg(roomId, key, btn){
  try{
    const oldText=await adminRestGet('msgs/'+roomId+'/'+key+'/text').catch(()=>'')||'';
    const newText=prompt('Mesajı düzenle:',oldText);
    if(newText===null||newText.trim()===oldText)return;
    const t=newText.trim();
    if(!t){showToast('Mesaj boş olamaz!');return;}
    await adminRestSet('msgs/'+roomId+'/'+key+'/text',t);
    showToast('Mesaj güncellendi.');loadAdminMsgs();
  }catch(e){showToast('Hata.');}
}


/* ── Admin: Forum ── */

async function loadAdminForum(){
  const body = document.getElementById('adminBody');
  body.innerHTML='<div class="ld"><span></span><span></span><span></span></div>';
  const postsRaw = await adminRestGet('forum/posts').catch(()=>null)||{};
  try{
    const posts = postsRaw;
    const arr = Object.entries(posts).map(([k,v])=>({...v,_key:k})).sort((a,b)=>b.ts-a.ts);
    if(!arr.length){body.innerHTML='<p style="color:var(--muted);padding:20px">Forum paylaşımı yok.</p>';return;}
    let h=`<div class="admin-section"><div class="admin-sec-title">Forum Paylaşımları (${arr.length})</div><div class="admin-card">`;
    arr.forEach(p=>{
      const commentCount = p.comments ? Object.keys(p.comments).length : 0;
      const likeCount = p.likes ? Object.keys(p.likes).length : 0;
      const catLabel = {genel:'💬',tarih:'📜',kultur:'🎭',spor:'⚽',muzik:'🎵',teknoloji:'💻',soru:'❓'}[p.cat]||'💬';
      h+=`<div class="admin-row" style="align-items:flex-start">
        <div class="admin-row-av" style="background:${strColor(p.user)};flex-shrink:0">${initials(p.user)}</div>
        <div class="admin-row-info">
          <div class="admin-row-name">${esc(p.user)} <span style="font-size:.65rem;color:var(--muted)">${catLabel} ${p.cat||'genel'}</span></div>
          <div class="admin-msg-text">${esc(p.text).slice(0,100)}${p.text&&p.text.length>100?'…':''}</div>
          <div class="admin-msg-meta">
            <span style="color:var(--muted);font-size:.68rem">❤️${likeCount} · 💬${commentCount} · ${formatDate(new Date(p.ts))} ${fmtTime(p.ts)}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
          <button class="a-btn blue" onclick="adminEditForumPost('${p._key}',this)">✏️</button>
          <button class="a-btn red" onclick="adminDeleteForumPost('${p._key}')">🗑️</button>
        </div>
      </div>`;
    });
    h+='</div></div>';
    body.innerHTML=h;
  }catch(e){body.innerHTML='<p style="color:var(--muted);padding:20px">Yüklenemedi.</p>';}
}
async function adminEditForumPost(key, btn){
  try{
    const oldText=await adminRestGet('forum/posts/'+key+'/text').catch(()=>'')||'';
    const newText=prompt('Paylaşımı düzenle:',oldText);
    if(newText===null||newText.trim()===oldText)return;
    const t=newText.trim();
    if(!t){showToast('Metin boş olamaz!');return;}
    await adminRestSet('forum/posts/'+key+'/text',t);
    showToast('Güncellendi.');loadAdminForum();
  }catch(e){showToast('Hata.');}
}
async function adminDeleteForumPost(key){
  if(!confirm('Bu forum paylaşımını sil?'))return;
  try{
    await adminRestDelete('forum/posts/'+key);
    showToast('Silindi.');loadAdminForum();
  }catch(e){showToast('Hata.');}
}



/* ── Admin: Design ── */

async function loadAdminDesign(){
  const body = document.getElementById('adminBody');
  body.innerHTML='<div class="ld"><span></span><span></span><span></span></div>';
  _db.ref('settings/design').once('value').then(snap=>{
    const d = snap.val()||{};
    _renderDesignPanel(d);
  }).catch(()=>_renderDesignPanel({}));
}

function _renderDesignPanel(d){
  const body = document.getElementById('adminBody');
  if(!body) return;

  // ── Yardımcı oluşturucular ──
  const sv  = (k,def) => d[k]!==undefined ? d[k] : def;
  const inp = (id,val,ph,extra='') =>
    `<input type="text" id="${id}" value="${val||''}" placeholder="${ph}"
     style="width:100%;background:var(--surface2);border:1px solid var(--border);
            border-radius:7px;padding:7px 10px;color:var(--text);font-size:.78rem;" ${extra}>`;
  const ta  = (id,val,ph,rows=4) =>
    `<textarea id="${id}" rows="${rows}" placeholder="${ph}"
     style="width:100%;background:var(--surface2);border:1px solid var(--border);
            border-radius:7px;padding:8px 10px;color:var(--text);font-size:.78rem;
            resize:vertical;font-family:inherit;">${val||''}</textarea>`;
  const row = (lbl,inner,tip='') =>
    `<div style="margin-bottom:12px;">
       <div style="font-size:.7rem;font-weight:700;color:var(--muted);margin-bottom:5px;">${lbl}${tip?`<span style="font-weight:400;opacity:.6;margin-left:6px;">${tip}</span>`:''}</div>
       ${inner}
     </div>`;
  const range = (id,min,max,def,unit,lbl) => {
    const cur = d[id]!==undefined ? d[id] : def;
    return `<div style="margin-bottom:10px;">
      <div style="font-size:.68rem;color:var(--muted);margin-bottom:4px;display:flex;justify-content:space-between;">
        <span>${lbl}</span><b id="drv_${id}" style="color:var(--accent)">${cur}${unit}</b>
      </div>
      <input type="range" id="dr_${id}" min="${min}" max="${max}" value="${cur}"
             style="width:100%;accent-color:var(--accent);"
             oninput="document.getElementById('drv_${id}').textContent=this.value+'${unit}';_liveApply('${id}',this.value,'${unit}')">
    </div>`;
  };
  const toggle = (id,lbl,def) => {
    const checked = d[id]!==undefined ? d[id] : def;
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:.82rem;">${lbl}</span>
      <label style="position:relative;display:inline-block;width:40px;height:22px;">
        <input type="checkbox" id="dr_${id}" ${checked?'checked':''} style="opacity:0;width:0;height:0;"
               onchange="_liveApplyToggle('${id}',this.checked)">
        <span style="position:absolute;inset:0;background:${checked?'var(--accent)':'var(--border)'};border-radius:11px;transition:.2s;cursor:pointer;"
              onclick="var cb=this.previousElementSibling;cb.checked=!cb.checked;this.style.background=cb.checked?'var(--accent)':'var(--border)';_liveApplyToggle('${id}',cb.checked)"></span>
        <span style="position:absolute;left:${checked?'20px':'2px'};top:2px;width:18px;height:18px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;" id="drth_${id}"></span>
      </label>
    </div>`;
  };
  const clr = (id,def,lbl) => {
    const cur = d['color_'+id]||def;
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <input type="color" id="dc_${id}" value="${cur}"
             style="width:36px;height:36px;border-radius:8px;border:2px solid var(--border);cursor:pointer;padding:2px;background:var(--surface2);"
             oninput="_previewColor('${id}',this.value)">
      <div style="flex:1;">
        <div style="font-size:.72rem;font-weight:700;color:var(--text);">${lbl}</div>
        <div style="font-size:.65rem;font-weight:400;color:var(--muted);" id="dcc_${id}">${cur}</div>
      </div>
    </div>`;
  };
  const grid2 = arr => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">${arr.join('')}</div>`;
  const grid1 = arr => arr.join('');
  const sec  = (title,content) =>
    `<div style="margin-bottom:20px;background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;">
       <div style="padding:10px 14px;background:var(--surface2);font-size:.72rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);">${title}</div>
       <div style="padding:14px;">${content}</div>
     </div>`;

  // ────────────────────────────────
  // TAB 0: 🖌️ RENKLER
  // ────────────────────────────────
  const COLORS = [
    { cat:'🏠 Genel', items:[
      ['bg','#1a1e25','Ana Arka Plan'],['bg2','#22262d','İkincil Arka Plan'],
      ['surface','#2a303c','Panel Yüzeyi'],['surface2','#333c4a','Panel Yüzeyi 2'],
      ['border','#434c5e','Kenarlık'],
    ]},
    { cat:'✏️ Yazı', items:[
      ['text','#dde2ea','Normal Yazı'],['textHi','#ffffff','Başlık Yazı'],
      ['muted','#8f9ab0','Soluk/Yardımcı Yazı'],
    ]},
    { cat:'🎯 Vurgu & Durum', items:[
      ['accent','#4a9e7a','Aksan / CTA'],['green','#2ecc71','Çevrimiçi / Başarı'],
      ['red','#e05555','Hata / Tehlike'],['yellow','#f59e0b','Uyarı / Bilgi'],
    ]},
    { cat:'🗂️ Layout', items:[
      ['purple','#1e2030','Header Arka Plan'],['sidebarBg','#161a22','Sidebar Arka Plan'],
      ['sidebarItem','#252d3d','Sidebar Seçili Öğe'],['navBg','#12151c','Sol Rail'],
      ['tabBarBg','#12151c','Alt Tab Bar (Mobil)'],
    ]},
    { cat:'💬 Mesajlar', items:[
      ['ownBg','#1f4a3a','Kendi Mesaj Balonu'],['incomingBg','#1e2e35','Gelen Mesaj Balonu'],
      ['ownText','#d4f1e4','Kendi Mesaj Yazısı'],['incomingText','#dde2ea','Gelen Mesaj Yazısı'],
      ['inputBg','#1e2a3a','Mesaj Giriş Arka Plan'],['inputBorder','#3a4560','Giriş Kenarlığı'],
    ]},
  ];
  let colHtml = '';
  COLORS.forEach(cat => {
    colHtml += sec(cat.cat, cat.items.map(([id,def,lbl]) => clr(id,def,lbl)).join(''));
  });

  // ────────────────────────────────
  // TAB 1: 🔤 YAZI & FONT
  // ────────────────────────────────
  const FONTS = [
    { v:'DM Sans,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', l:'DM Sans (Varsayılan)' },
    { v:'"Inter",sans-serif', l:'Inter' },{ v:'"Roboto",sans-serif', l:'Roboto' },
    { v:'"Nunito",sans-serif', l:'Nunito' },{ v:'"Poppins",sans-serif', l:'Poppins' },
    { v:'"Montserrat",sans-serif', l:'Montserrat' },{ v:'"Syne",sans-serif', l:'Syne' },
    { v:'"DM Mono",monospace', l:'DM Mono' },{ v:'monospace', l:'Monospace' },
  ];
  const curFont = d.fontFamily||FONTS[0].v;
  let fontSel = `<select id="dr_fontFamily" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:7px;padding:7px 10px;color:var(--text);font-size:.82rem;margin-bottom:14px;" onchange="_liveApplyFont(this.value)">`;
  FONTS.forEach(f => { fontSel += `<option value="${f.v}" ${curFont===f.v?'selected':''}>${f.l}</option>`; });
  fontSel += '</select>';

  let fontHtml = row('📦 Font Ailesi', fontSel);
  fontHtml += sec('📏 Yazı Boyutları', grid2([
    range('fontSize',11,24,15,'px','📝 Genel Yazı'),
    range('msgFontSize',11,22,14,'px','💬 Mesaj Yazısı'),
    range('sidebarFontSize',11,20,13,'px','📋 Sidebar Yazısı'),
    range('headerFontSize',13,30,18,'px','🏷️ Header Başlığı'),
    range('inputFontSize',11,20,14,'px','✏️ Giriş Kutusu'),
    range('forumFontSize',11,22,14,'px','📰 Forum Yazısı'),
    range('sidebarItemFontSize',10,18,13,'px','📁 Sidebar Öğe'),
    range('timestampSize',9,14,11,'px','🕐 Zaman Damgası'),
    range('usernameFontSize',10,18,13,'px','👤 Kullanıcı Adı'),
    range('letterSpacing',-2,5,0,'px','↔️ Harf Aralığı'),
  ]));

  // ────────────────────────────────
  // TAB 2: 📐 BOYUTLAR & LAYOUT
  // ────────────────────────────────
  let layoutHtml = '';
  layoutHtml += sec('📐 Köşe Yuvarlamaları', grid2([
    range('borderRadius',0,28,12,'px','🔵 Genel Köşe'),
    range('cardRadius',0,24,10,'px','🃏 Kart'),
    range('msgRadius',0,28,14,'px','💬 Mesaj Balonu'),
    range('inputRadius',0,20,10,'px','✏️ Input'),
    range('btnRadius',0,24,8,'px','🔘 Buton'),
    range('avatarRadius',0,50,8,'px','👤 Avatar'),
  ]));
  layoutHtml += sec('📏 Panel & Menü Boyutları', grid2([
    range('sidebarWidth',160,360,260,'px','📋 Sidebar Genişliği'),
    range('railWidth',44,100,68,'px','🛤️ Sol Rail Genişliği'),
    range('headerHeight',44,88,56,'px','📏 Header Yüksekliği'),
    range('tabBarHeight',50,90,60,'px','📱 Alt Tab Bar (Mob)'),
    range('inputHeight',32,80,44,'px','✏️ Input Yüksekliği'),
    range('avatarSize',22,56,32,'px','👤 Avatar Boyutu'),
  ]));
  layoutHtml += sec('↔️ Boşluklar', grid2([
    range('msgPaddingH',4,24,10,'px','↔️ Mesaj Yatay'),
    range('msgPaddingV',3,18,6,'px','↕️ Mesaj Dikey'),
    range('sidebarItemPad',3,20,8,'px','📁 Sidebar Öğe Pad'),
    range('sectionGap',1,24,6,'px','↕️ Bölüm Arası'),
    range('msgGap',1,16,4,'px','↕️ Mesajlar Arası'),
    range('railPad',4,20,10,'px','🛤️ Rail İç Boşluk'),
  ]));

  // ────────────────────────────────
  // TAB 3: 🌑 GÖLGE & BLUR
  // ────────────────────────────────
  let shadowHtml = sec('🌑 Gölgeler', grid2([
    range('cardShadow',0,48,12,'px','🃏 Kart Gölgesi'),
    range('headerShadow',0,48,8,'px','🏷️ Header Gölgesi'),
    range('sidebarShadow',0,48,0,'px','📋 Sidebar Gölgesi'),
    range('inputShadow',0,24,0,'px','✏️ Input Gölgesi'),
    range('bubbleShadow',0,32,8,'px','💬 Mesaj Balonu'),
    range('btnShadow',0,24,0,'px','🔘 Buton Gölgesi'),
  ]));
  shadowHtml += sec('💨 Blur Efektleri', grid2([
    range('headerBlur',0,48,20,'px','🏷️ Header Frosted'),
    range('sidebarBlur',0,36,0,'px','📋 Sidebar Blur'),
    range('modalBlur',0,36,16,'px','🗔 Modal Blur'),
    range('overlayOpacity',0,90,80,'%','🌑 Overlay Opaklık'),
  ]));

  // ────────────────────────────────
  // TAB 4: 📱 İKON & TAB BAR
  // ────────────────────────────────
  let iconHtml = sec('📱 Alt Tab Bar (Mobil)', grid2([
    range('tabIconSize',14,40,20,'px','📱 İkon Boyutu'),
    range('tabLabelSize',7,16,9,'px','📱 Etiket Boyutu'),
    range('tabBarPad',2,16,6,'px','📱 Tab Bar Padding'),
  ]));
  iconHtml += sec('🖥️ Sol Rail (Desktop)', grid2([
    range('navIconSize',14,40,19,'px','🖥️ İkon Boyutu'),
    range('railBtnRadius',4,28,12,'px','🛤️ Buton Radius'),
    range('railBtnSize',32,64,44,'px','🛤️ Buton Boyutu'),
  ]));
  iconHtml += sec('💬 Mesaj & Durum İkonları', grid2([
    range('msgIconSize',12,32,18,'px','💬 Mesaj İkonu'),
    range('statusDotSize',6,18,11,'px','🟢 Durum Noktası'),
    range('reactionSize',14,32,18,'px','😊 Reaksiyon İkonu'),
  ]));

  // Tab sırası/görünürlük
  const defaultTabs = [
    {id:'home',label:'Ana Sayfa',emoji:'🏠'},{id:'msgs',label:'Mesajlar',emoji:'💬'},
    {id:'forum',label:'Forum',emoji:'📋'},{id:'friends',label:'Arkadaşlar',emoji:'👥'},
    {id:'watch',label:'İzle',emoji:'📺'},
  ];
  const savedTabOrder = d.tabOrder||defaultTabs.map(t=>t.id);
  const hiddenTabs = d.hiddenTabs||[];
  const orderedTabs = savedTabOrder.map(id=>defaultTabs.find(t=>t.id===id)).filter(Boolean);
  let tabHtml = '<div id="dc_tab_list" style="display:flex;flex-direction:column;gap:4px;">';
  orderedTabs.forEach(t => {
    const hidden = hiddenTabs.includes(t.id);
    tabHtml += `<div data-tab-id="${t.id}" draggable="true"
      style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface2);
             border:1px solid var(--border);border-radius:8px;cursor:move;opacity:${hidden?.45:1};"
      ondragstart="adminTabDragStart(event)" ondragover="adminTabDragOver(event)" ondrop="adminTabDrop(event)">
      <span style="font-size:1rem;">${t.emoji}</span>
      <span style="flex:1;font-size:.82rem;font-weight:700;">${t.label}</span>
      <button onclick="adminTabToggleVisibility(this.closest('[data-tab-id]'))"
        style="padding:4px 8px;border-radius:6px;background:var(--surface);border:1px solid var(--border);
               font-size:.72rem;cursor:pointer;">${hidden?'👁️ Göster':'🙈 Gizle'}</button>
    </div>`;
  });
  tabHtml += '</div><div style="font-size:.68rem;color:var(--muted);margin-top:6px;">↕️ Sürükle-bırak ile sırala</div>';
  iconHtml += sec('🔢 Tab Sırası & Görünürlük', tabHtml);

  // ────────────────────────────────
  // TAB 5: ✨ ANİMASYON & EFEKT
  // ────────────────────────────────
  let animHtml = sec('✨ Animasyonlar', [
    toggle('animMessages','💬 Mesaj Giriş Animasyonu',true),
    toggle('animSidebar','📋 Sidebar Hover Efekti',true),
    toggle('animButtons','🔘 Buton Hover Animasyonu',true),
    toggle('animTyping','⌨️ Yazıyor Göstergesi',true),
  ].join(''));
  animHtml += sec('🪟 Görsel Efektler', [
    toggle('glassEffect','🪟 Frosted Glass (Header/Modal)',true),
    toggle('gradientBg','🌈 Gradient Arka Plan',false),
    toggle('compactMode','📦 Kompakt Mod (daha az boşluk)',false),
    toggle('roundedEverything','⭕ Her Şey Yuvarlak',false),
  ].join(''));
  animHtml += sec('👁️ Göster / Gizle', [
    toggle('showAvatars','👤 Avatarları Göster',true),
    toggle('showTimestamps','🕐 Zaman Damgaları',true),
    toggle('showReactions','😊 Reaksiyon Butonları',true),
    toggle('showUserStatus','🟢 Kullanıcı Durumu',true),
    toggle('showMemberCount','👥 Üye Sayısı',true),
    toggle('showOnlineCount','🟢 Çevrimiçi Sayısı',true),
    toggle('showCarbonWidget','🌿 Karbon Widget',true),
    toggle('showMusicWidget','🎵 Müzik Butonu',true),
    toggle('showNatureBot','🤖 NatureBot',true),
  ].join(''));

  // ────────────────────────────────
  // TAB 6: 🖼️ LOGO & MEDYA
  // ────────────────────────────────
  const imgRow = (id,lbl,ph) => row(lbl,
    inp('dci_'+id,(d.customImages||{})[id]||'',ph) +
    `<div style="font-size:.62rem;color:var(--muted);margin-top:3px;">URL veya <code style="background:var(--surface2);padding:1px 4px;border-radius:3px;">data:image/...</code> base64 formatı</div>`
  );
  let logoHtml = sec('🌿 Uygulama İkonları', [
    imgRow('appLogo','🌿 Uygulama Logosu (Header/PWA)','https://...png veya data:image/svg+xml,...'),
    imgRow('favicon','⭐ Favicon (Tarayıcı Sekmesi)','https://...ico veya .png'),
    imgRow('defaultAvatar','👤 Varsayılan Kullanıcı Avatarı','https://...'),
  ].join(''));
  logoHtml += sec('🖼️ Arka Planlar', [
    imgRow('loginBg','🔐 Giriş Sayfası Arka Planı','https://...'),
    imgRow('emptyRoomBg','🏜️ Boş Oda Arka Planı','https://...'),
    imgRow('sidebarBanner','📋 Sidebar Üst Banner','https://...'),
    imgRow('homeBg','🏠 Ana Sayfa Arka Planı','https://...'),
  ].join(''));
  logoHtml += sec('🤖 Bot & Özel', [
    imgRow('botAvatar','🤖 NatureBot Avatarı (URL veya Emoji)','🤖 veya https://...'),
    imgRow('customEmoji1','🎨 Özel Emoji 1','🌿'),
    imgRow('customEmoji2','🎨 Özel Emoji 2','🌱'),
  ].join(''));

  // ────────────────────────────────
  // TAB 7: 📝 İÇERİK & METİN
  // ────────────────────────────────
  const ct = d.content||{};
  let contentHtml = sec('🏠 Ana Sayfa', [
    row('🏷️ Sunucu Adı (Header)',inp('dct_serverName',ct.serverName||'Nature.co','Nature.co'),'Tüm sayfalarda görünür'),
    row('📝 Sunucu Alt Başlığı',inp('dct_serverSubtitle',ct.serverSubtitle||'Kanallar & Gruplar','Kanallar & Gruplar')),
    row('👋 Karşılama Başlığı',inp('dct_welcomeTitle',ct.welcomeTitle||"Nature.co'ya Hoş Geldin","Nature.co'ya Hoş Geldin")),
    row('📋 Karşılama Alt Metni',inp('dct_welcomeSubtitle',ct.welcomeSubtitle||'Soldaki listeden bir kanal seç','Soldaki listeden...')),
    row('🔘 Karşılama Buton 1',inp('dct_welcomeBtn1',ct.welcomeBtn1||'💬 Kanal Seç','💬 Kanal Seç')),
    row('🔘 Karşılama Buton 2',inp('dct_welcomeBtn2',ct.welcomeBtn2||'👥 Arkadaşlar','👥 Arkadaşlar')),
  ].join(''));
  contentHtml += sec('📋 Sidebar Etiketleri', [
    row('🤖 NatureBot Bölümü',inp('dct_secNaturebot',ct.secNaturebot||'NatureBot','NatureBot')),
    row('📡 Kanallar Bölümü',inp('dct_secChannels',ct.secChannels||'Kanallar','Kanallar')),
    row('👥 Gruplar Bölümü',inp('dct_secGroups',ct.secGroups||'Gruplar','Gruplar')),
    row('💬 Direkt Mesajlar',inp('dct_secDMs',ct.secDMs||'Direkt Mesajlar','Direkt Mesajlar')),
  ].join(''));
  contentHtml += sec('🔐 Giriş Sayfası', [
    row('🏷️ Giriş Başlığı',inp('dct_loginTitle',ct.loginTitle||'Giriş Yap','Giriş Yap')),
    row('📝 Giriş Alt Metni',inp('dct_loginSubtitle',ct.loginSubtitle||'','Hoş geldin, doğaya bağlan...')),
    row('🔘 Giriş Butonu',inp('dct_loginBtnText',ct.loginBtnText||'Giriş Yap','Giriş Yap')),
    row('🔘 Kayıt Butonu',inp('dct_registerBtnText',ct.registerBtnText||'Kayıt Ol','Kayıt Ol')),
  ].join(''));
  contentHtml += sec('🔢 Alt Navigasyon (Mobil)', [
    row('🏠 Ana Sayfa Etiketi',inp('dct_tabHome',ct.tabHome||'Ana Sayfa','Ana Sayfa')),
    row('💬 Mesajlar Etiketi',inp('dct_tabMsgs',ct.tabMsgs||'Mesajlar','Mesajlar')),
    row('📋 Forum Etiketi',inp('dct_tabForum',ct.tabForum||'Forum','Forum')),
    row('👥 Arkadaşlar Etiketi',inp('dct_tabFriends',ct.tabFriends||'Arkadaşlar','Arkadaşlar')),
    row('📺 İzle Etiketi',inp('dct_tabWatch',ct.tabWatch||'İzle','İzle')),
  ].join(''));
  contentHtml += sec('📢 Bildirim & Sistem Mesajları', [
    row('📢 Duyuru Kanalı Adı',inp('dct_announceChannel',ct.announceChannel||'Genel Duyuru','Genel Duyuru')),
    row('🌿 Footer / Dipnot',inp('dct_footerText',ct.footerText||'','© 2025 Nature.co')),
    row('🔔 Bildirim İzin Mesajı',ta('dct_pushPromptText',ct.pushPromptText||'','Apple Watch dahil tüm cihazlarda bildirim almak ister misin?',2)),
  ].join(''));

  // ────────────────────────────────
  // TAB 8: ⚙️ CSS / JS
  // ────────────────────────────────
  let cssHtml = sec('🎨 Özel CSS', row('',
    `<div style="font-size:.72rem;color:var(--muted);margin-bottom:6px;">Tüm sitenin üzerine eklenir. <code style="background:var(--surface2);padding:2px 4px;border-radius:3px;">!important</code> gerektiğinde kullan.</div>` +
    `<textarea id="dr_customCSS" rows="10" placeholder=".ws-header { background: #ff0000 !important; }"
       style="width:100%;background:#050a06;border:1px solid var(--border);border-radius:8px;
              padding:10px;color:#6dbf67;font-family:'DM Mono',monospace;font-size:.76rem;resize:vertical;">${d.customCSS||''}</textarea>`
  ));
  cssHtml += sec('⚡ Özel JavaScript', row('',
    `<div style="font-size:.72rem;color:var(--muted);margin-bottom:6px;">Her sayfa yüklemesinde çalışır. DOM manipülasyonu, widget vb.</div>` +
    `<textarea id="dr_customJS" rows="6" placeholder="// document.body.classList.add('my-theme');"
       style="width:100%;background:#050a06;border:1px solid var(--border);border-radius:8px;
              padding:10px;color:#6dbf67;font-family:'DM Mono',monospace;font-size:.76rem;resize:vertical;">${d.customJS||''}</textarea>`
  ));

  // ────────────────────────────────
  // TAB 9: 🏷️ UYGULAMA BİLGİSİ
  // ────────────────────────────────
  let appInfoHtml = sec('🏷️ Temel Bilgiler', [
    row('🌿 Uygulama Adı',inp('dr_appName',d.appName||'Nature.co','Nature.co')),
    row('📝 Kısa Açıklama',inp('dr_appSlogan',d.appSlogan||'Kanallar & Gruplar','...')),
    row('🔗 Site URL',inp('dr_siteUrl',d.siteUrl||'','https://natureco.me')),
    row('📧 İletişim E-posta',inp('dr_contactEmail',d.contactEmail||'','admin@natureco.me')),
  ].join(''));
  appInfoHtml += sec('🔒 Gizlilik & Kurallar', [
    row('📜 Kullanım Koşulları URL',inp('dr_tosUrl',d.tosUrl||'','https://...')),
    row('🔒 Gizlilik Politikası URL',inp('dr_privacyUrl',d.privacyUrl||'','https://...')),
    row('📋 Sunucu Kuralları',ta('dr_serverRules',d.serverRules||'','1. Saygılı ol\n2. ...',5)),
  ].join(''));

  // ────────────────────────────────
  // TAB 10: 🎭 TEMALAR
  // ────────────────────────────────
  const themes = [
    {name:'🌿 Nature (Varsayılan)',key:'nature'},{name:'🌙 Midnight Dark',key:'midnight'},
    {name:'🌊 Ocean Blue',key:'ocean'},{name:'🎨 Neon Cyber',key:'neon'},
    {name:'📰 Editorial Light',key:'light'},{name:'🌸 Soft Pastel',key:'pastel'},
    {name:'🔥 Warm Ember',key:'ember'},
  ];
  let themeHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">`;
  themes.forEach(t => {
    themeHtml += `<button onclick="applyDesignTheme('${t.key}')"
      style="padding:10px;background:var(--surface2);border:1px solid var(--border);
             border-radius:8px;font-size:.82rem;cursor:pointer;color:var(--text);
             transition:all .15s;" onmouseover="this.style.borderColor='var(--accent)'"
             onmouseout="this.style.borderColor='var(--border)'">${t.name}</button>`;
  });
  themeHtml += '</div>';
  themeHtml += `<div style="margin-top:16px;font-size:.72rem;color:var(--muted);">Temayı seçtikten sonra <b style="color:var(--accent)">Kaydet</b> butonu ile kalıcı yap.</div>`;

  // ────────────────────────────────
  // RENDER
  // ────────────────────────────────
  const TAB_LABELS = ['🖌️ Renkler','🔤 Yazı','📐 Boyutlar','🌑 Gölge','📱 İkon','✨ Efekt','🖼️ Medya','📝 İçerik','⚙️ CSS/JS','🏷️ Uygulama','🎭 Temalar'];
  const TAB_CONTENT = [colHtml,fontHtml,layoutHtml,shadowHtml,iconHtml,animHtml,logoHtml,contentHtml,cssHtml,appInfoHtml,themeHtml];

  let html = '<div style="max-width:100%;">';
  html += '<div style="font-size:1.1rem;font-weight:900;margin-bottom:4px;">🎨 Görsel Tasarım Stüdyosu</div>';
  html += '<div style="font-size:.72rem;color:var(--muted);margin-bottom:14px;">Tüm değişiklikler Firebase\'e kaydedilir. Üyeler yenileyince görür. <b style="color:var(--accent)">👁️ Önizle</b> ile kaydetmeden test et.</div>';

  html += `<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;">
    <button onclick="_previewDesignAll()" style="flex:1;min-width:120px;padding:9px;background:var(--surface2);border:1px solid var(--accent);border-radius:8px;color:var(--accent);font-weight:700;font-size:.82rem;cursor:pointer;">👁️ Canlı Önizle</button>
    <button onclick="_resetDesignPreview()" style="padding:9px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--muted);font-size:.82rem;cursor:pointer;">↺ Sıfırla</button>
    <button onclick="openSimulator()" style="flex:1;min-width:120px;padding:9px;background:linear-gradient(135deg,#6d28d9,#2563eb);border:none;border-radius:8px;color:#fff;font-weight:700;font-size:.82rem;cursor:pointer;">📱 Simülatör</button>
  </div>`;

  // Sub-tabs - scrollable
  html += `<div id="designSubTabs" style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:16px;">`;
  TAB_LABELS.forEach((t,i) => {
    html += `<button onclick="showDesignTab(${i})" id="dst_${i}"
      style="padding:5px 10px;border-radius:100px;font-size:.72rem;font-weight:700;
             border:1px solid var(--border);cursor:pointer;transition:all .15s;white-space:nowrap;
             background:${i===0?'var(--accent)':'var(--surface2)'};
             color:${i===0?'#fff':'var(--muted)'}">${t}</button>`;
  });
  html += '</div>';

  TAB_CONTENT.forEach((content,i) => {
    html += `<div id="dstc_${i}" style="display:${i===0?'block':'none'}">${content}</div>`;
  });

  html += `<div style="display:flex;gap:8px;margin-top:20px;position:sticky;bottom:0;background:var(--bg);padding:12px 0;border-top:1px solid var(--border);">
    <button onclick="saveAdminDesign()" style="flex:1;padding:13px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-weight:900;font-size:.88rem;cursor:pointer;">💾 Kaydet & Tüm Üyelere Uygula</button>
    <button onclick="resetAdminDesign()" style="padding:13px 16px;background:var(--surface2);color:var(--red);border:1px solid var(--red);border-radius:10px;font-weight:700;font-size:.82rem;cursor:pointer;">🗑️</button>
  </div>`;
  html += '</div>';

  body.innerHTML = html;
}

// Live preview helpers
function _liveApply(id,val,unit){
  const CSS_MAP = {
    borderRadius:'--radius',msgRadius:'--msg-radius',cardRadius:'--card-radius',
    inputRadius:'--input-radius',btnRadius:'--btn-radius',
    sidebarWidth:'--sidebar-w',railWidth:'--rail-w',
    headerHeight:'--header-h',tabBarHeight:'--tab-bar-h',
    avatarSize:'--avatar-size',inputHeight:'--input-h',
    cardShadow:'--card-shadow-blur',headerBlur:'--header-blur',
    sidebarBlur:'--sidebar-blur',
  };
  const root = document.documentElement;
  if(CSS_MAP[id]) root.style.setProperty(CSS_MAP[id], val+unit);
}
function _liveApplyToggle(id,val){
  if(id==='compactMode') document.body.classList.toggle('compact-mode',val);
  if(id==='glassEffect') document.body.classList.toggle('glass-effect',val);
  // update toggle thumb position
  const thumb = document.getElementById('drth_'+id);
  if(thumb) thumb.style.left = val ? '20px' : '2px';
}
function _liveApplyFont(val){
  document.body.style.fontFamily = val;
}


function showDesignTab(i){
  document.querySelectorAll('[id^="dstc_"]').forEach((el,j)=>{ el.style.display = j===i?'block':'none'; });
  document.querySelectorAll('[id^="dst_"]').forEach((el,j)=>{
    el.style.background = j===i?'var(--accent)':'var(--surface2)';
    el.style.color = j===i?'#fff':'var(--muted)';
  });
}

function adminTabToggle(id){
  const el = document.getElementById('dctab_'+id);
  if(!el) return;
  const hidden = el.style.opacity === '0.4';
  el.style.opacity = hidden ? '1' : '0.4';
  const btn = el.querySelector('button');
  if(btn) btn.textContent = hidden ? '🙈' : '👁️';
}

function _previewColor(key, val){
  const cssVarMap = {
    bg:'--bg', bg2:'--bg2', surface:'--surface', surface2:'--surface2',
    border:'--border', text:'--text', textHi:'--text-hi', muted:'--muted',
    accent:'--accent', purple:'--purple', green:'--green', red:'--red',
    yellow:'--yellow', ownBg:'--own-bg', incomingBg:'--incoming-bg',
    sidebarBg:'--sidebar-bg', navBg:'--nav-bg', tabBarBg:'--tabbar-bg',
  };
  const cssVar = cssVarMap[key];
  if(cssVar) document.documentElement.style.setProperty(cssVar, val);
}

function _previewDesignAll(){
  const g = id => document.getElementById(id);
  const root = document.documentElement;
  ['bg','bg2','surface','surface2','border','text','textHi','muted','accent','purple',
   'green','red','yellow','ownBg','incomingBg','sidebarBg','navBg','tabBarBg'].forEach(k=>{
    const el = g('dc_'+k); if(el) _previewColor(k, el.value);
  });
  const fontEl = g('dr_fontFamily'); if(fontEl) document.body.style.fontFamily = fontEl.value;
  const cssEl = g('dr_customCSS');
  if(cssEl) injectDesignCSS('nc-custom-preview', cssEl.value);
  showToast('👁️ Önizleme aktif — kaydetmek için Kaydet butonuna bas');
}

function _resetDesignPreview(){
  location.reload();
}

function applyDesignTheme(key){
  const themes = {
    nature:{bg:'#0d1a0f',bg2:'#122016',surface:'#1a2e1e',surface2:'#213826',border:'#2d5a28',text:'#d4e8d0',textHi:'#a8e6a0',muted:'#5a8a56',accent:'#4a8f40',purple:'#0e1f10',green:'#4a8f40'},
    midnight:{bg:'#090d18',bg2:'#0f1520',surface:'#161c2d',surface2:'#1c2438',border:'#2a3350',text:'#c8d0e8',textHi:'#ffffff',muted:'#6b7899',accent:'#4f7fff',purple:'#080d18'},
    neon:{bg:'#090010',bg2:'#100020',surface:'#180030',surface2:'#200040',border:'#4400aa',text:'#e0d0ff',textHi:'#ffffff',muted:'#8855cc',accent:'#aa00ff',purple:'#050008',green:'#00ff88'},
    light:{bg:'#f0f2f5',bg2:'#e8eaed',surface:'#ffffff',surface2:'#f4f5f8',border:'#d0d3db',text:'#1a1d25',textHi:'#000000',muted:'#6b7280',accent:'#3b82f6',purple:'#e8eaed'},
    pastel:{bg:'#1a0f2e',bg2:'#251540',surface:'#301c50',surface2:'#3c2460',border:'#5a3880',text:'#f0e6ff',textHi:'#ffffff',muted:'#9b77cc',accent:'#c084fc',purple:'#180e28'},
    ember:{bg:'#1a0a00',bg2:'#241000',surface:'#321500',surface2:'#401c00',border:'#6b3300',text:'#ffd0a0',textHi:'#ffffff',muted:'#996633',accent:'#ff6600',purple:'#160800'},
  };
  const t = themes[key];
  if(!t) return;
  Object.entries(t).forEach(([k,v])=>{
    const colorEl = document.getElementById('dc_'+k);
    const textEl  = document.getElementById('dc_'+k+'_t');
    if(colorEl) colorEl.value = v;
    if(textEl)  textEl.value  = v;
    _previewColor(k, v);
  });
  showToast('🎭 Tema uygulandı! Kaydet butonuna basarak kalıcı yap.');
}


// Tab sürükle-bırak
let _dragTabId = null;
function adminTabDragStart(e){ _dragTabId = e.currentTarget.dataset.tabId; e.currentTarget.style.opacity='.5'; }
function adminTabDragOver(e){ e.preventDefault(); }
function adminTabDrop(e){
  e.preventDefault();
  const targetId = e.currentTarget.dataset.tabId;
  if(!_dragTabId || _dragTabId === targetId) { document.querySelectorAll('[id^=dctab_]').forEach(el=>el.style.opacity=''); return; }
  const list = document.getElementById('dc_tab_list');
  const dragEl = document.getElementById('dctab_'+_dragTabId);
  const targetEl = document.getElementById('dctab_'+targetId);
  if(dragEl && targetEl) {
    const items = [...list.children];
    const dragIdx = items.indexOf(dragEl);
    const targetIdx = items.indexOf(targetEl);
    if(dragIdx < targetIdx) list.insertBefore(dragEl, targetEl.nextSibling);
    else list.insertBefore(dragEl, targetEl);
  }
  document.querySelectorAll('[id^=dctab_]').forEach(el=>el.style.opacity='');
  _dragTabId = null;
}

function adminTabToggleVisibility(tabId, btn){
  const row = document.getElementById('dctab_'+tabId);
  const isHidden = row.style.opacity === '0.45';
  row.style.opacity = isHidden ? '' : '0.45';
  btn.textContent = isHidden ? '🚫 Gizle' : '👁 Göster';
  btn.style.color = isHidden ? 'var(--muted)' : 'var(--green)';
}

function adminDesignPreview(){
  const root = document.documentElement;
  const g = id => document.getElementById(id);
  // Validate hex color before applying
  const isValidColor = c => c && /^#[0-9a-fA-F]{3,8}$/.test(c.trim());
  const cv = key => {
    const el = g('dc_'+key);
    if(!el) return null;
    // Prefer text input value for validation
    const txtEl = g('dc_'+key+'_txt');
    const val = txtEl ? txtEl.value.trim() : el.value;
    return isValidColor(val) ? val : (isValidColor(el.value) ? el.value : null);
  };
  const colorMap = {
    bg:'--bg', bg2:'--bg2', surface:'--surface', surface2:'--surface2',
    border:'--border', text:'--text', textHi:'--text-hi', muted:'--muted',
    accent:'--accent', green:'--green', red:'--red', ownBg:'--own-bg', incomingBg:'--incoming-bg'
  };
  Object.entries(colorMap).forEach(([k,v]) => { const c=cv(k); if(c) root.style.setProperty(v,c); });
  const font = g('dc_font') ? g('dc_font').value : null;
  if(font) document.body.style.fontFamily = font;
  const radius = cv('radius');
  if(radius) root.style.setProperty('--radius', radius+'px');

  // Text sizes preview
  const msgSz = g('dc_msgFontSize');
  const sideSz = g('dc_sidebarFontSize');
  const hdrSz = g('dc_headerFontSize');
  const inpSz = g('dc_inputFontSize');
  if(msgSz)  document.querySelectorAll('.msg-text,.msg-body,.m-text').forEach(el=>el.style.fontSize=msgSz.value+'px');
  if(sideSz) document.querySelectorAll('.r-label,.sec-hdr').forEach(el=>el.style.fontSize=sideSz.value+'px');
  if(hdrSz)  document.querySelectorAll('.ws-name,.chat-name').forEach(el=>el.style.fontSize=hdrSz.value+'px');
  if(inpSz)  document.querySelectorAll('#msgInput,#chatInput,textarea.msg-inp').forEach(el=>el.style.fontSize=inpSz.value+'px');

  // Icon sizes preview
  const tabIcSz = g('dc_tabIconSize');
  const tabLbSz = g('dc_tabLabelSize');
  const navIcSz = g('dc_navIconSize');
  if(tabIcSz) document.querySelectorAll('.tab-ic svg,.tab-ic').forEach(el=>{ el.style.width=tabIcSz.value+'px'; el.style.height=tabIcSz.value+'px'; });
  if(tabLbSz) document.querySelectorAll('.tab-lb').forEach(el=>el.style.fontSize=tabLbSz.value+'px');
  if(navIcSz) document.querySelectorAll('.rail-btn-ic svg,.rail-btn-ic').forEach(el=>{ el.style.width=navIcSz.value+'px'; el.style.height=navIcSz.value+'px'; });
}

async function saveAdminDesign(){
  const g = id => document.getElementById(id);
  const gv = id => { const el=g(id); return el ? el.value : undefined; };
  const gn = id => { const el=g(id); return el ? parseFloat(el.value) : undefined; };
  const gb = id => { const el=g(id); return el ? el.checked : undefined; };

  const obj = { updatedAt: Date.now(), updatedBy: _cu };

  // ── Renkler ──
  const COLOR_IDS = ['bg','bg2','surface','surface2','border','text','textHi','muted','accent',
    'green','red','yellow','purple','sidebarBg','sidebarItem','navBg','tabBarBg',
    'ownBg','incomingBg','ownText','incomingText','inputBg','inputBorder'];
  COLOR_IDS.forEach(k => { const el=g('dc_'+k); if(el) obj['color_'+k]=el.value; });

  // ── Font ──
  const fontEl = g('dr_fontFamily');
  if(fontEl) obj.fontFamily = fontEl.value;

  // ── Tüm range slider'lar ──
  const RANGES = [
    'fontSize','msgFontSize','sidebarFontSize','headerFontSize','inputFontSize',
    'forumFontSize','sidebarItemFontSize','timestampSize','usernameFontSize','letterSpacing',
    'borderRadius','cardRadius','msgRadius','inputRadius','btnRadius','avatarRadius',
    'sidebarWidth','railWidth','headerHeight','tabBarHeight','inputHeight','avatarSize',
    'msgPaddingH','msgPaddingV','sidebarItemPad','sectionGap','msgGap','railPad',
    'cardShadow','headerShadow','sidebarShadow','inputShadow','bubbleShadow','btnShadow',
    'headerBlur','sidebarBlur','modalBlur','overlayOpacity',
    'tabIconSize','tabLabelSize','tabBarPad','navIconSize','railBtnRadius','railBtnSize',
    'msgIconSize','statusDotSize','reactionSize',
  ];
  RANGES.forEach(k => { const v=gn('dr_'+k); if(v!==undefined && !isNaN(v)) obj[k]=v; });

  // ── Toggle'lar ──
  const TOGGLES = [
    'animMessages','animSidebar','animButtons','animTyping',
    'glassEffect','gradientBg','compactMode','roundedEverything',
    'showAvatars','showTimestamps','showReactions','showUserStatus',
    'showMemberCount','showOnlineCount','showCarbonWidget','showMusicWidget','showNatureBot',
  ];
  TOGGLES.forEach(k => { const el=g('dr_'+k); if(el) obj[k]=el.checked; });

  // ── Logo & Medya ──
  const IMG_KEYS = ['appLogo','favicon','defaultAvatar','loginBg','emptyRoomBg',
                    'sidebarBanner','homeBg','botAvatar','customEmoji1','customEmoji2'];
  const customImages = {};
  IMG_KEYS.forEach(k => { const v=gv('dci_'+k); if(v&&v.trim()) customImages[k]=v.trim(); });
  obj.customImages = customImages;

  // ── İçerik & Metin ──
  const CONTENT_KEYS = [
    'serverName','serverSubtitle','welcomeTitle','welcomeSubtitle','welcomeBtn1','welcomeBtn2',
    'secNaturebot','secChannels','secGroups','secDMs',
    'loginTitle','loginSubtitle','loginBtnText','registerBtnText',
    'tabHome','tabMsgs','tabForum','tabFriends','tabWatch',
    'announceChannel','footerText','pushPromptText',
  ];
  const content = {};
  CONTENT_KEYS.forEach(k => { const v=gv('dct_'+k); if(v!==undefined) content[k]=v; });
  obj.content = content;

  // ── CSS / JS ──
  const cssEl=g('dr_customCSS'), jsEl=g('dr_customJS');
  if(cssEl) obj.customCSS = cssEl.value;
  if(jsEl)  obj.customJS  = jsEl.value;

  // ── Uygulama Bilgisi ──
  ['appName','appSlogan','siteUrl','contactEmail','tosUrl','privacyUrl','serverRules'].forEach(k => {
    const v=gv('dr_'+k); if(v!==undefined) obj[k]=v;
  });

  // ── Tab sırası ──
  const tabList = g('dc_tab_list');
  if(tabList){
    obj.tabOrder = [...tabList.children].map(el=>el.dataset.tabId);
    obj.hiddenTabs = [...tabList.children].filter(el=>parseFloat(el.style.opacity)<1).map(el=>el.dataset.tabId);
  }

  try {
    // SDK üzerinden kaydet (REST token sorunu yok)
    await dbRef('settings/design').set(obj);
    applyGlobalDesign(obj);
    showToast('✅ Tasarım kaydedildi! Üyeler yenileyince görecek.');
  } catch(e) {
    // SDK başarısız → REST dene
    try {
      await adminRestSet('settings/design', obj);
      applyGlobalDesign(obj);
      showToast('✅ Tasarım kaydedildi!');
    } catch(e2) {
      showToast('❌ Kaydetme hatası: ' + (e2.message||e.message));
    }
  }
}


function applyGlobalDesign(d){
  if(!d) return;
  const root = document.documentElement;

  // ── CSS Değişkenleri — Renkler ──
  const COLOR_MAP = {
    color_bg:'--bg', color_bg2:'--bg2', color_surface:'--surface',
    color_surface2:'--surface2', color_border:'--border', color_text:'--text',
    color_textHi:'--text-hi', color_muted:'--muted', color_accent:'--accent',
    color_green:'--green', color_red:'--red', color_yellow:'--yellow',
    color_purple:'--purple', color_sidebarBg:'--sidebar-bg', color_sidebarItem:'--sidebar-item',
    color_navBg:'--nav-bg', color_tabBarBg:'--tabbar-bg',
    color_ownBg:'--own-bg', color_incomingBg:'--incoming-bg',
    color_ownText:'--own-text', color_incomingText:'--incoming-text',
    color_inputBg:'--input-bg', color_inputBorder:'--input-border',
  };
  Object.entries(COLOR_MAP).forEach(([dk,cv]) => { if(d[dk]) root.style.setProperty(cv, d[dk]); });

  // ── Font ──
  if(d.fontFamily) document.body.style.fontFamily = d.fontFamily;

  // ── Range → CSS Vars ──
  const RANGE_MAP = {
    borderRadius:['--radius','px'], cardRadius:['--card-radius','px'],
    msgRadius:['--msg-radius','px'], inputRadius:['--input-radius','px'],
    btnRadius:['--btn-radius','px'], avatarRadius:['--avatar-radius','px'],
    sidebarWidth:['--sidebar-w','px'], railWidth:['--rail-w','px'],
    headerHeight:['--header-h','px'], tabBarHeight:['--tab-bar-h','px'],
    avatarSize:['--avatar-size','px'], inputHeight:['--input-h','px'],
    cardShadow:['--card-shadow-blur','px'], headerBlur:['--header-blur','px'],
    sidebarBlur:['--sidebar-blur','px'], modalBlur:['--modal-blur','px'],
    overlayOpacity:['--overlay-opacity','%'],
    msgPaddingH:['--msg-pad-h','px'], msgPaddingV:['--msg-pad-v','px'],
    sectionGap:['--section-gap','px'], msgGap:['--msg-gap','px'],
  };
  Object.entries(RANGE_MAP).forEach(([k,[cv,u]]) => {
    if(d[k]!==undefined) root.style.setProperty(cv, d[k]+u);
  });

  // ── Yazı boyutları → direkt CSS ──
  const textCSS = [];
  if(d.msgFontSize)           textCSS.push(`.msg-text,.msg-body,.m-text{font-size:${d.msgFontSize}px!important}`);
  if(d.sidebarFontSize)       textCSS.push(`.r-label,.sec-hdr,.dsk-sec-hdr{font-size:${d.sidebarFontSize}px!important}`);
  if(d.headerFontSize)        textCSS.push(`.ws-name{font-size:${d.headerFontSize}px!important}`);
  if(d.inputFontSize)         textCSS.push(`#msgInput,textarea{font-size:${d.inputFontSize}px!important}`);
  if(d.forumFontSize)         textCSS.push(`.forum-post-body,.forum-body{font-size:${d.forumFontSize}px!important}`);
  if(d.sidebarItemFontSize)   textCSS.push(`.r-label,.ch-title{font-size:${d.sidebarItemFontSize}px!important}`);
  if(d.timestampSize)         textCSS.push(`.msg-time,.timestamp{font-size:${d.timestampSize}px!important}`);
  if(d.usernameFontSize)      textCSS.push(`.msg-author,.username{font-size:${d.usernameFontSize}px!important}`);
  if(d.letterSpacing!==undefined) textCSS.push(`body{letter-spacing:${d.letterSpacing}px!important}`);
  if(textCSS.length) injectDesignCSS('nc-text-sizes', textCSS.join('\n'));

  // ── İkon boyutları ──
  const iconCSS = [];
  if(d.tabIconSize)   iconCSS.push(`.tab-ic svg{width:${d.tabIconSize}px!important;height:${d.tabIconSize}px!important}`);
  if(d.tabLabelSize)  iconCSS.push(`.tab-lb{font-size:${d.tabLabelSize}px!important}`);
  if(d.navIconSize)   iconCSS.push(`.rail-btn-ic svg{width:${d.navIconSize}px!important;height:${d.navIconSize}px!important}`);
  if(d.railBtnRadius) iconCSS.push(`.rail-btn{border-radius:${d.railBtnRadius}px!important}`);
  if(d.railBtnSize)   iconCSS.push(`.rail-btn{width:${d.railBtnSize}px!important;height:${d.railBtnSize}px!important}`);
  if(d.statusDotSize) iconCSS.push(`.sdot,.status-dot{width:${d.statusDotSize}px!important;height:${d.statusDotSize}px!important}`);
  if(d.avatarSize)    iconCSS.push(`.ws-av,.av-wrap,.av{width:${d.avatarSize}px!important;height:${d.avatarSize}px!important}`);
  if(iconCSS.length)  injectDesignCSS('nc-icon-sizes', iconCSS.join('\n'));

  // ── Layout ──
  const layoutCSS = [];
  if(d.sidebarWidth)    layoutCSS.push(`#sidebar,.sidebar{width:${d.sidebarWidth}px!important;min-width:${d.sidebarWidth}px!important}`);
  if(d.railWidth)       layoutCSS.push(`#rail,.rail{width:${d.railWidth}px!important;min-width:${d.railWidth}px!important}`);
  if(d.headerHeight)    layoutCSS.push(`.ws-header{height:${d.headerHeight}px!important;min-height:${d.headerHeight}px!important}`);
  if(d.tabBarHeight)    layoutCSS.push(`.tab-bar{height:${d.tabBarHeight}px!important;min-height:${d.tabBarHeight}px!important}`);
  if(d.inputHeight)     layoutCSS.push(`#msgInput{height:${d.inputHeight}px!important;min-height:${d.inputHeight}px!important}`);
  if(d.sidebarItemPad)  layoutCSS.push(`.r-item,.ch-item{padding-top:${d.sidebarItemPad}px!important;padding-bottom:${d.sidebarItemPad}px!important}`);
  if(d.msgGap!==undefined) layoutCSS.push(`.msg-wrap,.msg-row{margin-bottom:${d.msgGap}px!important}`);
  if(d.sectionGap!==undefined) layoutCSS.push(`.sec-hdr,.dsk-sec-hdr{margin-top:${d.sectionGap}px!important}`);
  if(layoutCSS.length)  injectDesignCSS('nc-layout-sizes', layoutCSS.join('\n'));

  // ── Gölge & Blur ──
  const shadowCSS = [];
  if(d.cardShadow!==undefined)   shadowCSS.push(`.card,.r-card,.msg-card{box-shadow:0 4px ${d.cardShadow}px rgba(0,0,0,.4)!important}`);
  if(d.headerShadow!==undefined) shadowCSS.push(`.ws-header{box-shadow:0 2px ${d.headerShadow}px rgba(0,0,0,.5)!important}`);
  if(d.headerBlur!==undefined)   shadowCSS.push(`.ws-header{backdrop-filter:blur(${d.headerBlur}px)!important;-webkit-backdrop-filter:blur(${d.headerBlur}px)!important}`);
  if(d.bubbleShadow!==undefined) shadowCSS.push(`.msg-own,.msg-in,.msg-bubble{box-shadow:0 2px ${d.bubbleShadow}px rgba(0,0,0,.3)!important}`);
  if(shadowCSS.length)           injectDesignCSS('nc-shadows', shadowCSS.join('\n'));

  // ── Toggle'lar ──
  if(d.compactMode!==undefined)       document.body.classList.toggle('compact-mode', !!d.compactMode);
  if(d.glassEffect!==undefined)       document.body.classList.toggle('glass-effect', !!d.glassEffect);
  if(d.roundedEverything!==undefined) document.body.classList.toggle('rounded-all', !!d.roundedEverything);
  if(d.gradientBg!==undefined)        document.body.classList.toggle('gradient-bg', !!d.gradientBg);
  if(d.showAvatars===false)   injectDesignCSS('nc-no-avatars','.ws-av,.av-wrap,.av{display:none!important}');
  if(d.showTimestamps===false)injectDesignCSS('nc-no-timestamps','.msg-time,.timestamp{display:none!important}');
  if(d.showReactions===false) injectDesignCSS('nc-no-reactions','.reaction-row,.msg-react{display:none!important}');
  if(d.showCarbonWidget===false) { document.querySelectorAll('#carbonWidget').forEach(e=>e.style.display='none'); }
  if(d.showMusicWidget===false)  { document.querySelectorAll('.ambiance-btn,[onclick*="Ambiance"]').forEach(e=>e.style.display='none'); }
  if(d.showNatureBot===false)    { document.querySelectorAll('#natureBotPet,#botKennel').forEach(e=>e.style.display='none'); }

  // ── İçerik & Metin ──
  const ct = d.content||{};
  window._nc_labels = ct; // rooms.js ve desktop.js bundan okur

  if(ct.serverName){
    document.querySelectorAll('#wsHeaderName,.ws-name:first-of-type').forEach(el=>{ if(!el.classList.contains('ch-title')) el.textContent=ct.serverName; });
    document.title = ct.serverName + ' — Ana Sayfa';
  }
  if(ct.serverSubtitle){
    document.querySelectorAll('.ws-sub,.server-subtitle').forEach(el=>el.textContent=ct.serverSubtitle);
    const subn = document.querySelector('.ws-name + *');
    if(subn && subn.classList.contains('ws-sub')) subn.textContent = ct.serverSubtitle;
  }
  if(ct.welcomeTitle){
    document.querySelectorAll('.big-title,[data-ct="welcomeTitle"]').forEach(el=>el.textContent=ct.welcomeTitle);
  }
  if(ct.welcomeSubtitle){
    document.querySelectorAll('.big-sub,[data-ct="welcomeSubtitle"]').forEach(el=>el.textContent=ct.welcomeSubtitle);
  }

  // Tab etiketleri
  const tabLabelMap = {tabHome:'home',tabMsgs:'msgs',tabForum:'forum',tabFriends:'friends',tabWatch:'watch'};
  Object.entries(tabLabelMap).forEach(([ctKey,tabId]) => {
    if(ct[ctKey]){
      document.querySelectorAll(`.tab-lb,[data-tab="${tabId}"] .tab-lb`).forEach(el=>{
        if(el.closest(`[onclick*="${tabId}"]`)||el.closest(`#tab${tabId.charAt(0).toUpperCase()+tabId.slice(1)}`)){
          el.textContent=ct[ctKey];
        }
      });
    }
  });

  // ── Özel Medya ──
  if(d.customImages){
    const ci = d.customImages;
    if(ci.appLogo){
      document.querySelectorAll('#myAvatar,#deskRailUser,.app-logo').forEach(el=>{
        el.innerHTML = ci.appLogo.startsWith('http')||ci.appLogo.startsWith('data')
          ? `<img src="${ci.appLogo}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
          : ci.appLogo;
      });
    }
    if(ci.botAvatar){
      document.querySelectorAll('#natureBotPet .bot-head,.naturebot-avatar').forEach(el=>{
        el.innerHTML = ci.botAvatar.startsWith('http')||ci.botAvatar.startsWith('data')
          ? `<img src="${ci.botAvatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
          : ci.botAvatar;
      });
    }
    if(ci.loginBg){
      const ls = document.getElementById('loginScreen');
      if(ls) ls.style.backgroundImage = `url('${ci.loginBg}')`;
    }
  }

  // ── Tab sırası & görünürlük ──
  if(d.tabOrder && d.tabOrder.length){
    document.querySelectorAll('.tab-bar').forEach(bar => {
      const tabs = [...bar.children];
      d.tabOrder.forEach((id,idx) => {
        const el = tabs.find(t => {
          const oc=t.getAttribute('onclick')||'', tid=t.id||'';
          if(id==='home')    return tid==='tabHome'||oc.includes("'home'");
          if(id==='msgs')    return oc.includes('openDMModal');
          if(id==='forum')   return tid==='tabForum'||oc.includes("'forum'");
          if(id==='friends') return oc.includes('openFriendsModal')||oc.includes("'friends'");
          if(id==='watch')   return oc.includes("'watch'");
          return false;
        });
        if(el) el.style.order = idx;
      });
      if(d.hiddenTabs) d.hiddenTabs.forEach(id => {
        const el = tabs.find(t => {
          const oc=t.getAttribute('onclick')||'',tid=t.id||'';
          if(id==='home')    return tid==='tabHome'||oc.includes("'home'");
          if(id==='msgs')    return oc.includes('openDMModal');
          if(id==='forum')   return tid==='tabForum'||oc.includes("'forum'");
          if(id==='friends') return oc.includes('openFriendsModal');
          if(id==='watch')   return oc.includes("'watch'");
          return false;
        });
        if(el) el.style.display='none';
      });
    });
  }

  // ── Özel CSS ──
  if(d.customCSS) injectDesignCSS('nc-custom-css', d.customCSS);

  // ── Özel JS ──
  if(d.customJS){
    try { (new Function(d.customJS))(); } catch(e){ console.warn('customJS error:',e); }
  }
}


function addDesignStyle(varName, value, selector){
  injectDesignCSS('nc-ds-'+varName.replace(/[^a-z0-9]/g,''), `${selector} { font-size:${value}!important; }`);
}

function injectDesignCSS(id, css){
  let el = document.getElementById(id);
  if(!el){ el=document.createElement('style'); el.id=id; document.head.appendChild(el); }
  el.textContent = css;
}



/* ═══════════════════════════════════════════════════
   📱 MOBİL / TABLET / MASAÜSTÜ SİMÜLATÖRÜ
   ═══════════════════════════════════════════════════ */

function openSimulator(){
  const existing = document.getElementById('ncSimOverlay');
  if(existing){ existing.remove(); return; }

  const DEVICES = [
    { id:'iphone15',   name:'iPhone 15 Pro',     w:393,  h:852,  mobile:true  },
    { id:'iphone_se',  name:'iPhone SE (3.nesil)',w:375,  h:667,  mobile:true  },
    { id:'iphone_max', name:'iPhone 15 Pro Max',  w:430,  h:932,  mobile:true  },
    { id:'ipad',       name:'iPad Air 11"',        w:820,  h:1180, mobile:true  },
    { id:'android_s',  name:'Samsung S24',         w:360,  h:780,  mobile:true  },
    { id:'android_m',  name:'Pixel 8 Pro',         w:412,  h:915,  mobile:true  },
    { id:'desktop_sm', name:'Laptop 1366×768',     w:1366, h:768,  mobile:false },
    { id:'desktop_lg', name:'Desktop 1920×1080',   w:1920, h:1080, mobile:false },
  ];

  let activeDev = DEVICES[0];
  let isLandscape = false;
  let zoomVal = 0.58;

  function gW(){ return isLandscape ? activeDev.h : activeDev.w; }
  function gH(){ return isLandscape ? activeDev.w : activeDev.h; }

  function updateFrame(){
    const iframe = document.getElementById('simIframe');
    const bezel  = document.getElementById('simBezel');
    const info   = document.getElementById('simSizeInfo');
    const notch  = document.getElementById('simNotch');
    const homebar= document.getElementById('simHomebar');
    if(iframe){ iframe.style.width = gW()+'px'; iframe.style.height = gH()+'px'; }
    if(bezel)  bezel.style.transform = 'scale('+zoomVal+')';
    if(info)   info.textContent = gW()+'×'+gH();
    if(notch)  notch.style.display = activeDev.mobile ? 'flex' : 'none';
    if(homebar)homebar.style.display = activeDev.mobile ? 'flex' : 'none';
    // Bezel border-radius desktop'ta düz
    const shell = document.getElementById('simBezel');
    if(shell) shell.style.borderRadius = activeDev.mobile ? '40px' : '8px';
  }

  const overlay = document.createElement('div');
  overlay.id = 'ncSimOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(5,5,15,.95);display:flex;flex-direction:column;';

  const devOptions = DEVICES.map(d =>
    '<option value="'+d.id+'" '+(d.id===activeDev.id?'selected':'')+'>'+
    (d.mobile?'📱':'🖥️')+' '+d.name+' ('+d.w+'×'+d.h+')</option>'
  ).join('');

  const btnStyle = 'padding:6px 12px;border-radius:7px;font-size:.78rem;font-weight:700;cursor:pointer;border:1px solid #3a3a5e;background:#1a1a2e;color:#c4b5fd;';

  overlay.innerHTML =
    // ── Toolbar ──
    '<div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:#080812;border-bottom:1px solid #1e1e3a;flex-shrink:0;flex-wrap:wrap;">'+
      '<button onclick="document.getElementById(\'ncSimOverlay\').remove()" style="padding:6px 12px;background:#dc2626;border:none;border-radius:7px;color:#fff;font-weight:900;cursor:pointer;font-size:.82rem;">✕</button>'+
      '<span style="color:#fff;font-weight:900;font-size:.88rem;">📱 Simülatör</span>'+
      '<select id="simDevSel" style="'+btnStyle+'max-width:220px;padding:6px 8px;" onchange="window._simChange(this.value)">'+devOptions+'</select>'+
      '<button id="simOrientBtn" style="'+btnStyle+'" onclick="window._simOrient()">🔄 Dikey</button>'+
      '<div style="display:flex;align-items:center;gap:5px;">'+
        '<span style="color:#6b7280;font-size:.7rem;">Zoom</span>'+
        '<input type="range" id="simZoomR" min="15" max="95" value="58" style="width:80px;accent-color:#7c3aed;" oninput="window._simZoom(this.value)">'+
        '<span id="simZoomLbl" style="color:#c4b5fd;font-size:.72rem;min-width:32px;">58%</span>'+
      '</div>'+
      '<span id="simSizeInfo" style="margin-left:auto;color:#6b7280;font-size:.72rem;font-family:monospace;">'+gW()+'×'+gH()+'</span>'+
      '<button style="'+btnStyle+'" onclick="window._simReload()">↺ Yenile</button>'+
      // Ön hazır zoom butonları
      '<div style="display:flex;gap:4px;">'+
        '<button style="'+btnStyle+'font-size:.68rem;padding:4px 7px;" onclick="window._simZoom(35)">35%</button>'+
        '<button style="'+btnStyle+'font-size:.68rem;padding:4px 7px;" onclick="window._simZoom(58)">58%</button>'+
        '<button style="'+btnStyle+'font-size:.68rem;padding:4px 7px;" onclick="window._simZoom(80)">80%</button>'+
      '</div>'+
    '</div>'+
    // ── Stage ──
    '<div id="simStage" style="flex:1;display:flex;align-items:center;justify-content:center;overflow:auto;padding:30px;">'+
      '<div id="simBezel" style="'+
        'border-radius:40px;'+
        'background:linear-gradient(145deg,#252535,#141420);'+
        'padding:16px 14px;'+
        'box-shadow:0 0 0 2px #3a3a5e,0 0 0 4px #1a1a2e,0 24px 80px rgba(0,0,0,.9),inset 0 0 20px rgba(255,255,255,.02);'+
        'transform-origin:center center;'+
        'transform:scale('+zoomVal+');'+
        'transition:transform .2s;'+
      '">'+
        // Notch
        '<div id="simNotch" style="width:100%;display:flex;justify-content:center;margin-bottom:5px;">'+
          '<div style="width:100px;height:7px;background:#0a0a14;border-radius:4px;"></div>'+
        '</div>'+
        // Screen
        '<div style="border-radius:22px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);">'+
          '<iframe id="simIframe" style="display:block;border:none;background:#1a1e25;" width="'+gW()+'" height="'+gH()+'" src="'+location.href.split('#')[0]+'"></iframe>'+
        '</div>'+
        // Home bar
        '<div id="simHomebar" style="width:100%;display:flex;justify-content:center;margin-top:6px;">'+
          '<div style="width:110px;height:4px;background:rgba(255,255,255,.18);border-radius:2px;"></div>'+
        '</div>'+
      '</div>'+
    '</div>';

  document.body.appendChild(overlay);

  // Iframe yüklenince oturumu aktar
  document.getElementById('simIframe').addEventListener('load', function(){
    try{
      const iw = this.contentWindow;
      if(!iw || !window._cu) return;
      // localStorage üzerinden session
      iw.localStorage && Object.entries(localStorage).forEach(([k,v])=>{
        if(k.startsWith('sohbet_')) try{ iw.localStorage.setItem(k,v); }catch{}
      });
    }catch(e){}
  });

  // Global helpers
  window._simChange = function(devId){
    activeDev = DEVICES.find(d=>d.id===devId)||DEVICES[0];
    isLandscape = false;
    const orientBtn = document.getElementById('simOrientBtn');
    if(orientBtn) orientBtn.textContent = '🔄 Dikey';
    updateFrame();
  };
  window._simOrient = function(){
    isLandscape = !isLandscape;
    const btn = document.getElementById('simOrientBtn');
    if(btn) btn.textContent = isLandscape ? '🔄 Yatay' : '🔄 Dikey';
    updateFrame();
  };
  window._simZoom = function(val){
    zoomVal = val/100;
    const lbl = document.getElementById('simZoomLbl');
    const r   = document.getElementById('simZoomR');
    if(lbl) lbl.textContent = Math.round(val)+'%';
    if(r) r.value = val;
    updateFrame();
  };
  window._simReload = function(){
    const iframe = document.getElementById('simIframe');
    if(iframe) iframe.src = iframe.src;
  };
}


// Sayfa yüklenince global tasarımı Firebase'den çekip uygula
(function initGlobalDesign(){
  setTimeout(async ()=>{
    try {
      const snap = await dbRef('settings/design').once('value');
      const d = snap.val();
      if(d) applyGlobalDesign(d);
    } catch(e){}
  }, 900);
})();



/* ── Admin: Settings ── */


/* ── Admin: Üye Oluştur ── */

window._renderCreateUser = async function(body) {
  body.innerHTML = '<div class="ld"><span></span><span></span><span></span></div>';
  body.innerHTML = `
    <div class="admin-section">
      <div class="admin-sec-title">➕ Yeni Üye Oluştur</div>
      <div style="display:flex;flex-direction:column;gap:12px;max-width:420px;">
        <div>
          <div style="font-size:.75rem;color:var(--muted);margin-bottom:4px;">Kullanıcı Adı</div>
          <input class="admin-inp" id="cu_username" placeholder="kullanici_adi" style="width:100%;">
        </div>
        <div>
          <div style="font-size:.75rem;color:var(--muted);margin-bottom:4px;">Şifre</div>
          <input class="admin-inp" id="cu_password" type="password" placeholder="••••••••" style="width:100%;">
        </div>
        <div>
          <div style="font-size:.75rem;color:var(--muted);margin-bottom:4px;">Rol</div>
          <select class="admin-inp" id="cu_role" style="width:100%;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:8px 10px;">
            <option value="user">👤 Üye</option>
            <option value="mod">🛡️ Moderatör</option>
            <option value="admin">👑 Admin</option>
          </select>
        </div>
        <button onclick="adminCreateUserSubmit()" style="padding:12px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-weight:900;font-size:.88rem;cursor:pointer;margin-top:4px;">
          ✅ Üye Oluştur
        </button>
        <div id="cu_result" style="font-size:.82rem;color:var(--muted);"></div>
      </div>
    </div>`;
};

async function adminCreateUserSubmit() {
  const username = (document.getElementById('cu_username')?.value||'').trim();
  const password = (document.getElementById('cu_password')?.value||'').trim();
  const role = document.getElementById('cu_role')?.value || 'user';
  const res = document.getElementById('cu_result');
  if(!username || !password){ if(res) res.textContent='❌ Kullanıcı adı ve şifre zorunlu.'; return; }
  if(username.length < 3){ if(res) res.textContent='❌ Kullanıcı adı en az 3 karakter olmalı.'; return; }
  if(password.length < 6){ if(res) res.textContent='❌ Şifre en az 6 karakter olmalı.'; return; }
  try {
    const existing = await adminRestGet('users/'+username).catch(()=>null);
    if(existing){ if(res) res.textContent='❌ Bu kullanıcı adı zaten alınmış.'; return; }
    // Login sistemi hashStr(pass+user) kullanıyor — aynı formatta kaydet
    const passwordHash = await hashStr(password + username);
    const userData = {
      username, role,
      passwordHash,
      createdAt: Date.now(),
      createdBy: _cu,
      online: false,
      avatar: '', bio: ''
    };
    await adminRestSet('users/'+username, userData);
    if(res) res.innerHTML = '<span style="color:var(--green)">✅ '+username+' kullanıcısı oluşturuldu!</span>';
    document.getElementById('cu_username').value='';
    document.getElementById('cu_password').value='';
  } catch(e) {
    if(res) res.textContent = '❌ Hata: ' + (e.message||e);
  }
}


/* ── Admin: Davet Linkleri ── */

window._renderInviteLinks = async function(body) {
  body.innerHTML = '<div class="ld"><span></span><span></span><span></span></div>';
  const settings = await adminRestGet('settings').catch(()=>null)||{};
  const inviteCode = settings.inviteCode || '';
  const regOpen = (settings.registration||'open') === 'open';
  const baseUrl = window.location.origin + window.location.pathname;

  body.innerHTML = `
    <div class="admin-section">
      <div class="admin-sec-title">🔗 Davet Linkleri</div>
      <div style="display:flex;flex-direction:column;gap:16px;max-width:520px;">
        
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;">
          <div style="font-size:.78rem;color:var(--muted);margin-bottom:8px;">📋 Kayıt Durumu</div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:10px;height:10px;border-radius:50%;background:${regOpen?'var(--green)':'var(--red)'}"></div>
            <span style="font-size:.88rem;font-weight:700;color:var(--text-hi);">${regOpen?'Kayıt Açık':'Kayıt Kapalı'}</span>
          </div>
        </div>

        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;">
          <div style="font-size:.78rem;color:var(--muted);margin-bottom:8px;">🔑 Davet Kodu</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="admin-inp" id="inv_code" value="${inviteCode}" placeholder="Davet kodu (boş = kod gerekmez)" style="flex:1;">
            <button onclick="adminSaveInviteCode()" style="padding:9px 14px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:.8rem;cursor:pointer;white-space:nowrap;">Kaydet</button>
          </div>
          <div style="font-size:.7rem;color:var(--muted);margin-top:6px;">Boş bırakılırsa davet kodu sorulmaz.</div>
        </div>

        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;">
          <div style="font-size:.78rem;color:var(--muted);margin-bottom:8px;">🌐 Davet Linki</div>
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:.8rem;color:var(--text);word-break:break-all;font-family:monospace;" id="inv_link_display">
            ${inviteCode ? baseUrl+'?invite='+inviteCode : baseUrl}
          </div>
          <button onclick="adminCopyInviteLink()" style="margin-top:8px;padding:8px 14px;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;">📋 Kopyala</button>
        </div>

        <div id="inv_result" style="font-size:.82rem;color:var(--muted);"></div>
      </div>
    </div>`;
};

async function adminSaveInviteCode() {
  const code = (document.getElementById('inv_code')?.value||'').trim();
  const res = document.getElementById('inv_result');
  try {
    await adminRestSet('settings/inviteCode', code || null);
    const baseUrl = window.location.origin + window.location.pathname;
    const display = document.getElementById('inv_link_display');
    if(display) display.textContent = code ? baseUrl+'?invite='+code : baseUrl;
    if(res) res.innerHTML = '<span style="color:var(--green)">✅ Davet kodu kaydedildi.</span>';
  } catch(e) {
    if(res) res.textContent = '❌ Hata: ' + (e.message||e);
  }
}

function adminCopyInviteLink() {
  const display = document.getElementById('inv_link_display');
  if(!display) return;
  navigator.clipboard.writeText(display.textContent.trim()).then(()=>showToast('📋 Link kopyalandı!'));
}

async function loadAdminSettings(){
  const body = document.getElementById('adminBody');
  body.innerHTML='<div class="ld"><span></span><span></span><span></span></div>';
  const s = await adminRestGet('settings').catch(()=>null)||{};
  try{
    {
    const appName = esc(s.appName||'Nature.co');
    const welcomeMsg = esc(s.welcomeMsg||'');
    const msgLimit = s.msgLimit||100;
    const regOpen = (s.registration||'open')==='open';
    const inviteCode = esc(s.inviteCode||'');

    let html = '<div class="admin-section">';
    html += '<div class="admin-sec-title">⚙️ Uygulama Ayarları</div>';
    html += '<div class="admin-card" style="padding:14px;display:flex;flex-direction:column;gap:14px;">';

    html += '<div><div class="admin-sec-title" style="margin-bottom:6px">Uygulama Adı</div>';
    html += '<div style="display:flex;gap:8px">';
    html += '<input class="admin-inp" id="setAppName" value="'+appName+'" placeholder="Uygulama adı..." style="margin-bottom:0;flex:1">';
    html += `<button class="a-btn blue" onclick="saveAdminSetting('appName','setAppName','Güncellendi.')">Kaydet</button>`;
    html += '</div></div>';

    html += '<div><div class="admin-sec-title" style="margin-bottom:6px">Hoşgeldin Mesajı</div>';
    html += '<div style="display:flex;gap:8px">';
    html += '<input class="admin-inp" id="setWelcome" value="'+welcomeMsg+'" placeholder="Yeni üyelere mesaj..." style="margin-bottom:0;flex:1">';
    html += `<button class="a-btn blue" onclick="saveAdminSetting('welcomeMsg','setWelcome','Güncellendi.')">Kaydet</button>`;
    html += '</div></div>';

    const srvLabel = (typeof FB_SERVERS !== 'undefined' && _activeServer && FB_SERVERS[_activeServer]) ? FB_SERVERS[_activeServer].label : (_activeServer||'Bu Sunucu');
    html += '<div><div class="admin-sec-title" style="margin-bottom:6px">🔐 Üye Kaydı — <span style="color:var(--primary)">' + srvLabel + '</span></div>';
    html += '<div style="background:var(--bg);border-radius:10px;padding:14px;display:flex;align-items:center;justify-content:space-between;gap:12px">';
    html += '<div>';
    html += '<div style="font-size:13px;font-weight:600;color:var(--text-hi)">' + (regOpen ? '✅ Kayıt Açık' : '🔒 Kayıt Kapalı') + '</div>';
    html += '<div style="font-size:11px;color:var(--muted);margin-top:3px">' + (regOpen ? 'Yeni üyeler kayıt olabilir' : 'Yeni üye alımı durduruldu') + '</div>';
    html += '</div>';
    html += '<button id="regToggleBtn" onclick="toggleRegistration()" style="padding:10px 20px;border-radius:8px;border:none;font-weight:700;font-size:13px;cursor:pointer;background:' + (regOpen ? '#e74c3c' : '#2ecc71') + ';color:#fff">';
    html += regOpen ? '🔒 Kaydı Durdur' : '✅ Kaydı Aç';
    html += '</button>';
    html += '</div></div>';

    html += '<div><div class="admin-sec-title" style="margin-bottom:6px">Mesaj Geçmişi Sınırı</div>';
    html += '<div style="display:flex;gap:8px">';
    html += '<input class="admin-inp" id="setMsgLimit" type="number" value="'+msgLimit+'" min="10" max="1000" style="margin-bottom:0;flex:1">';
    html += `<button class="a-btn blue" onclick="saveAdminSettingNum('msgLimit','setMsgLimit','Güncellendi.')">Kaydet</button>`;
    html += '</div></div>';

    html += '</div></div>';

    html += '<div class="admin-section" style="margin-top:12px">';
    html += '<div class="admin-sec-title">🗑️ Toplu İşlemler</div>';
    html += '<div class="admin-card" style="padding:14px;display:flex;flex-direction:column;gap:10px;border-color:rgba(224,30,90,.25);">';
    html += '<div style="font-size:.75rem;color:var(--muted);margin-bottom:4px;">⚠️ Bu işlemler geri alınamaz. Dikkatli kullanın.</div>';
    html += '<button onclick="adminClearAllMsgs()" style="width:100%;padding:11px;border:1px solid rgba(224,30,90,.3);border-radius:9px;background:rgba(224,30,90,.12);color:#ff5a8a;font-weight:900;font-size:.88rem;cursor:pointer;">🗑️ Tüm Mesajları Sil (DM Dahil)</button>';
    html += '<button onclick="adminClearForumPosts()" style="width:100%;padding:11px;border:1px solid rgba(224,30,90,.3);border-radius:9px;background:rgba(224,30,90,.12);color:#ff5a8a;font-weight:900;font-size:.88rem;cursor:pointer;">🗑️ Tüm Forum Paylaşımlarını Sil</button>';
    html += '</div></div>';
    // ── AI Asistan Key bölümü ──
    const aiKey = esc(s.openrouterKey||'');
    const aiKeyMasked = aiKey ? '✅ Key kayıtlı (' + aiKey.slice(0,8) + '...)' : '❌ Key girilmemiş';
    html += '<div class="admin-section" style="margin-top:12px">';
    html += '<div class="admin-sec-title">🤖 AI Mesaj Asistanı</div>';
    html += '<div class="admin-card" style="padding:14px;display:flex;flex-direction:column;gap:10px;">';
    html += '<div style="font-size:.75rem;color:var(--muted);">OpenRouter API key giriniz — tüm kullanıcılar kendi key girmeden AI asistanı kullanabilir.</div>';
    html += '<div style="font-size:.78rem;font-weight:700;color:' + (aiKey ? 'var(--green)' : '#e05555') + ';">' + aiKeyMasked + '</div>';
    html += '<div style="display:flex;gap:8px;">';
    html += '<input class="admin-inp" type="password" id="setAiKey" value="' + aiKey + '" placeholder="sk-or-..." style="margin-bottom:0;flex:1;">';
    html += '<button class="a-btn blue" onclick="saveAiKeyAdmin()">Kaydet</button>';
    html += '</div>';
    html += '<div style="font-size:.7rem;color:var(--muted);">Ücretsiz key: <a href="https://openrouter.ai/keys" target="_blank" style="color:var(--purple);">openrouter.ai/keys</a></div>';
    html += '</div></div>';

    // Davet kodu bölümü
    html += '<div class="admin-section" style="margin-top:12px">';
    html += '<div class="admin-sec-title">🔑 Davet Kodu</div>';
    html += '<div class="admin-card" style="padding:14px;"><div style="font-size:.75rem;color:var(--muted);margin-bottom:8px;">Üye kaydı kapalıyken kullanıcıların kayıt olabilmesi için kod.</div>';
    html += '<div style="display:flex;gap:8px;">';
    html += '<input class="admin-inp" id="setInviteCode" value="'+inviteCode+'" placeholder="Örn: NATURE2026" style="margin-bottom:0;flex:1;">';
    html += '<button class="a-btn purple" onclick="saveAdminSetting(\'inviteCode\',\'setInviteCode\',\'Davet kodu güncellendi.\')">Kaydet</button>';
    html += '</div></div></div>';

    // ── Yedekleme bölümü ──
    html += '<div class="admin-section" style="margin-top:12px"><div class="admin-sec-title">📦 Veri Yedekleme</div><div class="admin-card" style="padding:14px;display:flex;flex-direction:column;gap:8px;"><div style="font-size:.75rem;color:var(--muted);margin-bottom:4px;">Seçilen verileri JSON formatında indirin.</div>';
    ['users','rooms','msgs','forum/posts','settings'].forEach(function(p){
      html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px;background:var(--surface2);border-radius:8px;"><input type="checkbox" id="bkp_'+p.replace('/','_')+'" checked><span style="font-size:.82rem;color:var(--text);">📁 '+p+'</span></label>';
    });
    html += '<button class="a-btn blue" style="width:100%;margin-top:4px;" onclick="execExportFromSettings()">⬇️ Yedek Al</button></div></div>';

    body.innerHTML = html;
  }}catch(e){ body.innerHTML='<p style="color:var(--muted);padding:20px">Yüklenemedi.</p>'; }
}

async function execExportFromSettings(){
  const paths=['users','rooms','msgs','forum/posts','settings'].filter(p=>{const el=document.getElementById('bkp_'+p.replace('/','_'));return el&&el.checked;});
  if(!paths.length){showToast('En az bir alan seçin.');return;}
  showToast('📦 Dışa aktarılıyor...');
  const result={exportedAt:new Date().toISOString()};
  for(const p of paths){ try{result[p.replace('/','_')]=await adminRestGet(p);}catch(e){result[p.replace('/','_')]=null;} }
  const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='backup_'+Date.now()+'.json'; a.click(); URL.revokeObjectURL(url);
  showToast('✅ Yedek indirildi!');
}

async function toggleRegistration(){
  const btn = document.getElementById('regToggleBtn');
  if(!btn) return;
  const isOpening = btn.textContent.includes('Aç');
  const newVal = isOpening ? 'open' : 'closed';
  btn.disabled = true;
  try{ await adminRestSet('settings/registration',newVal); showToast(isOpening?'✅ Kayıt açıldı!':'🔒 Kayıt durduruldu!'); loadAdminSettings(); }
  catch(e){ showToast('❌ Hata: '+(e&&e.message||'Bilinmiyor')); btn.disabled=false; }
}
async function saveAiKeyAdmin(){
  const val = (document.getElementById('setAiKey')?.value||'').trim();
  if(!val){ showToast('❌ Key boş olamaz'); return; }
  try{
    await adminRestSet('settings/openrouterKey', val);
    showToast('✅ AI Key kaydedildi! Tüm kullanıcılar artık kullanabilir.');
    loadAdminSettings();
  }catch(e){ showToast('❌ Hata: '+(e?.message||'')); }
}

async function saveAdminSetting(key, inputId, successMsg){
  const val = document.getElementById(inputId).value.trim();
  try{ await adminRestSet('settings/'+key,val); showToast(successMsg); }
  catch(e){ showToast('❌ Hata: '+(e&&e.message||'Bilinmiyor')); }
}
async function saveAdminSettingNum(key, inputId, successMsg){
  const val = parseInt(document.getElementById(inputId).value)||100;
  try{ await adminRestSet('settings/'+key,val); showToast(successMsg); }catch(e){ showToast('❌ Hata: '+(e&&e.message||'')); }
}
async function adminClearAllMsgs(){
  if(!confirm('TÜM mesajlar (DM dahil) silinsin mi? Bu işlem geri alınamaz!'))return;
  try{
    const clearedAt = Date.now();
    const rooms = await adminRestGet('rooms')||{};
    await Promise.all(Object.keys(rooms).map(id=>adminRestSet('rooms/'+id+'/clearedAt',clearedAt)));
    await adminRestDelete('msgs');
    await adminRestDelete('dms');
    showToast('✅ Tüm mesajlar silindi.'); if(typeof loadAdminMsgs==='function')loadAdminMsgs();
  }catch(e){ console.error('adminClearAllMsgs:',e); showToast('❌ Hata: '+((e&&e.message)||'Bilinmiyor')); }
}
async function adminClearForumPosts(){
  if(!confirm('TÜM forum paylaşımları silinsin mi? Bu işlem geri alınamaz!'))return;
  try{ await adminRestDelete('forum/posts'); showToast('✅ Tüm forum paylaşımları silindi.'); if(typeof loadAdminForum==='function')loadAdminForum(); }
  catch(e){ showToast('❌ Hata: '+(e&&e.message||'Bilinmiyor')); }
}


/* ══════════════════════════════════════════════
   🛡️ ADMIN: GÜVENLİK & GELİŞMİŞ YETKİLER
══════════════════════════════════════════════ */

async function loadAdminSecurity(){
  const body = document.getElementById('adminBody');
  body.innerHTML='<div class="ld"><span></span><span></span><span></span></div>';
  const s = await adminRestGet('settings').catch(()=>null)||{};
  try{
    {

    let html = '';

    // ── Bakım Modu ──
    html += `<div class="admin-section">
      <div class="admin-sec-title">🔧 Bakım Modu</div>
      <div class="admin-card" style="padding:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <div style="font-size:.85rem;font-weight:700;color:var(--text-hi);">Bakım modunu ${s.maintenance?'kapat':'aktifleştir'}</div>
            <div style="font-size:.75rem;color:var(--muted);margin-top:3px;">Aktifken sadece adminler giriş yapabilir.</div>
          </div>
          <button class="a-btn ${s.maintenance?'green':'red'}" onclick="toggleMaintenance(${!s.maintenance})">
            ${s.maintenance?'✅ Aktif — Kapat':'🔧 Kapalı — Aktifleştir'}
          </button>
        </div>
        ${s.maintenance ? `<div style="margin-top:12px;display:flex;gap:8px;">
          <input class="admin-inp" id="maintMsg" value="${esc(s.maintenanceMsg||'Sistem bakımda, yakında döneceğiz!')}" placeholder="Bakım mesajı..." style="margin-bottom:0;flex:1;">
          <button class="a-btn blue" onclick="saveAdminSetting('maintenanceMsg','maintMsg','Mesaj güncellendi.')">Kaydet</button>
        </div>` : ''}
      </div>
    </div>`;

    // ── Kullanıcı Limitleri ──
    html += `<div class="admin-section">
      <div class="admin-sec-title">👥 Kullanıcı Limitleri</div>
      <div class="admin-card" style="padding:14px;display:flex;flex-direction:column;gap:12px;">
        <div>
          <div style="font-size:.78rem;color:var(--muted);margin-bottom:6px;">Maksimum kullanıcı sayısı (0 = sınırsız)</div>
          <div style="display:flex;gap:8px;">
            <input class="admin-inp" id="setMaxUsers" type="number" value="${s.maxUsers||0}" min="0" style="margin-bottom:0;flex:1;">
            <button class="a-btn blue" onclick="saveAdminSettingNum('maxUsers','setMaxUsers','Güncellendi.')">Kaydet</button>
          </div>
        </div>
        <div>
          <div style="font-size:.78rem;color:var(--muted);margin-bottom:6px;">Minimum kullanıcı adı uzunluğu</div>
          <div style="display:flex;gap:8px;">
            <input class="admin-inp" id="setMinUsername" type="number" value="${s.minUsernameLen||3}" min="2" max="10" style="margin-bottom:0;flex:1;">
            <button class="a-btn blue" onclick="saveAdminSettingNum('minUsernameLen','setMinUsername','Güncellendi.')">Kaydet</button>
          </div>
        </div>
        <div>
          <div style="font-size:.78rem;color:var(--muted);margin-bottom:6px;">Kullanıcı başına maks. oda sayısı</div>
          <div style="display:flex;gap:8px;">
            <input class="admin-inp" id="setMaxRoomsUser" type="number" value="${s.maxRoomsPerUser||10}" min="1" style="margin-bottom:0;flex:1;">
            <button class="a-btn blue" onclick="saveAdminSettingNum('maxRoomsPerUser','setMaxRoomsUser','Güncellendi.')">Kaydet</button>
          </div>
        </div>
      </div>
    </div>`;

    // ── Yasaklı Kelimeler ──
    html += `<div class="admin-section">
      <div class="admin-sec-title">🚫 Yasaklı Kelimeler</div>
      <div class="admin-card" style="padding:14px;">
        <div style="font-size:.75rem;color:var(--muted);margin-bottom:8px;">Virgülle ayırın. Bu kelimeler mesajlarda otomatik filtrelenecek.</div>
        <textarea class="admin-inp" id="setBannedWords" style="margin-bottom:8px;min-height:80px;resize:vertical;">${esc(s.bannedWords||'')}</textarea>
        <button class="a-btn blue" onclick="saveAdminSetting('bannedWords','setBannedWords','Yasaklı kelimeler güncellendi.')">Kaydet</button>
      </div>
    </div>`;

    // ── Susturma Yönetimi ──
    html += `<div class="admin-section">
      <div class="admin-sec-title">🔇 Susturulan Kullanıcılar</div>
      <div class="admin-card" style="padding:14px;">
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <input class="admin-inp" id="muteUsername" placeholder="Kullanıcı adı..." style="margin-bottom:0;flex:1;" autocorrect="off" autocapitalize="off">
          <input class="admin-inp" id="muteDuration" type="number" value="60" min="1" placeholder="Dakika" style="margin-bottom:0;width:90px;">
          <button class="a-btn red" onclick="adminMuteUser()">🔇 Sustur</button>
        </div>`;

    // Muted users listesi
    const mutedList = Object.entries(s.mutedUsers||{}).filter(([,v])=>v>Date.now());
    if(mutedList.length){
      mutedList.forEach(([u, until])=>{
        const remaining = Math.ceil((until-Date.now())/60000);
        html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
          <div>
            <div style="font-size:.82rem;font-weight:700;color:var(--text-hi);">${esc(u)}</div>
            <div style="font-size:.7rem;color:var(--red);">⏱ ${remaining} dk kaldı</div>
          </div>
          <button class="a-btn green" style="font-size:.72rem;" onclick="adminUnmuteUser('${esc(u)}')">Sesi Aç</button>
        </div>`;
      });
    } else {
      html += '<div style="font-size:.78rem;color:var(--muted);">Susturulan kullanıcı yok.</div>';
    }
    html += `</div></div>`;

    // ── IP & Aktivite Logları ──
    html += `<div class="admin-section">
      <div class="admin-sec-title">📋 Aktivite Logları</div>
      <div class="admin-card" style="padding:14px;">
        <button class="a-btn blue" style="margin-bottom:10px;width:100%;" onclick="loadActivityLogs()">📋 Son 50 Girişi Göster</button>
        <div id="activityLogsBody" style="font-size:.75rem;color:var(--muted);">Butona basarak logları yükleyin.</div>
      </div>
    </div>`;

    // ── Toplu Bildirim ──
    html += `<div class="admin-section">
      <div class="admin-sec-title">📢 Toplu Bildirim Gönder</div>
      <div class="admin-card" style="padding:14px;display:flex;flex-direction:column;gap:10px;">
        <input class="admin-inp" id="broadcastTitle" placeholder="Bildirim başlığı..." style="margin-bottom:0;">
        <textarea class="admin-inp" id="broadcastMsg" placeholder="Bildirim mesajı..." style="margin-bottom:0;min-height:60px;resize:vertical;"></textarea>
        <button class="a-btn blue" onclick="adminSendBroadcast()">📢 Tüm Kullanıcılara Gönder</button>
      </div>
    </div>`;

    // ── Tehlikeli Bölge ──
    html += `<div class="admin-section">
      <div class="admin-sec-title" style="color:var(--red);">⚠️ Tehlikeli Bölge</div>
      <div class="admin-card" style="padding:14px;border-color:rgba(224,85,85,.3);display:flex;flex-direction:column;gap:10px;">
        <button class="admin-submit" style="background:var(--red);margin:0;" onclick="adminForceLogoutAll()">🚪 Tüm Kullanıcıları Çıkış Yaptır</button>
        <button class="admin-submit" style="background:var(--red);margin:0;" onclick="adminClearAllMsgs()">🗑️ Tüm Mesajları Sil</button>
        <button class="admin-submit" style="background:var(--red);margin:0;" onclick="adminClearForumPosts()">🗑️ Tüm Forum Gönderilerini Sil</button>
        <button class="admin-submit" style="background:#7f3f3f;margin:0;" onclick="adminDeleteInactiveUsers()">👤 Pasif Kullanıcıları Temizle (30 gün+)</button>
      </div>
    </div>`;

    body.innerHTML = html;
  }}catch(e){ body.innerHTML='<p style="color:var(--muted);padding:20px">Yüklenemedi.</p>'; }
}

async function toggleMaintenance(enable){
  if(enable && !confirm('Bakım modu aktifleştirilsin mi? Adminler dışında kimse giriş yapamaz!')) return;
  try{
    await adminRestSet('settings/maintenance',enable);
    showToast(enable ? '🔧 Bakım modu aktif.' : '✅ Bakım modu kapatıldı.');
    loadAdminSecurity();
  }catch(e){showToast('Hata: '+(e&&e.message||''));}
}

async function adminMuteUser(){
  const username = document.getElementById('muteUsername').value.trim();
  const minutes = parseInt(document.getElementById('muteDuration').value)||60;
  if(!username){ showToast('Kullanıcı adı girin.'); return; }
  const until = Date.now() + minutes * 60 * 1000;
  try{
    await Promise.all([
      adminRestSet('settings/mutedUsers/'+username,until),
      adminRestSet('users/'+username+'/mutedUntil',until)
    ]);
    showToast(`🔇 ${username} ${minutes} dakika susturuldu.`);
    loadAdminSecurity();
  }catch(e){showToast('Hata.');}
}

async function adminUnmuteUser(username){
  try{
    await Promise.all([
      adminRestDelete('settings/mutedUsers/'+username),
      adminRestDelete('users/'+username+'/mutedUntil')
    ]);
    showToast(`🔊 ${username} sesinin kısıtlaması kaldırıldı.`);
    loadAdminSecurity();
  }catch(e){showToast('Hata.');}
}

function loadActivityLogs(){
  const logsBody = document.getElementById('activityLogsBody');
  if(logsBody) logsBody.innerHTML = '<div class="ld"><span></span><span></span><span></span></div>';
  dbRef('activityLog').limitToLast(50).once('value').then(snap=>{
    const logs = snap.val()||{};
    const arr = Object.values(logs).reverse();
    if(!arr.length){
      if(logsBody) logsBody.innerHTML = '<div style="color:var(--muted);font-size:.78rem;">Log kaydı bulunamadı.</div>';
      return;
    }
    let h = '';
    arr.forEach(log=>{
      const t = log.ts ? new Date(log.ts).toLocaleString('tr-TR') : '?';
      h += `<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;gap:10px;">
        <div>
          <span style="font-weight:700;color:var(--text-hi);">${esc(log.user||'?')}</span>
          <span style="color:var(--muted);"> · ${esc(log.action||'giriş')}</span>
        </div>
        <div style="color:var(--muted);font-size:.68rem;white-space:nowrap;">${t}</div>
      </div>`;
    });
    if(logsBody) logsBody.innerHTML = h;
  }).catch(()=>{ if(logsBody) logsBody.innerHTML = '<div style="color:var(--muted);">Loglar yüklenemedi.</div>'; });
}

function adminSendBroadcast(){
  const title = document.getElementById('broadcastTitle').value.trim();
  const msg = document.getElementById('broadcastMsg').value.trim();
  if(!title||!msg){ showToast('Başlık ve mesaj gerekli.'); return; }
  if(!confirm(`Tüm kullanıcılara bildirim gönderilsin mi?\n\n"${title}"`)) return;
  const data = { title, msg, ts: Date.now(), from: _cu };
  adminRestSet('broadcasts/'+Date.now(),data).then(()=>{
    showToast('📢 Bildirim gönderildi!');
    document.getElementById('broadcastTitle').value='';
    document.getElementById('broadcastMsg').value='';
  }).catch(()=>showToast('Hata.'));
}

async function adminForceLogoutAll(){
  if(!confirm('TÜM kullanıcılar çıkış yaptırılsın mı? Bu işlem geri alınamaz!')) return;
  try{
    await adminRestSet('forceLogout',{ ts: Date.now(), by: _cu });
    showToast('🚪 Tüm kullanıcılar çıkış yaptırıldı.');
  }catch(e){showToast('Hata.');}
}

async function adminDeleteInactiveUsers(){
  if(!confirm('30 günden fazla süredir giriş yapmayan kullanıcılar silinsin mi?')) return;
  try{
    const cutoff = Date.now()-30*24*60*60*1000;
    const users = await adminRestGet('users')||{};
    const toDelete = Object.entries(users).filter(([k,v])=>!v.isAdmin&&(!v.lastSeen||v.lastSeen<cutoff)).map(([k])=>k);
    if(!toDelete.length){ showToast('Silinecek pasif kullanıcı yok.'); return; }
    if(!confirm(toDelete.length+' pasif kullanıcı silinecek. Devam edilsin mi?')) return;
    await Promise.all(toDelete.flatMap(u=>[adminRestDelete('users/'+u),adminRestDelete('online/'+u),adminRestDelete('friends/'+u),adminRestDelete('friendRequests/'+u),adminRestDelete('friendRequestsSent/'+u)]));
    showToast('✅ '+toDelete.length+' kullanıcı silindi.'); loadAdminUsers();
  }catch(e){ showToast('❌ Hata: '+(e&&e.message||'Bilinmiyor')); }
}



/* ── Gelişmiş Oda Yönetimi ── */

async function adminRoomDetails(roomId){
  const r = await adminRestGet('rooms/'+roomId).catch(()=>null)||{};
  {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:22px;max-width:440px;width:100%;max-height:85vh;overflow-y:auto;">
        <div style="font-size:1rem;font-weight:900;color:var(--text-hi);margin-bottom:16px;">⚙️ Oda Ayarları — ${esc(r.name||roomId)}</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <div style="font-size:.75rem;color:var(--muted);margin-bottom:4px;">Oda Adı</div>
            <input id="rd-name" class="admin-inp" value="${esc(r.name||'')}" style="margin-bottom:0;">
          </div>
          <div>
            <div style="font-size:.75rem;color:var(--muted);margin-bottom:4px;">Oda Açıklaması</div>
            <input id="rd-desc" class="admin-inp" value="${esc(r.description||'')}" placeholder="Açıklama..." style="margin-bottom:0;">
          </div>
          <div>
            <div style="font-size:.75rem;color:var(--muted);margin-bottom:4px;">Yavaş Mod (saniye, 0=kapalı)</div>
            <input id="rd-slow" class="admin-inp" type="number" value="${r.slowMode||0}" min="0" max="3600" style="margin-bottom:0;">
          </div>
          <div>
            <div style="font-size:.75rem;color:var(--muted);margin-bottom:4px;">Max Üye (0=sınırsız)</div>
            <input id="rd-maxmembers" class="admin-inp" type="number" value="${r.maxMembers||0}" min="0" style="margin-bottom:0;">
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;padding:8px 0;">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="checkbox" id="rd-locked" ${r.locked?'checked':''}>
              <span style="font-size:.82rem;color:var(--text);">🔒 Kilitli oda</span>
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="checkbox" id="rd-readonly" ${r.readOnly?'checked':''}>
              <span style="font-size:.82rem;color:var(--text);">📖 Salt okunur</span>
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="checkbox" id="rd-hidden" ${r.hidden?'checked':''}>
              <span style="font-size:.82rem;color:var(--text);">🙈 Gizli oda</span>
            </label>
          </div>
        </div>
        <div style="margin-top:16px;">
          <div style="font-size:.75rem;color:var(--muted);margin-bottom:8px;">Üyeler (${(r.members||[]).length})</div>
          <div style="max-height:120px;overflow-y:auto;background:var(--surface2);border-radius:10px;padding:8px;">
            ${(r.members||[]).map(m=>`
              <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;">
                <span style="font-size:.8rem;color:var(--text-hi);">${esc(m)}</span>
                <button onclick="adminKickFromRoom('${esc(roomId)}','${esc(m)}')" style="background:var(--red);border:none;border-radius:5px;color:#fff;font-size:.62rem;padding:2px 8px;cursor:pointer;">Çıkar</button>
              </div>`).join('')||'<div style="color:var(--muted);font-size:.78rem;">Üye yok</div>'}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:16px;">
          <button class="a-btn blue" style="flex:1;" onclick="adminSaveRoomDetails('${esc(roomId)}',this.closest('[style*=fixed]'))">💾 Kaydet</button>
          <button class="a-btn red" onclick="if(confirm('Oda silinsin mi?'))adminRestDelete('rooms/${esc(roomId)}').then(()=>{adminRestDelete('msgs/${esc(roomId)}').catch(()=>{});showToast('Oda silindi.');this.closest('[style*=fixed]').remove();loadAdminRooms();}).catch(()=>showToast('Hata.'))">🗑️</button>
          <button class="a-btn" style="background:var(--surface2);" onclick="this.closest('[style*=fixed]').remove()">İptal</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
}

async function adminSaveRoomDetails(roomId, modal){
  const updates = {
    name: document.getElementById('rd-name').value.trim(),
    description: document.getElementById('rd-desc').value.trim(),
    slowMode: parseInt(document.getElementById('rd-slow').value)||0,
    maxMembers: parseInt(document.getElementById('rd-maxmembers').value)||0,
    locked: document.getElementById('rd-locked').checked,
    readOnly: document.getElementById('rd-readonly').checked,
    hidden: document.getElementById('rd-hidden').checked,
  };
  if(!updates.name){ showToast('Oda adı boş olamaz.'); return; }
  try{
    const existing = await adminRestGet('rooms/'+roomId).catch(()=>({}))||{};
    await adminRestSet('rooms/'+roomId, {...existing, ...updates});
    showToast('✅ Oda güncellendi!');
    if(modal) modal.remove();
    loadAdminRooms();
  }catch(e){showToast('Hata.');}
}

async function adminKickFromRoom(roomId, username){
  if(!confirm(username+' odadan çıkarılsın mı?')) return;
  try{
    const room=await adminRestGet('rooms/'+roomId)||{};
    const members=(room.members||[]).filter(m=>m!==username);
    await adminRestSet('rooms/'+roomId+'/members',members);
    showToast(username+' odadan çıkarıldı.');
    document.querySelectorAll('[style*="position:fixed"]').forEach(el=>{
      if(el.querySelector('#rd-name')) el.remove();
    });
    adminRoomDetails(roomId);
  }catch(e){showToast('Hata.');}
}


/* ── Sistem Sağlığı İzleme ── */

async function loadAdminSystemHealth(){
  const body = document.getElementById('adminBody');
  body.innerHTML = '<div class="ld"><span></span><span></span><span></span></div>';
  const [users,rooms,msgs,forum,online] = await Promise.all([
    adminRestGet('users').catch(()=>({})),
    adminRestGet('rooms').catch(()=>({})),
    adminRestGet('msgs').catch(()=>({})),
    adminRestGet('forum/posts').catch(()=>({})),
    adminRestGet('online').catch(()=>({}))
  ]);
  try{
    {
    const _users=users||{}, _rooms=rooms||{}, _msgs=msgs||{}, _forum=forum||{}, _online2=online||{};
    const usersS=null, roomsS=null, msgsS=null, forumS=null, onlineS=null;

    const totalUsers = Object.keys(_users).length;
    const bannedUsers = Object.values(_users).filter(u=>u&&u.banned).length;
    const adminUsers = Object.values(_users).filter(u=>u&&u.isAdmin).length;
    const totalRooms = Object.keys(_rooms).filter(k=>_rooms[k].type!=='dm').length;
    const totalMsgs = Object.values(_msgs).reduce((a,r)=>a+Object.keys(r||{}).length,0);
    const totalPosts = Object.keys(_forum).length;
    const onlineNow = Object.keys(_online2).length;

    // Depolama tahmini (her kayıt ~500 byte)
    const estimatedKB = Math.round((totalUsers*0.5 + totalMsgs*0.3 + totalPosts*0.3));

    let html = '<div class="admin-stat-grid">';
    const stats = [
      { icon:'👥', label:'Toplam Üye', val:totalUsers, color:'#5b9bd5' },
      { icon:'🟢', label:'Şu An Online', val:onlineNow, color:'#2ecc71' },
      { icon:'🚫', label:'Banlı Üye', val:bannedUsers, color:'#ff5a8a' },
      { icon:'👑', label:'Admin Sayısı', val:adminUsers, color:'#f0c040' },
      { icon:'📢', label:'Toplam Oda', val:totalRooms, color:'#c4a7ff' },
      { icon:'💬', label:'Toplam Mesaj', val:totalMsgs, color:'#1abc9c' },
      { icon:'📋', label:'Forum Gönderisi', val:totalPosts, color:'#e67e22' },
      { icon:'💾', label:'Tahmini Veri', val:estimatedKB+'KB', color:'#7a8090' },
    ];
    stats.forEach(s=>{
      html += `<div class="admin-stat-card">
        <div class="admin-stat-val" style="color:${s.color}">${s.val}</div>
        <div class="admin-stat-label">${s.icon} ${s.label}</div>
      </div>`;
    });
    html += '</div>';

    // Son kayıt olan kullanıcılar
    const recentUsers = Object.values(_users).filter(u=>u&&u.createdAt).sort((a,b)=>b.createdAt-a.createdAt).slice(0,5);
    if(recentUsers.length){
      html += '<div class="admin-section"><div class="admin-sec-title">🆕 Son Kayıt Olan Kullanıcılar</div><div class="admin-card">';
      recentUsers.forEach(u=>{
        html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);">
          <div style="font-size:.82rem;font-weight:700;color:var(--text-hi);">${esc(u.username||u.displayName||'?')}</div>
          <div style="font-size:.7rem;color:var(--muted);">${u.createdAt?new Date(u.createdAt).toLocaleString('tr-TR'):'—'}</div>
        </div>`;
      });
      html += '</div></div>';
    }

    // En aktif odalar
    const roomActivity = Object.entries(_msgs).map(([id,m])=>({id,count:Object.keys(m||{}).length})).sort((a,b)=>b.count-a.count).slice(0,5);
    if(roomActivity.length){
      html += '<div class="admin-section"><div class="admin-sec-title">🔥 En Aktif Odalar</div><div class="admin-card">';
      roomActivity.forEach(r=>{
        const room = rooms[r.id]||{};
        html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);">
          <div style="font-size:.82rem;font-weight:700;color:var(--text-hi);">${esc(room.name||r.id)}</div>
          <div style="font-size:.75rem;color:var(--accent);font-weight:700;">${r.count} mesaj</div>
        </div>`;
      });
      html += '</div></div>';
    }

    body.innerHTML = html;
  }}catch(e){ body.innerHTML='<p style="color:var(--muted);padding:20px">Yüklenemedi.</p>'; }
}


/* ── Toplu Mesaj Silme ── */

function adminBulkDeleteMsgs(){
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:22px;max-width:420px;width:100%;">
      <div style="font-size:1rem;font-weight:900;color:var(--text-hi);margin-bottom:16px;">🗑️ Toplu Mesaj Silme</div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <div style="font-size:.75rem;color:var(--muted);margin-bottom:4px;">Kullanıcı (boş=hepsi)</div>
          <input id="bd-user" class="admin-inp" placeholder="Kullanıcı adı..." style="margin-bottom:0;">
        </div>
        <div>
          <div style="font-size:.75rem;color:var(--muted);margin-bottom:4px;">Oda (boş=hepsi)</div>
          <input id="bd-room" class="admin-inp" placeholder="Oda ID..." style="margin-bottom:0;">
        </div>
        <div>
          <div style="font-size:.75rem;color:var(--muted);margin-bottom:4px;">İçerik filtresi (boş=hepsi)</div>
          <input id="bd-contains" class="admin-inp" placeholder="Bu metni içeren mesajları sil..." style="margin-bottom:0;">
        </div>
      </div>
      <div style="background:rgba(224,85,85,.1);border:1px solid rgba(224,85,85,.3);border-radius:10px;padding:10px;margin:12px 0;font-size:.75rem;color:var(--red);">
        ⚠️ Bu işlem geri alınamaz!
      </div>
      <div style="display:flex;gap:8px;">
        <button class="a-btn red" style="flex:1;" onclick="execBulkDeleteMsgs(this.closest('[style*=fixed]'))">🗑️ Sil</button>
        <button class="a-btn" style="background:var(--surface2);" onclick="this.closest('[style*=fixed]').remove()">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function execBulkDeleteMsgs(modal){
  const filterUser = document.getElementById('bd-user').value.trim().toLowerCase();
  const filterRoom = document.getElementById('bd-room').value.trim();
  const filterContains = document.getElementById('bd-contains').value.trim().toLowerCase();

  if(!confirm('Filtrelerle eşleşen mesajlar silinsin mi?')) return;

  adminRestGet('msgs').then(allMsgsData=>{
    const allRooms = allMsgsData||{};
    const delPaths = [];

    Object.entries(allRooms).forEach(([roomId, msgs])=>{
      if(filterRoom && roomId !== filterRoom) return;
      Object.entries(msgs||{}).forEach(([key, m])=>{
        if(filterUser && (m.user||'').toLowerCase() !== filterUser) return;
        if(filterContains && !(m.text||'').toLowerCase().includes(filterContains)) return;
        delPaths.push('msgs/'+roomId+'/'+key);
      });
    });

    Promise.all(delPaths.map(p=>adminRestDelete(p))).then(()=>{
      showToast(`✅ ${delPaths.length} mesaj silindi.`);
      if(modal) modal.remove();
    }).catch(()=>showToast('Bazı silmeler başarısız.'));
  });
}


/* ── Veri Yedekleme (JSON export) ── */

function adminExportData(){
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:22px;max-width:380px;width:100%;">
      <div style="font-size:1rem;font-weight:900;color:var(--text-hi);margin-bottom:16px;">📦 Veri Yedekleme</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        ${['users','rooms','msgs','forum/posts','settings'].map(p=>`
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px;background:var(--surface2);border-radius:8px;">
            <input type="checkbox" data-path="${p}" checked>
            <span style="font-size:.82rem;color:var(--text);">📁 ${p}</span>
          </label>`).join('')}
      </div>
      <div style="display:flex;gap:8px;">
        <button class="a-btn blue" style="flex:1;" onclick="execExportData(this.closest('[style*=fixed]'))">⬇️ İndir</button>
        <button class="a-btn" style="background:var(--surface2);" onclick="this.closest('[style*=fixed]').remove()">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function execExportData(modal){
  const checks = modal.querySelectorAll('input[type=checkbox]:checked');
  const paths = [...checks].map(c=>c.dataset.path);
  if(!paths.length){ showToast('En az bir alan seçin.'); return; }

  showToast('📦 Dışa aktarılıyor...');
  const result = { exportedAt: new Date().toISOString() };

  for(const p of paths){
    try{
      const snap = await dbRef(p.startsWith('settings')?p:''+p).once('value');
      result[p.replace('/','_')] = snap.val();
    }catch(e){ result[p] = null; }
  }

  const blob = new Blob([JSON.stringify(result, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download='backup_'+'data_'+Date.now()+'.json';
  a.click(); URL.revokeObjectURL(url);
  showToast('✅ Yedek indirildi!');
  if(modal) modal.remove();
}


/* ── 🕐 AKTİVİTE LOGLARI ── */

function loadAdminActivityFull(){
  const body = document.getElementById('adminBody');
  body.innerHTML = `
    <div class="admin-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div class="admin-sec-title" style="margin:0">🕐 Aktivite Logları</div>
        <div style="display:flex;gap:6px;">
          <select id="actLogFilter" onchange="loadAdminActivityFull()" class="admin-inp" style="margin:0;padding:5px 10px;font-size:.78rem;">
            <option value="all">Tümü</option>
            <option value="login">Girişler</option>
            <option value="msg">Mesajlar</option>
            <option value="ban">Ban/Unban</option>
            <option value="admin">Admin İşlemleri</option>
          </select>
          <button class="a-btn red" onclick="clearActivityLogs()" style="padding:5px 12px;font-size:.78rem;">🗑️ Temizle</button>
        </div>
      </div>
      <div class="admin-card" id="actLogBody" style="padding:0;max-height:500px;overflow-y:auto;"></div>
    </div>`;
  const filter = document.getElementById('actLogFilter')?.value||'all';
  adminRestGet('activityLog').then(data=>{
    const logBody = document.getElementById('actLogBody');
    if(!logBody) return;
    data = data||{};
    let entries = Object.values(data).reverse();
    if(filter!=='all') entries = entries.filter(e=>e.type===filter);
    if(!entries.length){ logBody.innerHTML='<div style="color:var(--muted);padding:20px;text-align:center;">Log bulunamadı.</div>'; return; }
    const typeIcon = {login:'🔑',msg:'💬',ban:'🚫',admin:'👑',register:'📝',logout:'🚪'};
    logBody.innerHTML = entries.map(e=>`
      <div style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid var(--border);">
        <div style="font-size:1.1rem;flex-shrink:0;">${typeIcon[e.type]||'📌'}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.83rem;color:var(--text-hi);font-weight:600;">${esc(e.user||'?')} <span style="color:var(--muted);font-weight:400;">${esc(e.action||e.type||'')}</span></div>
          <div style="font-size:.72rem;color:var(--muted);">${new Date(e.ts||0).toLocaleString('tr-TR')}${e.ip?' · IP: '+esc(e.ip):''}</div>
        </div>
      </div>`).join('');
  });
}
function clearActivityLogs(){
  if(!confirm('Tüm aktivite logları silinsin mi?')) return;
  _db.ref('activityLog').remove().then(()=>{ showToast('Loglar temizlendi.'); loadAdminActivityFull(); });
}

