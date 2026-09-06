import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Bot, Shield, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RoleTester from './RoleTester';

export default function StudentDashboard({ onAttemptTutorPage }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAttemptTutor = () => {
    if (onAttemptTutorPage) {
      onAttemptTutorPage();
    } else {
      navigate('/tutor');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Dashboard Top Banner */}
      <div className="dashboard-header-card student">
        <div className="dashboard-header-left">
          <div className="role-avatar-lg student">
            👨‍🎓
          </div>
          <div>
            <div className="dashboard-pill-row">
              <span className="role-tag-badge student">
                <Shield size={13} />
                STUDENT ACCOUNT
              </span>
              <span className="milestone-badge">Milestone 2 Verified</span>
            </div>
            <h1 className="dashboard-title">Welcome back, {user?.name || 'Sam'}</h1>
            <p className="dashboard-subtitle">
              You have student access. You can view your assigned tutor, scheduled sessions, and AI summaries.
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
            <span className="meta-label">Assigned Tutor:</span>
            <span className="meta-val mono">{user?.tutorId || 'Alex Rivera (Linked)'}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Role Level:</span>
            <span className="meta-val status-student">student (Read-Only)</span>
          </div>
        </div>
      </div>

      {/* Access Control Demonstration Notice */}
      <div className="rbac-notice-card">
        <div className="rbac-notice-left">
          <div className="rbac-notice-icon">
            <Lock size={20} />
          </div>
          <div>
            <h4 className="rbac-notice-title">Role-Based Access Guard Active</h4>
            <p className="rbac-notice-desc">
              As a student, you are restricted from tutor-only management pages and API endpoints. 
              Click below to test the access denial safeguard.
            </p>
          </div>
        </div>
        <button
          onClick={handleAttemptTutor}
          className="btn-test-rbac"
          title="Attempt to open Tutor Management Console"
        >
          <Lock size={15} />
          <span>Attempt to Open Tutor Console</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Feature / Milestone Preview Grid */}
      <div className="dashboard-section">
        <h2 className="section-title">Student Portal & Upcoming Milestones</h2>
        <div className="preview-grid">
          <div className="preview-card">
            <div className="preview-card-header">
              <div className="preview-icon-box">
                <Calendar size={20} />
              </div>
              <span className="preview-tag-next">Milestone 4</span>
            </div>
            <h3 className="preview-card-title">My Sessions</h3>
            <p className="preview-card-desc">
              View scheduled 1-on-1 tutoring sessions, timing, and meeting links provided by your tutor.
            </p>
          </div>

          <div className="preview-card">
            <div className="preview-card-header">
              <div className="preview-icon-box">
                <Bot size={20} />
              </div>
              <span className="preview-tag-next">Milestone 5</span>
            </div>
            <h3 className="preview-card-title">AI Summaries & Homework</h3>
            <p className="preview-card-desc">
              Access Gemini-generated post-session review notes, actionable takeaways, and homework assignments.
            </p>
          </div>

          <div className="preview-card">
            <div className="preview-card-header">
              <div className="preview-icon-box">
                <BookOpen size={20} />
              </div>
              <span className="preview-tag-next">Milestone 3</span>
            </div>
            <h3 className="preview-card-title">Learning Goals</h3>
            <p className="preview-card-desc">
              Track progress across target subjects and key concepts identified by your tutor.
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
