import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  BookOpen,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Sparkles,
  Target,
  AlertTriangle,
  RefreshCw,
  Check,
  Save
} from 'lucide-react';
import { sessionApi } from '../../services/api';

export default function SessionWorkspace() {
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notes state & autosave
  const [notesText, setNotesText] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const debounceTimerRef = useRef(null);
  const lastSavedNotesRef = useRef('');

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { ok, data } = await sessionApi.getById(id);
      if (!ok) {
        throw new Error(data.message || data.error || 'Failed to load session workspace.');
      }
      setSession(data.session);
      setNotesText(data.session.notes || '');
      lastSavedNotesRef.current = data.session.notes || '';
      setSaveStatus('saved');
    } catch (err) {
      console.error('Fetch session workspace error:', err);
      setError(err.message || 'Failed to retrieve session details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Save notes helper
  const saveNotesToServer = useCallback(
    async (text) => {
      if (text === lastSavedNotesRef.current) {
        setSaveStatus('saved');
        return;
      }

      setSaveStatus('saving');
      try {
        const { ok, data } = await sessionApi.updateNotes(id, text);
        if (!ok) {
          throw new Error(data.message || 'Failed to auto-save notes.');
        }
        lastSavedNotesRef.current = text;
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave notes error:', err);
        setSaveStatus('error');
      }
    },
    [id]
  );

  // Handle live typing with debounced autosave
  const handleNotesChange = (e) => {
    const text = e.target.value;
    setNotesText(text);

    if (session?.status !== 'in_progress') {
      return;
    }

    setSaveStatus('unsaved');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveNotesToServer(text);
    }, 800);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle Lifecycle Status Transition
  const handleStatusChange = async (targetStatus) => {
    setStatusActionLoading(true);
    try {
      // If transitioning away from in_progress, ensure any pending notes are flushed first
      if (session.status === 'in_progress' && notesText !== lastSavedNotesRef.current) {
        await saveNotesToServer(notesText);
      }

      const { ok, data } = await sessionApi.updateStatus(id, targetStatus);
      if (!ok) {
        alert(data.message || 'Failed to update session status.');
        return;
      }
      setSession(data.session);
    } catch (err) {
      console.error('Status update error:', err);
      alert('An error occurred during lifecycle transition.');
    } finally {
      setStatusActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="profile-loading-box">
          <div className="spinner-large" />
          <p className="loading-text">Loading session workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="dashboard-container">
        <div className="profile-error-card">
          <div className="error-icon-box">
            <AlertCircle size={32} />
          </div>
          <h2 className="error-title">Session Not Found</h2>
          <p className="error-desc">{error || 'Session could not be located or you lack authorization.'}</p>
          <div className="error-actions">
            <Link to="/tutor/sessions" className="btn-primary-auth">
              <ArrowLeft size={16} /> Return to Sessions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const student = session.studentId;
  const isNotesEditable = session.status === 'in_progress';
  const isCompleted = session.status === 'completed' || session.status === 'ai_reviewed';

  const formatLocalTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="dashboard-container">
      {/* Top Nav */}
      <div className="profile-nav-bar">
        <Link to="/tutor/sessions" className="btn-back">
          <ArrowLeft size={16} />
          <span>Back to Sessions</span>
        </Link>

        {student?._id && (
          <Link
            to={`/tutor/students/${student.id || student._id}`}
            className="btn-workspace-link"
          >
            <User size={14} />
            <span>View Student Profile</span>
          </Link>
        )}
      </div>

      {/* Main Header Card */}
      <div className="workspace-header-card">
        <div className="workspace-header-main">
          <div className="workspace-icon-box">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="roster-pill-row" style={{ marginBottom: '0.3rem' }}>
              <span className={`status-pill ${session.status}`}>
                <span className="status-dot" />
                {session.status.replace('_', ' ')}
              </span>
              {student?.subject && (
                <span className="badge-subject">
                  <BookOpen size={12} /> {student.subject}
                </span>
              )}
            </div>
            <h1 className="workspace-topic-title">{session.topic}</h1>
            <div className="workspace-meta-row">
              <span>
                <strong>Student:</strong> {student?.name || 'Assigned Student'}
              </span>
              <span>•</span>
              <span>
                <Calendar size={13} style={{ display: 'inline', marginRight: '3px' }} />
                {formatLocalTime(session.scheduledAt)}
              </span>
              <span>•</span>
              <span>
                <Clock size={13} style={{ display: 'inline', marginRight: '3px' }} />
                {session.durationMinutes} min
              </span>
            </div>
          </div>
        </div>

        {/* State Machine Action Controls */}
        <div className="workspace-actions-group">
          {session.status === 'scheduled' && (
            <button
              onClick={() => handleStatusChange('in_progress')}
              className="btn-primary-schedule"
              disabled={statusActionLoading}
            >
              <Play size={16} />
              <span>{statusActionLoading ? 'Starting...' : 'Start Live Session'}</span>
            </button>
          )}

          {session.status === 'in_progress' && (
            <button
              onClick={() => handleStatusChange('completed')}
              className="btn-primary-enroll"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
              disabled={statusActionLoading}
            >
              <CheckCircle2 size={16} />
              <span>{statusActionLoading ? 'Finalizing...' : 'Complete Session'}</span>
            </button>
          )}

          {isCompleted && (
            <div className="badge-status-active" style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}>
              <CheckCircle2 size={15} /> Session Finalized (Read-Only)
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Workspace Grid */}
      <div className="workspace-grid">
        {/* Left Column: Live Notes Editor */}
        <div className="notes-card">
          <div className="notes-header-bar">
            <div className="notes-title-group">
              <FileText size={18} className="meta-icon-accent" />
              <h3 className="notes-title">Session Live Notes</h3>
            </div>

            {/* Autosave Indicator */}
            <div>
              {isNotesEditable && (
                <>
                  {saveStatus === 'saving' && (
                    <span className="autosave-badge saving">
                      <div className="spinner-sm" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                      Saving...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="autosave-badge saved">
                      <Check size={13} /> Saved just now
                    </span>
                  )}
                  {saveStatus === 'unsaved' && (
                    <span className="autosave-badge unsaved">
                      • Unsaved changes
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="autosave-badge unsaved" style={{ color: '#F87171' }}>
                      <AlertCircle size={13} /> Save failed
                    </span>
                  )}
                </>
              )}

              {isCompleted && (
                <span className="autosave-badge locked">
                  <Lock size={12} /> Read-only notes
                </span>
              )}
            </div>
          </div>

          {/* Conditional Guidance Banners */}
          {session.status === 'scheduled' && (
            <div className="notes-scheduled-banner">
              <Clock size={16} />
              <span>
                Notes can only be edited while a session is <strong>in progress</strong>. Click <strong>Start Live Session</strong> above when you are ready to begin.
              </span>
            </div>
          )}

          {isCompleted && (
            <div className="notes-locked-banner">
              <Lock size={16} />
              <span>
                This session has been completed. Notes are now finalized and permanently stored for student review.
              </span>
            </div>
          )}

          {/* Text Area */}
          <textarea
            className="notes-textarea"
            placeholder={
              isNotesEditable
                ? 'Type live notes during the session... Autosave will save your changes continuously.'
                : 'No notes were recorded for this session.'
            }
            value={notesText}
            onChange={handleNotesChange}
            disabled={!isNotesEditable}
          />

          {isNotesEditable && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => saveNotesToServer(notesText)}
                disabled={saveStatus === 'saving'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              >
                <Save size={13} />
                <span>Save Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Student Reference Sidebar */}
        <div className="workspace-student-card">
          <div className="profile-card-header" style={{ paddingBottom: '0.6rem' }}>
            <div className="card-title-group">
              <div className="card-icon-wrap goal">
                <Target size={16} />
              </div>
              <div>
                <h4 className="card-title" style={{ fontSize: '1rem' }}>Student Objectives</h4>
                <p className="card-subtitle">{student?.name || 'Student'}</p>
              </div>
            </div>
          </div>

          {/* Target Goals */}
          <div style={{ marginBottom: '0.5rem' }}>
            <span className="target-label" style={{ marginBottom: '0.4rem' }}>
              <Target size={13} /> Target Learning Goals
            </span>
            {student?.learningGoals?.length > 0 ? (
              <div className="goals-list" style={{ gap: '0.4rem' }}>
                {student.learningGoals.map((g, idx) => (
                  <div key={idx} className="goal-item" style={{ padding: '0.5rem 0.75rem', fontSize: '0.825rem' }}>
                    <div className="goal-icon-bullet" style={{ width: 16, height: 16 }}>
                      <Check size={10} />
                    </div>
                    <span>{g}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-subtext">No goals defined.</p>
            )}
          </div>

          {/* Weak Areas */}
          <div>
            <span className="target-label" style={{ marginBottom: '0.4rem' }}>
              <AlertTriangle size={13} className="text-warning" /> Weak Areas & Focus
            </span>
            {student?.weakAreas?.length > 0 ? (
              <div className="weak-areas-list" style={{ gap: '0.4rem' }}>
                {student.weakAreas.map((w, idx) => (
                  <div key={idx} className="weak-item" style={{ padding: '0.5rem 0.75rem', fontSize: '0.825rem' }}>
                    <div className="weak-pill-bullet" style={{ width: 16, height: 16, fontSize: '0.7rem' }}>
                      !
                    </div>
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-subtext">No weak areas specified.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
