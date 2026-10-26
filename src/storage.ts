import type { UserProfile, TimeSession, PomodoroSettings, TodoItem, ActiveTimerState, CategoryDefinition } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const USERS_KEY = 'better_together_users_v3';
const ACTIVE_USER_ID_KEY = 'better_together_active_user_id_v3';
const SESSIONS_KEY = 'better_together_sessions_v3';
const POMODORO_SETTINGS_KEY = 'better_together_pomodoro_settings_v3';
const CATEGORIES_KEY = 'better_together_categories_v3';
const CATEGORY_DEFS_KEY = 'better_together_category_defs_v1';
const TODOS_KEY = 'better_together_todos_v3';

export const DEFAULT_CATEGORY_DEFS: CategoryDefinition[] = [
  { name: 'Study', color: '#10B981', isProductive: true },
  { name: 'Work', color: '#3B82F6', isProductive: true },
  { name: 'Club', color: '#8B5CF6', isProductive: true },
  { name: 'Sleep', color: '#6366F1', isProductive: false },
  { name: 'Entertainment', color: '#EF4444', isProductive: false },
];

export const DEFAULT_CATEGORIES: string[] = DEFAULT_CATEGORY_DEFS.map(c => c.name);

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user_savithmi',
    name: 'Savithmi',
    avatarColor: '#7C3AED',
    role: 'Student & Researcher',
    createdAt: Date.now() - 86400000 * 14,
  },
  {
    id: 'user_ranindu',
    name: 'Ranindu',
    avatarColor: '#9333EA',
    role: 'Software Engineer',
    createdAt: Date.now() - 86400000 * 7,
  }
];

export const DEFAULT_TODOS: TodoItem[] = [];

export const DEFAULT_POMODORO: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
  autoStartBreaks: false,
};

export const getInitialSessions = (): TimeSession[] => {
  return [];
};

export const storage = {
  // ---- To-do List Management ----
  getTodos: (): TodoItem[] => {
    try {
      const data = localStorage.getItem(TODOS_KEY);
      if (!data) {
        localStorage.setItem(TODOS_KEY, JSON.stringify(DEFAULT_TODOS));
        return DEFAULT_TODOS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_TODOS;
    }
  },

  saveTodos: (todos: TodoItem[]) => {
    localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  },

  addTodo: (todo: TodoItem) => {
    const current = storage.getTodos();
    const updated = [todo, ...current];
    storage.saveTodos(updated);
    storage.syncTodoToCloud(todo);
    return updated;
  },

  toggleTodo: (id: string) => {
    const current = storage.getTodos();
    const updated = current.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        const modified = {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined,
        };
        storage.syncTodoToCloud(modified);
        return modified;
      }
      return t;
    });
    storage.saveTodos(updated);
    return updated;
  },

  deleteTodo: (id: string) => {
    const current = storage.getTodos();
    const updated = current.filter(t => t.id !== id);
    storage.saveTodos(updated);
    storage.deleteTodoFromCloud(id);
    return updated;
  },

  // ---- Category Management ----
  getCategoryDefinitions: (): CategoryDefinition[] => {
    try {
      const data = localStorage.getItem(CATEGORY_DEFS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      
      // Fallback or migration from string categories
      const legacyCats = storage.getCategories();
      const migrated: CategoryDefinition[] = legacyCats.map(cat => {
        const matchedDefault = DEFAULT_CATEGORY_DEFS.find(d => d.name.toLowerCase() === cat.toLowerCase());
        if (matchedDefault) return matchedDefault;
        const isProd = !['sleep', 'entertainment', 'gaming', 'break'].includes(cat.toLowerCase());
        return {
          name: cat,
          color: '#7C3AED',
          isProductive: isProd,
        };
      });

      localStorage.setItem(CATEGORY_DEFS_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      return DEFAULT_CATEGORY_DEFS;
    }
  },

  saveCategoryDefinitions: (defs: CategoryDefinition[]) => {
    localStorage.setItem(CATEGORY_DEFS_KEY, JSON.stringify(defs));
    storage.saveCategories(defs.map(d => d.name));
  },

  getCategories: (): string[] => {
    try {
      const defs = localStorage.getItem(CATEGORY_DEFS_KEY);
      if (defs) {
        const parsedDefs = JSON.parse(defs);
        if (Array.isArray(parsedDefs) && parsedDefs.length > 0) {
          return parsedDefs.map((d: CategoryDefinition) => d.name);
        }
      }
      const data = localStorage.getItem(CATEGORIES_KEY);
      if (!data) {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories: (categories: string[]) => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  },

  // ---- User Management ----
  getUsers: (): UserProfile[] => {
    try {
      const data = localStorage.getItem(USERS_KEY);
      if (!data) {
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_USERS;
    }
  },

  saveUsers: (users: UserProfile[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getActiveUserId: (): string => {
    try {
      const id = localStorage.getItem(ACTIVE_USER_ID_KEY);
      if (id) return id;
      const users = storage.getUsers();
      if (users.length > 0) {
        localStorage.setItem(ACTIVE_USER_ID_KEY, users[0].id);
        return users[0].id;
      }
      return 'user_savithmi';
    } catch {
      return 'user_savithmi';
    }
  },

  setActiveUserId: (id: string) => {
    localStorage.setItem(ACTIVE_USER_ID_KEY, id);
  },

  getSessions: (): TimeSession[] => {
    try {
      const data = localStorage.getItem(SESSIONS_KEY);
      if (!data) {
        const initial = getInitialSessions();
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return getInitialSessions();
    }
  },

  saveSessions: (sessions: TimeSession[]) => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  },

  addSession: (session: TimeSession) => {
    const current = storage.getSessions();
    const updated = [session, ...current];
    storage.saveSessions(updated);
    return updated;
  },

  deleteSession: (id: string) => {
    const current = storage.getSessions();
    const updated = current.filter(s => s.id !== id);
    storage.saveSessions(updated);
    return updated;
  },

  getPomodoroSettings: (): PomodoroSettings => {
    try {
      const data = localStorage.getItem(POMODORO_SETTINGS_KEY);
      if (!data) return DEFAULT_POMODORO;
      return JSON.parse(data);
    } catch {
      return DEFAULT_POMODORO;
    }
  },

  savePomodoroSettings: (settings: PomodoroSettings) => {
    localStorage.setItem(POMODORO_SETTINGS_KEY, JSON.stringify(settings));
  },

  // ---- ACTIVE TIMER PERSISTENCE (Per-User, Survives Refresh, Tab Close, Reconnect & User Switch) ----
  getActiveTimer: (userId?: string): {
    isRunning: boolean;
    startedAt: number | null; // epoch ms when current run started
    accumulatedSeconds: number; // seconds before current run
    workingOn: string;
    category: string;
    isPomodoroEnabled: boolean;
    selectedTodoId?: string | null;
    pomodoroMode?: 'work' | 'shortBreak' | 'longBreak';
    pomodoroPreset?: 'standard' | 'longFocus';
    pomodoroTargetSeconds?: number;
    pomodoroCycleCount?: number;
  } | null => {
    try {
      const key = userId 
        ? `better_together_active_timer_user_${userId}` 
        : 'better_together_active_timer_v1';
      const data = localStorage.getItem(key) || (userId ? localStorage.getItem('better_together_active_timer_v1') : null);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  saveActiveTimer: (
    state: {
      isRunning: boolean;
      startedAt: number | null;
      accumulatedSeconds: number;
      workingOn: string;
      category: string;
      isPomodoroEnabled: boolean;
      selectedTodoId?: string | null;
      pomodoroMode?: 'work' | 'shortBreak' | 'longBreak';
      pomodoroPreset?: 'standard' | 'longFocus';
      pomodoroTargetSeconds?: number;
      pomodoroCycleCount?: number;
    },
    userId?: string
  ) => {
    const key = userId 
      ? `better_together_active_timer_user_${userId}` 
      : 'better_together_active_timer_v1';
    localStorage.setItem(key, JSON.stringify(state));
  },

  clearActiveTimer: (userId?: string) => {
    if (userId) {
      localStorage.removeItem(`better_together_active_timer_user_${userId}`);
    }
    localStorage.removeItem('better_together_active_timer_v1');
  },

  // ---- SUPABASE CLOUD SYNC HELPERS ----
  async fetchCloudTodos(): Promise<TodoItem[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('todos').select('*');
      if (error || !data) return null;
      return data.map(t => ({
        id: t.id,
        userId: t.user_id,
        title: t.title,
        category: t.category,
        completed: Boolean(t.completed),
        createdAt: Number(t.created_at) || Date.now(),
        completedAt: t.completed_at ? Number(t.completed_at) : undefined,
      }));
    } catch (e) {
      console.warn('Could not fetch cloud todos:', e);
      return null;
    }
  },

  async syncTodoToCloud(todo: TodoItem) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('todos').upsert({
        id: todo.id,
        user_id: todo.userId,
        title: todo.title,
        category: todo.category,
        completed: todo.completed,
        created_at: todo.createdAt,
        completed_at: todo.completedAt || null,
      });
    } catch (e) {
      console.warn('Cloud sync error for todo:', e);
    }
  },

  async deleteTodoFromCloud(id: string) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('todos').delete().eq('id', id);
    } catch (e) {
      console.warn('Cloud delete error for todo:', e);
    }
  },

  async fetchCloudProfiles(): Promise<UserProfile[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error || !data || data.length === 0) return null;
      return data.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        avatarColor: p.avatar_color,
        createdAt: Number(p.created_at) || Date.now()
      }));
    } catch (e) {
      console.warn('Could not fetch cloud profiles:', e);
      return null;
    }
  },

  async syncProfileToCloud(user: UserProfile) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        name: user.name,
        role: user.role,
        avatar_color: user.avatarColor,
        created_at: user.createdAt
      });
    } catch (e) {
      console.warn('Cloud sync error for profile:', e);
    }
  },

  async deleteProfileFromCloud(id: string) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('profiles').delete().eq('id', id);
    } catch (e) {
      console.warn('Cloud delete error for profile:', e);
    }
  },

  async fetchCloudSessions(): Promise<TimeSession[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('start_time', { ascending: false });

      if (error || !data) return null;
      return data.map(s => ({
        id: s.id,
        userId: s.user_id,
        userName: s.user_name,
        workingOn: s.working_on,
        category: s.category,
        startTime: Number(s.start_time),
        endTime: Number(s.end_time),
        durationSeconds: Number(s.duration_seconds),
        isPomodoro: Boolean(s.is_pomodoro),
        pomodoroCyclesCompleted: Number(s.pomodoro_cycles_completed) || 0,
        notes: s.notes || undefined,
        todoId: s.todo_id || undefined,
      }));
    } catch (e) {
      console.warn('Could not fetch cloud sessions:', e);
      return null;
    }
  },

  async syncSessionToCloud(session: TimeSession) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('sessions').insert({
        id: session.id,
        user_id: session.userId,
        user_name: session.userName,
        working_on: session.workingOn,
        category: session.category,
        start_time: session.startTime,
        end_time: session.endTime,
        duration_seconds: session.durationSeconds,
        is_pomodoro: session.isPomodoro,
        pomodoro_cycles_completed: session.pomodoroCyclesCompleted || 0,
        notes: session.notes || null,
        todo_id: session.todoId || null,
      });
    } catch (e) {
      console.warn('Cloud sync error for session:', e);
    }
  },

  async deleteSessionFromCloud(id: string) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('sessions').delete().eq('id', id);
    } catch (e) {
      console.warn('Cloud delete error for session:', e);
    }
  },

  // ---- LIVE ACTIVE TRACKING BROADCAST ----
  async syncActiveTimerToCloud(activeState: ActiveTimerState) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('active_timers').upsert({
        user_id: activeState.userId,
        user_name: activeState.userName,
        working_on: activeState.workingOn,
        category: activeState.category,
        started_at: activeState.startedAt,
        accumulated_seconds: activeState.accumulatedSeconds,
        is_running: activeState.isRunning,
        is_pomodoro: activeState.isPomodoro,
        pomodoro_mode: activeState.pomodoroMode || 'work',
        pomodoro_preset: activeState.pomodoroPreset || 'standard',
        pomodoro_target_seconds: activeState.pomodoroTargetSeconds ?? 1500,
        pomodoro_cycle_count: activeState.pomodoroCycleCount ?? 0,
        updated_at: Date.now()
      });
    } catch (e) {
      console.warn('Cloud active_timers sync error:', e);
    }
  },

  async clearActiveTimerFromCloud(userId: string) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('active_timers').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Cloud active_timers clear error:', e);
    }
  },

  async fetchCloudActiveTimers(): Promise<ActiveTimerState[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('active_timers').select('*');
      if (error || !data) return null;
      return data.map(d => ({
        userId: d.user_id,
        userName: d.user_name,
        workingOn: d.working_on || '',
        category: d.category || 'Study',
        startedAt: Number(d.started_at) || Date.now(),
        accumulatedSeconds: Number(d.accumulated_seconds) || 0,
        isRunning: Boolean(d.is_running),
        isPomodoro: Boolean(d.is_pomodoro),
        pomodoroMode: d.pomodoro_mode as 'work' | 'shortBreak' | 'longBreak' | undefined,
        pomodoroPreset: d.pomodoro_preset as 'standard' | 'longFocus' | undefined,
        pomodoroTargetSeconds: d.pomodoro_target_seconds != null ? Number(d.pomodoro_target_seconds) : undefined,
        pomodoroCycleCount: d.pomodoro_cycle_count != null ? Number(d.pomodoro_cycle_count) : undefined,
        updatedAt: Number(d.updated_at) || Date.now()
      }));
    } catch (e) {
      console.warn('Could not fetch active timers:', e);
      return null;
    }
  }
};
