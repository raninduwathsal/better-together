import React, { useState } from 'react';
import type { UserProfile, TimeSession } from '../types';
import { 
  X, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Tag, 
  FileText,
  PlayCircle
} from 'lucide-react';
import { playSound } from '../audio';
import './ManualTimeModal.css';

interface ManualTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  categories: string[];
  onAddSession: (session: TimeSession) => void;
}

export const ManualTimeModal: React.FC<ManualTimeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  categories,
  onAddSession,
}) => {
  // Form state
  const [workingOn, setWorkingOn] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Study');
  const [notes, setNotes] = useState('');
  
  // Date default to today
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [sessionDate, setSessionDate] = useState<string>(todayDateStr);

  // Time logging mode: 'duration' (hours + mins) OR 'timeRange' (exact Start Time -> End Time)
  const [entryMode, setEntryMode] = useState<'duration' | 'timeRange'>('timeRange');

  // Duration mode state
  const [hours, setHours] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(0);

  // Start Time & End Time mode state (e.g. 09:00 to 11:30)
  const defaultStart = '09:00';
  const defaultEnd = '10:30';
  const [startTimeStr, setStartTimeStr] = useState<string>(defaultStart);
  const [endTimeStr, setEndTimeStr] = useState<string>(defaultEnd);

  if (!isOpen) return null;

  // Calculate live preview duration for time range
  const calculateRangeDuration = (): { seconds: number; display: string } => {
    if (entryMode === 'duration') {
      const secs = (hours * 3600) + (minutes * 60);
      return { seconds: secs, display: `${hours}h ${minutes}m` };
    }

    const [sh, sm] = startTimeStr.split(':').map(Number);
    const [eh, em] = endTimeStr.split(':').map(Number);
    const startMins = (sh * 60) + sm;
    let endMins = (eh * 60) + em;

    if (endMins < startMins) {
      endMins += 24 * 60; // Next day wrap
    }

    const diffMins = Math.max(0, endMins - startMins);
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return { seconds: diffMins * 60, display: `${h}h ${m}m` };
  };

  const currentDurationInfo = calculateRangeDuration();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentDurationInfo.seconds <= 0) return;

    let startTimestamp: number;
    let endTimestamp: number;

    if (entryMode === 'timeRange') {
      const [sh, sm] = startTimeStr.split(':').map(Number);
      const [eh, em] = endTimeStr.split(':').map(Number);

      const startDate = new Date(sessionDate);
      startDate.setHours(sh, sm, 0, 0);
      startTimestamp = startDate.getTime();

      const endDate = new Date(sessionDate);
      endDate.setHours(eh, em, 0, 0);
      if (endDate.getTime() < startTimestamp) {
        endDate.setDate(endDate.getDate() + 1);
      }
      endTimestamp = endDate.getTime();
    } else {
      const dateObj = new Date(sessionDate);
      const now = new Date();
      dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      endTimestamp = dateObj.getTime();
      startTimestamp = endTimestamp - (currentDurationInfo.seconds * 1000);
    }

    const manualSession: TimeSession = {
      id: 'sess_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      workingOn: workingOn.trim() || 'Manual Study Session',
      category,
      startTime: startTimestamp,
      endTime: endTimestamp,
      durationSeconds: currentDurationInfo.seconds,
      isPomodoro: false,
      notes: notes.trim() || undefined,
    };

    onAddSession(manualSession);
    playSound('complete');

    // Reset & close
    setWorkingOn('');
    setNotes('');
    onClose();
  };

  return (
    <div className="manual-modal-overlay" onClick={onClose}>
      <div className="manual-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="manual-close-btn" onClick={onClose} title="Close">
          <X size={18} />
        </button>

        <div className="manual-header">
          <div className="manual-icon-box">
            <Clock size={20} className="text-purple" />
          </div>
          <div>
            <h3 className="manual-title">Log Missed Study Time</h3>
            <p className="manual-subtitle">
              Record exact start & end times or total duration for hour-by-hour drilldown.
            </p>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div className="entry-mode-toggle-bar">
          <button
            type="button"
            className={`entry-mode-pill ${entryMode === 'timeRange' ? 'active' : ''}`}
            onClick={() => setEntryMode('timeRange')}
          >
            <PlayCircle size={14} />
            <span>Exact Start & End Time (Recommended)</span>
          </button>
          <button
            type="button"
            className={`entry-mode-pill ${entryMode === 'duration' ? 'active' : ''}`}
            onClick={() => setEntryMode('duration')}
          >
            <Clock size={14} />
            <span>Total Duration</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="manual-form">
          {/* What was worked on */}
          <div className="manual-form-group">
            <label className="manual-label">
              <span>What did you work on?</span>
            </label>
            <input
              type="text"
              className="manual-input"
              placeholder="e.g. Organic Chemistry Lecture, LeetCode Dynamic Programming..."
              value={workingOn}
              onChange={(e) => setWorkingOn(e.target.value)}
              required
            />
          </div>

          {/* Mode 1: Exact Start Time & End Time */}
          {entryMode === 'timeRange' ? (
            <div className="manual-time-range-group">
              <div className="manual-row-2col">
                <div className="manual-form-group">
                  <label className="manual-label">
                    <Clock size={13} className="text-purple" />
                    <span>Log Start Time</span>
                  </label>
                  <input
                    type="time"
                    className="manual-input time-picker font-mono"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    required
                  />
                </div>

                <div className="manual-form-group">
                  <label className="manual-label">
                    <Clock size={13} className="text-purple" />
                    <span>Log End Time</span>
                  </label>
                  <input
                    type="time"
                    className="manual-input time-picker font-mono"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="range-preview-banner">
                <span>Calculated Span: <strong>{currentDurationInfo.display}</strong></span>
              </div>
            </div>
          ) : (
            /* Mode 2: Duration in Hours & Minutes */
            <div className="manual-duration-row">
              <div className="manual-form-group">
                <label className="manual-label">Hours</label>
                <div className="manual-number-wrapper">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    className="manual-num-input font-mono"
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <span className="manual-num-unit">hrs</span>
                </div>
              </div>

              <div className="manual-form-group">
                <label className="manual-label">Minutes</label>
                <div className="manual-number-wrapper">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className="manual-num-input font-mono"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  />
                  <span className="manual-num-unit">mins</span>
                </div>
              </div>
            </div>
          )}

          {/* Category & Date Row */}
          <div className="manual-row-2col">
            <div className="manual-form-group">
              <label className="manual-label">
                <Tag size={13} className="text-purple" />
                <span>Category</span>
              </label>
              <select
                className="manual-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="manual-form-group">
              <label className="manual-label">
                <Calendar size={13} className="text-purple" />
                <span>Date Logged</span>
              </label>
              <input
                type="date"
                className="manual-input date-input"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                max={todayDateStr}
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div className="manual-form-group">
            <label className="manual-label">
              <FileText size={13} className="text-muted" />
              <span>Notes (Optional)</span>
            </label>
            <input
              type="text"
              className="manual-input"
              placeholder="Key notes, pages covered, topics reviewed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button type="submit" className="manual-submit-btn">
            <CheckCircle2 size={18} />
            <span>Save Study Time ({currentDurationInfo.display})</span>
          </button>
        </form>
      </div>
    </div>
  );
};
