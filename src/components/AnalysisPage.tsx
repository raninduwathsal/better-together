import React, { useMemo } from 'react';
import type { TimeSession, UserProfile, CategoryDefinition } from '../types';
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
  categoryDefs?: CategoryDefinition[];
}

// Fallback Default Category Colors
export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  'Study': '#10B981',         // Green
  'Club': '#8B5CF6',          // Purple
  'Entertainment': '#EF4444', // Red
  'Work': '#3B82F6',          // Blue
  'Sleep': '#6366F1',         // Indigo
  'Deep Work': '#059669',     // Emerald
  'Other': '#94A3B8',         // Slate
};

export const CATEGORY_COLORS = DEFAULT_CATEGORY_COLORS;

export const getCategoryColor = (category: string, customDefs?: CategoryDefinition[]): string => {
  if (customDefs) {
    const match = customDefs.find(c => c.name.toLowerCase() === category.toLowerCase());
    if (match) return match.color;
  }
  return DEFAULT_CATEGORY_COLORS[category] || '#A855F7';
};

interface HourSegment {
  category: string;
  minutes: number;
  color: string;
  sessionTitle: string;
}

interface HourBucket {
  hour: number;
  label: string;
  totalMinutes: number;
  segments: HourSegment[];
  sessions: TimeSession[];
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ sessions, currentUser, categoryDefs }) => {
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
        color: getCategoryColor(name, categoryDefs)
      };
    });

    return entries.sort((a, b) => b.seconds - a.seconds);
  }, [userSessions, totalSecondsAllTime, categoryDefs]);

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

  // Selected date for hourly drilldown (default to today: 'YYYY-MM-DD')
  const [selectedDrilldownDate, setSelectedDrilldownDate] = React.useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Hourly distribution for the selected day with STACKED category segments (24 buckets: 00:00 to 23:00)
  const hourlyDayBreakdown = useMemo<HourBucket[]>(() => {
    const buckets: HourBucket[] = [];
    for (let h = 0; h < 24; h++) {
      buckets.push({
        hour: h,
        label: `${h.toString().padStart(2, '0')}:00`,
        totalMinutes: 0,
        segments: [],
        sessions: []
      });
    }

    // Parse the selected day's boundaries in local time
    const [y, m, d] = selectedDrilldownDate.split('-').map(Number);
    const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();

    // Find sessions that overlap with this day
    const daySessions = userSessions.filter(s => {
      const sStart = s.startTime;
      const sEnd = s.endTime || (s.startTime + s.durationSeconds * 1000);
      return sStart <= dayEnd && sEnd >= dayStart;
    });

    // Populate each hour bucket with stacked category slices
    daySessions.forEach(session => {
      const sStart = session.startTime;
      const sEnd = session.endTime || (session.startTime + session.durationSeconds * 1000);

      for (let h = 0; h < 24; h++) {
        const bucketStart = new Date(y, m - 1, d, h, 0, 0, 0).getTime();
        const bucketEnd = new Date(y, m - 1, d, h + 1, 0, 0, 0).getTime();

        const overlapStart = Math.max(sStart, bucketStart);
        const overlapEnd = Math.min(sEnd, bucketEnd);

        if (overlapEnd > overlapStart) {
          const overlapMins = Math.round((overlapEnd - overlapStart) / (1000 * 60));
          if (overlapMins > 0) {
            buckets[h].totalMinutes = Math.min(60, buckets[h].totalMinutes + overlapMins);
            
            // Add or merge segment for this category
            const existingSeg = buckets[h].segments.find(seg => seg.category === session.category);
            if (existingSeg) {
              existingSeg.minutes = Math.min(60, existingSeg.minutes + overlapMins);
            } else {
              buckets[h].segments.push({
                category: session.category,
                minutes: overlapMins,
                color: getCategoryColor(session.category, categoryDefs),
                sessionTitle: session.workingOn
              });
            }

            if (!buckets[h].sessions.some(s => s.id === session.id)) {
              buckets[h].sessions.push(session);
            }
          }
        }
      }
    });

    return buckets;
  }, [userSessions, selectedDrilldownDate]);

  // Overall 24-hour heatmap (cumulative study frequency by hour across all sessions)
  const cumulativeHourlyHeatmap = useMemo(() => {
    const hourCounts = new Array(24).fill(0);
    userSessions.forEach(s => {
      const date = new Date(s.startTime);
      const startHour = date.getHours();
      const durationHours = Math.max(1, Math.round(s.durationSeconds / 3600));
      for (let i = 0; i < durationHours; i++) {
        const h = (startHour + i) % 24;
        hourCounts[h] += 1;
      }
    });
    const maxVal = Math.max(1, ...hourCounts);
    return hourCounts.map((count, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      count,
      intensity: count / maxVal
    }));
  }, [userSessions]);

  // Peak productivity hour calculation
  const peakHour = useMemo(() => {
    let best = 0;
    let bestHour = 9;
    cumulativeHourlyHeatmap.forEach(item => {
      if (item.count > best) {
        best = item.count;
        bestHour = item.hour;
      }
    });
    return `${bestHour.toString().padStart(2, '0')}:00 - ${(bestHour + 1).toString().padStart(2, '0')}:00`;
  }, [cumulativeHourlyHeatmap]);

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

      {/* 24-Hour Daily Timesheet Drilldown (BladeGen inspired) */}
      <div className="chart-card drilldown-card">
        <div className="drilldown-header">
          <div>
            <div className="drilldown-badge">
              <Clock size={14} className="text-purple" />
              <span>Timesheet Hourly Breakdown</span>
            </div>
            <h3 className="chart-title" style={{ marginTop: '0.35rem' }}>
              Hour-by-Hour Activity Drilldown
            </h3>
            <p className="chart-desc">
              Inspect exactly how many minutes you studied in each hour of the day
            </p>
          </div>

          <div className="drilldown-date-picker-wrap">
            <span className="picker-label">Select Day:</span>
            <input 
              type="date"
              className="drilldown-date-input font-mono"
              value={selectedDrilldownDate}
              onChange={(e) => setSelectedDrilldownDate(e.target.value)}
            />
          </div>
        </div>

        {/* 24 Hour Stacked Bar Graph */}
        <div className="hourly-bars-grid">
          {hourlyDayBreakdown.map((bucket) => {
            const hasActivity = bucket.totalMinutes > 0;

            return (
              <div 
                key={bucket.hour} 
                className={`hourly-bar-col ${hasActivity ? 'has-data' : ''}`}
              >
                {/* Multi-category detailed tooltip */}
                <div className="hourly-bar-tooltip">
                  <span className="tooltip-time font-mono">{bucket.label}</span>
                  <span className="tooltip-mins font-mono">{bucket.totalMinutes}m logged</span>
                  {bucket.segments.length > 0 && (
                    <div className="tooltip-segments-list">
                      {bucket.segments.map(seg => (
                        <div key={seg.category} className="tooltip-seg-item">
                          <span className="tooltip-dot" style={{ backgroundColor: seg.color }} />
                          <span className="tooltip-seg-cat">{seg.category}:</span>
                          <span className="tooltip-seg-val font-mono">{seg.minutes}m</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stacked Bar Track */}
                <div className="hourly-bar-track">
                  {hasActivity ? (
                    <div className="stacked-bar-container">
                      {bucket.segments.map((seg, sIdx) => {
                        // Calculate percentage of the 60-minute hour
                        const segmentHeightPct = (seg.minutes / 60) * 100;
                        return (
                          <div 
                            key={sIdx}
                            className="stacked-bar-slice"
                            style={{
                              height: `${segmentHeightPct}%`,
                              backgroundColor: seg.color,
                            }}
                            title={`${seg.category}: ${seg.minutes} min`}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <span className="hourly-bar-label font-mono">
                  {bucket.hour % 3 === 0 ? bucket.label.split(':')[0] : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Category Color Legend */}
        <div className="drilldown-category-legend">
          <div className="legend-label-title">Categories:</div>
          <div className="legend-chips-list">
            {(categoryDefs && categoryDefs.length > 0 
              ? categoryDefs 
              : Object.entries(DEFAULT_CATEGORY_COLORS).map(([name, color]) => ({ name, color, isProductive: true }))
            ).map(cat => (
              <span key={cat.name} className="legend-tag-pill">
                <span className="tag-dot" style={{ backgroundColor: cat.color }} />
                <span>{cat.name} {!cat.isProductive && <small style={{ opacity: 0.7, fontSize: '0.7em' }}>(Rest/Inactive)</small>}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Active sessions list for this selected day */}
        <div className="drilldown-day-sessions">
          <div className="drilldown-sessions-header">
            <span className="sessions-header-title">
              Sessions Logged on {new Date(selectedDrilldownDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
            </span>
            <span className="sessions-count-badge font-mono">
              {hourlyDayBreakdown.reduce((sum, b) => sum + b.totalMinutes, 0)} mins total
            </span>
          </div>

          {hourlyDayBreakdown.some(b => b.totalMinutes > 0) ? (
            <div className="drilldown-chips-row">
              {Array.from(new Set(hourlyDayBreakdown.flatMap(b => b.sessions))).map(session => (
                <div key={session.id} className="drilldown-session-chip">
                  <span 
                    className="chip-cat-dot" 
                    style={{ backgroundColor: getCategoryColor(session.category) }} 
                  />
                  <span className="chip-name">{session.workingOn}</span>
                  <span 
                    className="chip-category-badge"
                    style={{ 
                      color: getCategoryColor(session.category),
                      backgroundColor: `${getCategoryColor(session.category)}18`,
                      borderColor: `${getCategoryColor(session.category)}40`
                    }}
                  >
                    {session.category}
                  </span>
                  <span className="chip-time font-mono">
                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {session.endTime ? ` - ${new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </span>
                  <span className="chip-duration font-mono">
                    {Math.round(session.durationSeconds / 60)}m
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-drilldown-msg">
              No time tracked on this date. Use the "+ Log Missed Time" button or start the timer to log hours!
            </div>
          )}
        </div>
      </div>

      {/* 24-Hour Lifetime Study Distribution Heatmap */}
      <div className="chart-card heatmap-card">
        <div className="chart-card-header">
          <div>
            <h3 className="chart-title">Peak Productivity Hours (Lifetime Heatmap)</h3>
            <p className="chart-desc">
              Your overall peak study window is typically around <strong className="text-purple">{peakHour}</strong>
            </p>
          </div>
          <Flame size={18} className="text-pink" />
        </div>

        <div className="heatmap-row">
          {cumulativeHourlyHeatmap.map(cell => {
            const alpha = Math.max(0.08, cell.intensity);
            return (
              <div 
                key={cell.hour} 
                className="heatmap-cell"
                title={`${cell.label}: ${cell.count} study sessions`}
              >
                <div 
                  className="heatmap-cell-inner"
                  style={{
                    backgroundColor: `rgba(124, 58, 237, ${cell.count > 0 ? alpha : 0.05})`,
                    border: cell.count > 0 ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid var(--border-light)'
                  }}
                >
                  <span className="heatmap-cell-val font-mono">{cell.count > 0 ? cell.count : ''}</span>
                </div>
                <span className="heatmap-cell-hour font-mono">
                  {cell.hour % 2 === 0 ? cell.hour : ''}
                </span>
              </div>
            );
          })}
        </div>
        <div className="heatmap-legend">
          <span className="legend-label">Less active</span>
          <div className="heatmap-legend-gradient" />
          <span className="legend-label">Peak focus</span>
        </div>
      </div>

      {/* Clean-Room Key Highlights */}
      <div className="insights-panel">
        <h4 className="insights-title">
          <Award size={18} className="text-purple" />
          <span>Productivity Insight & Reflection</span>
        </h4>
        <p className="insights-body">
          {categoryStats.length === 0 ? (
            <>No study sessions recorded yet for <strong>{currentUser.name}</strong>. Start your first session from the Tracker tab or use "+ Log Missed Time" to begin generating live cloud analytics!</>
          ) : (
            <>Sessions are logged friction-free without intrusive prompts. Your highest output is in <strong>{categoryStats[0]?.name}</strong>, accounting for <strong>{categoryStats[0]?.percentage}%</strong> of total focus volume with peak focus between <strong>{peakHour}</strong>.</>
          )}
        </p>
      </div>
    </div>
  );
};
