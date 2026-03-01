import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';

const Login = ({ onBack }) => {
  const { login, register, serverSettings, currentServer, servers } = useApp();
  const [activeTab, setActiveTab] = useState('login');
  const [loginStep, setLoginStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regInviteCode, setRegInviteCode] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPassword2, setRegPassword2] = useState('');
  const [regOrigin, setRegOrigin] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  const serverInfo = servers[currentServer];

  // Yaprak Logo SVG
  const LeafLogo = ({ size = 56 }) => (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="leafClipLogin">
          <path d="M60 14 C76 22 98 44 98 68 C98 92 81 108 60 108 C39 108 22 92 22 68 C22 44 44 22 60 14Z" />
        </clipPath>
      </defs>
      <path d="M60 14 C76 22 98 44 98 68 C98 92 81 108 60 108 C39 108 22 92 22 68 C22 44 44 22 60 14Z" fill="#0e2b0c" />
      <g clipPath="url(#leafClipLogin)">
        <line x1="60" y1="14" x2="60" y2="108" stroke="#4a8f40" strokeWidth="1.2" />
        <line x1="60" y1="35" x2="78" y2="55" stroke="#4a8f40" strokeWidth=".7" />
        <line x1="60" y1="35" x2="42" y2="55" stroke="#4a8f40" strokeWidth=".7" />
        <line x1="60" y1="52" x2="82" y2="68" stroke="#4a8f40" strokeWidth=".6" />
        <line x1="60" y1="52" x2="38" y2="68" stroke="#4a8f40" strokeWidth=".6" />
        <line x1="60" y1="68" x2="78" y2="82" stroke="#4a8f40" strokeWidth=".5" />
        <line x1="60" y1="68" x2="42" y2="82" stroke="#4a8f40" strokeWidth=".5" />
        <line x1="60" y1="82" x2="70" y2="94" stroke="#4a8f40" strokeWidth=".4" />
        <line x1="60" y1="82" x2="50" y2="94" stroke="#4a8f40" strokeWidth=".4" />
      </g>
      <path d="M60 14 C76 22 98 44 98 68 C98 92 81 108 60 108 C39 108 22 92 22 68 C22 44 44 22 60 14Z" fill="none" stroke="#4a8f40" strokeWidth="1.2" />
    </svg>
  );

  const handleLoginStep1 = (e) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      setError('Kullanıcı adı gerekli');
      return;
    }
    setError('');
    setLoginStep(2);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginPassword) {
      setError('Şifre gerekli');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(loginUsername, loginPassword);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!regUsername.trim()) {
      setError('Kullanıcı adı gerekli');
      return;
    }
    if (!regEmail.trim()) {
      setError('E-posta gerekli');
      return;
    }
    if (regPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }
    if (regPassword !== regPassword2) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    if (!regOrigin) {
      setError('Köken/Uyruk seçimi gerekli');
      return;
    }
    if (!tosAccepted || !kvkkAccepted) {
      setError('Sözleşmeleri kabul etmelisiniz');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        origin: regOrigin,
        inviteCode: regInviteCode
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate user avatar color
  const getUserColor = (username) => {
    const colors = ['#5b9bd5', '#6c63ff', '#2ecc71', '#f97316', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < (username || '').length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const registrationClosed = serverSettings?.registrationEnabled === false;

  return (
    <div className="login-screen" data-testid="login-screen">
      <div className="login-box">
        {/* Back Button */}
        <button 
          className="back-btn" 
          onClick={onBack}
          data-testid="back-to-server-select"
        >
          <ChevronLeft size={14} />
          <span>Sunucu</span>
        </button>

        {/* Logo */}
        <div className="login-logo">
          <LeafLogo />
        </div>

        {/* Title */}
        <h1 className="login-title">Nature.co</h1>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            className={`login-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setError(''); }}
            data-testid="tab-login"
          >
            Giriş Yap
          </button>
          <button
            className={`login-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setError(''); }}
            data-testid="tab-register"
          >
            Kayıt Ol
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="login-error" data-testid="login-error">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <div>
            {/* Step 1: Username */}
            {loginStep === 1 && (
              <form onSubmit={handleLoginStep1}>
                <div className="login-field">
                  <label>Kullanıcı Adı</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Kullanıcı adın..."
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    data-testid="login-username-input"
                  />
                </div>
                <button 
                  type="submit" 
                  className="login-btn"
                  disabled={loading}
                  data-testid="login-next-btn"
                >
                  İleri →
                </button>
              </form>
            )}

            {/* Step 2: Password */}
            {loginStep === 2 && (
              <form onSubmit={handleLogin}>
                {/* User Info */}
                <div className="login-user-info">
                  <div 
                    className="login-user-avatar"
                    style={{ background: getUserColor(loginUsername) }}
                  >
                    {loginUsername.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="login-user-name">{loginUsername}</div>
                    <div className="login-user-sub">hesabına giriş yapılıyor</div>
                  </div>
                  <button
                    type="button"
                    className="login-change-user"
                    onClick={() => { setLoginStep(1); setLoginPassword(''); setError(''); }}
                    data-testid="change-user-btn"
                  >
                    ← Değiştir
                  </button>
                </div>

                {/* Password Field */}
                <div className="login-field">
                  <label>Doğrulama</label>
                  <div className="password-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Kodunu gir..."
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck="false"
                      data-testid="login-password-input"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="login-btn"
                  disabled={loading}
                  data-testid="login-submit-btn"
                >
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* REGISTER FORM */}
        {activeTab === 'register' && (
          <div>
            {registrationClosed ? (
              <div className="reg-closed">
                <div className="reg-closed-icon">🔒</div>
                <h3>Kayıt Şu An Kapalı</h3>
                <p>Bu sunucuda yeni üye alımı geçici olarak durdurulmuştur.</p>
              </div>
            ) : (
              <form onSubmit={handleRegister}>
                {/* Invite Code */}
                {serverSettings?.requireInviteCode && (
                  <div className="login-field">
                    <label>
                      Davet Kodu <span className="optional">(Adminden alın)</span>
                    </label>
                    <input
                      type="text"
                      value={regInviteCode}
                      onChange={(e) => setRegInviteCode(e.target.value)}
                      placeholder="Davet kodunu girin..."
                      autoComplete="off"
                      data-testid="reg-invite-input"
                    />
                  </div>
                )}

                {/* Username */}
                <div className="login-field">
                  <label>Kullanıcı Adı</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Kullanıcı adın..."
                    autoComplete="off"
                    data-testid="reg-username-input"
                  />
                </div>

                {/* Email */}
                <div className="login-field">
                  <label>E-posta Adresi</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    autoComplete="email"
                    data-testid="reg-email-input"
                  />
                </div>

                {/* Password */}
                <div className="login-field">
                  <label>Doğrulama</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="En az 6 karakter..."
                    autoComplete="new-password"
                    data-testid="reg-password-input"
                  />
                </div>

                {/* Password Confirm */}
                <div className="login-field">
                  <label>Doğrulama (tekrar)</label>
                  <input
                    type="password"
                    value={regPassword2}
                    onChange={(e) => setRegPassword2(e.target.value)}
                    placeholder="Tekrar gir..."
                    autoComplete="new-password"
                    data-testid="reg-password2-input"
                  />
                </div>

                {/* Origin */}
                <div className="login-field">
                  <label>Köken / Uyruk</label>
                  <select
                    value={regOrigin}
                    onChange={(e) => setRegOrigin(e.target.value)}
                    data-testid="reg-origin-select"
                  >
                    <option value="">— Seçiniz —</option>
                    <option value="🇹🇷 Türk">🇹🇷 Türk</option>
                    <option value="🇦🇿 Azerbaycanlı">🇦🇿 Azerbaycanlı</option>
                    <option value="🇺🇿 Özbek">🇺🇿 Özbek</option>
                    <option value="🇹🇲 Türkmen">🇹🇲 Türkmen</option>
                    <option value="🇰🇿 Kazak">🇰🇿 Kazak</option>
                    <option value="🇰🇬 Kırgız">🇰🇬 Kırgız</option>
                    <option value="🇺🇦 Ukraynalı">🇺🇦 Ukraynalı</option>
                    <option value="🇷🇺 Rus">🇷🇺 Rus</option>
                    <option value="🇩🇪 Alman">🇩🇪 Alman</option>
                    <option value="🇬🇧 İngiliz">🇬🇧 İngiliz</option>
                    <option value="🇫🇷 Fransız">🇫🇷 Fransız</option>
                    <option value="🌍 Diğer">🌍 Diğer</option>
                  </select>
                </div>

                {/* Checkboxes */}
                <div className="login-checkboxes">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={tosAccepted}
                      onChange={(e) => setTosAccepted(e.target.checked)}
                      data-testid="tos-checkbox"
                    />
                    <span>
                      <a href="#" style={{ color: '#2ecc71', textDecoration: 'underline' }}>Üyelik Sözleşmesi</a>'ni okudum, anladım ve kabul ediyorum.
                    </span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={kvkkAccepted}
                      onChange={(e) => setKvkkAccepted(e.target.checked)}
                      data-testid="kvkk-checkbox"
                    />
                    <span>
                      <a href="#" style={{ color: '#2ecc71', textDecoration: 'underline' }}>KVKK Aydınlatma Metni</a>'ni okudum; köken/milliyet bilgisinin özel nitelikli veri olarak işlenmesine <strong style={{ color: '#fff' }}>açık rıza</strong> veriyorum.
                    </span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="login-btn"
                  disabled={loading}
                  data-testid="register-submit-btn"
                >
                  {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol →'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
