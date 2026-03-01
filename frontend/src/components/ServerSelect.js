import React from 'react';
import { useApp } from '../context/AppContext';

const ServerSelect = () => {
  const { servers, initServer } = useApp();

  const handleSelectServer = (serverId) => {
    initServer(serverId);
  };

  // Yaprak Logo SVG
  const LeafLogo = ({ size = 64 }) => (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="leafClipSelect">
          <path d="M60 14 C76 22 98 44 98 68 C98 92 81 108 60 108 C39 108 22 92 22 68 C22 44 44 22 60 14Z" />
        </clipPath>
      </defs>
      <path d="M60 14 C76 22 98 44 98 68 C98 92 81 108 60 108 C39 108 22 92 22 68 C22 44 44 22 60 14Z" fill="#0e2b0c" />
      <g clipPath="url(#leafClipSelect)">
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

  return (
    <div className="server-select-screen" data-testid="server-select-screen">
      <div className="server-select-content">
        <div className="server-select-header">
          <div className="server-logo">
            <LeafLogo />
          </div>
          <h1 className="server-title">Nature.co</h1>
          <p className="server-subtitle">Bağlanmak istediğin sunucuyu seç</p>
        </div>

        <div className="server-list" data-testid="server-list">
          {Object.values(servers).map((server) => (
            <div
              key={server.id}
              className="server-card"
              onClick={() => handleSelectServer(server.id)}
              data-testid={`server-card-${server.id}`}
            >
              <div 
                className="server-card-icon"
                style={{ 
                  background: `${server.color}22`,
                  borderColor: `${server.color}44`
                }}
              >
                {server.icon}
              </div>
              <div className="server-card-info">
                <div className="server-card-name">{server.name}</div>
                <div className="server-card-desc">{server.description}</div>
              </div>
              <div className="server-card-arrow" style={{ color: server.color }}>›</div>
            </div>
          ))}
        </div>

        <p className="server-note">
          Her sunucu bağımsızdır — ayrı hesap, ayrı odalar
        </p>
      </div>
    </div>
  );
};

export default ServerSelect;
