import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Bot, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StudentList from '../students/StudentList';

export default function TutorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      {/* Dashboard Top Banner */}
      <div className="dashboard-header-card">
        <div className="dashboard-header-left">
          <div className="role-avatar-lg tutor">
            👨‍🏫
          </div>
          <div>
            <div className="dashboard-pill-row">
              <span className="role-tag-badge tutor">
                <Shield size={13} />
                TUTOR ACCOUNT
              </span>
              <span className="milestone-badge">Tutor Portal</span>
            </div>
            <h1 className="dashboard-title">Welcome back, {user?.name || 'Alex'}</h1>
            <p className="dashboard-subtitle">
              You have full tutor administrative privileges. Manage student rosters, learning targets, sessions, and AI summaries.
            </p>
          </div>
        </div>

        <div className="account-meta-box">
          <div className="meta-row">
            <span className="meta-label">Email:</span>
            <span className="meta-val">{user?.email}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Account ID:</span>
            <span className="meta-val mono">{user?.id}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Role Level:</span>
            <span className="meta-val status-active">tutor (Full Access)</span>
          </div>
        </div>
      </div>

      {/* Live Student Management Section */}
      <div className="dashboard-section">
        <StudentList isCompact={false} />
      </div>

      {/* Core Platform Capabilities Grid */}
      <div className="dashboard-section">
        <h2 className="section-title">Core Platform Capabilities</h2>
        <div className="preview-grid">
          <div className="preview-card live-card">
            <div className="preview-card-header">
              <div className="preview-icon-box" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818CF8' }}>
                <Users size={20} />
              </div>
              <span className="preview-tag-next" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
                Active
              </span>
            </div>
            <h3 className="preview-card-title">Student Management</h3>
            <p className="preview-card-desc">
              Full student profiles with subject tags, learning goals, weak area focus tracking, and server-side tutor ownership security.
            </p>
          </div>

          <div className="preview-card live-card">
            <div className="preview-card-header">
              <div className="preview-icon-box" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}>
                <Calendar size={20} />
              </div>
              <span className="preview-tag-next" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
                Active
              </span>
            </div>
            <h3 className="preview-card-title">1-on-1 Sessions & Live Notes</h3>
            <p className="preview-card-desc">
              Schedule 1-on-1 sessions with double-booking clash protection, live debounced autosave notes, and state machine lifecycle.
            </p>
            <div style={{ marginTop: '0.75rem' }}>
              <button
                onClick={() => navigate('/tutor/sessions')}
                className="btn-workspace-link"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Open Sessions Hub</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="preview-card live-card">
            <div className="preview-card-header">
              <div className="preview-icon-box" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#C084FC' }}>
                <Bot size={20} />
              </div>
              <span className="preview-tag-next" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
                Active
              </span>
            </div>
            <h3 className="preview-card-title">Gemini AI Plans & Reviews</h3>
            <p className="preview-card-desc">
              Pre-session 4-point AI lesson plans, practice questions, post-session summaries, and interactive homework tracking.
            </p>
            <div style={{ marginTop: '0.75rem' }}>
              <button
                onClick={() => navigate('/tutor/sessions')}
                className="btn-workspace-link"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Generate AI Content</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
