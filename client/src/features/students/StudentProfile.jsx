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
  Clock
} from 'lucide-react';
import { studentApi } from '../../services/api';

export default function StudentProfile() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
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

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { ok, data } = await studentApi.getById(id);

      if (!ok) {
        throw new Error(data.message || data.error || 'Could not load student profile.');
      }

      setStudent(data.student);
      setEditFormData({
        name: data.student.name || '',
        email: data.student.email || '',
        subject: data.student.subject || '',
        currentLevel: data.student.currentLevel || ''
      });
      setEditGoals(data.student.learningGoals || []);
      setEditWeakAreas(data.student.weakAreas || []);
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
          {/* Left Column: Goals & Weaknesses */}
          <div className="profile-main-col">
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

          {/* Right Column: Milestone Previews & Quick Actions */}
          <div className="profile-side-col">
            {/* Quick Session Launcher (Milestone 4 Preview) */}
            <div className="profile-side-card">
              <div className="side-card-header">
                <div className="side-card-icon">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="side-card-title">1-on-1 Sessions</h4>
                  <span className="milestone-subtag">Milestone 4 Feature</span>
                </div>
              </div>
              <p className="side-card-desc">
                Schedule live 1-on-1 tutoring sessions with conflict detection and automated session lifecycle tracking.
              </p>
              <button
                className="btn-side-action"
                title="Schedule session with this student (Available in Milestone 4)"
              >
                <Calendar size={15} />
                <span>Schedule New Session</span>
              </button>
            </div>

            {/* Gemini AI Lesson Planner (Milestone 5 Preview) */}
            <div className="profile-side-card ai-accent">
              <div className="side-card-header">
                <div className="side-card-icon ai">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="side-card-title">Gemini AI Lesson Plan</h4>
                  <span className="milestone-subtag ai">Milestone 5 Feature</span>
                </div>
              </div>
              <p className="side-card-desc">
                Synthesize customized lesson plans and review quizzes tailored to {student.name}'s weak areas: <em>{student.weakAreas?.[0] || 'Target Topics'}</em>.
              </p>
              <button
                className="btn-side-action ai"
                title="Generate AI Lesson Plan (Available in Milestone 5)"
              >
                <Sparkles size={15} />
                <span>Generate AI Study Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
