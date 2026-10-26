export interface UserProfile {
  id: string;
  name: string;
  avatarColor: string;
  role?: string;
  createdAt: number;
}

export interface CategoryDefinition {
  name: string;
  color: string;
  isProductive: boolean;
}

export type SessionCategory = string;

export interface TodoItem {
  id: string;
  userId: string;
  title: string;
  category: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface TimeSession {
  id: string;
  userId: string;
  userName: string;
  workingOn: string;
  category: string;
  startTime: number;
  endTime: number;
  durationSeconds: number; // actual worked time in seconds
  isPomodoro: boolean;
  pomodoroCyclesCompleted?: number;
  notes?: string;
  todoId?: string;
}

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  soundEnabled: boolean;
  autoStartBreaks: boolean;
}

export interface ActiveTimerState {
  userId: string;
  userName: string;
  workingOn: string;
  category: string;
  startedAt: number; // epoch ms when current run started
  accumulatedSeconds: number; // seconds prior to current run
  isRunning: boolean;
  isPomodoro: boolean;
  updatedAt: number;
}

export type TabType = 'timer' | 'analysis' | 'timesheet' | 'settings';
