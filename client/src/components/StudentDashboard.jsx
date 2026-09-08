import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Bot,
  Shield,
  Lock,
  ArrowRight,
  Target,
  AlertTriangle,
  GraduationCap,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RoleTester from './RoleTester';

export default function StudentDashboard({ onAttemptTutorPage }) {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();

  const [studentProfile, setStudentProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    async function loadStudentProfile() {
      try {
        const res = await authFetch('/students/profile/me');
        if (res.ok) {
          const data = await res.json();
          setStudentProfile(data.student);
        }
      } catch (err) {
        console.error('Failed to load student profile for me:', err);
      } finally {
        setProfileLoading(false);
      }
    }
    loadStudentProfile();
  }, [authFetch]);

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
              <span className="milestone-badge">Milestone 3 Verified</span>
            </div>
            <h1 className="dashboard-title">Welcome back, {user?.name || 'Sam'}</h1>
            <p className="dashboard-subtitle">
              You have student access. You can view your enrolled subjects, learning goals, scheduled sessions, and AI summaries.
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

      {/* Enrolled Student Profile Overview (Milestone 3) */}
      <div className="dashboard-section">
        <h2 className="section-title">My Academic Profile & Learning Goals</h2>
        {profileLoading ? (
          <div className="student-profile-summary-card loading">
            <RefreshCw size={20} className="spin" />
            <span>Loading your academic profile...</span>
          </div>
        ) : studentProfile ? (
          <div className="student-profile-summary-card">
            <div className="summary-header">
              <div className="summary-badges">
                <span className="badge-subject-lg">
                  <BookOpen size={14} />
                  {studentProfile.subject}
                </span>
                <span className="badge-level-lg">
                  <GraduationCap size={14} />
                  {studentProfile.currentLevel}
                </span>
              </div>
              <span className="summary-linked-badge">
                <CheckCircle2 size={13} /> Active Enrollment
              </span>
            </div>

            <div className="summary-grid">
              {/* Target Learning Goals */}
              <div className="summary-col">
                <h4 className="summary-col-title">
                  <Target size={16} className="text-accent" />
                  <span>Target Learning Goals ({studentProfile.learningGoals?.length || 0})</span>
                </h4>
                {studentProfile.learningGoals && studentProfile.learningGoals.length > 0 ? (
                  <div className="summary-chips-list">
                    {studentProfile.learningGoals.map((goal, idx) => (
                      <div key={idx} className="summary-chip goal">
                        <div className="bullet-dot goal" />
                        <span>{goal}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-subtext">No specific goals set yet.</p>
                )}
              </div>

              {/* Weak Areas & Focus Topics */}
              <div className="summary-col">
                <h4 className="summary-col-title">
                  <AlertTriangle size={16} className="text-warning" />
                  <span>Areas Needing Practice ({studentProfile.weakAreas?.length || 0})</span>
                </h4>
                {studentProfile.weakAreas && studentProfile.weakAreas.length > 0 ? (
                  <div className="summary-chips-list">
                    {studentProfile.weakAreas.map((area, idx) => (
                      <div key={idx} className="summary-chip weak">
                        <div className="bullet-dot weak" />
                        <span>{area}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-subtext">No weak areas flagged yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="student-profile-summary-card empty">
            <p>No student academic profile is linked to your user account yet.</p>
          </div>
        )}
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

          <div className="preview-card live-card">
            <div className="preview-card-header">
              <div className="preview-icon-box" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06B6D4' }}>
                <BookOpen size={20} />
              </div>
              <span className="preview-tag-next" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
                Milestone 3 Live
              </span>
            </div>
            <h3 className="preview-card-title">Academic Profile</h3>
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
