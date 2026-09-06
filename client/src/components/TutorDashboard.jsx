import React from 'react';
import { Users, Calendar, Bot, FileText, CheckCircle2, Shield, ArrowRight, UserCheck, Key, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RoleTester from './RoleTester';

export default function TutorDashboard({ onNavigateToTutorConsole }) {
  const { user } = useAuth();

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
              <span className="milestone-badge">Milestone 2 Verified</span>
            </div>
            <h1 className="dashboard-title">Welcome back, {user?.name || 'Alex'}</h1>
            <p className="dashboard-subtitle">
              You have full tutor administrative privileges. Manage student rosters, sessions, and AI summaries.
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

      {/* Feature / Milestone Preview Grid */}
      <div className="dashboard-section">
        <h2 className="section-title">Tutor Capabilities & Upcoming Milestones</h2>
        <div className="preview-grid">
          <div className="preview-card">
            <div className="preview-card-header">
              <div className="preview-icon-box">
                <Users size={20} />
              </div>
              <span className="preview-tag-next">Milestone 3</span>
            </div>
            <h3 className="preview-card-title">Student Management</h3>
            <p className="preview-card-desc">
              Create, view, and organize student profiles with subject tags, target goals, and skill weakness trackers.
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
