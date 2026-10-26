import React from 'react';
import { Clock, TrendingUp, Zap, Target } from 'lucide-react';
import './HoursKpiCard.css';

interface HoursKpiCardProps {
  todaySeconds: number; // total logged seconds
  productiveSeconds?: number; // productive focus seconds (defaults to todaySeconds if not provided)
  restSeconds?: number; // inactive / rest logged seconds (e.g. sleep, entertainment)
  userName: string;
}

export const HoursKpiCard: React.FC<HoursKpiCardProps> = ({ 
  todaySeconds, 
  productiveSeconds,
  restSeconds = 0,
  userName 
}) => {
  const TOTAL_HOURS_IN_DAY = 24;
  const effectiveProductive = productiveSeconds !== undefined ? productiveSeconds : todaySeconds;
  const hoursWorked = effectiveProductive / 3600;
  const percentageOfDay = Math.min(100, (hoursWorked / TOTAL_HOURS_IN_DAY) * 100);
  
  // Format hours and minutes for productive focus
  const wholeHours = Math.floor(hoursWorked);
  const minutes = Math.floor((effectiveProductive % 3600) / 60);

  // Format rest / inactive hours if logged
  const restHoursWorked = restSeconds / 3600;
  const restWholeHours = Math.floor(restHoursWorked);
  const restMinutes = Math.floor((restSeconds % 3600) / 60);

  // SVG circular gauge calculations
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentageOfDay / 100) * circumference;

  // Typical target for deep study / work in a day (e.g. 6 hours = 100% of productive goal)
  const typicalGoalHours = 6;
  const goalPercentage = Math.min(100, Math.round((hoursWorked / typicalGoalHours) * 100));

  return (
    <div className="hours-kpi-card">
      <div className="kpi-left-content">
        <div className="kpi-badge">
          <Clock size={14} className="badge-icon" />
          <span>Daily 24-Hour Utilization</span>
        </div>
        
        <h2 className="kpi-title">
          Hours Worked vs. 24 Hours of the Day
        </h2>
        
        <p className="kpi-subtitle">
          Real-time tracking of <span className="highlight-name">{userName}</span>'s active study time across the 24-hour cycle.
        </p>

        <div className="kpi-metrics-row">
          <div className="metric-box">
            <span className="metric-label">Productive Focus</span>
            <div className="metric-value-row">
              <span className="metric-huge text-purple">{wholeHours}</span>
              <span className="metric-unit">h</span>
              <span className="metric-huge text-purple" style={{ marginLeft: '6px' }}>{minutes}</span>
              <span className="metric-unit">m</span>
            </div>
          </div>

          <div className="metric-divider" />

          {restSeconds > 0 && (
            <>
              <div className="metric-box">
                <span className="metric-label">Rest / Sleep</span>
                <div className="metric-value-row">
                  <span className="metric-huge" style={{ color: '#6366F1' }}>{restWholeHours}</span>
                  <span className="metric-unit">h</span>
                  <span className="metric-huge" style={{ color: '#6366F1', marginLeft: '6px' }}>{restMinutes}</span>
                  <span className="metric-unit">m</span>
                </div>
              </div>

              <div className="metric-divider" />
            </>
          )}

          <div className="metric-box">
            <span className="metric-label">Remaining in Day</span>
            <div className="metric-value-row">
              <span className="metric-huge">{Math.max(0, 24 - wholeHours - restWholeHours - (minutes > 0 ? 1 : 0))}</span>
              <span className="metric-unit">h left</span>
            </div>
          </div>

          <div className="metric-divider" />

          <div className="metric-box">
            <span className="metric-label">Goal Target (6h)</span>
            <div className="metric-value-row">
              <span className="metric-huge text-purple">{goalPercentage}%</span>
              <Target size={18} className="metric-target-icon" />
            </div>
          </div>
        </div>

        {/* Linear breakdown bar */}
        <div className="kpi-linear-bar-container">
          <div className="kpi-linear-bar-labels">
            <span>00:00 (Start of Day)</span>
            <span className="kpi-linear-ratio font-mono">
              {hoursWorked.toFixed(1)}h Focus {restSeconds > 0 ? `+ ${restHoursWorked.toFixed(1)}h Rest` : ''} / 24h ({percentageOfDay.toFixed(1)}%)
            </span>
            <span>24:00 (Midnight)</span>
          </div>
          <div className="kpi-linear-track">
            <div 
              className="kpi-linear-fill" 
              style={{ width: `${Math.max(percentageOfDay, 2)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Circular Gauge on the right */}
      <div className="kpi-gauge-wrapper">
        <div className="gauge-relative">
          <svg width={size} height={size} className="gauge-svg">
            <circle
              className="gauge-bg-circle"
              stroke="#EDE9FE"
              strokeWidth={strokeWidth}
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
            <circle
              className="gauge-fill-circle"
              stroke="url(#purpleGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
            <defs>
              <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="60%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>
            </defs>
          </svg>
          <div className="gauge-inner-content">
            <TrendingUp size={22} className="gauge-icon" />
            <div className="gauge-percentage-text">
              {percentageOfDay.toFixed(1)}%
            </div>
            <div className="gauge-small-label">of Day Active</div>
          </div>
        </div>
        <div className="gauge-footer-pill">
          <Zap size={13} className="lightning-icon" />
          <span>Active Capacity</span>
        </div>
      </div>
    </div>
  );
};
