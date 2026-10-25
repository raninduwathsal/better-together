import React, { useState } from 'react';
import type { UserProfile, PomodoroSettings } from '../types';
import { 
  Users, 
  UserPlus, 
  Check, 
  Trash2, 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  PlayCircle,
  Tag,
  Plus
} from 'lucide-react';
import { playSound } from '../audio';
import './SettingsPage.css';

interface SettingsPageProps {
  users: UserProfile[];
  activeUserId: string;
  onSelectUser: (id: string) => void;
  onAddUser: (name: string, role?: string, color?: string) => void;
  onDeleteUser: (id: string) => void;
  pomodoroSettings: PomodoroSettings;
  onUpdatePomodoro: (settings: PomodoroSettings) => void;
  categories: string[];
  onAddCategory: (categoryName: string) => void;
  onDeleteCategory: (categoryName: string) => void;
}

const PRESET_AVATAR_COLORS = [
  '#7C3AED', // Deep Purple
  '#9333EA', // Purple
  '#C084FC', // Light Lavender
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  users,
  activeUserId,
  onSelectUser,
  onAddUser,
  onDeleteUser,
  pomodoroSettings,
  onUpdatePomodoro,
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_AVATAR_COLORS[0]);
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  // New category input state
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    onAddUser(newUserName.trim(), newUserRole.trim() || undefined, selectedColor);
    setNewUserName('');
    setNewUserRole('');
    setShowAddSuccess(true);
    playSound('complete');
    setTimeout(() => setShowAddSuccess(false), 3000);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    onAddCategory(newCategoryName.trim());
    setNewCategoryName('');
    playSound('complete');
  };

  const handlePomoChange = (field: keyof PomodoroSettings, value: number | boolean) => {
    onUpdatePomodoro({
      ...pomodoroSettings,
      [field]: value,
    });
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">App Settings & Profiles</h1>
        <p className="settings-subtitle">
          Manage saved users, customize activity categories (Sleep, Entertainment, Study, Club, Work, etc.), and configure Pomodoro durations.
        </p>
      </div>

      <div className="settings-layout">
        
        {/* Left Column: User Profile Management */}
        <div className="settings-card">
          <div className="card-top">
            <div className="card-title-row">
              <Users size={20} className="text-purple" />
              <h2 className="card-heading">Saved User Profiles</h2>
            </div>
            <span className="saved-badge">
              <ShieldCheck size={14} /> Auto-Saved
            </span>
          </div>
          <p className="card-subtext">
            Choose your active user. The timer and countdown will automatically log sessions for this user without asking every time.
          </p>

          {/* User List */}
          <div className="user-selection-list">
            {users.map(user => {
              const isActive = user.id === activeUserId;
              return (
                <div 
                  key={user.id} 
                  className={`user-card-item ${isActive ? 'active-user' : ''}`}
                  onClick={() => onSelectUser(user.id)}
                >
                  <div className="user-card-left">
                    <div 
                      className="user-card-avatar"
                      style={{ backgroundColor: user.avatarColor }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <div className="user-name-line">
                        <span className="user-card-name">{user.name}</span>
                        {isActive && <span className="current-chip">Active</span>}
                      </div>
                      <span className="user-card-role">{user.role || 'Member / Learner'}</span>
                    </div>
                  </div>

                  <div className="user-card-actions">
                    {isActive ? (
                      <div className="active-check-icon">
                        <Check size={18} />
                      </div>
                    ) : (
                      <button 
                        className="select-user-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUser(user.id);
                        }}
                      >
                        Select
                      </button>
                    )}

                    {users.length > 1 && (
                      <button 
                        className="delete-user-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteUser(user.id);
                        }}
                        title="Delete Profile"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New User Form */}
          <form className="add-user-form" onSubmit={handleCreateUser}>
            <div className="form-heading">
              <UserPlus size={16} className="text-purple" />
              <span>Add New User Profile</span>
            </div>

            <div className="form-fields">
              <div className="field-row">
                <input
                  type="text"
                  className="settings-input"
                  placeholder="Full Name (e.g. Maya Chen)"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="settings-input"
                  placeholder="Role / Focus (e.g. Medical Student)"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                />
              </div>

              {/* Color swatches */}
              <div className="color-picker-row">
                <span className="color-label">Avatar Color:</span>
                <div className="color-swatches">
                  {PRESET_AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`swatch-circle ${selectedColor === c ? 'selected-swatch' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setSelectedColor(c)}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" className="create-user-btn">
                <UserPlus size={16} />
                <span>Save & Add Profile</span>
              </button>

              {showAddSuccess && (
                <div className="add-success-banner">
                  <Check size={16} /> User created and saved to local storage!
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Categories Management & Pomodoro Preferences */}
        <div className="settings-column-right">
          
          {/* Activity Categories (Types) Card */}
          <div className="settings-card" style={{ marginBottom: '1.75rem' }}>
            <div className="card-top">
              <div className="card-title-row">
                <Tag size={20} className="text-purple" />
                <h2 className="card-heading">Activity Categories / Types</h2>
              </div>
              <span className="saved-badge">Customizable</span>
            </div>
            <p className="card-subtext">
              Set custom categories for tracking time (defaults: Sleep, Entertainment, Study, Club, Work).
            </p>

            {/* List of current categories */}
            <div className="categories-manage-chips">
              {categories.map((cat) => (
                <div key={cat} className="manage-cat-chip">
                  <span className="cat-chip-text">{cat}</span>
                  {categories.length > 1 && (
                    <button
                      type="button"
                      className="cat-chip-delete"
                      onClick={() => onDeleteCategory(cat)}
                      title={`Remove ${cat}`}
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Category Input */}
            <form className="add-category-form" onSubmit={handleCreateCategory}>
              <input
                type="text"
                className="settings-input"
                placeholder="New Category name (e.g. Gym, Reading, Gaming)..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button type="submit" className="add-category-btn">
                <Plus size={16} />
                <span>Add Type</span>
              </button>
            </form>
          </div>

          {/* Pomodoro & Timer Preferences */}
          <div className="settings-card">
            <div className="card-top">
              <div className="card-title-row">
                <Sliders size={20} className="text-purple" />
                <h2 className="card-heading">Pomodoro Interval Preferences</h2>
              </div>
            </div>
            <p className="card-subtext">
              Configure custom focus and break lengths for the Pomodoro study mode.
            </p>

            <div className="pomo-settings-group">
              <div className="setting-item">
                <div className="setting-meta">
                  <label className="setting-title">Focus Duration (Minutes)</label>
                  <span className="setting-hint">Standard study duration before break</span>
                </div>
                <input 
                  type="number" 
                  min="5" 
                  max="90" 
                  className="number-input font-mono"
                  value={pomodoroSettings.workMinutes}
                  onChange={(e) => handlePomoChange('workMinutes', Math.max(1, parseInt(e.target.value) || 25))}
                />
              </div>

              <div className="setting-item">
                <div className="setting-meta">
                  <label className="setting-title">Short Break (Minutes)</label>
                  <span className="setting-hint">Rest duration between focus intervals</span>
                </div>
                <input 
                  type="number" 
                  min="1" 
                  max="30" 
                  className="number-input font-mono"
                  value={pomodoroSettings.shortBreakMinutes}
                  onChange={(e) => handlePomoChange('shortBreakMinutes', Math.max(1, parseInt(e.target.value) || 5))}
                />
              </div>

              <div className="setting-item">
                <div className="setting-meta">
                  <label className="setting-title">Long Break (Minutes)</label>
                  <span className="setting-hint">Extended rest after complete study set</span>
                </div>
                <input 
                  type="number" 
                  min="5" 
                  max="60" 
                  className="number-input font-mono"
                  value={pomodoroSettings.longBreakMinutes}
                  onChange={(e) => handlePomoChange('longBreakMinutes', Math.max(1, parseInt(e.target.value) || 15))}
                />
              </div>

              <div className="setting-item">
                <div className="setting-meta">
                  <label className="setting-title">Cycles Before Long Break</label>
                  <span className="setting-hint">Number of focus intervals before long break</span>
                </div>
                <input 
                  type="number" 
                  min="1" 
                  max="10" 
                  className="number-input font-mono"
                  value={pomodoroSettings.cyclesBeforeLongBreak}
                  onChange={(e) => handlePomoChange('cyclesBeforeLongBreak', Math.max(1, parseInt(e.target.value) || 4))}
                />
              </div>

              <div className="setting-item toggle-row">
                <div className="setting-meta">
                  <label className="setting-title">Auditory Chimes & Bells</label>
                  <span className="setting-hint">Play gentle tones when starting or completing timer</span>
                </div>
                <button 
                  type="button" 
                  className={`sound-toggle-btn ${pomodoroSettings.soundEnabled ? 'active' : ''}`}
                  onClick={() => {
                    const nextVal = !pomodoroSettings.soundEnabled;
                    handlePomoChange('soundEnabled', nextVal);
                    if (nextVal) playSound('complete');
                  }}
                >
                  {pomodoroSettings.soundEnabled ? (
                    <>
                      <Volume2 size={16} />
                      <span>Enabled</span>
                    </>
                  ) : (
                    <>
                      <VolumeX size={16} />
                      <span>Muted</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Sound Test */}
            <div className="test-sound-box">
              <span className="test-sound-text">Test Chime Audio:</span>
              <button 
                type="button" 
                className="sound-chip" 
                onClick={() => playSound('start')}
              >
                <PlayCircle size={14} /> Start Chime
              </button>
              <button 
                type="button" 
                className="sound-chip" 
                onClick={() => playSound('complete')}
              >
                <Sparkles size={14} /> Complete Chime
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
