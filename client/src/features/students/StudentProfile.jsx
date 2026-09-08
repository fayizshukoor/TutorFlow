import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  BookOpen,
  GraduationCap,
  Target,
  AlertTriangle,
  Calendar,
  Sparkles,
  Edit3,
  Check,
  X,
  Plus,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ListChecks,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { studentApi, sessionApi } from '../../services/api';
import SessionScheduleModal from '../sessions/SessionScheduleModal';

export default function StudentProfile() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [studentSessions, setStudentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    subject: '',
    currentLevel: ''
  });
  const [editGoals, setEditGoals] = useState([]);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [editWeakAreas, setEditWeakAreas] = useState([]);
  const [newWeakInput, setNewWeakInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);

  // AI Plan modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planGenerating, setPlanGenerating] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [activePlanSession, setActivePlanSession] = useState(null);

  // AI Progress Summary state
  const [summaryGenerating, setSummaryGenerating] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, sessionsRes] = await Promise.all([
        studentApi.getById(id),
        sessionApi.getAll({ studentId: id })
      ]);

      if (!profileRes.ok) {
        throw new Error(profileRes.data?.message || profileRes.data?.error || 'Could not load student profile.');
      }

      setStudent(profileRes.data.student);
      if (sessionsRes.ok) {
        setStudentSessions(sessionsRes.data.sessions || []);
      }

      setEditFormData({
        name: profileRes.data.student.name || '',
        email: profileRes.data.student.email || '',
        subject: profileRes.data.student.subject || '',
        currentLevel: profileRes.data.student.currentLevel || ''
      });
      setEditGoals(profileRes.data.student.learningGoals || []);
      setEditWeakAreas(profileRes.data.student.weakAreas || []);
    } catch (err) {
      console.error('Fetch student error:', err);
      setError(err.message || 'Failed to retrieve student profile.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  // AI Plan generation handler
  const handleTriggerAiPlan = async (targetSession = null) => {
    setPlanError(null);
    const sessionToUse = targetSession || studentSessions.find(
      (s) => s.status === 'scheduled' || s.status === 'in_progress'
    );

    if (!sessionToUse) {
      setActivePlanSession(null);
      setPlanModalOpen(true);
      return;
    }

    setActivePlanSession(sessionToUse);
    setPlanModalOpen(true);

    if (!sessionToUse.aiPlan?.lessonOutline?.length) {
      await generatePlanForSession(sessionToUse.id || sessionToUse._id);
    }
  };

  const generatePlanForSession = async (sessionId) => {
    setPlanGenerating(true);
    setPlanError(null);
    try {
      const { ok, data } = await sessionApi.generateAiPlan(sessionId);
      if (!ok) {
        throw new Error(data.message || data.error || 'Failed to generate AI session plan.');
      }
      setActivePlanSession(data.session);
      setStudentSessions((prev) =>
        prev.map((s) => ((s.id || s._id) === sessionId ? data.session : s))
      );
    } catch (err) {
      console.error('AI Plan generation error:', err);
      setPlanError(err.message || 'AI Plan generation failed. Please click Retry.');
    } finally {
      setPlanGenerating(false);
    }
  };

  // AI Progress Summary generation handler
  const handleGenerateProgressSummary = async () => {
    setSummaryGenerating(true);
    setSummaryError(null);
    try {
      const { ok, data } = await studentApi.generateProgressSummary(id);
      if (!ok) {
        throw new Error(data.message || data.error || 'Failed to generate student progress summary.');
      }
      setStudent(data.student);
    } catch (err) {
      console.error('AI Progress Summary generation error:', err);
      setSummaryError(err.message || 'Progress summary generation failed. Please click Retry.');
    } finally {
      setSummaryGenerating(false);
    }
  };

  // Handle Edit input changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (saveError) setSaveError(null);
  };

  const handleAddGoal = (e) => {
    e?.preventDefault();
    const trimmed = newGoalInput.trim();
    if (trimmed && !editGoals.includes(trimmed)) {
      setEditGoals([...editGoals, trimmed]);
      setNewGoalInput('');
    }
  };

  const handleRemoveGoal = (index) => {
    setEditGoals(editGoals.filter((_, i) => i !== index));
  };

  const handleAddWeakArea = (e) => {
    e?.preventDefault();
    const trimmed = newWeakInput.trim();
    if (trimmed && !editWeakAreas.includes(trimmed)) {
      setEditWeakAreas([...editWeakAreas, trimmed]);
      setNewWeakInput('');
    }
  };

  const handleRemoveWeakArea = (index) => {
    setEditWeakAreas(editWeakAreas.filter((_, i) => i !== index));
  };

  const handleCancelEdit = () => {
    if (student) {
      setEditFormData({
        name: student.name || '',
        email: student.email || '',
        subject: student.subject || '',
        currentLevel: student.currentLevel || ''
      });
      setEditGoals(student.learningGoals || []);
      setEditWeakAreas(student.weakAreas || []);
    }
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditing(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    // Validations
    if (!editFormData.name.trim()) {
      setSaveError('Student name is required.');
      return;
    }
    if (!editFormData.email.trim()) {
      setSaveError('Student email is required.');
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(editFormData.email.trim())) {
      setSaveError('Please enter a valid email address.');
      return;
    }
    if (!editFormData.subject.trim()) {
      setSaveError('Subject is required.');
      return;
    }
    if (!editFormData.currentLevel.trim()) {
      setSaveError('Academic level is required.');
      return;
    }

    setSaving(true);
    try {
      const { ok, data } = await studentApi.update(id, {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        subject: editFormData.subject.trim(),
        currentLevel: editFormData.currentLevel.trim(),
        learningGoals: editGoals,
        weakAreas: editWeakAreas
      });

      if (!ok) {
        throw new Error(data.message || data.error || 'Failed to update student profile.');
      }

      setStudent(data.student);
      setSaveSuccess('Student profile updated successfully!');
      setTimeout(() => {
        setIsEditing(false);
        setSaveSuccess(null);
      }, 900);
    } catch (err) {
      console.error('Update student error:', err);
      setSaveError(err.message || 'An error occurred while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="profile-loading-box">
          <div className="spinner-large" />
          <p className="loading-text">Loading student profile details...</p>
        </div>
      </div>
    );
  }

  // 2. Error / Not Found State
  if (error || !student) {
    return (
      <div className="dashboard-container">
        <div className="profile-error-card">
          <div className="error-icon-box">
            <AlertTriangle size={32} />
          </div>
          <h2 className="error-title">Student Profile Not Found</h2>
          <p className="error-desc">
            {error || 'This student profile could not be found or you do not have permission to access it.'}
          </p>
          <div className="error-actions">
            <Link to="/tutor/students" className="btn-primary-auth" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeft size={16} />
              <span>Return to Student Roster</span>
            </Link>
            <button onClick={fetchStudent} className="btn-retry">
              <RefreshCw size={15} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const initials = student.name
    ? student.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'ST';

  const formattedCreatedDate = student.createdAt
    ? new Date(student.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Enrolled recently';

  return (
    <div className="dashboard-container">
      {/* Top Breadcrumb Navigation */}
      <div className="profile-nav-bar">
        <Link to="/tutor/students" className="btn-back">
          <ArrowLeft size={16} />
          <span>Back to Student Roster</span>
        </Link>
        
        <div className="profile-actions-top">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-edit-profile"
              title="Edit student profile"
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={handleCancelEdit}
              className="btn-cancel-edit"
              disabled={saving}
            >
              <X size={15} />
              <span>Cancel Editing</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Student Header Card */}
      <div className="student-profile-header-card">
        <div className="student-header-left">
          <div className="student-avatar-lg">
            {initials}
          </div>
          <div className="student-header-info">
            <div className="student-badge-row">
              <span className="badge-subject-lg">
                <BookOpen size={13} />
                {student.subject}
              </span>
              <span className="badge-level-lg">
                <GraduationCap size={13} />
                {student.currentLevel}
              </span>
              <span className="badge-status-active">
                <ShieldCheck size={13} />
                Enrolled
              </span>
            </div>
            <h1 className="student-profile-name">{student.name}</h1>
            <div className="student-meta-row">
              <span className="student-meta-item">
                <Mail size={14} className="meta-icon" />
                <span>{student.email}</span>
              </span>
              <span className="meta-dot">•</span>
              <span className="student-meta-item">
                <Clock size={14} className="meta-icon" />
                <span>Enrolled on {formattedCreatedDate}</span>
              </span>
            </div>
          </div>
        </div>

        {/* User-friendly summary box without exposing internal ObjectIDs */}
        <div className="student-id-box">
          <div className="meta-row">
            <span className="meta-label">Enrollment:</span>
            <span className="meta-val status-active">Active</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Focus Subject:</span>
            <span className="meta-val">{student.subject}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Assigned Tutor:</span>
            <span className="meta-val">Alex Rivera</span>
          </div>
        </div>
      </div>

      {/* Edit Mode vs View Mode */}
      {isEditing ? (
        /* ================== EDIT FORM ================== */
        <div className="profile-edit-section">
          <div className="edit-card">
            <div className="edit-card-header">
              <div className="edit-title-group">
                <div className="edit-icon-wrap">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="edit-title">Edit Student Profile</h3>
                  <p className="edit-subtitle">Update academic details, goals, and focus areas</p>
                </div>
              </div>
              <span className="immutable-pill">
                <ShieldCheck size={13} /> Student Record Protected
              </span>
            </div>

            {saveError && (
              <div className="form-alert error">
                <AlertTriangle size={16} />
                <span>{saveError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="form-alert success">
                <CheckCircle2 size={16} />
                <span>{saveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="edit-profile-form">
              {/* Name and Email */}
              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-name">
                    Student Full Name <span className="req">*</span>
                  </label>
                  <input
                    id="edit-name"
                    name="name"
                    type="text"
                    className="form-input-clean"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-email">
                    Student Email Address <span className="req">*</span>
                  </label>
                  <input
                    id="edit-email"
                    name="email"
                    type="email"
                    className="form-input-clean"
                    value={editFormData.email}
                    onChange={handleEditChange}
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Subject and Level */}
              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-subject">
                    Subject <span className="req">*</span>
                  </label>
                  <input
                    id="edit-subject"
                    name="subject"
                    type="text"
                    className="form-input-clean"
                    value={editFormData.subject}
                    onChange={handleEditChange}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-level">
                    Current Academic Level <span className="req">*</span>
                  </label>
                  <input
                    id="edit-level"
                    name="currentLevel"
                    type="text"
                    className="form-input-clean"
                    value={editFormData.currentLevel}
                    onChange={handleEditChange}
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Learning Goals Editor */}
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label" htmlFor="edit-goal-input">
                    <Target size={14} className="label-icon text-accent" />
                    <span>Learning Goals ({editGoals.length})</span>
                  </label>
                </div>
                <div className="tag-input-wrapper">
                  <input
                    id="edit-goal-input"
                    type="text"
                    className="form-input-clean"
                    placeholder="Add a new learning goal (Press Enter)..."
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGoal();
                      }
                    }}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={handleAddGoal}
                    className="btn-add-tag"
                    disabled={!newGoalInput.trim() || saving}
                  >
                    <Plus size={14} /> Add Goal
                  </button>
                </div>

                <div className="tags-container">
                  {editGoals.map((goal, idx) => (
                    <span key={idx} className="tag-chip goal">
                      <span>{goal}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGoal(idx)}
                        className="btn-remove-tag"
                        title="Remove goal"
                        disabled={saving}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {editGoals.length === 0 && (
                    <span className="empty-tags-hint">No goals defined yet. Add key target milestones.</span>
                  )}
                </div>
              </div>

              {/* Weak Areas Editor */}
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label" htmlFor="edit-weak-input">
                    <AlertTriangle size={14} className="label-icon text-warning" />
                    <span>Weak Areas & Target Concepts ({editWeakAreas.length})</span>
                  </label>
                </div>
                <div className="tag-input-wrapper">
                  <input
                    id="edit-weak-input"
                    type="text"
                    className="form-input-clean"
                    placeholder="Add a weak area or difficult concept (Press Enter)..."
                    value={newWeakInput}
                    onChange={(e) => setNewWeakInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddWeakArea();
                      }
                    }}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={handleAddWeakArea}
                    className="btn-add-tag"
                    disabled={!newWeakInput.trim() || saving}
                  >
                    <Plus size={14} /> Add Focus
                  </button>
                </div>

                <div className="tags-container">
                  {editWeakAreas.map((area, idx) => (
                    <span key={idx} className="tag-chip weak">
                      <span>{area}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWeakArea(idx)}
                        className="btn-remove-tag"
                        title="Remove focus area"
                        disabled={saving}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {editWeakAreas.length === 0 && (
                    <span className="empty-tags-hint">No weak areas identified yet.</span>
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="edit-form-actions">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save-profile"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="spinner-sm" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* ================== VIEW MODE ================== */
        <div className="profile-view-grid">
          {/* Left Column: Progress Trajectory, Goals & Weaknesses */}
          <div className="profile-main-col">
            {/* Gemini AI Cumulative Progress Trajectory Card */}
            <div className="profile-card ai-progress-card">
              <div className="profile-card-header">
                <div className="card-title-group">
                  <div className="card-icon-wrap" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))', color: '#A855F7' }}>
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h3 className="card-title">Gemini AI Progress Trajectory</h3>
                    <p className="card-subtitle">Cumulative performance synthesis across past AI-reviewed sessions</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {student.progressSummaryGeneratedAt && (
                    <span className="summary-date-badge">
                      <Clock size={11} /> {new Date(student.progressSummaryGeneratedAt).toLocaleDateString()}
                    </span>
                  )}
                  {student.progressSummaryModel && (
                    <span className="ai-model-pill">
                      <Sparkles size={11} /> {student.progressSummaryModel}
                    </span>
                  )}
                  <button
                    onClick={handleGenerateProgressSummary}
                    className="btn-generate-summary"
                    disabled={summaryGenerating}
                    title={student.progressSummary?.summary ? "Regenerate Progress Summary" : "Generate Progress Summary"}
                  >
                    <RefreshCw size={13} className={summaryGenerating ? 'spin' : ''} />
                    <span>
                      {summaryGenerating
                        ? 'Synthesizing...'
                        : student.progressSummary?.summary
                        ? 'Regenerate Summary'
                        : 'Generate Progress Summary'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Generating In-Progress State */}
              {summaryGenerating && (
                <div className="ai-generating-container" style={{ margin: '1rem 0' }}>
                  <div className="spinner-large" />
                  <p className="ai-generating-text">Synthesizing Cumulative Progress with Gemini AI...</p>
                  <p className="ai-generating-hint">
                    Analyzing all completed session reviews, breakthroughs, and improvement areas for {student.name} to determine learning velocity and focus priorities.
                  </p>
                </div>
              )}

              {/* Error Alert with Retry */}
              {summaryError && (
                <div className="form-alert error" style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem' }}>{summaryError}</span>
                  </div>
                  <button
                    onClick={handleGenerateProgressSummary}
                    className="btn-secondary"
                    disabled={summaryGenerating}
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                  >
                    <RefreshCw size={11} /> Retry
                  </button>
                </div>
              )}

              {/* Render Structured Summary if Present */}
              {!summaryGenerating && student.progressSummary?.summary ? (
                <div className="progress-summary-body">
                  {/* Executive Narrative */}
                  <div className="progress-narrative-box">
                    <p>{student.progressSummary.summary}</p>
                  </div>

                  {/* 3 Structured Columns: Improving, Struggling, Recommended Focus */}
                  <div className="progress-cols-grid">
                    {/* Improving Areas */}
                    <div className="progress-col improving">
                      <h4 className="progress-col-title improving">
                        <CheckCircle2 size={15} />
                        <span>Improving Areas ({student.progressSummary.improvingAreas?.length || 0})</span>
                      </h4>
                      <div className="progress-items-list">
                        {student.progressSummary.improvingAreas?.map((item, idx) => (
                          <div key={idx} className="progress-item improving">
                            <div className="progress-bullet improving" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Continuing Difficulties */}
                    <div className="progress-col struggling">
                      <h4 className="progress-col-title struggling">
                        <AlertTriangle size={15} />
                        <span>Continuing Difficulties ({student.progressSummary.strugglingAreas?.length || 0})</span>
                      </h4>
                      <div className="progress-items-list">
                        {student.progressSummary.strugglingAreas?.map((item, idx) => (
                          <div key={idx} className="progress-item struggling">
                            <div className="progress-bullet struggling" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Next Focus */}
                    <div className="progress-col focus">
                      <h4 className="progress-col-title focus">
                        <Target size={15} />
                        <span>Recommended Focus ({student.progressSummary.recommendedFocus?.length || 0})</span>
                      </h4>
                      <div className="progress-items-list">
                        {student.progressSummary.recommendedFocus?.map((item, idx) => (
                          <div key={idx} className="progress-item focus">
                            <div className="progress-bullet focus" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : !summaryGenerating && (
                <div className="empty-subcard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem', gap: '0.75rem' }}>
                  <Sparkles size={24} style={{ color: '#818CF8' }} />
                  <p style={{ margin: 0, maxWidth: '480px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No progress summary has been generated yet. Click <strong>"Generate Progress Summary"</strong> to synthesize {student.name}'s performance history across all past completed session reviews with Gemini AI.
                  </p>
                </div>
              )}
            </div>

            {/* Learning Goals Section Card */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="card-title-group">
                  <div className="card-icon-wrap goal">
                    <Target size={18} />
                  </div>
                  <div>
                    <h3 className="card-title">Target Learning Goals</h3>
                    <p className="card-subtitle">Key mastery objectives established with the tutor</p>
                  </div>
                </div>
                <span className="card-counter-badge">{student.learningGoals?.length || 0} Targets</span>
              </div>

              {student.learningGoals && student.learningGoals.length > 0 ? (
                <div className="goals-list">
                  {student.learningGoals.map((goal, idx) => (
                    <div key={idx} className="goal-item">
                      <div className="goal-icon-bullet">
                        <Check size={13} />
                      </div>
                      <div className="goal-text">{goal}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-subcard">
                  <p>No learning goals added yet. Click "Edit Profile" to define target milestones.</p>
                </div>
              )}
            </div>

            {/* Weak Areas & Focus Topics Section Card */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="card-title-group">
                  <div className="card-icon-wrap weak">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 className="card-title">Weak Areas & Focus Concepts</h3>
                    <p className="card-subtitle">Topics requiring extra practice and structured review</p>
                  </div>
                </div>
                <span className="card-counter-badge warning">{student.weakAreas?.length || 0} Areas</span>
              </div>

              {student.weakAreas && student.weakAreas.length > 0 ? (
                <div className="weak-areas-list">
                  {student.weakAreas.map((area, idx) => (
                    <div key={idx} className="weak-item">
                      <div className="weak-pill-bullet">!</div>
                      <div className="weak-text">{area}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-subcard">
                  <p>No weakness areas tracked yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Actions & AI Planner */}
          <div className="profile-side-col">
            {/* Quick Session Launcher */}
            <div className="profile-side-card">
              <div className="side-card-header">
                <div className="side-card-icon">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="side-card-title">1-on-1 Sessions</h4>
                  <span className="milestone-subtag">Live Feature</span>
                </div>
              </div>
              <p className="side-card-desc">
                Schedule live 1-on-1 tutoring sessions with conflict detection and automated session lifecycle tracking.
              </p>
              <button
                onClick={() => setScheduleModalOpen(true)}
                className="btn-side-action"
                title="Schedule session with this student"
              >
                <Calendar size={15} />
                <span>Schedule New Session</span>
              </button>
            </div>

            {/* Gemini AI Lesson Planner */}
            <div className="profile-side-card ai-accent">
              <div className="side-card-header">
                <div className="side-card-icon ai">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="side-card-title">Gemini AI Lesson Plan</h4>
                  <span className="milestone-subtag ai">Pre-Session Planner</span>
                </div>
              </div>
              <p className="side-card-desc">
                Synthesize a tailored 4-point lesson plan and 3 practice problems targeting {student.name}'s focus area: <em>{student.weakAreas?.[0] || 'Target Topics'}</em>.
              </p>
              <button
                onClick={() => handleTriggerAiPlan()}
                className="btn-side-action ai"
                title="Generate or view AI Lesson Plan"
              >
                <Sparkles size={15} />
                <span>Generate AI Study Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Session Modal */}
      {scheduleModalOpen && (
        <SessionScheduleModal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          defaultStudentId={student?._id || student?.id}
          onSessionCreated={(newSession) => {
            setStudentSessions((prev) => [newSession, ...prev]);
            setScheduleModalOpen(false);
          }}
        />
      )}

      {/* AI Session Plan Modal */}
      {planModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container ai-plan-modal" style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge" style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="modal-title">Gemini AI Pre-Session Lesson Plan</h3>
                  <p className="modal-subtitle">
                    {activePlanSession
                      ? `Lesson: ${activePlanSession.topic} (${student?.name})`
                      : `Targeted Study Strategy for ${student?.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPlanModalOpen(false)}
                className="btn-modal-close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body-content" style={{ padding: '1.25rem 0' }}>
              {/* If no scheduled session exists */}
              {!activePlanSession && (
                <div className="ai-plan-empty-box" style={{ textAlign: 'center', padding: '2rem 1.5rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '14px', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
                  <Calendar size={36} style={{ color: '#818CF8', margin: '0 auto 1rem auto' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    No Scheduled Session Found
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                    To generate a personalized, curriculum-aligned lesson plan, please schedule an upcoming 1-on-1 tutoring session with {student?.name} first.
                  </p>
                  <button
                    onClick={() => {
                      setPlanModalOpen(false);
                      setScheduleModalOpen(true);
                    }}
                    className="btn-primary-schedule"
                    style={{ margin: '0 auto' }}
                  >
                    <Calendar size={15} />
                    <span>Schedule Session Now</span>
                  </button>
                </div>
              )}

              {/* Generating in-progress indicator */}
              {planGenerating && (
                <div className="ai-generating-container" style={{ margin: '1rem 0' }}>
                  <div className="spinner-large" />
                  <p className="ai-generating-text">Synthesizing Pedagogical Plan with Gemini AI...</p>
                  <p className="ai-generating-hint">
                    Analyzing {student?.name}'s learning goals, weak areas ({student?.weakAreas?.join(', ') || 'None'}), and past lesson reviews to build a customized 4-step outline and 3 practice problems.
                  </p>
                </div>
              )}

              {/* Error Banner */}
              {planError && (
                <div className="form-alert error" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem' }}>{planError}</span>
                  </div>
                  {activePlanSession && (
                    <button
                      onClick={() => generatePlanForSession(activePlanSession.id || activePlanSession._id)}
                      className="btn-secondary"
                      disabled={planGenerating}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                    >
                      <RefreshCw size={12} className={planGenerating ? 'spin' : ''} />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              )}

              {/* Render Plan Details */}
              {!planGenerating && activePlanSession?.aiPlan?.lessonOutline?.length > 0 && (
                <div className="ai-plan-details-wrap">
                  {/* Meta Bar */}
                  <div className="ai-plan-meta-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="ai-model-tag">
                        <Sparkles size={12} /> {activePlanSession.aiPlan.modelUsed || 'Gemini Flash'}
                      </span>
                      {activePlanSession.aiPlan.generatedAt && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Generated {new Date(activePlanSession.aiPlan.generatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => generatePlanForSession(activePlanSession.id || activePlanSession._id)}
                      className="btn-ai-regenerate"
                      disabled={planGenerating}
                      title="Regenerate Plan with Gemini"
                    >
                      <RefreshCw size={12} className={planGenerating ? 'spin' : ''} />
                      <span>Regenerate Plan</span>
                    </button>
                  </div>

                  {/* 1. Learning Objectives */}
                  <div className="ai-plan-section" style={{ marginBottom: '1.25rem' }}>
                    <h4 className="ai-col-heading" style={{ color: '#38BDF8', fontSize: '0.95rem', marginBottom: '0.6rem' }}>
                      <Target size={16} />
                      <span>Target Learning Objectives ({activePlanSession.aiPlan.learningObjectives?.length || 0})</span>
                    </h4>
                    <div className="goals-list" style={{ gap: '0.45rem' }}>
                      {activePlanSession.aiPlan.learningObjectives?.map((obj, idx) => (
                        <div key={idx} className="goal-item" style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}>
                          <div className="goal-icon-bullet">
                            <Check size={11} />
                          </div>
                          <span>{obj}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Exactly 4-Step Lesson Outline */}
                  <div className="ai-plan-section" style={{ marginBottom: '1.25rem' }}>
                    <h4 className="ai-col-heading" style={{ color: '#C084FC', fontSize: '0.95rem', marginBottom: '0.6rem' }}>
                      <ListChecks size={16} />
                      <span>Structured 4-Point Lesson Outline</span>
                    </h4>
                    <div className="ai-outline-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {activePlanSession.aiPlan.lessonOutline?.map((step, idx) => (
                        <div key={idx} className="ai-outline-step-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                          <div className="ai-outline-step-badge" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #A855F7)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
                            {idx + 1}
                          </div>
                          <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                            {step}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Exactly 3 Practice Questions */}
                  <div className="ai-plan-section" style={{ marginBottom: '1.25rem' }}>
                    <h4 className="ai-col-heading" style={{ color: '#FBBF24', fontSize: '0.95rem', marginBottom: '0.6rem' }}>
                      <HelpCircle size={16} />
                      <span>Targeted Practice Questions (3)</span>
                    </h4>
                    <div className="ai-questions-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {activePlanSession.aiPlan.practiceQuestions?.map((q, idx) => (
                        <div key={idx} className="ai-question-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FBBF24', background: 'rgba(245, 158, 11, 0.18)', padding: '0.2rem 0.5rem', borderRadius: '6px', flexShrink: 0 }}>
                            Q{idx + 1}
                          </span>
                          <span style={{ flex: 1, fontSize: '0.875rem', color: '#FEF3C7', lineHeight: 1.5 }}>
                            {q}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="modal-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              {activePlanSession && (
                <Link
                  to={`/tutor/sessions/${activePlanSession.id || activePlanSession._id}`}
                  className="btn-primary-auth"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <ArrowRight size={15} />
                  <span>Open Session Workspace</span>
                </Link>
              )}
              <button
                onClick={() => setPlanModalOpen(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
