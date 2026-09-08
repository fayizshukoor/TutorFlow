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
  Save,
  CheckSquare,
  Square,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sessionApi } from '../../services/api';

export default function SessionWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const isTutor = user?.role === 'tutor';
  const isStudent = user?.role === 'student';

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notes state & autosave
  const [notesText, setNotesText] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const debounceTimerRef = useRef(null);
  const lastSavedNotesRef = useRef('');

  // AI Review state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState(null);
  const [checkedTasks, setCheckedTasks] = useState({});

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
      if (!isTutor || text === lastSavedNotesRef.current) {
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
    [id, isTutor]
  );

  // Handle live typing with debounced autosave
  const handleNotesChange = (e) => {
    if (!isTutor) return;
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
    if (!isTutor) return;
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

  // Handle Gemini AI Review Generation
  const handleGenerateAiReview = async (regenerate = false) => {
    if (!isTutor) return;
    setAiGenerating(true);
    setAiError(null);
    setAiSuccessMessage(null);
    try {
      const { ok, data } = await sessionApi.generateAiReview(id, { regenerate });
      if (!ok) {
        throw new Error(data.message || data.error || 'Failed to generate AI review.');
      }
      setSession(data.session);
      setAiSuccessMessage('Gemini AI review and homework generated successfully!');
      setTimeout(() => setAiSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Generate AI review error:', err);
      setAiError(err.message || 'An error occurred while generating the AI review.');
    } finally {
      setAiGenerating(false);
    }
  };

  const toggleHomeworkTask = (index) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
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
            <Link to={isStudent ? '/student' : '/tutor/sessions'} className="btn-primary-auth">
              <ArrowLeft size={16} /> Return to {isStudent ? 'Dashboard' : 'Sessions'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const student = session.studentId;
  const tutor = session.tutorId;
  const isNotesEditable = isTutor && session.status === 'in_progress';
  const isCompleted = session.status === 'completed' || session.status === 'ai_reviewed';
  const isAiReviewed = session.status === 'ai_reviewed';
  const aiReview = session.aiReview;

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
        <Link to={isStudent ? '/student' : '/tutor/sessions'} className="btn-back">
          <ArrowLeft size={16} />
          <span>Back to {isStudent ? 'Student Dashboard' : 'Sessions'}</span>
        </Link>

        {isTutor && student?._id && (
          <Link
            to={`/tutor/students/${student.id || student._id}`}
            className="btn-workspace-link"
          >
            <User size={14} />
            <span>View Student Profile</span>
          </Link>
        )}

        {isStudent && (
          <div className="student-view-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <GraduationCap size={16} className="text-accent" />
            <span>Student Lesson Workspace</span>
          </div>
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
                <strong>{isStudent ? 'Tutor:' : 'Student:'}</strong> {isStudent ? (tutor?.name || 'Alex Rivera') : (student?.name || 'Assigned Student')}
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

        {/* State Machine Action Controls for Tutor */}
        {isTutor && (
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

            {session.status === 'completed' && (
              <button
                onClick={() => handleGenerateAiReview(false)}
                className="btn-ai-generate"
                disabled={aiGenerating}
              >
                <Sparkles size={16} />
                <span>{aiGenerating ? 'Generating Review...' : 'Generate AI Review'}</span>
              </button>
            )}

            {isAiReviewed && (
              <div className="badge-status-active" style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}>
                <CheckCircle2 size={15} /> AI Reviewed
              </div>
            )}
          </div>
        )}

        {isStudent && (
          <div className="workspace-actions-group">
            <span className={`status-pill ${session.status}`} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
              <span className="status-dot" />
              {session.status === 'ai_reviewed' ? 'AI Review Available' : session.status.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* AI Success / Error Alerts */}
      {aiSuccessMessage && (
        <div className="form-alert" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#6EE7B7', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{aiSuccessMessage}</span>
        </div>
      )}

      {aiError && (
        <div className="form-alert error" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={16} />
          <span>{aiError}</span>
          {isTutor && (
            <button
              onClick={() => handleGenerateAiReview(session.status === 'ai_reviewed')}
              className="btn-secondary"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', marginLeft: 'auto' }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* AI Generating In-Progress State */}
      {aiGenerating && (
        <div className="ai-generating-container" style={{ marginBottom: '1.75rem' }}>
          <div className="spinner-large" />
          <p className="ai-generating-text">Synthesizing Session with Gemini AI...</p>
          <p className="ai-generating-hint">
            Analyzing session topic, whiteboard notes, and student learning goals to generate structured feedback and custom homework.
          </p>
        </div>
      )}

      {/* Milestone 5: Gemini AI Review & Homework Section */}
      {(aiReview || session.aiSummary) && (
        <div className="ai-review-card">
          {/* Header */}
          <div className="ai-review-header">
            <div className="ai-header-left">
              <div className="ai-sparkle-icon-wrap">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="ai-header-title">Gemini AI Lesson Review & Homework</h3>
                <p className="ai-header-subtitle">
                  AI-synthesized pedagogical analysis and actionable student follow-up
                </p>
              </div>
            </div>

            <div className="ai-meta-pills">
              <span className="ai-model-tag">
                <Sparkles size={12} /> {aiReview?.modelUsed || 'Gemini Flash'}
              </span>
              {aiReview?.generatedAt && (
                <span className="form-hint" style={{ fontSize: '0.75rem' }}>
                  Generated {new Date(aiReview.generatedAt).toLocaleDateString()}
                </span>
              )}
              {isTutor && (
                <button
                  onClick={() => handleGenerateAiReview(true)}
                  className="btn-ai-regenerate"
                  disabled={aiGenerating}
                  title="Regenerate with Gemini AI"
                >
                  <RefreshCw size={13} className={aiGenerating ? 'spin' : ''} />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          </div>

          {/* Executive Summary */}
          {aiReview?.summary && (
            <div className="ai-summary-box">
              <div className="ai-summary-label">
                <FileText size={13} /> Executive Summary
              </div>
              <p style={{ margin: 0, color: '#F1F5F9' }}>{aiReview.summary}</p>

              {aiReview.keyTopicsCovered?.length > 0 && (
                <div className="ai-topics-row">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Covered:</span>
                  {aiReview.keyTopicsCovered.map((topicItem, idx) => (
                    <span key={idx} className="ai-topic-pill">
                      <BookOpen size={11} className="text-accent" /> {topicItem}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2-Column Strengths vs Improvements Grid */}
          <div className="ai-grid-2col">
            {/* Student Strengths */}
            <div className="ai-pedagogy-col">
              <h4 className="ai-col-heading" style={{ color: '#34D399' }}>
                <CheckCircle2 size={16} />
                <span>Demonstrated Strengths ({aiReview?.studentStrengths?.length || 0})</span>
              </h4>
              <div className="ai-bullet-list">
                {aiReview?.studentStrengths?.length > 0 ? (
                  aiReview.studentStrengths.map((str, idx) => (
                    <div key={idx} className="ai-bullet-item strength">
                      <div className="ai-bullet-dot strength">
                        <Check size={11} />
                      </div>
                      <span>{str}</span>
                    </div>
                  ))
                ) : (
                  <p className="empty-subtext">No specific strengths recorded.</p>
                )}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="ai-pedagogy-col">
              <h4 className="ai-col-heading" style={{ color: '#FBBF24' }}>
                <AlertTriangle size={16} />
                <span>Areas Needing Practice ({aiReview?.areasForImprovement?.length || 0})</span>
              </h4>
              <div className="ai-bullet-list">
                {aiReview?.areasForImprovement?.length > 0 ? (
                  aiReview.areasForImprovement.map((area, idx) => (
                    <div key={idx} className="ai-bullet-item weakness">
                      <div className="ai-bullet-dot weakness">
                        !
                      </div>
                      <span>{area}</span>
                    </div>
                  ))
                ) : (
                  <p className="empty-subtext">No specific improvement areas flagged.</p>
                )}
              </div>
            </div>
          </div>

          {/* Recommended Next Steps */}
          {aiReview?.recommendedNextSteps?.length > 0 && (
            <div className="ai-pedagogy-col" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.25)' }}>
              <h4 className="ai-col-heading" style={{ color: '#818CF8' }}>
                <ArrowRight size={16} />
                <span>Recommended Next Steps & Action Items</span>
              </h4>
              <div className="ai-bullet-list">
                {aiReview.recommendedNextSteps.map((step, idx) => (
                  <div key={idx} className="ai-bullet-item nextstep">
                    <div className="ai-bullet-dot nextstep">
                      <Sparkles size={11} />
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Homework Assignment Card */}
          {aiReview?.homework && (
            <div className="homework-card">
              <div className="homework-header">
                <div className="homework-title-wrap">
                  <span className="homework-badge">
                    <BookOpen size={12} /> Homework Assignment
                  </span>
                  <h4 className="homework-title">{aiReview.homework.title}</h4>
                </div>
                <span className="form-hint" style={{ fontSize: '0.8rem' }}>
                  {isStudent ? 'Track your practice tasks below' : 'Assigned to student'}
                </span>
              </div>

              {aiReview.homework.description && (
                <p className="homework-desc">{aiReview.homework.description}</p>
              )}

              {aiReview.homework.tasks?.length > 0 && (
                <div className="homework-tasks-list">
                  {aiReview.homework.tasks.map((task, idx) => {
                    const isChecked = Boolean(checkedTasks[idx]);
                    return (
                      <div
                        key={idx}
                        className={`homework-task-row ${isChecked ? 'checked-task' : ''}`}
                        onClick={() => toggleHomeworkTask(idx)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={`homework-checkbox ${isChecked ? 'checked' : ''}`}>
                          <Check size={12} />
                        </div>
                        <span style={{ flex: 1 }}>{task}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Fallback aiSummary string if aiReview object is not formatted */}
          {!aiReview && session.aiSummary && (
            <div className="ai-summary-box">
              <div className="ai-summary-label">
                <Sparkles size={13} /> AI Summary & Notes
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{session.aiSummary}</div>
            </div>
          )}
        </div>
      )}

      {/* 2-Column Workspace Grid: Notes & Reference Sidebar */}
      <div className="workspace-grid" style={{ marginTop: '2rem' }}>
        {/* Left Column: Live Notes Editor */}
        <div className="notes-card">
          <div className="notes-header-bar">
            <div className="notes-title-group">
              <FileText size={18} className="meta-icon-accent" />
              <h3 className="notes-title">Tutor Session Notes</h3>
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
                  <Lock size={12} /> Finalized notes
                </span>
              )}
            </div>
          </div>

          {/* Conditional Guidance Banners */}
          {session.status === 'scheduled' && (
            <div className="notes-scheduled-banner">
              <Clock size={16} />
              <span>
                {isTutor
                  ? <>Notes can only be edited while a session is <strong>in progress</strong>. Click <strong>Start Live Session</strong> above when you are ready.</>
                  : <>Lesson notes will be recorded by your tutor once the session begins.</>}
              </span>
            </div>
          )}

          {isCompleted && (
            <div className="notes-locked-banner">
              <Lock size={16} />
              <span>
                This session has been completed. Notes are permanently saved for student review and AI review generation.
              </span>
            </div>
          )}

          {/* Text Area */}
          <textarea
            className="notes-textarea"
            placeholder={
              isNotesEditable
                ? 'Type live notes during the session... Autosave will save your changes continuously.'
                : 'No live notes were recorded for this session.'
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
                <h4 className="card-title" style={{ fontSize: '1rem' }}>
                  {isStudent ? 'My Enrolled Objectives' : 'Student Objectives'}
                </h4>
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
