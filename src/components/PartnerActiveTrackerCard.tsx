import React, { useState, useEffect } from 'react';
import type { ActiveTimerState, UserProfile } from '../types';
import { Radio, Flame, Sparkles, Clock } from 'lucide-react';
import './PartnerActiveTrackerCard.css';

interface PartnerActiveTrackerCardProps {
  activeTimers: ActiveTimerState[];
  currentUserId: string;
  users: UserProfile[];
}

export const PartnerActiveTrackerCard: React.FC<PartnerActiveTrackerCardProps> = ({
  activeTimers,
  currentUserId,
  users,
}) => {
  // Tick every second to smoothly animate running partner timer duration
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter partners who are actively tracking and not the current user
  const otherActiveTimers = activeTimers.filter(
    t => t.userId !== currentUserId && t.isRunning
  );

  if (otherActiveTimers.length === 0) {
    return null; // Don't show clutter if nobody else is tracking right now
  }

  const formatDuration = (timer: ActiveTimerState) => {
    const elapsedSinceStarted = timer.startedAt ? Math.max(0, Math.floor((now - timer.startedAt) / 1000)) : 0;
    const totalSecs = (timer.accumulatedSeconds || 0) + elapsedSinceStarted;
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="partner-tracking-banner" role="region" aria-label="Partner Currently Tracking">
      <div className="partner-banner-header">
        <div className="live-indicator-wrapper">
          <span className="live-ping-dot"></span>
          <Radio size={16} className="live-radio-icon" />
          <span className="live-header-title">CURRENTLY TRACKING RIGHT NOW</span>
        </div>
        <div className="partner-together-tag">
          <Sparkles size={13} className="sparkle-gold" />
          <span>Together in Flow</span>
        </div>
      </div>

      <div className="partner-cards-list">
        {otherActiveTimers.map(partnerTimer => {
          const profile = users.find(u => u.id === partnerTimer.userId);
          const avatarColor = profile?.avatarColor || '#7C3AED';
          const partnerName = partnerTimer.userName || profile?.name || 'Partner';
          const taskName = partnerTimer.workingOn?.trim() || 'Focus Session';
          const categoryName = partnerTimer.category || 'Study';

          return (
            <div key={partnerTimer.userId} className="partner-timer-card">
              <div className="partner-card-left">
                <div 
                  className="partner-avatar"
                  style={{ backgroundColor: avatarColor }}
                >
                  {partnerName.charAt(0).toUpperCase()}
                  <span className="partner-status-dot" title="Active now"></span>
                </div>

                <div className="partner-info">
                  <div className="partner-name-row">
                    <span className="partner-name">{partnerName}</span>
                    <span className="partner-is-tracking-badge">
                      <Flame size={12} className="flame-icon" />
                      is tracking
                    </span>
                  </div>
                  <div className="partner-task-row">
                    <span className="partner-task-name" title={taskName}>
                      "{taskName}"
                    </span>
                    <span className="partner-category-pill">{categoryName}</span>
                  </div>
                </div>
              </div>

              <div className="partner-card-right">
                <div className="partner-timer-badge">
                  <Clock size={13} className="partner-clock-icon" />
                  <span className="partner-time-digits font-mono">
                    {formatDuration(partnerTimer)}
                  </span>
                </div>
                {partnerTimer.isPomodoro && (
                  <span className="partner-pomo-tag">Pomodoro</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
