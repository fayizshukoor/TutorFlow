import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Activity, 
  BookOpen, 
  Calendar, 
  Bot, 
  FileText, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Server,
  ArrowRight,
  Shield,
  LogIn
} from 'lucide-react';
import { AuthProvider, useAuth, API_BASE_URL } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import TutorDashboard from './components/TutorDashboard';
import StudentDashboard from './components/StudentDashboard';
import TutorConsole from './components/TutorConsole';
import AccessDenied from './components/AccessDenied';

// Inner App with view routing & auth state
function MainApp() {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'login' | 'dashboard' | 'tutor-only-page'
  const [healthStatus, setHealthStatus] = useState({ loading: true, data: null, error: null });
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = async () => {
    setHealthStatus(prev => ({ ...prev, loading: true, error: null }));
    try {
      const startTime = performance.now();
      const response = await fetch(`${API_BASE_URL}/health`);
      const latency = Math.round(performance.now() - startTime);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setHealthStatus({
        loading: false,
        data: { ...data, latency },
        error: null
      });
    } catch (err) {
      setHealthStatus({
        loading: false,
        data: null,
        error: err.message || 'Unable to connect to backend server'
      });
    } finally {
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // Handler after successful login
  const handleLoginSuccess = (loggedInUser) => {
    setCurrentView('dashboard');
  };

  // View router renderer
  const renderCurrentView = () => {
    if (loading) {
      return (
        <div className="loading-screen">
          <div className="spinner-large"></div>
          <p>Verifying authentication session...</p>
        </div>
      );
    }

    // 1. LOGIN VIEW
    if (currentView === 'login') {
      if (isAuthenticated) {
        // Already logged in, show dashboard
        return renderDashboard();
      }
      return (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess} 
          onBackHome={() => setCurrentView('home')} 
        />
      );
    }

    // 2. DASHBOARD VIEW (Protected)
    if (currentView === 'dashboard') {
      if (!isAuthenticated) {
        return (
          <LoginPage 
            onLoginSuccess={handleLoginSuccess} 
            onBackHome={() => setCurrentView('home')} 
          />
        );
      }
      return renderDashboard();
    }

    // 3. TUTOR CONSOLE / TUTOR ONLY ROUTE (Protected + Role Guard)
    if (currentView === 'tutor-only-page') {
      if (!isAuthenticated) {
        return (
          <LoginPage 
            onLoginSuccess={handleLoginSuccess} 
            onBackHome={() => setCurrentView('home')} 
          />
        );
      }
      if (user?.role === 'student') {
        return <AccessDenied onBackToDashboard={() => setCurrentView('dashboard')} />;
      }
      return <TutorConsole onBack={() => setCurrentView('dashboard')} />;
    }

    // 4. HOME VIEW (Milestone 1 Preserved)
    return (
      <main className="container">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-pill">
            <Sparkles size={14} />
            <span>Milestone 2: JWT Auth & RBAC Active</span>
          </div>

          <h1 className="hero-title">
            <span className="gradient-text">TutorFlow is running</span>
          </h1>

          <p className="hero-subtitle">
            A dedicated 1-on-1 session platform for online tutors and students with 
            secure JWT authentication, role-based dashboards, and AI-powered lesson plans.
          </p>

          {/* Action CTAs */}
          <div className="hero-cta-group">
            {isAuthenticated ? (
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className="btn-hero-primary"
              >
                <span>Go to {user.role === 'tutor' ? 'Tutor' : 'Student'} Dashboard</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                onClick={() => setCurrentView('login')} 
                className="btn-hero-primary"
              >
                <LogIn size={18} />
                <span>Sign In to Dashboard</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>

          {/* Backend Health Check Widget */}
          <div className="health-card">
            <div className="health-item">
              <Server size={18} color="#818CF8" />
              <span className="health-label">API Endpoint:</span>
              <span className="health-value">/api/health (Port 5000)</span>
            </div>

            <div className="health-item">
              <span className="health-label">Backend Status:</span>
              {healthStatus.loading ? (
                <span className="health-badge loading">
                  <RefreshCw size={12} className="spin" /> Checking...
                </span>
              ) : healthStatus.error ? (
                <span className="health-badge error" title={healthStatus.error}>
                  <AlertCircle size={12} /> Disconnected
                </span>
              ) : (
                <span className="health-badge ok">
                  <CheckCircle2 size={12} /> {JSON.stringify(healthStatus.data?.status || 'ok')}
                </span>
              )}
            </div>

            {healthStatus.data?.latency && (
              <div className="health-item">
                <Activity size={16} color="#10B981" />
                <span className="health-label">Latency:</span>
                <span className="health-value">{healthStatus.data.latency}ms</span>
              </div>
            )}

            <button 
              onClick={checkHealth}
              disabled={healthStatus.loading}
              title="Refresh Health Check"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '6px'
              }}
            >
              <RefreshCw size={16} style={{ animation: healthStatus.loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </section>

        {/* Milestone 2 Highlight Banner */}
        <section className="milestone2-banner">
          <div className="milestone2-badge">
            <Shield size={16} color="var(--primary)" />
            <span>Milestone 2 Implemented</span>
          </div>
          <h2 className="milestone2-title">JWT Authentication & Role-Based Access Control</h2>
          <p className="milestone2-desc">
            Test tutor and student accounts with secure token verification, password hashing, and server-side route guards.
          </p>
          <div className="milestone2-actions">
            <button 
              onClick={() => setCurrentView('login')} 
              className="btn-banner-login"
            >
              <span>Test Sign In Flow</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* Core Architecture Pillars */}
        <section className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Users size={22} />
            </div>
            <h3 className="feature-title">Role-Based Access</h3>
            <p className="feature-desc">
              Dedicated interfaces and permissions for Tutors and Students with secure JWT authentication.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Calendar size={22} />
            </div>
            <h3 className="feature-title">Session Lifecycle</h3>
            <p className="feature-desc">
              Strict 4-stage flow: <strong>Scheduled → In progress → Completed → AI reviewed</strong> with clash prevention.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Bot size={22} />
            </div>
            <h3 className="feature-title">Gemini AI Assistant</h3>
            <p className="feature-desc">
              Generates customized lesson plans and post-session summaries with tailored homework tasks.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <FileText size={22} />
            </div>
            <h3 className="feature-title">Debounced Autosave</h3>
            <p className="feature-desc">
              Real-time in-session notes autosaved seamlessly with debounce mechanisms to prevent data loss.
            </p>
          </div>
        </section>

        {/* Tech Stack Banner */}
        <section className="stack-section">
          <h2 className="stack-title">Built with Approved Technology Stack</h2>
          <div className="stack-tags">
            <div className="stack-tag"><span>⚡</span> React 18 (Vite)</div>
            <div className="stack-tag"><span>🟢</span> Node.js & Express</div>
            <div className="stack-tag"><span>🍃</span> MongoDB & Mongoose</div>
            <div className="stack-tag"><span>🔒</span> JWT Authentication</div>
            <div className="stack-tag"><span>🔑</span> bcryptjs Password Hash</div>
            <div className="stack-tag"><span>✨</span> Google Gemini API</div>
            <div className="stack-tag"><span>▲</span> Vercel (Frontend)</div>
            <div className="stack-tag"><span>🚀</span> Render (Backend)</div>
          </div>
        </section>
      </main>
    );
  };

  const renderDashboard = () => {
    if (user?.role === 'tutor') {
      return (
        <TutorDashboard 
          onNavigateToTutorConsole={() => setCurrentView('tutor-only-page')} 
        />
      );
    }
    return (
      <StudentDashboard 
        onAttemptTutorPage={() => setCurrentView('tutor-only-page')} 
      />
    );
  };

  return (
    <div className="app">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      {renderCurrentView()}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>TutorFlow &copy; {new Date().getFullYear()} — Online Tutor & Student Session Management Platform</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
