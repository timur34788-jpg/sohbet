/* Nature.co — auth.js */
/* Otomatik bölümlendi */

/* ── Kayıt: global geçici veri ── */

var _regPending = null;

async function submitRegister(){
  // Kayıt açık mı kontrolü
  try{
    const regSetting = await fbRestGet('settings/registration');
    if(regSetting === 'closed'){
      showLoginErr('❌ Bu sunucuda şu an yeni üye kaydı kapalıdır.');
      return;
    }
  }catch(e){ /* ayar yoksa açık say */ }
  const user=sanitizeInput(document.getElementById('regUser').value.trim(), 30);
  const email=sanitizeInput(document.getElementById('regEmail').value.trim(), 100);
  const pass=document.getElementById('regPass').value;
  const pass2=document.getElementById('regPass2').value;
  const origin=document.getElementById('regOrigin').value;

  const tosChecked = document.getElementById('regTosCheck')?.checked;
  const kvkkChecked = document.getElementById('regKvkkCheck')?.checked;
  if(!tosChecked){showLoginErr('Üyelik Sözleşmesini kabul etmelisiniz.');return;}
  if(!kvkkChecked){showLoginErr('KVKK Aydınlatma Metnini kabul etmelisiniz.');return;}
  if(!user){showLoginErr('Kullanıcı adı girin.');return;}
  if(user.length<2){showLoginErr('Kullanıcı adı en az 2 karakter.');return;}
  if(!/^[a-zA-Z0-9_.\-çğışöüÇĞİŞÖÜ]+$/.test(user)){showLoginErr('Kullanıcı adında geçersiz karakter.');return;}
  if(user===ADMIN_USERNAME){showLoginErr('Bu kullanıcı adı kullanılamaz.');return;}
  if(!email||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){showLoginErr('Geçerli bir e-posta girin.');return;}
  if(pass.length<6){showLoginErr('Şifre en az 6 karakter olmalı.');return;}
  if(pass!==pass2){showLoginErr('Şifreler eşleşmiyor.');return;}
  if(!origin){showLoginErr('Köken/uyruk seçin.');return;}

  // Davet linki token doğrulama (URL hash: #inv_TOKEN)
  const _invToken = window._pendingInviteToken || null;
  if(_invToken) {
    try {
      const inv = await fbRestGet('invites/' + _invToken).catch(()=>null);
      if(!inv) { showLoginErr('Davet linki geçersiz veya silinmiş.'); return; }
      if(inv.expiresAt && Date.now() > inv.expiresAt) { showLoginErr('Davet linkinin süresi dolmuş.'); return; }
      if(inv.maxUses && (inv.usedCount||0) >= inv.maxUses) { showLoginErr('Bu davet linki maksimum kullanım sayısına ulaştı.'); return; }
    } catch(e) { showLoginErr('Davet linki kontrol edilemedi.'); return; }
  }

  // Davet kodu doğrulama (Firebase'de settings/inviteCode varsa zorunlu)
  const inviteCodeInput = (document.getElementById('regInviteCode')?.value||'').trim();
  try{
    const inviteCode = await fbRestGet('settings/inviteCode').catch(()=>null);
    if(inviteCode && !_invToken){
      if(!inviteCodeInput){showLoginErr('Davet kodu gereklidir.');return;}
      if(inviteCodeInput !== String(inviteCode)){showLoginErr('Davet kodu hatalı.');return;}
    }
  }catch(e){}

  const arabOrigins=['🇸🇾 Suriyeli','🇮🇶 Iraklı','🇸🇦 Suudi Arabistanlı','🇦🇪 BAE\'li','🇶🇦 Katarlı','🇲🇦 Faslı','🇩🇿 Cezayirli','🇹🇳 Tunuslu','🇪🇬 Mısırlı','🇱🇾 Libyalı','🇸🇴 Somalili'];
  if(arabOrigins.includes(origin)){showLoginErr('Üzgünüz, bu platformda kayıt olamazsınız.');return;}

  const regBtn=document.getElementById('regBtn');
  regBtn.textContent='Kod gönderiliyor...';regBtn.disabled=true;
  const rstReg=()=>{regBtn.textContent='Kayıt Ol →';regBtn.disabled=false;};

  try{
    const ex = await fbRestGet('users/'+user);
    if(ex){showLoginErr('Bu kullanıcı adı alınmış.');rstReg();return;}
  }catch(e){showLoginErr('Bağlantı hatası.');rstReg();return;}

  const code = String(Math.floor(100000+Math.random()*900000));
  const ph = await hashStr(pass+user);
  _regPending = {user,email,pass:ph,origin,code,exp:Date.now()+30*60*1000};

  // ── EmailJS Graceful Degradation ──
  const _ejsConfigured = window._EJS && window._EJS.pub && window._EJS.svc && window._EJS.tpl;
  if(!_ejsConfigured){
    regBtn.textContent='Hesap oluşturuluyor...';
    try{
      const ex2 = await fbRestGet('users/'+user).catch(()=>null);
      if(ex2){ showLoginErr('Bu kullanıcı adı alınmış.'); rstReg(); return; }
      const _newUserId2 = 'U' + Date.now().toString().slice(-8) + Math.floor(1000+Math.random()*9000);
      const _regIp2 = await getUserIP().catch(()=>null);
      await fbRestSet('users/'+user,{
        username:user, email:email, createdAt:Date.now(),
        isAdmin:false, banned:false, passwordHash:ph, origin:origin,
        userId: _newUserId2,
        regIP: _regIp2 || null,
        inviteToken: window._pendingInviteToken || null
      });
      if(window._pendingInviteToken) {
        try {
          const inv = await fbRestGet('invites/' + window._pendingInviteToken).catch(()=>null);
          if(inv) {
            const useKey = Date.now().toString(36);
            await fbRestSet('invites/' + window._pendingInviteToken + '/uses/' + useKey, {
              username: user, email: email, origin: origin, joinedAt: Date.now(),
              userId: _newUserId2, ip: _regIp2 || null
            });
            await fbRestSet('invites/' + window._pendingInviteToken + '/usedCount', (inv.usedCount||0) + 1);
          }
        } catch(e2) {}
        window._pendingInviteToken = null;
      }
      _passwordHash=ph; _cu=user; _isAdmin=false;
      _regPending=null;
      onLoginSuccess();
    }catch(e){
      showLoginErr('Kayıt hatası. İnternet bağlantını kontrol et.');
      rstReg();
    }
    return;
  }

  try{
    // EmailJS kota koruması: aynı email'e 5 dakikada max 3 kod
    const ejsKey = 'ejs_'+email;
    const ejsLog = JSON.parse(localStorage.getItem(ejsKey)||'[]').filter(t=>Date.now()-t<5*60*1000);
    if(ejsLog.length >= 3){ showLoginErr('⚠️ Çok fazla kod isteği. 5 dakika bekleyin.'); rstReg(); return; }
    ejsLog.push(Date.now());
    localStorage.setItem(ejsKey, JSON.stringify(ejsLog));

    await emailjs.send(window._EJS.svc, window._EJS.tpl, {
      to_name: user, email: email, passcode: code
    });
    document.getElementById('regVerifyStep').style.display='block';
    regBtn.style.display='none';
    showLoginErr('');
    document.getElementById('regVerifyCode').focus();
  }catch(e){
    showLoginErr('Mail gönderilemedi: '+(e.text||e.message||'Bilinmeyen hata'));
    rstReg();
  }
}

async function verifyRegCode(){
  if(!_regPending){showLoginErr('Lütfen önce kayıt formunu doldurun.');return;}
  if(Date.now()>_regPending.exp){showLoginErr('Kodun süresi doldu. Tekrar deneyin.');_resetRegForm();return;}
  const entered=document.getElementById('regVerifyCode').value.trim();
  if(entered!==_regPending.code){showLoginErr('Kod hatalı. Tekrar deneyin.');return;}

  const vBtn=document.getElementById('regVerifyBtn');
  vBtn.textContent='Hesap oluşturuluyor...';vBtn.disabled=true;
  try{
    const ex=await fbRestGet('users/'+_regPending.user);
    if(ex){showLoginErr('Bu kullanıcı adı artık alınmış.');_resetRegForm();return;}
    const _newUserId = 'U' + Date.now().toString().slice(-8) + Math.floor(1000+Math.random()*9000);
    const _regIp = await getUserIP().catch(()=>null);
    await fbRestSet('users/'+_regPending.user,{
      username:_regPending.user,
      email:_regPending.email,
      createdAt:Date.now(),
      lastSeen:Date.now(),
      isAdmin:false,
      banned:false,
      passwordHash:_regPending.pass,
      origin:_regPending.origin,
      userId: _newUserId,
      regIP: _regIp || null,
      inviteToken: window._pendingInviteToken || null
    });
    // Davet linki kullanımını kaydet
    if(window._pendingInviteToken) {
      try {
        const inv = await fbRestGet('invites/' + window._pendingInviteToken).catch(()=>null);
        if(inv) {
          const useKey = Date.now().toString(36);
          await fbRestSet('invites/' + window._pendingInviteToken + '/uses/' + useKey, {
            username: _regPending.user,
            email: _regPending.email,
            origin: _regPending.origin,
            joinedAt: Date.now(),
            userId: _newUserId,
            ip: _regIp || null
          });
          await fbRestSet('invites/' + window._pendingInviteToken + '/usedCount', (inv.usedCount||0) + 1);
        }
      } catch(e2) {}
      window._pendingInviteToken = null;
    }
    _passwordHash=_regPending.pass;_cu=_regPending.user;_isAdmin=false;
    _regPending=null;
    onLoginSuccess();
  }catch(e){
    showLoginErr('Bağlantı hatası. İnterneti kontrol et.');
    vBtn.textContent='Hesabı Aktifleştir ✓';vBtn.disabled=false;
  }
}

async function resendRegCode(){
  if(!_regPending){return;}
  const _ejsOk = window._EJS && window._EJS.pub && window._EJS.svc && window._EJS.tpl;
  if(!_ejsOk){ showLoginErr('⚠️ E-posta özelliği şu an devre dışı.'); return; }
  const newCode=String(Math.floor(100000+Math.random()*900000));
  _regPending.code=newCode;
  _regPending.exp=Date.now()+30*60*1000;
  try{
    await emailjs.send(window._EJS.svc, window._EJS.tpl, {
      to_name:_regPending.user,
      email:_regPending.email,
      passcode:newCode
    });
    showLoginErr('Yeni kod gönderildi! ✅');
  }catch(e){showLoginErr('Mail gönderilemedi: '+(e.text||e.message||'Bilinmeyen hata'));}
}

function _resetRegForm(){
  _regPending=null;
  document.getElementById('regVerifyStep').style.display='none';
  document.getElementById('regBtn').style.display='block';
  document.getElementById('regBtn').textContent='Kayıt Ol →';
  document.getElementById('regBtn').disabled=false;
  document.getElementById('regVerifyCode').value='';
  document.getElementById('regVerifyBtn').textContent='Hesabı Aktifleştir ✓';
  document.getElementById('regVerifyBtn').disabled=false;
}


function resetBtn(){
  const btn=document.getElementById('loginBtn');
  btn.textContent='Giriş Yap →';
  btn.disabled=false;
}


/* ── Login Success ── */





/* ── IP Adresi Kaydetme ── */

async function getUserIP(){
  try{
    const ctrl = new AbortController();
    const timeout = setTimeout(()=>ctrl.abort(), 3000);
    const r = await fetch('https://api.ipify.org?format=json',{cache:'no-store', signal: ctrl.signal});
    clearTimeout(timeout);
    const d = await r.json();
    return d.ip||null;
  }catch(e){ return null; }
}

async function saveUserIP(username){
  const ip = await getUserIP();
  if(!ip||!username) return;
  const now = Date.now();
  // Kullanıcı kaydına IP ekle
  try{
    await fbRestGet('users/'+username).then(async u=>{
      const ips = u?.ipHistory||{};
      ips[now] = ip;
      // Son 10 IP'yi tut
      const keys = Object.keys(ips).sort((a,b)=>b-a).slice(0,10);
      const trimmed = {};
      keys.forEach(k=>{ trimmed[k]=ips[k]; });
      await fbRestSet('users/'+username+'/ipHistory', trimmed).catch(()=>{});
      await fbRestSet('users/'+username+'/lastIP', ip).catch(()=>{});
    });
    // IP ban listesinde var mı kontrol et
    const banned = await fbRestGet('bannedIPs/'+ip.replace(/\./g,'_'));
    if(banned){
      showToast('Bu IP adresi yasaklıdır.');
      setTimeout(()=>logout(),1500);
    }
  }catch(e){}
}

async function checkIPBan(){
  const ip = await getUserIP();
  if(!ip) return false;
  try{
    const banned = await fbRestGet('bannedIPs/'+ip.replace(/\./g,'_'));
    return !!banned;
  }catch(e){ return false; }
}
function onLoginSuccess(){
  loadCustomGameImages();
  loadCustomGames();
  loadUserSecurityData();
  saveUserIP(_cu);
  localStorage.setItem('sohbet_user_' + _activeServer, _cu);
  localStorage.setItem('sohbet_pass_' + _activeServer, _passwordHash||'');
  localStorage.setItem('sohbet_last_server', _activeServer);
  // Bekleyen hash navigasyonunu işle (sayfa yenilenince #profil gibi)
  if(window._pendingHashNav){
    var _phn = window._pendingHashNav;
    window._pendingHashNav = null;
    setTimeout(function(){
      if(typeof IS_DESKTOP === 'function' && IS_DESKTOP()){
        if(typeof deskNav === 'function') deskNav(_phn);
      } else {
        if(typeof switchMainTab === 'function') switchMainTab(_phn);
      }
    }, 600);
  }
  // Admin durumunu her zaman DB'den doğrula — localStorage'a güvenme
  const _finalizeAdminStatus = (isAdm) => {
    _isAdmin = isAdm && (_cu === ADMIN_USERNAME);
    if(_isAdmin) localStorage.setItem('sohbet_admin_' + _activeServer,'1');
    else localStorage.removeItem('sohbet_admin_' + _activeServer);
    const ab = document.getElementById('adminPanelBtn');
    if(ab) ab.style.display = _isAdmin ? 'flex' : 'none';
    const rb = document.getElementById('rb-admin');
    if(rb) rb.style.display = _isAdmin ? 'flex' : 'none';
  };
  if(_cu){
    fbRestGet('admins/'+_cu).then(val=>{
      _finalizeAdminStatus(!!val);
    }).catch(()=>{ _finalizeAdminStatus(_cu === ADMIN_USERNAME); });
  } else {
    _finalizeAdminStatus(_cu === ADMIN_USERNAME);
  }
  // Kendi fotoğrafını önceden cache'e yükle
  if(_db && _cu){
    dbRef('users/'+_cu+'/photoURL').once('value').then(s=>{
      const url = s.val();
      if(url){ _avatarCache[_cu] = url; }
      renderMyAvatar();
    }).catch(()=>{ renderMyAvatar(); });
  } else {
    renderMyAvatar();
  }
  // adminPanelBtn artık _finalizeAdminStatus içinde yönetiliyor

  // loginScreen'i tamamen gizle — z-index:10 olduğu için kaldırılmazsa her şeyin önünde kalır
  var ls = document.getElementById('loginScreen');
  if(ls){ ls.classList.remove('active'); ls.style.display='none'; }

  switchMainTab('home');
  loadRooms();
  if(typeof deskLoadRoomList==='function' && IS_DESKTOP()) setTimeout(deskLoadRoomList,500);
  startHeartbeat();listenOnline();listenFriendRequests();
  requestNotifPermission();
  listenIncomingCalls();
  if(typeof loadReminders==='function') setTimeout(loadReminders, 800);
  if(typeof _loadCurrentStatus==='function') setTimeout(_loadCurrentStatus, 1000);
  initLocalVideoDrag();
  scheduleDMClear();
  if(typeof _newFeatureInit==='function') _newFeatureInit();
}

function doLogout(){
  if(_stopMsg){_stopMsg();_stopMsg=null;}
  if(_stopOnl){_stopOnl();_stopOnl=null;}
  if(_stopFrReqs){_stopFrReqs();_stopFrReqs=null;}
  clearInterval(_hbTimer);
  if(_db&&_cu) dbRef('online/'+_cu).remove().catch(()=>{});
  localStorage.removeItem('sohbet_user_' + _activeServer);
  localStorage.removeItem('sohbet_admin_' + _activeServer);
  localStorage.removeItem('sohbet_pass_' + _activeServer);
  localStorage.removeItem('sohbet_last_server');
  try{ localStorage.removeItem(_cgiCacheKey()); }catch(e){}
  try{ localStorage.removeItem(_cgCacheKey()); }catch(e){}
  _customGameImages = {};
  _customGames = [];
  _cu=null;_cRoom=null;_online={};_unread={};_isAdmin=false;
  Object.values(_lastMsgListeners).forEach(s=>{try{s();}catch(e){}});
  Object.keys(_lastMsgListeners).forEach(k=>delete _lastMsgListeners[k]);
  switchMainTab('home');
  var av=document.getElementById('myAvatar');if(av){av.textContent='';av.style.background='';}
  var lu=document.getElementById('loginUser');if(lu)lu.value='';
  var lp=document.getElementById('loginPass');if(lp)lp.value='';
  var lb=document.getElementById('loginBtn');if(lb){lb.textContent='Giriş Yap →';lb.disabled=false;}
  hideLoginErr();
  if(typeof showLoginTab==='function')showLoginTab('giris');
  // Sunucu seçimine dön
  backToServerSelect();
}

