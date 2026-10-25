import React, { useState, useMemo } from 'react';
import type { TimeSession, UserProfile } from '../types';
import { 
  Search, 
  Trash2, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Download 
} from 'lucide-react';
import './TimesheetPage.css';

interface TimesheetPageProps {
  sessions: TimeSession[];
  onDeleteSession: (id: string) => void;
  currentUser: UserProfile;
  categories: string[];
}

export const TimesheetPage: React.FC<TimesheetPageProps> = ({
  sessions,
  onDeleteSession,
  currentUser,
  categories,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterUserOnly, setFilterUserOnly] = useState<boolean>(true);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // User filter
      if (filterUserOnly && session.userId !== currentUser.id) return false;
      
      // Category filter
      if (filterCategory !== 'all' && session.category !== filterCategory) return false;

      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesWork = session.workingOn.toLowerCase().includes(query);
        const matchesNotes = session.notes?.toLowerCase().includes(query) || false;
        const matchesUser = session.userName.toLowerCase().includes(query);
        return matchesWork || matchesNotes || matchesUser;
      }

      return true;
    });
  }, [sessions, filterUserOnly, currentUser.id, filterCategory, searchTerm]);

  // Format timestamp to date & time strings
  const formatDateTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs > 0 ? `${secs}s` : ''}`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const exportCSV = () => {
    const headers = ['Session ID', 'User', 'What Are You Working On', 'Category', 'Duration (seconds)', 'Date', 'Type'];
    const rows = filteredSessions.map(s => [
      s.id,
      `"${s.userName}"`,
      `"${s.workingOn.replace(/"/g, '""')}"`,
      s.category,
      s.durationSeconds,
      new Date(s.startTime).toISOString(),
      s.isPomodoro ? 'Pomodoro' : 'Stopwatch'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `study_timesheet_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="timesheet-page">
      <div className="timesheet-header">
        <div>
          <h1 className="timesheet-title">Study Log & Timesheet</h1>
          <p className="timesheet-subtitle">
            Inspect past study records, durations, and task accomplishments. Clean records without unneeded reflection prompts.
          </p>
        </div>
        <button className="export-btn" onClick={exportCSV}>
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="timesheet-controls-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by task title, topic, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select 
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button 
            type="button" 
            className={`filter-user-toggle ${filterUserOnly ? 'active' : ''}`}
            onClick={() => setFilterUserOnly(!filterUserOnly)}
          >
            <span>{filterUserOnly ? `Only ${currentUser.name}` : 'All Users'}</span>
          </button>
        </div>
      </div>

      {/* Timesheet List / Table */}
      <div className="timesheet-table-card">
        {filteredSessions.length === 0 ? (
          <div className="empty-timesheet">
            <BookOpen size={40} className="empty-icon" />
            <h3>No matching study sessions found</h3>
            <p>Start a timer on the tracker tab to log your focus sessions.</p>
          </div>
        ) : (
          <div className="timesheet-list">
            <div className="table-header-row">
              <span className="col-task">What You Worked On</span>
              <span className="col-cat">Category</span>
              <span className="col-mode">Mode</span>
              <span className="col-time">Time & Date</span>
              <span className="col-dur">Duration</span>
              <span className="col-action">Action</span>
            </div>

            {filteredSessions.map(session => {
              const { date, time } = formatDateTime(session.startTime);
              return (
                <div key={session.id} className="session-item-row">
                  <div className="col-task cell-task">
                    <span className="task-title-text">{session.workingOn}</span>
                    {session.notes && <span className="task-notes-sub">{session.notes}</span>}
                    <span className="task-user-tag">by {session.userName}</span>
                  </div>

                  <div className="col-cat">
                    <span className={`cat-tag cat-${session.category.toLowerCase().replace(/\s+/g, '-')}`}>
                      {session.category}
                    </span>
                  </div>

                  <div className="col-mode">
                    {session.isPomodoro ? (
                      <span className="mode-pill pomodoro">
                        <Sparkles size={12} /> Pomodoro
                      </span>
                    ) : (
                      <span className="mode-pill stopwatch">
                        <Clock size={12} /> Stopwatch
                      </span>
                    )}
                  </div>

                  <div className="col-time cell-datetime">
                    <span className="time-primary font-mono">{time}</span>
                    <span className="date-secondary">{date}</span>
                  </div>

                  <div className="col-dur cell-duration">
                    <span className="dur-badge font-mono">{formatDuration(session.durationSeconds)}</span>
                  </div>

                  <div className="col-action">
                    <button 
                      className="delete-sess-btn"
                      onClick={() => onDeleteSession(session.id)}
                      title="Delete record"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
