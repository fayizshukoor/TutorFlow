import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  Bot,
  Shield,
  Lock,
  ArrowRight,
  Target,
  AlertTriangle,
  GraduationCap,
  CheckCircle2,
  RefreshCw,
  FileText,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentApi, sessionApi } from '../../services/api';
import RoleTester from './RoleTester';

export default function StudentDashboard({ onAttemptTutorPage }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [studentProfile, setStudentProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [selectedNotesSession, setSelectedNotesSession] = useState(null);

  const loadData = useCallback(async () => {
    setProfileLoading(true);
    setSessionsLoading(true);
    try {
      const [profileRes, sessionsRes] = await Promise.all([
        studentApi.getMyProfile(),
        sessionApi.getMySessions()
      ]);

      if (profileRes.ok) {
        setStudentProfile(profileRes.data.student);
      }
      if (sessionsRes.ok) {
        setSessions(sessionsRes.data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setProfileLoading(false);
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAttemptTutor = () => {
    if (onAttemptTutorPage) {
      onAttemptTutorPage();
    } else {
      navigate('/tutor');
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const upcomingSessions = sessions.filter(
    (s) => s.status === 'scheduled' || s.status === 'in_progress'
  );
  const pastSessions = sessions.filter(
    (s) => s.status === 'completed' || s.status === 'ai_reviewed'
  );

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
              <span className="milestone-badge">Milestone 4 Verified</span>
            </div>
            <h1 className="dashboard-title">Welcome back, {user?.name || 'Sam'}</h1>
            <p className="dashboard-subtitle">
              You have student access. You can view your enrolled subjects, learning goals, scheduled 1-on-1 sessions, and finalized lesson notes.
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

      {/* Milestone 4: My Tutoring Sessions (Upcoming & Completed) */}
      <div className="dashboard-section">
        <div className="roster-header-row">
          <div>
            <div className="roster-pill-row">
              <span className="badge-subject">
                <Calendar size={13} />
                Milestone 4 Live
              </span>
            </div>
            <h2 className="section-title" style={{ marginBottom: 0 }}>My Tutoring Sessions</h2>
            <p className="sessions-subtitle">
              Upcoming scheduled sessions and post-lesson notes provided by your tutor
            </p>
          </div>

          <button
            onClick={loadData}
            className="btn-refresh-icon"
            title="Refresh sessions"
            disabled={sessionsLoading}
          >
            <RefreshCw size={14} className={sessionsLoading ? 'spinning' : ''} />
          </button>
        </div>

        {sessionsLoading ? (
          <div className="student-profile-summary-card loading">
            <RefreshCw size={20} className="spin" />
            <span>Loading scheduled sessions...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="roster-empty-card">
            <div className="empty-icon-wrap">
              <Calendar size={28} />
            </div>
            <h3 className="empty-title">No Sessions Scheduled Yet</h3>
            <p className="empty-desc">
              Your tutor hasn't scheduled any upcoming sessions for you. They will appear here once booked.
            </p>
          </div>
        ) : (
          <div className="sessions-cards-grid">
            {sessions.map((session) => {
              const sid = session.id || session._id;
              return (
                <div key={sid} className="session-card">
                  <div className="session-card-header">
                    <div>
                      <h3 className="session-topic-title">{session.topic}</h3>
                      <div className="session-student-row">
                        <span>Tutor: {session.tutorId?.name || 'Alex Rivera'}</span>
                      </div>
                    </div>

                    <span className={`status-pill ${session.status}`}>
                      <span className="status-dot" />
                      {session.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="session-meta-grid">
                    <div className="session-meta-item">
                      <Calendar size={14} className="meta-icon-accent" />
                      <span>{formatDateTime(session.scheduledAt)}</span>
                    </div>
                    <div className="session-meta-item">
                      <Clock size={14} className="meta-icon-accent" />
                      <span>{session.durationMinutes} Minutes</span>
                    </div>
                  </div>

                  {session.notes ? (
                    <div className="session-notes-snippet">
                      <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {session.notes}
                    </div>
                  ) : (
                    <div className="empty-subtext" style={{ fontSize: '0.8rem' }}>
                      {session.status === 'scheduled'
                        ? 'Lesson notes will be recorded during the live session.'
                        : 'No notes recorded for this session.'}
                    </div>
                  )}

                  <div className="session-card-actions">
                    <span className="form-hint">
                      {session.status === 'ai_reviewed' ? (
                        session.aiReview?.homework?.tasks?.length > 0 ? (
                          <span style={{ color: '#C084FC', fontWeight: 600 }}>
                            📝 Homework: {(session.homeworkProgress || []).filter((p) => p.completed && p.taskIndex < session.aiReview.homework.tasks.length).length} of {session.aiReview.homework.tasks.length} completed
                          </span>
                        ) : '✨ AI Review & Homework Ready'
                      ) : session.status === 'in_progress' ? '⚡ Live session in progress' : 'Read-only access'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Link
                        to={`/student/sessions/${sid}`}
                        className="btn-view-profile"
                        style={{ padding: '0.35rem 0.75rem', background: session.status === 'ai_reviewed' ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))' : undefined }}
                      >
                        {session.status === 'ai_reviewed' ? <Sparkles size={13} className="text-accent" /> : <FileText size={13} />}
                        <span>{session.status === 'ai_reviewed' ? 'View AI Review & Homework' : 'Open Workspace'}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

      {/* Notes Reader Modal */}
      {selectedNotesSession && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge" style={{ background: 'linear-gradient(135deg, #06B6D4, #3B82F6)' }}>
                  <FileText size={22} />
                </div>
                <div>
                  <h3 className="modal-title">Session Lesson Notes</h3>
                  <p className="modal-subtitle">{selectedNotesSession.topic}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotesSession(null)}
                className="btn-modal-close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="notes-card" style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                <span>Date: {formatDateTime(selectedNotesSession.scheduledAt)}</span>
                <span className={`status-pill ${selectedNotesSession.status}`}>
                  {selectedNotesSession.status.replace('_', ' ')}
                </span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.925rem', color: 'var(--text-main)' }}>
                {selectedNotesSession.notes || 'No notes available.'}
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setSelectedNotesSession(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Auth & Role Verification Widget */}
      <div className="dashboard-section">
        <RoleTester />
      </div>
    </div>
  );
}
