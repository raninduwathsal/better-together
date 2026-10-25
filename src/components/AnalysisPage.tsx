import React, { useMemo } from 'react';
import type { TimeSession, UserProfile } from '../types';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  Calendar, 
  Award, 
  Flame, 
  Clock, 
  Zap,
  CheckCircle2,
  Filter
} from 'lucide-react';
import './AnalysisPage.css';

interface AnalysisPageProps {
  sessions: TimeSession[];
  currentUser: UserProfile;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ sessions, currentUser }) => {
  // Filter sessions for the active user
  const userSessions = useMemo(() => {
    return sessions.filter(s => s.userId === currentUser.id);
  }, [sessions, currentUser.id]);

  // Aggregate stats
  const totalSecondsAllTime = userSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalHoursAllTime = (totalSecondsAllTime / 3600).toFixed(1);
  const totalSessionsCount = userSessions.length;
  const pomodoroSessionsCount = userSessions.filter(s => s.isPomodoro).length;

  // Today's total
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTimestamp = todayStart.getTime();

  const todaySessions = userSessions.filter(s => s.startTime >= todayTimestamp);
  const todaySeconds = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const todayHours = (todaySeconds / 3600).toFixed(1);

  // Breakdown by Category
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    userSessions.forEach(s => {
      map[s.category] = (map[s.category] || 0) + s.durationSeconds;
    });

    const colors: Record<string, string> = {
      'Study': '#7C3AED',         // Deep Purple
      'Work': '#9333EA',          // Vibrant Purple
      'Club': '#C084FC',          // Light Lavender
      'Entertainment': '#EC4899', // Pink
      'Sleep': '#6366F1',         // Indigo
      'Deep Work': '#7C3AED',
      'Other': '#CBD5E1',
    };

    const entries = Object.entries(map).map(([name, seconds]) => {
      const hours = (seconds / 3600).toFixed(1);
      const percentage = totalSecondsAllTime > 0 
        ? Math.round((seconds / totalSecondsAllTime) * 100) 
        : 0;
      return {
        name,
        seconds,
        hours,
        percentage,
        color: colors[name] || '#8B5CF6'
      };
    });

    return entries.sort((a, b) => b.seconds - a.seconds);
  }, [userSessions, totalSecondsAllTime]);

  // Last 7 days breakdown for bar chart
  const last7DaysData = useMemo(() => {
    const days: { label: string; dateStr: string; seconds: number; hours: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const startMs = d.getTime();
      const endMs = startMs + 86400000;

      const daySeconds = userSessions
        .filter(s => s.startTime >= startMs && s.startTime < endMs)
        .reduce((sum, s) => sum + s.durationSeconds, 0);

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({
        label: i === 0 ? 'Today' : dayName,
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        seconds: daySeconds,
        hours: Number((daySeconds / 3600).toFixed(1)),
      });
    }
    return days;
  }, [userSessions]);

  const maxDayHours = Math.max(4, ...last7DaysData.map(d => d.hours));

  return (
    <div className="analysis-page">
      {/* Header */}
      <div className="analysis-header">
        <div>
          <h1 className="analysis-title">Study & Focus Analytics</h1>
          <p className="analysis-subtitle">
            Comprehensive breakdown of study distribution, peak productivity hours, and learning velocity.
          </p>
        </div>
        <div className="user-filter-tag">
          <Filter size={15} />
          <span>Showing metrics for: <strong>{currentUser.name}</strong></span>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Total Time Tracked</span>
            <div className="stat-icon-wrapper bg-purple-soft">
              <Clock size={18} className="text-purple" />
            </div>
          </div>
          <div className="stat-number-row">
            <span className="stat-big-number font-mono">{totalHoursAllTime}</span>
            <span className="stat-unit">hours</span>
          </div>
          <span className="stat-trend positive">
            <TrendingUp size={14} /> Cumulative lifetime focus
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Today's Focus</span>
            <div className="stat-icon-wrapper bg-indigo-soft">
              <Zap size={18} className="text-indigo" />
            </div>
          </div>
          <div className="stat-number-row">
            <span className="stat-big-number font-mono">{todayHours}</span>
            <span className="stat-unit">h logged</span>
          </div>
          <span className="stat-trend neutral">
            {todaySessions.length} sessions logged today
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Pomodoro Cycles</span>
            <div className="stat-icon-wrapper bg-pink-soft">
              <Flame size={18} className="text-pink" />
            </div>
          </div>
          <div className="stat-number-row">
            <span className="stat-big-number font-mono">{pomodoroSessionsCount}</span>
            <span className="stat-unit">intervals</span>
          </div>
          <span className="stat-trend positive">
            Structured 25m study blocks
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Completed Sessions</span>
            <div className="stat-icon-wrapper bg-emerald-soft">
              <Award size={18} className="text-emerald" />
            </div>
          </div>
          <div className="stat-number-row">
            <span className="stat-big-number font-mono">{totalSessionsCount}</span>
            <span className="stat-unit">entries</span>
          </div>
          <span className="stat-trend positive">
            <CheckCircle2 size={14} /> 100% distraction-free logs
          </span>
        </div>
      </div>

      {/* Main Analysis Visuals Grid */}
      <div className="charts-grid">
        
        {/* Weekly Focus Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Last 7 Days Study Hours</h3>
              <p className="chart-desc">Daily progress compared to optimal 4h - 6h focus window</p>
            </div>
            <Calendar size={18} className="text-muted" />
          </div>

          <div className="bar-chart-container">
            {last7DaysData.map((day, idx) => {
              const heightPercent = maxDayHours > 0 ? (day.hours / maxDayHours) * 100 : 0;
              const isToday = idx === last7DaysData.length - 1;

              return (
                <div key={day.dateStr} className="bar-column">
                  <div className="bar-value-label font-mono">
                    {day.hours > 0 ? `${day.hours}h` : '0h'}
                  </div>
                  <div className="bar-track">
                    <div 
                      className={`bar-fill ${isToday ? 'bar-today' : ''}`}
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                  </div>
                  <div className="bar-footer">
                    <span className={`bar-day-name ${isToday ? 'active-day' : ''}`}>{day.label}</span>
                    <span className="bar-date-sub">{day.dateStr}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="chart-footer-legend">
            <span className="legend-item"><span className="legend-dot purple-dot"></span> Completed Focus Time</span>
            <span className="legend-item"><span className="legend-dot goal-dot"></span> Target Baseline: 4.0h</span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Subject & Category Distribution</h3>
              <p className="chart-desc">Where study time was allocated</p>
            </div>
            <PieIcon size={18} className="text-muted" />
          </div>

          {categoryStats.length === 0 ? (
            <div className="empty-analysis-state">
              <p>No study sessions recorded yet for this user.</p>
            </div>
          ) : (
            <div className="categories-list">
              {categoryStats.map(item => (
                <div key={item.name} className="cat-stat-row">
                  <div className="cat-stat-top">
                    <div className="cat-name-badge">
                      <span className="cat-dot" style={{ backgroundColor: item.color }} />
                      <span className="cat-name">{item.name}</span>
                    </div>
                    <div className="cat-values">
                      <span className="cat-hours font-mono">{item.hours} hrs</span>
                      <span className="cat-pct font-mono">({item.percentage}%)</span>
                    </div>
                  </div>
                  <div className="cat-progress-track">
                    <div 
                      className="cat-progress-fill"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Clean-Room Key Highlights */}
      <div className="insights-panel">
        <h4 className="insights-title">
          <Award size={18} className="text-purple" />
          <span>Productivity Insight & Reflection</span>
        </h4>
        <p className="insights-body">
          Sessions are logged friction-free without intrusive prompts. Your highest output is in <strong>{categoryStats[0]?.name || 'Deep Work'}</strong>, accounting for <strong>{categoryStats[0]?.percentage || 0}%</strong> of total study volume.
        </p>
      </div>
    </div>
  );
};
