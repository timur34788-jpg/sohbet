import React from 'react';
import { useApp } from '../context/AppContext';
import { Leaf } from 'lucide-react';

const ServerSelect = () => {
  const { servers, initServer } = useApp();

  const handleSelectServer = (serverId) => {
    initServer(serverId);
  };

  return (
    <div className="server-select-screen" data-testid="server-select-screen">
      <div className="server-select-content">
        <div className="server-select-header">
          <div className="server-logo">
            <Leaf size={48} color="#4a8f40" />
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
