import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, User as UserIcon, LayoutDashboard, Home, Users, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/', { replace: true });
    logout();
  };

  const dashboardRoute = user?.role === 'tutor' ? '/tutor' : '/student';

  return (
    <header className="header">
      <div className="container header-inner">
        {/* Logo */}
        <Link to="/" className="logo-btn" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="logo">
            <div className="logo-icon">
              <BookOpen size={20} />
            </div>
            <span>TutorFlow</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="nav-links">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Home size={16} />
            <span>Home</span>
          </NavLink>

          {isAuthenticated && (
            <NavLink 
              to={dashboardRoute}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </NavLink>
          )}

          {isAuthenticated && user?.role === 'tutor' && (
            <NavLink 
              to="/tutor/students"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Users size={16} />
              <span>Students</span>
            </NavLink>
          )}

          {isAuthenticated && user?.role === 'tutor' && (
            <NavLink 
              to="/tutor/sessions"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Calendar size={16} />
              <span>Sessions</span>
            </NavLink>
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
                onClick={handleLogout} 
                className="btn-logout"
                title="Sign out of TutorFlow"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-login-header" style={{ textDecoration: 'none' }}>
              <UserIcon size={16} />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
