import React from 'react';

const NatureBot = ({ size = 120, animate = true }) => {
  return (
    <div 
      style={{ 
        position: 'relative',
        width: size,
        height: size * 1.4,
        display: 'inline-block'
      }}
      className={animate ? 'nature-bot-animate' : ''}
    >
      <svg 
        viewBox="0 0 100 140" 
        width={size} 
        height={size * 1.4}
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 0 10px rgba(74, 143, 64, 0.5))' }}
      >
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#4a8f40', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#3d7a35', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#2d5a28', stopOpacity: 1 }} />
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Antenna */}
        <line 
          x1="50" 
          y1="8" 
          x2="50" 
          y2="18" 
          stroke="#4a8f40" 
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle 
          cx="50" 
          cy="6" 
          r="4" 
          fill="#6dbf67"
          filter="url(#glow)"
        />

        {/* Main Body (Leaf/Teardrop Shape) */}
        <ellipse 
          cx="50" 
          cy="60" 
          rx="30" 
          ry="45" 
          fill="url(#bodyGradient)"
          stroke="#4a8f40" 
          strokeWidth="2.5"
          filter="url(#glow)"
        />

        {/* Head Area (Robotic) */}
        <rect 
          x="35" 
          y="30" 
          width="30" 
          height="25" 
          rx="4" 
          fill="#2d5a28"
          stroke="#4a8f40" 
          strokeWidth="1.5"
        />
        
        {/* Face Lines */}
        <line x1="38" y1="37" x2="62" y2="37" stroke="#1a3a18" strokeWidth="1" opacity="0.5" />
        <line x1="38" y1="42" x2="62" y2="42" stroke="#1a3a18" strokeWidth="1" opacity="0.5" />
        <line x1="38" y1="47" x2="62" y2="47" stroke="#1a3a18" strokeWidth="1" opacity="0.5" />

        {/* Eyes */}
        <circle 
          cx="43" 
          cy="42" 
          r="5" 
          fill="#4db8ff"
          filter="url(#glow)"
        />
        <circle 
          cx="43" 
          cy="42" 
          r="2.5" 
          fill="#003d66"
        />
        
        <circle 
          cx="57" 
          cy="42" 
          r="5" 
          fill="#4db8ff"
          filter="url(#glow)"
        />
        <circle 
          cx="57" 
          cy="42" 
          r="2.5" 
          fill="#003d66"
        />

        {/* Mouth */}
        <rect 
          x="45" 
          y="48" 
          width="10" 
          height="4" 
          rx="1" 
          fill="#1a3a18"
        />

        {/* Left Arm */}
        <g>
          <ellipse 
            cx="22" 
            cy="65" 
            rx="3" 
            ry="8" 
            fill="#4a8f40"
            stroke="#2d5a28" 
            strokeWidth="1.5"
            transform="rotate(-20 22 65)"
          />
        </g>

        {/* Right Arm */}
        <g>
          <ellipse 
            cx="78" 
            cy="65" 
            rx="3" 
            ry="8" 
            fill="#4a8f40"
            stroke="#2d5a28" 
            strokeWidth="1.5"
            transform="rotate(20 78 65)"
          />
        </g>

        {/* Left Leg */}
        <rect 
          x="40" 
          y="100" 
          width="6" 
          height="18" 
          rx="3" 
          fill="#4a8f40"
          stroke="#2d5a28" 
          strokeWidth="1.5"
        />
        <ellipse 
          cx="43" 
          cy="120" 
          rx="4" 
          ry="3" 
          fill="#3d7a35"
        />

        {/* Right Leg */}
        <rect 
          x="54" 
          y="100" 
          width="6" 
          height="18" 
          rx="3" 
          fill="#4a8f40"
          stroke="#2d5a28" 
          strokeWidth="1.5"
        />
        <ellipse 
          cx="57" 
          cy="120" 
          rx="4" 
          ry="3" 
          fill="#3d7a35"
        />

        {/* Leaf Vein Details */}
        <path 
          d="M 50 35 Q 50 60 50 85" 
          stroke="#2d5a28" 
          strokeWidth="1" 
          fill="none" 
          opacity="0.3"
        />
        <path 
          d="M 50 50 Q 35 55 30 60" 
          stroke="#2d5a28" 
          strokeWidth="0.8" 
          fill="none" 
          opacity="0.3"
        />
        <path 
          d="M 50 50 Q 65 55 70 60" 
          stroke="#2d5a28" 
          strokeWidth="0.8" 
          fill="none" 
          opacity="0.3"
        />
        <path 
          d="M 50 70 Q 35 73 32 78" 
          stroke="#2d5a28" 
          strokeWidth="0.8" 
          fill="none" 
          opacity="0.3"
        />
        <path 
          d="M 50 70 Q 65 73 68 78" 
          stroke="#2d5a28" 
          strokeWidth="0.8" 
          fill="none" 
          opacity="0.3"
        />
      </svg>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes glow-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(74, 143, 64, 0.5));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(74, 143, 64, 0.8));
          }
        }

        .nature-bot-animate {
          animation: float 3s ease-in-out infinite;
        }

        .nature-bot-animate svg {
          animation: glow-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NatureBot;
