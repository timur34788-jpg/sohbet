import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Leaf, ArrowLeft, Eye, EyeOff } from 'lucide-react';

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

  const serverInfo = servers[currentServer];
  const registrationClosed = serverSettings && !serverSettings.registrationOpen;

  return (
    <div className="login-screen" data-testid="login-screen">
      <div className="login-box">
        <button className="back-btn" onClick={onBack} data-testid="back-to-servers-btn">
          <ArrowLeft size={14} /> Sunucu
        </button>

        <div className="login-logo">
          <Leaf size={48} color="#4a8f40" />
        </div>
        <h1 className="login-title">{serverInfo?.name || 'Nature.co'}</h1>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            className={`login-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setError(''); }}
            data-testid="login-tab"
          >
            Giriş Yap
          </button>
          <button
            className={`login-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setError(''); }}
            data-testid="register-tab"
          >
            Kayıt Ol
          </button>
        </div>

        {error && <div className="login-error" data-testid="login-error">{error}</div>}

        {/* Login Form */}
        {activeTab === 'login' && (
          <>
            {loginStep === 1 && (
              <form onSubmit={handleLoginStep1} data-testid="login-step1-form">
                <div className="login-field">
                  <label>Kullanıcı Adı</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Kullanıcı adın..."
                    autoComplete="off"
                    data-testid="login-username-input"
                  />
                </div>
                <button type="submit" className="login-btn" data-testid="login-next-btn">
                  İleri →
                </button>
              </form>
            )}

            {loginStep === 2 && (
              <form onSubmit={handleLogin} data-testid="login-step2-form">
                <div className="login-user-info">
                  <div 
                    className="login-user-avatar"
                    style={{ background: '#5b9bd5' }}
                  >
                    {loginUsername.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="login-user-name">{loginUsername}</div>
                    <div className="login-user-sub">hesabına giriş yapılıyor</div>
                  </div>
                  <button 
                    type="button" 
                    className="login-change-user"
                    onClick={() => setLoginStep(1)}
                  >
                    ← Değiştir
                  </button>
                </div>

                <div className="login-field">
                  <label>Şifre</label>
                  <div className="password-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Şifreni gir..."
                      autoComplete="current-password"
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
          </>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <>
            {registrationClosed ? (
              <div className="reg-closed" data-testid="registration-closed">
                <div className="reg-closed-icon">🔒</div>
                <h3>Kayıt Şu An Kapalı</h3>
                <p>Bu sunucuda yeni üye alımı geçici olarak durdurulmuştur.</p>
              </div>
            ) : (
              <form onSubmit={handleRegister} data-testid="register-form">
                {serverSettings?.requireInviteCode && (
                  <div className="login-field">
                    <label>Davet Kodu <span className="optional">(Adminden alın)</span></label>
                    <input
                      type="text"
                      value={regInviteCode}
                      onChange={(e) => setRegInviteCode(e.target.value)}
                      placeholder="Davet kodunu girin..."
                      data-testid="register-invite-input"
                    />
                  </div>
                )}

                <div className="login-field">
                  <label>Kullanıcı Adı</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Kullanıcı adın..."
                    data-testid="register-username-input"
                  />
                </div>

                <div className="login-field">
                  <label>E-posta Adresi</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    data-testid="register-email-input"
                  />
                </div>

                <div className="login-field">
                  <label>Şifre</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="En az 6 karakter..."
                    data-testid="register-password-input"
                  />
                </div>

                <div className="login-field">
                  <label>Şifre (tekrar)</label>
                  <input
                    type="password"
                    value={regPassword2}
                    onChange={(e) => setRegPassword2(e.target.value)}
                    placeholder="Tekrar gir..."
                    data-testid="register-password2-input"
                  />
                </div>

                <div className="login-field">
                  <label>Köken / Uyruk</label>
                  <select
                    value={regOrigin}
                    onChange={(e) => setRegOrigin(e.target.value)}
                    data-testid="register-origin-select"
                  >
                    <option value="">— Seçiniz —</option>
                    <option value="🇹🇷 Türk">🇹🇷 Türk</option>
                    <option value="🇦🇿 Azerbaycanlı">🇦🇿 Azerbaycanlı</option>
                    <option value="🇺🇿 Özbek">🇺🇿 Özbek</option>
                    <option value="🇩🇪 Alman">🇩🇪 Alman</option>
                    <option value="🇬🇧 İngiliz">🇬🇧 İngiliz</option>
                    <option value="🌍 Diğer">🌍 Diğer</option>
                  </select>
                </div>

                <div className="login-checkboxes">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={tosAccepted}
                      onChange={(e) => setTosAccepted(e.target.checked)}
                      data-testid="tos-checkbox"
                    />
                    <span>Üyelik Sözleşmesi'ni okudum ve kabul ediyorum.</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={kvkkAccepted}
                      onChange={(e) => setKvkkAccepted(e.target.checked)}
                      data-testid="kvkk-checkbox"
                    />
                    <span>KVKK Aydınlatma Metni'ni okudum ve kabul ediyorum.</span>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
