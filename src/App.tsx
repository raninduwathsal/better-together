import { useState, useEffect } from 'react';
import type { 
  UserProfile, 
  TimeSession, 
  PomodoroSettings, 
  TabType, 
  SessionCategory,
  TodoItem,
  ActiveTimerState,
  CategoryDefinition
} from './types';
import { storage } from './storage';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Navbar } from './components/Navbar';
import { HoursKpiCard } from './components/HoursKpiCard';
import { TimerTracker } from './components/TimerTracker';
import { TodoListCard } from './components/TodoListCard';
import { PartnerActiveTrackerCard } from './components/PartnerActiveTrackerCard';
import { ManualTimeModal } from './components/ManualTimeModal';
import { AnalysisPage } from './components/AnalysisPage';
import { TimesheetPage } from './components/TimesheetPage';
import { SettingsPage } from './components/SettingsPage';
import { History, ArrowRight, Cloud, CloudOff } from 'lucide-react';
import './App.css';

export function App() {
  // App state
  const [activeTab, setActiveTab] = useState<TabType>('timer');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>('');
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(storage.getPomodoroSettings());
  const [categories, setCategories] = useState<string[]>(storage.getCategories());
  const [categoryDefs, setCategoryDefs] = useState<CategoryDefinition[]>(storage.getCategoryDefinitions());
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [activeTimers, setActiveTimers] = useState<ActiveTimerState[]>([]);

  // Manual Missed Time Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  // Global Timer State (lifted up so switching tabs does NOT reset active timer!)
  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [workingOn, setWorkingOn] = useState<string>('');
  const [category, setCategory] = useState<SessionCategory>('Study');
  const [isPomodoroEnabled, setIsPomodoroEnabled] = useState<boolean>(false);

  // Initialize from storage & sync with Supabase
  useEffect(() => {
    // 1. Initial immediate local render
    const localUsers = storage.getUsers();
    setUsers(localUsers);

    const savedUserId = storage.getActiveUserId();
    setActiveUserId(savedUserId);

    const localSessions = storage.getSessions();
    setSessions(localSessions);

    const localTodos = storage.getTodos();
    setTodos(localTodos);

    const loadedPomo = storage.getPomodoroSettings();
    setPomodoroSettings(loadedPomo);

    const loadedDefs = storage.getCategoryDefinitions();
    setCategoryDefs(loadedDefs);
    const loadedCats = loadedDefs.map(d => d.name);
    setCategories(loadedCats);
    if (!loadedCats.includes(category)) {
      setCategory(loadedCats[0] || 'Study');
    }

    // 1b. Restore persistent active timer (survives browser refresh, disconnection, navigation)
    const savedTimer = storage.getActiveTimer();
    if (savedTimer) {
      if (savedTimer.workingOn) setWorkingOn(savedTimer.workingOn);
      if (savedTimer.category && loadedCats.includes(savedTimer.category)) {
        setCategory(savedTimer.category);
      }
      setIsPomodoroEnabled(Boolean(savedTimer.isPomodoroEnabled));

      if (savedTimer.isRunning && savedTimer.startedAt) {
        // Calculate seconds elapsed while tab/browser was disconnected or closed!
        const elapsedSinceStart = Math.max(0, Math.floor((Date.now() - savedTimer.startedAt) / 1000));
        const totalRestored = savedTimer.accumulatedSeconds + elapsedSinceStart;
        setActiveSeconds(totalRestored);
        setIsRunning(true);
      } else {
        setActiveSeconds(savedTimer.accumulatedSeconds || 0);
        setIsRunning(false);
      }
    }

    // 2. Fetch from Supabase Cloud if configured
    if (isSupabaseConfigured) {
      storage.fetchCloudProfiles().then(cloudUsers => {
        if (cloudUsers !== null) {
          setIsCloudSynced(true);
          if (cloudUsers.length > 0) {
            setUsers(cloudUsers);
            storage.saveUsers(cloudUsers);
          } else {
            localUsers.forEach(u => storage.syncProfileToCloud(u));
          }
        }
      });

      storage.fetchCloudSessions().then(cloudSessions => {
        if (cloudSessions !== null) {
          setIsCloudSynced(true);
          if (cloudSessions.length > 0) {
            setSessions(cloudSessions);
            storage.saveSessions(cloudSessions);
          } else if (localSessions.length > 0) {
            // Push existing local sessions to Supabase on first run
            localSessions.forEach(s => storage.syncSessionToCloud(s));
          }
        }
      });

      storage.fetchCloudTodos().then(cloudTodos => {
        if (cloudTodos !== null) {
          setIsCloudSynced(true);
          if (cloudTodos.length > 0) {
            setTodos(cloudTodos);
            storage.saveTodos(cloudTodos);
          } else if (localTodos.length > 0) {
            localTodos.forEach(t => storage.syncTodoToCloud(t));
          }
        }
      });

      storage.fetchCloudActiveTimers().then(cloudTimers => {
        if (cloudTimers !== null) {
          setActiveTimers(cloudTimers);
        }
      });

      // 3. Subscribe to Real-Time Cloud Updates
      const channel = supabase
        .channel('better-together-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'active_timers' },
          () => {
            storage.fetchCloudActiveTimers().then(refreshed => {
              if (refreshed) {
                setActiveTimers(refreshed);
              }
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sessions' },
          () => {
            storage.fetchCloudSessions().then(refreshed => {
              if (refreshed) {
                setSessions(refreshed);
                storage.saveSessions(refreshed);
                setIsCloudSynced(true);
              }
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'todos' },
          () => {
            storage.fetchCloudTodos().then(refreshed => {
              if (refreshed) {
                setTodos(refreshed);
                storage.saveTodos(refreshed);
                setIsCloudSynced(true);
              }
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => {
            storage.fetchCloudProfiles().then(refreshed => {
              if (refreshed) {
                setUsers(refreshed);
                storage.saveUsers(refreshed);
              }
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Current active user object
  const currentUser = users.find(u => u.id === activeUserId) || users[0] || {
    id: 'user_savithmi',
    name: 'Savithmi',
    avatarColor: '#7C3AED',
    createdAt: Date.now()
  };

  // User management handlers
  const handleSelectUser = (id: string) => {
    setActiveUserId(id);
    storage.setActiveUserId(id);
  };

  const handleAddUser = (name: string, role?: string, color?: string) => {
    const newUser: UserProfile = {
      id: 'user_' + Date.now(),
      name,
      role: role || 'Member',
      avatarColor: color || '#7C3AED',
      createdAt: Date.now(),
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    storage.saveUsers(updatedUsers);
    storage.syncProfileToCloud(newUser);
    handleSelectUser(newUser.id);
  };

  const handleDeleteUser = (id: string) => {
    if (users.length <= 1) return;
    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    storage.saveUsers(updatedUsers);
    storage.deleteProfileFromCloud(id);
    if (activeUserId === id) {
      handleSelectUser(updatedUsers[0].id);
    }
  };

  // Category management handlers
  const handleAddCategory = (categoryName: string, color?: string, isProductive?: boolean) => {
    const trimmed = categoryName.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const newDef: CategoryDefinition = {
      name: trimmed,
      color: color || '#10B981',
      isProductive: isProductive !== undefined ? isProductive : true
    };
    const updatedDefs = [...categoryDefs, newDef];
    setCategoryDefs(updatedDefs);
    setCategories(updatedDefs.map(d => d.name));
    storage.saveCategoryDefinitions(updatedDefs);
  };

  const handleDeleteCategory = (categoryName: string) => {
    if (categories.length <= 1) return;
    const updatedDefs = categoryDefs.filter(c => c.name !== categoryName);
    setCategoryDefs(updatedDefs);
    const updatedCats = updatedDefs.map(d => d.name);
    setCategories(updatedCats);
    storage.saveCategoryDefinitions(updatedDefs);
    if (category === categoryName) {
      setCategory(updatedCats[0] || 'Study');
    }
  };

  const handleToggleCategoryProductivity = (categoryName: string) => {
    const updatedDefs = categoryDefs.map(c => {
      if (c.name === categoryName) {
        return { ...c, isProductive: !c.isProductive };
      }
      return c;
    });
    setCategoryDefs(updatedDefs);
    storage.saveCategoryDefinitions(updatedDefs);
  };

  // To-do list management handlers
  const handleAddTodo = (title: string, cat: string) => {
    const newTodo: TodoItem = {
      id: 'todo_' + Date.now(),
      userId: currentUser.id,
      title,
      category: cat,
      completed: false,
      createdAt: Date.now(),
    };
    const updated = storage.addTodo(newTodo);
    setTodos(updated);
  };

  const handleToggleTodo = (id: string) => {
    const updated = storage.toggleTodo(id);
    setTodos(updated);
  };

  const handleCompleteTodoFromTracker = (todoId: string) => {
    const updated = storage.toggleTodo(todoId);
    setTodos(updated);
  };

  const handleDeleteTodo = (id: string) => {
    const updated = storage.deleteTodo(id);
    setTodos(updated);
  };

  const handleStartTrackingTodo = (todoTitle: string, cat: string) => {
    setWorkingOn(todoTitle);
    if (categories.includes(cat)) {
      setCategory(cat);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdatePomodoro = (settings: PomodoroSettings) => {
    setPomodoroSettings(settings);
    storage.savePomodoroSettings(settings);
  };

  const handleSessionComplete = (newSession: TimeSession) => {
    const updated = storage.addSession(newSession);
    setSessions(updated);
    storage.syncSessionToCloud(newSession);
  };

  const handleDeleteSession = (id: string) => {
    const updated = storage.deleteSession(id);
    setSessions(updated);
    storage.deleteSessionFromCloud(id);
  };

  // Calculate today's seconds worked for current active user (Productive vs Inactive/Rest)
  const todayStartTimestamp = new Date().setHours(0, 0, 0, 0);
  const todayUserSessions = sessions.filter(
    s => s.userId === currentUser.id && s.startTime >= todayStartTimestamp
  );
  
  // Categorize sessions by productivity
  const productiveCategories = new Set(
    categoryDefs.filter(d => d.isProductive).map(d => d.name.toLowerCase())
  );

  const isCurrentCategoryProductive = productiveCategories.has(category.toLowerCase());

  const todaySavedProductiveSeconds = todayUserSessions
    .filter(s => productiveCategories.has((s.category || '').toLowerCase()))
    .reduce((acc, s) => acc + s.durationSeconds, 0);

  const todaySavedRestSeconds = todayUserSessions
    .filter(s => !productiveCategories.has((s.category || '').toLowerCase()))
    .reduce((acc, s) => acc + s.durationSeconds, 0);

  const totalProductiveSeconds = todaySavedProductiveSeconds + (isCurrentCategoryProductive ? activeSeconds : 0);
  const totalRestSeconds = todaySavedRestSeconds + (!isCurrentCategoryProductive ? activeSeconds : 0);
  const totalTodayLiveSeconds = totalProductiveSeconds + totalRestSeconds;

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
      />

      <main className="main-content">
        <div className="content-container">
          
          {/* Cloud Sync Status Banner */}
          <div className="cloud-status-pill">
            {isCloudSynced ? (
              <span className="cloud-badge cloud-online">
                <Cloud size={13} /> Supabase Cloud Connected (Live Syncing)
              </span>
            ) : (
              <span className="cloud-badge cloud-offline">
                <CloudOff size={13} /> Local Mode (Syncing when table is created)
              </span>
            )}
          </div>

          {/* TAB 1: TIMER, TO-DO LIST & HOME KPI */}
          {activeTab === 'timer' && (
            <div className="timer-tab-view">
              
              {/* PRIMARY 24-HOUR KPI CARD (SEPARATES PRODUCTIVE FOCUS FROM SLEEP/INACTIVE) */}
              <HoursKpiCard 
                todaySeconds={totalTodayLiveSeconds}
                productiveSeconds={totalProductiveSeconds}
                restSeconds={totalRestSeconds}
                userName={currentUser.name}
              />

              {/* LIVE PARTNER TRACKING BANNER (SHOWS IF SOMEONE ELSE IS CURRENTLY TRACKING) */}
              <PartnerActiveTrackerCard
                activeTimers={activeTimers}
                currentUserId={currentUser.id}
                users={users}
              />

              {/* CORE TIME TRACKER / POMODORO WITH AUTOCOMPLETE & COMPLETION DIALOG */}
              <TimerTracker
                currentUser={currentUser}
                pomodoroSettings={pomodoroSettings}
                onSessionComplete={handleSessionComplete}
                activeSeconds={activeSeconds}
                setActiveSeconds={setActiveSeconds}
                isRunning={isRunning}
                setIsRunning={setIsRunning}
                workingOn={workingOn}
                setWorkingOn={setWorkingOn}
                category={category}
                setCategory={setCategory}
                isPomodoroEnabled={isPomodoroEnabled}
                setIsPomodoroEnabled={setIsPomodoroEnabled}
                categories={categories}
                todos={todos}
                onCompleteTodo={handleCompleteTodoFromTracker}
                onOpenManualModal={() => setIsManualModalOpen(true)}
              />

              {/* HOMEPAGE TO-DO LIST FEATURE */}
              <TodoListCard
                todos={todos}
                currentUser={currentUser}
                categories={categories}
                onAddTodo={handleAddTodo}
                onToggleTodo={handleToggleTodo}
                onDeleteTodo={handleDeleteTodo}
                onStartTrackingTodo={handleStartTrackingTodo}
              />

              {/* Recent Sessions Quick Peek below timer */}
              <div className="recent-activity-section">
                <div className="recent-header">
                  <div className="recent-title-row">
                    <History size={18} className="text-purple" />
                    <h3>Today's Focus Activity</h3>
                  </div>
                  <button 
                    className="view-all-link"
                    onClick={() => setActiveTab('timesheet')}
                  >
                    <span>Open full timesheet</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {todayUserSessions.length === 0 ? (
                  <div className="recent-empty">
                    <p>No activity saved yet today. Hit <strong>Start Timer</strong> above to track your flow!</p>
                  </div>
                ) : (
                  <div className="recent-cards-row">
                    {todayUserSessions.slice(0, 3).map(s => {
                      const mins = Math.round(s.durationSeconds / 60);
                      return (
                        <div key={s.id} className="recent-mini-card">
                          <div className="mini-card-top">
                            <span className="mini-card-cat">{s.category}</span>
                            <span className="mini-card-time font-mono">
                              {mins >= 60 ? `${(mins / 60).toFixed(1)}h` : `${mins}m`}
                            </span>
                          </div>
                          <span className="mini-card-title">{s.workingOn}</span>
                          <span className="mini-card-mode">
                            {s.isPomodoro ? '⚡ Pomodoro' : '⏱ Stopwatch'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: ANALYSIS */}
          {activeTab === 'analysis' && (
            <AnalysisPage 
              sessions={sessions}
              currentUser={currentUser}
              categoryDefs={categoryDefs}
            />
          )}

          {/* TAB 3: TIMESHEET */}
          {activeTab === 'timesheet' && (
            <TimesheetPage
              sessions={sessions}
              onDeleteSession={handleDeleteSession}
              currentUser={currentUser}
              categories={categories}
              onOpenManualModal={() => setIsManualModalOpen(true)}
            />
          )}

          {/* TAB 4: SETTINGS, CATEGORIES & USER MANAGEMENT */}
          {activeTab === 'settings' && (
            <SettingsPage
              users={users}
              activeUserId={activeUserId}
              onSelectUser={handleSelectUser}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              pomodoroSettings={pomodoroSettings}
              onUpdatePomodoro={handleUpdatePomodoro}
              categories={categories}
              categoryDefs={categoryDefs}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onToggleCategoryProductivity={handleToggleCategoryProductivity}
            />
          )}

        </div>
      </main>

      {/* Floating running timer bar if user leaves tracker tab while running */}
      {isRunning && activeTab !== 'timer' && (
        <div className="floating-active-bar" onClick={() => setActiveTab('timer')}>
          <div className="floating-bar-left">
            <span className="pulsing-live-dot"></span>
            <span className="floating-task-name">
              {workingOn.trim() || 'Active'}:
            </span>
            <span className="floating-time font-mono">
              {Math.floor(activeSeconds / 60)}m {activeSeconds % 60}s
            </span>
          </div>
          <span className="floating-bar-action">Return to Timer &rarr;</span>
        </div>
      )}


      {/* MANUAL MISSED TIME MODAL */}
      <ManualTimeModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        currentUser={currentUser}
        categories={categories}
        onAddSession={handleSessionComplete}
      />
    </div>
  );
}

export default App;
