import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Activity, 
  Users, 
  Calendar, 
  Bot, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Server,
  ArrowRight,
  Shield,
  LogIn
} from 'lucide-react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState({ loading: true, data: null, error: null });

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
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const dashboardPath = user?.role === 'tutor' ? '/tutor' : '/student';

  return (
    <main className="container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-pill">
          <Sparkles size={14} />
          <span>Production Ready • All Platform Features Live</span>
        </div>

        <h1 className="hero-title">
          <span className="gradient-text">TutorFlow is running</span>
        </h1>

        <p className="hero-subtitle">
          A dedicated 1-on-1 session platform for online tutors and students with 
          secure JWT authentication, role-based dashboards, student rosters, and AI lesson plans.
        </p>

        {/* Action CTAs */}
        <div className="hero-cta-group">
          {isAuthenticated ? (
            <button 
              onClick={() => navigate(dashboardPath)} 
              className="btn-hero-primary"
            >
              <span>Go to {user.role === 'tutor' ? 'Tutor' : 'Student'} Dashboard</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')} 
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

      {/* Full Platform Highlight Banner */}
      <section className="milestone2-banner">
        <div className="milestone2-badge">
          <Sparkles size={16} color="var(--primary)" />
          <span>Full Platform Active</span>
        </div>
        <h2 className="milestone2-title">Complete 1-on-1 Tutoring Workflow</h2>
        <p className="milestone2-desc">
          Manage student rosters, schedule sessions with double-booking prevention, record live debounced notes, generate Gemini AI lesson plans, and track interactive homework progress.
        </p>
        <div className="milestone2-actions">
          <button 
            onClick={() => navigate(isAuthenticated ? dashboardPath : '/login')} 
            className="btn-banner-login"
          >
            <span>{isAuthenticated ? 'Open Dashboard' : 'Sign In to Get Started'}</span>
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
          <h3 className="feature-title">Student Rosters & Goals</h3>
          <p className="feature-desc">
            Organize student profiles with subject tags, current academic levels, target milestones, and weakness trackers.
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
}
