import React, { useEffect, useRef, useState } from 'react';

const NatureBot = ({ size = 120, animate = true, interactive = false }) => {
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <div 
      style={{ 
        position: 'relative',
        width: size,
        height: size * 1.5,
        display: 'inline-block'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <svg 
        id="natureBotPet" 
        viewBox="0 0 64 96" 
        width={size} 
        height={size * 1.5}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: isHovering 
            ? 'drop-shadow(0 6px 20px rgba(74,143,64,.55))' 
            : 'drop-shadow(0 4px 12px rgba(74,143,64,.35))',
          transition: 'filter 0.3s ease',
          cursor: interactive ? 'pointer' : 'default'
        }}
      >
        <defs>
          {/* Gradients */}
          <radialGradient id="bodyGrad" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#2e5c28"/>
            <stop offset="100%" stopColor="#1a3318"/>
          </radialGradient>
          <radialGradient id="eyeGrad" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#a5e6a0"/>
            <stop offset="100%" stopColor="#4a8f40"/>
          </radialGradient>
          <radialGradient id="headGrad" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#365e2e"/>
            <stop offset="100%" stopColor="#1e3d18"/>
          </radialGradient>
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(107,191,103,.12)"/>
            <stop offset="100%" stopColor="rgba(74,143,64,.06)"/>
          </linearGradient>
          <linearGradient id="legGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2e5c28"/>
            <stop offset="100%" stopColor="#1a3318"/>
          </linearGradient>
          
          {/* Glow effect */}
          <filter id="eyeGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Main body group */}
        <g className="bot-body-group">
          {/* Antenna */}
          <line x1="32" y1="8" x2="32" y2="17" stroke="#4a8f40" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="32" cy="7" r="3.5" fill="#4a8f40"/>
          <circle cx="32" cy="7" r="2" fill="#a5e6a0" className="bot-antenna-light">
            {animate && (
              <animate 
                attributeName="opacity" 
                values="1;0.3;1" 
                dur="2.4s" 
                repeatCount="indefinite"
              />
            )}
          </circle>

          {/* Head */}
          <rect x="14" y="16" width="36" height="28" rx="9" fill="url(#headGrad)" stroke="#4a8f40" strokeWidth="1.2"/>

          {/* Eyes */}
          <g filter="url(#eyeGlow)">
            {/* Left Eye */}
            <ellipse cx="24" cy="27" rx="5.5" ry="5.5" fill="url(#eyeGrad)" className="bot-eye-glow">
              {animate && (
                <animate 
                  attributeName="ry" 
                  values="5.5;5.5;5.5;0.8;5.5" 
                  dur="4s" 
                  repeatCount="indefinite"
                />
              )}
            </ellipse>
            <circle cx="24" cy="26" r="2.2" fill="#0d1f0c" opacity="0.9"/>
            <circle cx="25.2" cy="25" r="1" fill="rgba(255,255,255,.7)"/>
            
            {/* Right Eye */}
            <ellipse cx="40" cy="27" rx="5.5" ry="5.5" fill="url(#eyeGrad)" className="bot-eye-glow">
              {animate && (
                <animate 
                  attributeName="ry" 
                  values="5.5;5.5;5.5;0.8;5.5" 
                  dur="4s" 
                  begin="0.2s" 
                  repeatCount="indefinite"
                />
              )}
            </ellipse>
            <circle cx="40" cy="26" r="2.2" fill="#0d1f0c" opacity="0.9"/>
            <circle cx="41.2" cy="25" r="1" fill="rgba(255,255,255,.7)"/>
          </g>

          {/* Mouth (pixel grid) */}
          <g className="bot-mouth-grid" opacity="0.85">
            <rect x="25" y="37" width="3" height="2.5" rx=".5" fill="#4a8f40"/>
            <rect x="29" y="37" width="3" height="2.5" rx=".5" fill="#6dbf67"/>
            <rect x="33" y="37" width="3" height="2.5" rx=".5" fill="#4a8f40"/>
            <rect x="37" y="37" width="3" height="2.5" rx=".5" fill="#6dbf67"/>
          </g>

          {/* Body */}
          <rect x="16" y="44" width="32" height="26" rx="8" fill="url(#bodyGrad)" stroke="#3a7a34" strokeWidth="1"/>

          {/* Chest screen */}
          <rect x="22" y="48" width="20" height="13" rx="4" fill="url(#screenGrad)" stroke="rgba(74,143,64,.3)" strokeWidth=".8"/>
          <text x="32" y="57" textAnchor="middle" fontSize="5.5" fill="#6dbf67" fontFamily="monospace" opacity=".8">NAT</text>
          <line x1="22" y1="60" x2="42" y2="60" stroke="rgba(74,143,64,.2)" strokeWidth=".5"/>

          {/* Buttons */}
          <circle cx="24" cy="64" r="2.2" fill="#3a7a34" stroke="#4a8f40" strokeWidth=".6"/>
          <circle cx="40" cy="64" r="2.2" fill="#3a7a34" stroke="#4a8f40" strokeWidth=".6"/>
          <circle cx="32" cy="65" r="1.8" fill="#2d6b25"/>
          <circle cx="32" cy="65" r="1" fill="#4a8f40" opacity=".6">
            {animate && (
              <animate 
                attributeName="opacity" 
                values=".6;1;.6" 
                dur="1.8s" 
                repeatCount="indefinite"
              />
            )}
          </circle>
        </g>

        {/* Left arm */}
        <g className="bot-arm-left">
          <rect x="5" y="36" width="11" height="18" rx="5" fill="url(#bodyGrad)" stroke="#3a7a34" strokeWidth="1"/>
          <circle cx="10.5" cy="54" r="4.5" fill="#2e5c28" stroke="#4a8f40" strokeWidth=".8"/>
          <circle cx="10.5" cy="54" r="2" fill="#4a8f40" opacity=".5"/>
        </g>

        {/* Right arm */}
        <g className="bot-arm-right">
          <rect x="48" y="36" width="11" height="18" rx="5" fill="url(#bodyGrad)" stroke="#3a7a34" strokeWidth="1"/>
          <circle cx="53.5" cy="54" r="4.5" fill="#2e5c28" stroke="#4a8f40" strokeWidth=".8"/>
          <circle cx="53.5" cy="54" r="2" fill="#4a8f40" opacity=".5"/>
        </g>

        {/* Left leg */}
        <g className="bot-leg-left">
          <rect x="19" y="68" width="11" height="17" rx="5" fill="url(#legGrad)" stroke="#3a7a34" strokeWidth=".8"/>
          <ellipse cx="24.5" cy="85" rx="6.5" ry="4" fill="#1e3d18" stroke="#4a8f40" strokeWidth=".7"/>
        </g>

        {/* Right leg */}
        <g className="bot-leg-right">
          <rect x="34" y="68" width="11" height="17" rx="5" fill="url(#legGrad)" stroke="#3a7a34" strokeWidth=".8"/>
          <ellipse cx="39.5" cy="85" rx="6.5" ry="4" fill="#1e3d18" stroke="#4a8f40" strokeWidth=".7"/>
        </g>
      </svg>

      {/* CSS Animations */}
      {animate && (
        <style jsx>{`
          @keyframes botHover {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }

          @keyframes armSwingLeft {
            0%, 100% { transform: rotate(0deg); }
            30% { transform: rotate(-22deg); }
            60% { transform: rotate(8deg); }
          }

          @keyframes armSwingRight {
            0%, 100% { transform: rotate(0deg); }
            30% { transform: rotate(22deg); }
            60% { transform: rotate(-8deg); }
          }

          @keyframes legWalkLeft {
            0%, 100% { transform: rotate(0deg) translateY(0px); }
            25% { transform: rotate(-12deg) translateY(-2px); }
            75% { transform: rotate(10deg) translateY(1px); }
          }

          @keyframes legWalkRight {
            0%, 100% { transform: rotate(0deg) translateY(0px); }
            25% { transform: rotate(12deg) translateY(-2px); }
            75% { transform: rotate(-10deg) translateY(1px); }
          }

          .bot-body-group {
            animation: botHover 3.2s ease-in-out infinite;
            transform-origin: center center;
          }

          .bot-arm-left {
            transform-origin: 10.5px 36px;
            animation: armSwingLeft 1.6s ease-in-out infinite;
          }

          .bot-arm-right {
            transform-origin: 53.5px 36px;
            animation: armSwingRight 1.6s ease-in-out infinite;
            animation-delay: -0.8s;
          }

          .bot-leg-left {
            transform-origin: 24.5px 68px;
            animation: legWalkLeft 1.6s ease-in-out infinite;
          }

          .bot-leg-right {
            transform-origin: 39.5px 68px;
            animation: legWalkRight 1.6s ease-in-out infinite;
            animation-delay: -0.8s;
          }
        `}</style>
      )}
    </div>
  );
};

export default NatureBot;
