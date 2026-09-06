import React from 'react';
import { BookOpen, LogOut, User as UserIcon, Shield, Sparkles, LayoutDashboard, Home, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentView, setCurrentView }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="header">
      <div className="container header-inner">
        {/* Logo */}
        <button 
          onClick={() => setCurrentView('home')} 
          className="logo-btn"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div className="logo">
            <div className="logo-icon">
              <BookOpen size={20} />
            </div>
            <span>TutorFlow</span>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="nav-links">
          <button 
            className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentView('home')}
          >
            <Home size={16} />
            <span>Home</span>
          </button>

          {isAuthenticated && (
            <button 
              className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>
          )}

          {/* Test Access Control button to easily demo student attempting tutor view */}
          {isAuthenticated && (
            <button 
              className={`nav-link ${currentView === 'tutor-only-page' ? 'active' : ''}`}
              onClick={() => setCurrentView('tutor-only-page')}
              title={user?.role === 'student' ? 'Click to test student accessing tutor-only route (Access Denied demo)' : 'Tutor Management Console'}
            >
              <Lock size={16} />
              <span>Tutor Console</span>
              {user?.role === 'student' && <span className="nav-pill-warning">Test 403</span>}
            </button>
          )}
        </nav>

        {/* Right side auth & profile */}
        <div className="header-actions">
          {isAuthenticated ? (
            <div className="user-profile-menu">
              <div className="user-badge">
                <div className={`user-avatar ${user.role}`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className={`user-role-tag ${user.role}`}>
                    {user.role === 'tutor' ? '👨‍🏫 Tutor' : '👨‍🎓 Student'}
                  </span>
                </div>
              </div>

              <button 
                onClick={logout} 
                className="btn-logout"
                title="Sign out of TutorFlow"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setCurrentView('login')} 
              className="btn-login-header"
            >
              <UserIcon size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
