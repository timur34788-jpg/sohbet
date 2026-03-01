import React from 'react';
import { useApp } from '../context/AppContext';
import { Palette, Layout, Sun, Moon, Leaf, Droplet, Check } from 'lucide-react';

const SettingsModal = ({ onClose }) => {
  const { theme, layout, changeTheme, changeLayout } = useApp();

  const themes = [
    { id: 'dark', name: 'Koyu', icon: Moon, desc: 'Orijinal koyu tema' },
    { id: 'light', name: 'Açık', icon: Sun, desc: 'Aydınlık tema' },
    { id: 'nature', name: 'Doğa', icon: Leaf, desc: 'Yeşil doğa teması' },
    { id: 'blue', name: 'Mavi', icon: Droplet, desc: 'Mavi okyanus teması' }
  ];

  const layouts = [
    { id: 'original', name: 'Orijinal', desc: 'index.html tasarımı' },
    { id: 'modern', name: 'Modern', desc: 'Güncellenmiş tasarım' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Ayarlar</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-body">
          {/* Theme Selection */}
          <section className="settings-section">
            <div className="settings-section-header">
              <Palette size={20} />
              <h3>Tema Seçimi</h3>
            </div>
            <div className="theme-grid">
              {themes.map(({ id, name, icon: Icon, desc }) => (
                <div
                  key={id}
                  className={`theme-card ${theme === id ? 'active' : ''}`}
                  onClick={() => changeTheme(id)}
                >
                  <Icon size={32} />
                  <div className="theme-name">{name}</div>
                  <div className="theme-desc">{desc}</div>
                  {theme === id && (
                    <div className="theme-check">
                      <Check size={18} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Layout Selection */}
          <section className="settings-section">
            <div className="settings-section-header">
              <Layout size={20} />
              <h3>Arayüz Düzeni</h3>
            </div>
            <div className="layout-options">
              {layouts.map(({ id, name, desc }) => (
                <div
                  key={id}
                  className={`layout-option ${layout === id ? 'active' : ''}`}
                  onClick={() => changeLayout(id)}
                >
                  <div className="layout-radio">
                    {layout === id && <div className="layout-radio-dot" />}
                  </div>
                  <div className="layout-info">
                    <div className="layout-name">{name}</div>
                    <div className="layout-desc">{desc}</div>
                  </div>
                  {layout === id && (
                    <Check size={20} className="layout-check" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Preview */}
          <section className="settings-section">
            <div className="settings-section-header">
              <h3>Önizleme</h3>
            </div>
            <div className="theme-preview">
              <div className="preview-box" style={{ 
                background: 'var(--bg)', 
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ color: 'var(--text-hi)', marginBottom: '8px' }}>
                  Merhaba! 👋
                </div>
                <div style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
                  Bu mesaj önizlemesidir.
                </div>
                <div style={{ 
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: 'var(--surface)',
                  borderRadius: '6px',
                  color: 'var(--text)',
                  fontSize: '0.85rem'
                }}>
                  Seçili tema: <strong style={{ color: 'var(--accent)' }}>{themes.find(t => t.id === theme)?.name}</strong>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
