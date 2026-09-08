import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Bot, Shield, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StudentList from '../students/StudentList';
import RoleTester from './RoleTester';

export default function TutorDashboard({ onNavigateToTutorConsole }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleOpenConsole = () => {
    if (onNavigateToTutorConsole) {
      onNavigateToTutorConsole();
    } else {
      navigate('/tutor/console');
    }
  };

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
              <span className="milestone-badge">Milestone 3 Active</span>
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

      {/* Quick Launch Console Card */}
      <div className="rbac-notice-card tutor-console-cta">
        <div className="rbac-notice-left">
          <div className="rbac-notice-icon tutor">
            <Lock size={20} />
          </div>
          <div>
            <h4 className="rbac-notice-title">Tutor Management Console</h4>
            <p className="rbac-notice-desc">
              Access the protected tutor-only administration workspace and verify live backend role authorization.
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenConsole}
          className="btn-test-rbac tutor"
          title="Open Tutor Management Console"
        >
          <Lock size={15} />
          <span>Launch Tutor Console</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Milestone 3: Live Student Management Section */}
      <div className="dashboard-section">
        <StudentList isCompact={false} />
      </div>

      {/* Feature / Milestone Roadmap Grid */}
      <div className="dashboard-section">
        <h2 className="section-title">Platform Capabilities & Upcoming Milestones</h2>
        <div className="preview-grid">
          <div className="preview-card live-card">
            <div className="preview-card-header">
              <div className="preview-icon-box" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818CF8' }}>
                <Users size={20} />
              </div>
              <span className="preview-tag-next" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
                Milestone 3 Live
              </span>
            </div>
            <h3 className="preview-card-title">Student Management</h3>
            <p className="preview-card-desc">
              Full student profiles with subject tags, learning goals, weak area focus tracking, and server-side tutor ownership security.
            </p>
          </div>

          <div className="preview-card">
            <div className="preview-card-header">
              <div className="preview-icon-box">
                <Calendar size={20} />
              </div>
              <span className="preview-tag-next">Milestone 4</span>
            </div>
            <h3 className="preview-card-title">Session State Machine</h3>
            <p className="preview-card-desc">
              Schedule 1-on-1 tutoring sessions with automatic schedule collision prevention and lifecycle tracking.
            </p>
          </div>

          <div className="preview-card">
            <div className="preview-card-header">
              <div className="preview-icon-box">
                <Bot size={20} />
              </div>
              <span className="preview-tag-next">Milestone 5</span>
            </div>
            <h3 className="preview-card-title">Gemini AI Lesson Plans</h3>
            <p className="preview-card-desc">
              AI-generated lesson plans and post-session homework reviews synthesized from live session notes.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Auth & Role Verification Widget */}
      <div className="dashboard-section">
        <RoleTester />
      </div>
    </div>
  );
}
