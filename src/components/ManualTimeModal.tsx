import React, { useState } from 'react';
import type { UserProfile, TimeSession } from '../types';
import { 
  X, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Tag, 
  FileText 
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
  const [hours, setHours] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(0);
  const [notes, setNotes] = useState('');
  
  // Date and time defaults to now
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [sessionDate, setSessionDate] = useState<string>(todayDateStr);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSeconds = (hours * 3600) + (minutes * 60);
    if (totalSeconds <= 0) return;

    // Calculate start and end timestamp based on selected date
    const dateObj = new Date(sessionDate);
    const now = new Date();
    dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    const endTime = dateObj.getTime();
    const startTime = endTime - (totalSeconds * 1000);

    const manualSession: TimeSession = {
      id: 'sess_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      workingOn: workingOn.trim() || 'Manual Study Session',
      category,
      startTime,
      endTime,
      durationSeconds: totalSeconds,
      isPomodoro: false,
      notes: notes.trim() || undefined,
    };

    onAddSession(manualSession);
    playSound('complete');

    // Reset & close
    setWorkingOn('');
    setHours(1);
    setMinutes(0);
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
              Add hours and minutes you worked when the timer wasn't running.
            </p>
          </div>
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
              placeholder="e.g. Offline Reading, Organic Chemistry Lab, Math Problem Set..."
              value={workingOn}
              onChange={(e) => setWorkingOn(e.target.value)}
              required
            />
          </div>

          {/* Duration Row: Hours & Minutes */}
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
            <span>Save Missed Time ({hours}h {minutes}m)</span>
          </button>
        </form>
      </div>
    </div>
  );
};
