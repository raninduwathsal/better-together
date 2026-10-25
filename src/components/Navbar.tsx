import React from 'react';
import type { UserProfile, TabType } from '../types';
import { 
  Timer as TimerIcon, 
  BarChart3, 
  CalendarClock, 
  Settings, 
  Sparkles, 
  UserCheck 
} from 'lucide-react';
import './Navbar.css';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUser: UserProfile | undefined;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
}) => {
  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand Logo & Name */}
        <div className="brand" onClick={() => setActiveTab('timer')}>
          <div className="brand-icon-wrapper">
            <Sparkles className="brand-icon" size={20} />
          </div>
          <div className="brand-text">
            <span className="brand-title">Better Together</span>
            <span className="brand-badge">Time & Bloom</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          <button 
            className={`nav-btn ${activeTab === 'timer' ? 'active' : ''}`}
            onClick={() => setActiveTab('timer')}
            id="nav-tab-timer"
          >
            <TimerIcon size={18} />
            <span>Tracker</span>
          </button>

          <button 
            className={`nav-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
            id="nav-tab-analysis"
          >
            <BarChart3 size={18} />
            <span>Analysis</span>
          </button>

          <button 
            className={`nav-btn ${activeTab === 'timesheet' ? 'active' : ''}`}
            onClick={() => setActiveTab('timesheet')}
            id="nav-tab-timesheet"
          >
            <CalendarClock size={18} />
            <span>Timesheet</span>
          </button>

          <button 
            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            id="nav-tab-settings"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        {/* User indicator & quick switch to settings */}
        <div className="user-pill-section" onClick={() => setActiveTab('settings')} title="Manage saved users in Settings">
          <div 
            className="user-avatar"
            style={{ backgroundColor: currentUser?.avatarColor || '#7C3AED' }}
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-meta">
            <span className="user-name">{currentUser?.name || 'Guest User'}</span>
            <span className="user-status-text">
              <UserCheck size={12} className="check-icon" /> Saved Profile
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
