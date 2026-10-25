import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, X, Heart } from 'lucide-react';
import './CallaLilyModal.css';

interface CallaLilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  remainingTasksCount: number;
  userName: string;
}

export const CallaLilyModal: React.FC<CallaLilyModalProps> = ({
  isOpen,
  onClose,
  taskTitle,
  remainingTasksCount,
  userName,
}) => {
  const [bloomStage, setBloomStage] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setBloomStage(0);
      // Trigger blooming progression
      const t1 = setTimeout(() => setBloomStage(1), 200);
      const t2 = setTimeout(() => {
        setBloomStage(2);
        // Confetti burst when fully bloomed
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.55 },
          colors: ['#EDE9FE', '#C084FC', '#9333EA', '#FCD34D', '#10B981']
        });
      }, 900);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="calla-modal-overlay" onClick={onClose}>
      <div className="calla-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="calla-close-btn" onClick={onClose} title="Close">
          <X size={18} />
        </button>

        <div className="calla-sparkle-badge">
          <Sparkles size={15} />
          <span>Calla Lily in Bloom</span>
        </div>

        {/* Gamified Animated SVG Calla Lily */}
        <div className="calla-flower-stage">
          <svg
            viewBox="0 0 240 280"
            className={`calla-svg stage-${bloomStage}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6EE7B7" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>

              {/* Graceful elegant white petal with delicate purple/lavender undertones */}
              <linearGradient id="petalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#FAF5FF" />
                <stop offset="85%" stopColor="#EDE9FE" />
                <stop offset="100%" stopColor="#DDD6FE" />
              </linearGradient>

              {/* Inner funnel shadow for 3D depth */}
              <linearGradient id="innerThroatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C4B5FD" />
                <stop offset="60%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#5B21B6" />
              </linearGradient>

              {/* Golden Yellow Spadix (stamen of calla lily) */}
              <linearGradient id="spadixGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="70%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>

              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Glowing aura behind flower */}
            <circle cx="120" cy="110" r="70" fill="rgba(196, 181, 253, 0.25)" filter="url(#glowEffect)" />

            {/* Graceful arching stem */}
            <path
              className="stem-path"
              d="M 120 160 Q 123 210 115 270"
              fill="none"
              stroke="url(#stemGrad)"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Left Calla Leaf */}
            <path
              className="leaf-left"
              d="M 117 230 C 80 220 50 200 45 170 C 60 175 90 200 116 220 Z"
              fill="url(#leafGrad)"
            />

            {/* Right Calla Leaf */}
            <path
              className="leaf-right"
              d="M 118 245 C 155 240 185 210 190 175 C 175 185 145 210 118 238 Z"
              fill="url(#leafGrad)"
            />

            {/* The Funnel Throat of Calla Lily */}
            <path
              className="throat-shadow"
              d="M 105 155 Q 120 180 135 155 Q 120 135 105 155 Z"
              fill="url(#innerThroatGrad)"
              opacity="0.85"
            />

            {/* The Iconic Golden Spadix center spike */}
            <path
              className="calla-spadix"
              d="M 117 150 Q 120 85 122 75 Q 124 85 123 150 Z"
              fill="url(#spadixGrad)"
            />

            {/* Elegant Outer Petal (Spathe) Wrapping smoothly */}
            <path
              className="petal-main"
              d="M 120 175 
                 C 80 160 70 115 85 85 
                 C 98 60 115 35 120 22 
                 C 125 35 142 60 155 85 
                 C 170 115 160 160 120 175 Z"
              fill="url(#petalGrad)"
              stroke="#C4B5FD"
              strokeWidth="1.5"
            />

            {/* Sweeping folded trumpet curl of the calla lily */}
            <path
              className="petal-curl"
              d="M 120 22 
                 Q 135 60 148 100 
                 Q 120 140 100 110 
                 Q 110 70 120 22 Z"
              fill="url(#petalGrad)"
              opacity="0.95"
            />
          </svg>
        </div>

        {/* Motivational Task Completion message */}
        <div className="calla-content">
          <h2 className="calla-title">Beautiful Work, {userName}!</h2>
          <p className="calla-task-name">
            &ldquo;<strong>{taskTitle}</strong>&rdquo; is complete.
          </p>
          <div className="calla-status-box">
            <Heart size={16} className="text-pink" />
            <span>
              {remainingTasksCount === 0 ? (
                <strong>All tasks finished! The garden is fully in bloom today. 🌸</strong>
              ) : (
                <>Only <strong>{remainingTasksCount}</strong> task{remainingTasksCount === 1 ? '' : 's'} left on your list today!</>
              )}
            </span>
          </div>

          <button className="calla-continue-btn" onClick={onClose}>
            <span>Continue Growing &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
