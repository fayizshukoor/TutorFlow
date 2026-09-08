import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage({ onLoginSuccess, onBackHome }) {
  const { user, isAuthenticated, login, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to appropriate role dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const defaultPath = user.role === 'tutor' ? '/tutor' : '/student';
      const fromPath = location.state?.from?.pathname;
      navigate(fromPath || defaultPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  // Quick fill test accounts
  const fillTutor = () => {
    setEmail('tutor@tutorflow.com');
    setPassword('TutorPass123!');
    setAuthError(null);
  };

  const fillStudent = () => {
    setEmail('student@tutorflow.com');
    setPassword('StudentPass123!');
    setAuthError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
      const defaultPath = result.user.role === 'tutor' ? '/tutor' : '/student';
      const fromPath = location.state?.from?.pathname;
      navigate(fromPath || defaultPath, { replace: true });
    }
  };

  const handleBack = () => {
    if (onBackHome) {
      onBackHome();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Back link */}
        <button onClick={handleBack} className="btn-back">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        {/* Card Header */}
        <div className="auth-header">
          <div className="auth-icon-badge">
            <Shield size={24} />
          </div>
          <h2 className="auth-title">Welcome to TutorFlow</h2>
          <p className="auth-subtitle">Sign in to access your role-based dashboard</p>
        </div>

        {/* Quick Fill Testing Box */}
        <div className="quick-fill-box">
          <div className="quick-fill-label">
            <Sparkles size={14} color="#818CF8" />
            <span>Quick-Fill Demo Accounts</span>
          </div>
          <div className="quick-fill-buttons">
            <button
              type="button"
              className="quick-btn tutor-btn"
              onClick={fillTutor}
              title="Fill Alex Rivera (Tutor)"
            >
              👨‍🏫 Fill Tutor Account
            </button>
            <button
              type="button"
              className="quick-btn student-btn"
              onClick={fillStudent}
              title="Fill Sam Chen (Student)"
            >
              👨‍🎓 Fill Student Account
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="auth-alert error">
            <AlertCircle size={18} />
            <span>{authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="btn-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary-auth"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="btn-loading-content">
                <span className="spinner"></span>
                <span>Authenticating...</span>
              </span>
            ) : (
              <span className="btn-normal-content">
                <LogIn size={18} />
                <span>Sign In</span>
              </span>
            )}
          </button>
        </form>

        {/* Footer info note */}
        <div className="auth-footer-note">
          <p>
            🔒 Protected with <strong>JWT Bearer Authentication</strong> & strict server-side role validation.
          </p>
        </div>
      </div>
    </div>
  );
}
