import React, { useState, useEffect, useRef } from 'react';
import type { 
  UserProfile, 
  SessionCategory, 
  TimeSession, 
  PomodoroSettings,
  TodoItem
} from '../types';
import { storage } from '../storage';
import { playSound } from '../audio';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Coffee, 
  BookOpen, 
  ListTodo,
  Check,
  X,
  HelpCircle,
  Timer as TimerIcon,
  Zap,
  Clock
} from 'lucide-react';
import './TimerTracker.css';

interface TimerTrackerProps {
  currentUser: UserProfile;
  pomodoroSettings: PomodoroSettings;
  onSessionComplete: (session: TimeSession) => void;
  activeSeconds: number;
  setActiveSeconds: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  workingOn: string;
  setWorkingOn: React.Dispatch<React.SetStateAction<string>>;
  category: SessionCategory;
  setCategory: React.Dispatch<React.SetStateAction<SessionCategory>>;
  isPomodoroEnabled: boolean;
  setIsPomodoroEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  categories: string[];
  todos: TodoItem[];
  onCompleteTodo: (todoId: string, taskTitle: string) => void;
  onOpenManualModal: () => void;
  pomodoroMode: PomodoroMode;
  setPomodoroMode: React.Dispatch<React.SetStateAction<PomodoroMode>>;
  activePreset: PomodoroPreset;
  setActivePreset: React.Dispatch<React.SetStateAction<PomodoroPreset>>;
  pomodoroCycleCount: number;
  setPomodoroCycleCount: React.Dispatch<React.SetStateAction<number>>;
}

export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';
export type PomodoroPreset = 'standard' | 'longFocus'; // 25/5 or 50/10

export const TimerTracker: React.FC<TimerTrackerProps> = ({
  currentUser,
  pomodoroSettings,
  onSessionComplete,
  activeSeconds,
  setActiveSeconds,
  isRunning,
  setIsRunning,
  workingOn,
  setWorkingOn,
  category,
  setCategory,
  isPomodoroEnabled,
  setIsPomodoroEnabled,
  categories,
  todos,
  onCompleteTodo,
  onOpenManualModal,
  pomodoroMode,
  setPomodoroMode,
  activePreset,
  setActivePreset,
  pomodoroCycleCount,
  setPomodoroCycleCount,
}) => {
  // Current effective minutes based on preset
  const currentWorkMinutes = activePreset === 'longFocus' ? 50 : pomodoroSettings.workMinutes;
  const currentBreakMinutes = activePreset === 'longFocus' ? 10 : pomodoroSettings.shortBreakMinutes;

  const targetDurationSeconds = pomodoroMode === 'work' 
    ? currentWorkMinutes * 60 
    : pomodoroMode === 'shortBreak' 
      ? currentBreakMinutes * 60 
      : pomodoroSettings.longBreakMinutes * 60;

  const [sessionNotes, setSessionNotes] = useState<string>('');

  // Break prompt modal state: Triggered automatically when focus session reaches 0
  const [showBreakPrompt, setShowBreakPrompt] = useState<boolean>(false);
  const [completedCycleNumber, setCompletedCycleNumber] = useState<number>(1);

  // Dropdown state for task autocomplete
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);

  // Dialog prompt state when stopping timer: "Mark to do list task as done?"
  const [showMarkDoneDialog, setShowMarkDoneDialog] = useState<boolean>(false);
  const [pendingSavedSession, setPendingSavedSession] = useState<TimeSession | null>(null);

  const sessionStartTimeRef = useRef<number>(Date.now() - (activeSeconds * 1000));
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Keep sessionStartTimeRef in sync whenever activeSeconds changes while running or paused
  useEffect(() => {
    if (isRunning) {
      sessionStartTimeRef.current = Date.now() - (activeSeconds * 1000);
    }
  }, [isRunning]);

  // Pending tasks for current user
  const userPendingTodos = todos.filter(t => t.userId === currentUser.id && !t.completed);

  // Filter recommendations matching user typing
  const matchedTodos = userPendingTodos.filter(t => 
    t.title.toLowerCase().includes(workingOn.toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Dynamic countdown calculation: Directly computed from targetDurationSeconds and activeSeconds!
  // This guarantees that refreshing the page or connecting from another device/browser will show the exact centralized remaining time!
  const pomodoroTimeRemaining = Math.max(0, targetDurationSeconds - activeSeconds);

  // Main Timer Interval with wall-clock drift correction
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const syncElapsedTime = () => {
      if (!isRunning) return;
      const trueElapsed = Math.max(0, Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
      setActiveSeconds(trueElapsed);

      if (isPomodoroEnabled) {
        if (trueElapsed >= targetDurationSeconds) {
          handlePomodoroIntervalComplete();
        }
      }
    };

    if (isRunning) {
      syncElapsedTime();

      interval = setInterval(() => {
        syncElapsedTime();
      }, 1000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          syncElapsedTime();
        }
      };
      window.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', syncElapsedTime);

      return () => {
        if (interval) clearInterval(interval);
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', syncElapsedTime);
      };
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPomodoroEnabled, targetDurationSeconds]);

  // AUTOMATIC STOP AND PROMPT BREAK WHEN FOCUS REACHES 0
  const handlePomodoroIntervalComplete = () => {
    if (pomodoroMode === 'work') {
      const nextCycle = pomodoroCycleCount + 1;
      setPomodoroCycleCount(nextCycle);
      setCompletedCycleNumber(nextCycle);

      // Play completion chime & throw celebratory confetti
      playSound('complete');
      confetti({
        particleCount: 85,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#7C3AED', '#9333EA', '#C084FC', '#F59E0B']
      });

      // Automatically STOP timer and prompt user to take their well-deserved break!
      setIsRunning(false);
      setActiveSeconds(0);
      setShowBreakPrompt(true);

      const isLongBreak = nextCycle % pomodoroSettings.cyclesBeforeLongBreak === 0;
      if (isLongBreak) {
        setPomodoroMode('longBreak');
      } else {
        setPomodoroMode('shortBreak');
      }
    } else {
      // Break interval finished -> prompt back to focus
      playSound('start');
      setPomodoroMode('work');
      setActiveSeconds(0);
      setIsRunning(false);
    }
  };

  // Keep active timer state persisted to localStorage and sync to Supabase live
  useEffect(() => {
    if (isRunning) {
      storage.saveActiveTimer({
        isRunning: true,
        startedAt: sessionStartTimeRef.current,
        accumulatedSeconds: activeSeconds,
        workingOn,
        category,
        isPomodoroEnabled,
        selectedTodoId,
        pomodoroMode,
        pomodoroPreset: activePreset,
        pomodoroTargetSeconds: targetDurationSeconds,
        pomodoroCycleCount,
      }, currentUser.id);

      storage.syncActiveTimerToCloud({
        userId: currentUser.id,
        userName: currentUser.name,
        workingOn,
        category,
        startedAt: sessionStartTimeRef.current,
        accumulatedSeconds: activeSeconds,
        isRunning: true,
        isPomodoro: isPomodoroEnabled,
        pomodoroMode,
        pomodoroPreset: activePreset,
        pomodoroTargetSeconds: targetDurationSeconds,
        pomodoroCycleCount,
        updatedAt: Date.now()
      });
    } else if (activeSeconds > 0) {
      storage.saveActiveTimer({
        isRunning: false,
        startedAt: null,
        accumulatedSeconds: activeSeconds,
        workingOn,
        category,
        isPomodoroEnabled,
        selectedTodoId,
        pomodoroMode,
        pomodoroPreset: activePreset,
        pomodoroTargetSeconds: targetDurationSeconds,
        pomodoroCycleCount,
      }, currentUser.id);

      storage.syncActiveTimerToCloud({
        userId: currentUser.id,
        userName: currentUser.name,
        workingOn,
        category,
        startedAt: Date.now(),
        accumulatedSeconds: activeSeconds,
        isRunning: false,
        isPomodoro: isPomodoroEnabled,
        pomodoroMode,
        pomodoroPreset: activePreset,
        pomodoroTargetSeconds: targetDurationSeconds,
        pomodoroCycleCount,
        updatedAt: Date.now()
      });
    }
  }, [isRunning, activeSeconds, workingOn, category, isPomodoroEnabled, selectedTodoId, currentUser, pomodoroMode, activePreset, targetDurationSeconds, pomodoroCycleCount]);

  const handleStartBreakNow = () => {
    setShowBreakPrompt(false);
    playSound('start');
    setActiveSeconds(0);
    sessionStartTimeRef.current = Date.now();
    setIsRunning(true);
  };

  const handleSkipBreak = () => {
    setShowBreakPrompt(false);
    setPomodoroMode('work');
    setActiveSeconds(0);
    setIsRunning(false);
  };

  const handleStart = () => {
    // If starting fresh or resuming
    sessionStartTimeRef.current = Date.now() - (activeSeconds * 1000);
    setIsDropdownOpen(false);
    playSound('start');
    setIsRunning(true);
    storage.saveActiveTimer({
      isRunning: true,
      startedAt: sessionStartTimeRef.current,
      accumulatedSeconds: activeSeconds,
      workingOn,
      category,
      isPomodoroEnabled,
      selectedTodoId,
      pomodoroMode,
      pomodoroPreset: activePreset,
      pomodoroTargetSeconds: targetDurationSeconds,
      pomodoroCycleCount,
    }, currentUser.id);
  };

  const handlePause = () => {
    playSound('pause');
    setIsRunning(false);
    storage.saveActiveTimer({
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: activeSeconds,
      workingOn,
      category,
      isPomodoroEnabled,
      selectedTodoId,
      pomodoroMode,
      pomodoroPreset: activePreset,
      pomodoroTargetSeconds: targetDurationSeconds,
      pomodoroCycleCount,
    }, currentUser.id);
  };

  const handleReset = () => {
    setIsRunning(false);
    setActiveSeconds(0);
    setSelectedTodoId(null);
    setShowBreakPrompt(false);
    storage.clearActiveTimer(currentUser.id);
    storage.clearActiveTimerFromCloud(currentUser.id);
    if (isPomodoroEnabled) {
      setPomodoroMode('work');
    }
  };

  const handleStopClick = () => {
    const now = Date.now();
    const wallClockSeconds = sessionStartTimeRef.current > 0 
      ? Math.max(0, Math.floor((now - sessionStartTimeRef.current) / 1000))
      : activeSeconds;
    const finalDuration = Math.max(activeSeconds, wallClockSeconds);

    if (finalDuration < 5) {
      handleReset();
      return;
    }

    const matchingTodo = selectedTodoId 
      ? todos.find(t => t.id === selectedTodoId && !t.completed)
      : userPendingTodos.find(t => t.title.trim().toLowerCase() === workingOn.trim().toLowerCase());

    const sessionToSave: TimeSession = {
      id: 'sess_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      workingOn: workingOn.trim() || 'Untitled Session',
      category: category,
      startTime: sessionStartTimeRef.current,
      endTime: now,
      durationSeconds: finalDuration,
      isPomodoro: isPomodoroEnabled,
      pomodoroCyclesCompleted: pomodoroCycleCount,
      notes: sessionNotes.trim() || undefined,
      todoId: matchingTodo?.id,
    };

    if (matchingTodo) {
      setIsRunning(false);
      setPendingSavedSession(sessionToSave);
      setShowMarkDoneDialog(true);
    } else {
      finishAndCommitSession(sessionToSave, false);
    }
  };

  const finishAndCommitSession = (session: TimeSession, markDone: boolean) => {
    playSound('complete');
    onSessionComplete(session);

    if (markDone && session.todoId) {
      onCompleteTodo(session.todoId, session.workingOn);
    }

    storage.clearActiveTimer(currentUser.id);
    storage.clearActiveTimerFromCloud(currentUser.id);
    setShowMarkDoneDialog(false);
    setPendingSavedSession(null);
    setShowBreakPrompt(false);
    setIsRunning(false);
    setActiveSeconds(0);
    setWorkingOn('');
    setSessionNotes('');
    setSelectedTodoId(null);
    setPomodoroCycleCount(0);
    if (isPomodoroEnabled) {
      setPomodoroMode('work');
    }
  };

  const selectSuggestedTodo = (todo: TodoItem) => {
    setWorkingOn(todo.title);
    setSelectedTodoId(todo.id);
    if (categories.includes(todo.category)) {
      setCategory(todo.category);
    }
    setIsDropdownOpen(false);
  };

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const setManualPomodoroMode = (mode: PomodoroMode) => {
    setPomodoroMode(mode);
    setActiveSeconds(0);
    setIsRunning(false);
  };

  const displayedSeconds = isPomodoroEnabled ? pomodoroTimeRemaining : activeSeconds;

  return (
    <div className="tracker-wrapper">
      <div className={`tracker-card ${isRunning ? 'active-timer-glow' : ''}`}>
        
        {/* Top Controls: Mode & Toggle */}
        <div className="tracker-top-bar">
          <div className="pomodoro-toggle-container">
            <span className="toggle-label">
              <Sparkles size={16} className="text-purple" />
              <span>Pomodoro Mode</span>
            </span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isPomodoroEnabled} 
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsPomodoroEnabled(val);
                  setIsRunning(false);
                  if (val) {
                    setPomodoroMode('work');
                    setActiveSeconds(0);
                  }
                }}
                id="pomodoro-toggle-checkbox"
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* Preset Selector: Standard 25/5 vs Long Focus 50/10 */}
          {isPomodoroEnabled && (
            <div className="preset-selector-row">
              <button
                type="button"
                className={`preset-pill ${activePreset === 'standard' ? 'active' : ''}`}
                onClick={() => {
                  setActivePreset('standard');
                  setPomodoroMode('work');
                  setActiveSeconds(0);
                  setIsRunning(false);
                }}
              >
                <TimerIcon size={13} />
                <span>Standard (25m / 5m)</span>
              </button>

              <button
                type="button"
                className={`preset-pill ${activePreset === 'longFocus' ? 'active' : ''}`}
                onClick={() => {
                  setActivePreset('longFocus');
                  setPomodoroMode('work');
                  setActiveSeconds(0);
                  setIsRunning(false);
                }}
              >
                <Zap size={13} />
                <span>Long Focus (50m / 10m)</span>
              </button>
            </div>
          )}

          {/* Pomodoro Intervals Navigation */}
          {isPomodoroEnabled && (
            <div className="pomodoro-pills">
              <button 
                className={`pomo-pill ${pomodoroMode === 'work' ? 'active' : ''}`}
                onClick={() => setManualPomodoroMode('work')}
              >
                Focus ({currentWorkMinutes}m)
              </button>
              <button 
                className={`pomo-pill ${pomodoroMode === 'shortBreak' ? 'active' : ''}`}
                onClick={() => setManualPomodoroMode('shortBreak')}
              >
                Break ({currentBreakMinutes}m)
              </button>
              <button 
                className={`pomo-pill ${pomodoroMode === 'longBreak' ? 'active' : ''}`}
                onClick={() => setManualPomodoroMode('longBreak')}
              >
                Long Break ({pomodoroSettings.longBreakMinutes}m)
              </button>
            </div>
          )}

          <div className="user-auto-tag">
            <span className="tag-dot" style={{ backgroundColor: currentUser.avatarColor }}></span>
            <span>Logging for <strong>{currentUser.name}</strong></span>
          </div>
        </div>

        {/* Big Digital Timer Display */}
        <div className="timer-display-container">
          <div className="timer-display-inner">
            <div className="timer-state-label">
              {isPomodoroEnabled ? (
                pomodoroMode === 'work' ? (
                  <span className="label-badge work-badge">
                    <Flame size={14} /> {activePreset === 'longFocus' ? 'Deep 50m Focus' : 'Standard 25m Focus'} {pomodoroCycleCount > 0 ? `· Cycle #${pomodoroCycleCount + 1}` : ''}
                  </span>
                ) : (
                  <span className="label-badge break-badge">
                    <Coffee size={14} /> Resting ({currentBreakMinutes}m) · Rejuvenate
                  </span>
                )
              ) : (
                <span className="label-badge default-badge">
                  <BookOpen size={14} /> Open Stopwatch
                </span>
              )}
            </div>

            <h1 className="timer-digits font-mono">
              {formatTime(displayedSeconds)}
            </h1>

            {isPomodoroEnabled && pomodoroMode === 'work' && activeSeconds > 0 && (
              <p className="timer-subtext">
                Session accumulated: <strong>{formatTime(activeSeconds)}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Task Input Section: Auto-suggest Dropdown */}
        <div className="tracker-form-section">
          <div className="input-group" ref={inputContainerRef}>
            <label className="input-label" htmlFor="working-on-input">
              <ListTodo size={16} className="text-purple" />
              <span>What are you working on?</span>
              {userPendingTodos.length > 0 && (
                <span className="todo-hint-badge">
                  {userPendingTodos.length} to-do item{userPendingTodos.length === 1 ? '' : 's'} available
                </span>
              )}
            </label>

            <div className="autocomplete-wrapper">
              <input
                id="working-on-input"
                type="text"
                className="working-input"
                placeholder="Type what you're working on, or pick from your to-do list..."
                value={workingOn}
                onChange={(e) => {
                  setWorkingOn(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
              />

              {isDropdownOpen && matchedTodos.length > 0 && (
                <div className="todo-autocomplete-dropdown">
                  <div className="dropdown-title">Recommended from your To-Do List:</div>
                  {matchedTodos.map((todo) => (
                    <div 
                      key={todo.id} 
                      className="dropdown-item"
                      onClick={() => selectSuggestedTodo(todo)}
                    >
                      <div className="dropdown-item-left">
                        <CheckCircle2 size={14} className="dropdown-item-icon" />
                        <span className="dropdown-item-title">{todo.title}</span>
                      </div>
                      <span className="dropdown-item-cat">{todo.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Selector Pills */}
          <div className="category-group">
            <label className="input-label">Category</label>
            <div className="category-chips">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-chip ${category === cat ? 'selected' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timer Control Action Buttons */}
        <div className="tracker-actions">
          {!isRunning ? (
            <button 
              className="action-btn primary-start-btn" 
              onClick={handleStart}
              id="timer-start-btn"
            >
              <Play size={20} fill="currentColor" />
              <span>{activeSeconds > 0 ? 'Resume Timer' : 'Start Focus'}</span>
            </button>
          ) : (
            <button 
              className="action-btn pause-btn" 
              onClick={handlePause}
              id="timer-pause-btn"
            >
              <Pause size={20} fill="currentColor" />
              <span>Pause</span>
            </button>
          )}

          {activeSeconds > 0 && (
            <>
              <button 
                className="action-btn stop-save-btn" 
                onClick={handleStopClick}
                title="Finish & Save Session"
                id="timer-save-btn"
              >
                <CheckCircle2 size={18} />
                <span>Finish & Save</span>
              </button>

              <button 
                className="action-btn reset-btn" 
                onClick={handleReset}
                title="Discard Timer"
                id="timer-reset-btn"
              >
                <RotateCcw size={16} />
              </button>
            </>
          )}

          {!isRunning && activeSeconds === 0 && (
            <button
              type="button"
              className="action-btn-secondary manual-entry-quick-btn"
              onClick={onOpenManualModal}
              title="Add time manually"
            >
              <Clock size={15} />
              <span>+ Log Missed Time</span>
            </button>
          )}
        </div>

        {/* Collapsible Session Notes */}
        {activeSeconds > 0 && (
          <div className="session-notes-box">
            <input 
              type="text"
              className="notes-input"
              placeholder="Optional session notes: achievements, breakthroughs, pages completed..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* AUTOMATIC BREAK PROMPT MODAL: Prompts to take a break after 25m (or 50m) */}
      {showBreakPrompt && (
        <div className="mark-done-overlay">
          <div className="mark-done-card break-prompt-card">
            <div className="break-prompt-icon">
              <Coffee size={32} className="text-emerald" />
            </div>
            <h3 className="mark-done-title">Focus Time Finished!</h3>
            <p className="mark-done-desc">
              Outstanding work! You completed <strong>{activePreset === 'longFocus' ? '50 minutes' : '25 minutes'}</strong> of deep focus (Cycle #{completedCycleNumber}). Time to step away, stretch, and hydrate.
            </p>

            <div className="mark-done-actions">
              <button 
                className="mark-done-yes-btn start-break-btn"
                onClick={handleStartBreakNow}
              >
                <Coffee size={18} />
                <span>Start {currentBreakMinutes}-Minute Break Now</span>
              </button>

              <button 
                className="mark-done-no-btn"
                onClick={handleSkipBreak}
              >
                <span>Skip Break & Continue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: "Mark to do list task as done or not?" */}
      {showMarkDoneDialog && pendingSavedSession && (
        <div className="mark-done-overlay">
          <div className="mark-done-card">
            <div className="mark-done-icon">
              <HelpCircle size={28} className="text-purple" />
            </div>
            <h3 className="mark-done-title">Session Completed!</h3>
            <p className="mark-done-desc">
              Would you like to mark &ldquo;<strong>{pendingSavedSession.workingOn}</strong>&rdquo; as <strong>Done</strong> on your To-Do list?
            </p>

            <div className="mark-done-actions">
              <button 
                className="mark-done-yes-btn"
                onClick={() => finishAndCommitSession(pendingSavedSession, true)}
              >
                <Check size={18} />
                <span>Yes, Mark as Done</span>
              </button>

              <button 
                className="mark-done-no-btn"
                onClick={() => finishAndCommitSession(pendingSavedSession, false)}
              >
                <X size={16} />
                <span>Keep on List</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
