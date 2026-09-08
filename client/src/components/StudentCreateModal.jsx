import React, { useState } from 'react';
import { X, UserPlus, BookOpen, Target, AlertTriangle, CheckCircle2, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PRESET_SUBJECTS = [
  'AP Calculus BC',
  'AP Physics C',
  'Organic Chemistry',
  'SAT Math & Reading',
  'Computer Science (Python/Java)',
  'Linear Algebra',
  'AP Biology'
];

const PRESET_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12 / AP',
  'Undergraduate'
];

export default function StudentCreateModal({ isOpen, onClose, onStudentCreated }) {
  const { authFetch } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    currentLevel: ''
  });

  const [goalInput, setGoalInput] = useState('');
  const [learningGoals, setLearningGoals] = useState([]);

  const [weakAreaInput, setWeakAreaInput] = useState('');
  const [weakAreas, setWeakAreas] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleAddGoal = (e) => {
    e?.preventDefault();
    const trimmed = goalInput.trim();
    if (trimmed && !learningGoals.includes(trimmed)) {
      setLearningGoals([...learningGoals, trimmed]);
      setGoalInput('');
    }
  };

  const handleRemoveGoal = (indexToRemove) => {
    setLearningGoals(learningGoals.filter((_, i) => i !== indexToRemove));
  };

  const handleAddWeakArea = (e) => {
    e?.preventDefault();
    const trimmed = weakAreaInput.trim();
    if (trimmed && !weakAreas.includes(trimmed)) {
      setWeakAreas([...weakAreas, trimmed]);
      setWeakAreaInput('');
    }
  };

  const handleRemoveWeakArea = (indexToRemove) => {
    setWeakAreas(weakAreas.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Basic frontend validations
    if (!formData.name.trim()) {
      setError('Please enter the student\'s full name.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter the student\'s email address.');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!formData.subject.trim()) {
      setError('Please specify the primary subject.');
      return;
    }

    if (!formData.currentLevel.trim()) {
      setError('Please select or enter the student\'s current academic level.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await authFetch('/students', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          currentLevel: formData.currentLevel.trim(),
          learningGoals,
          weakAreas
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create student profile.');
      }

      setSuccessMsg(`Student profile for "${data.student?.name || formData.name}" created successfully!`);
      
      // Delay closing slightly so user sees success confirmation
      setTimeout(() => {
        if (onStudentCreated) {
          onStudentCreated(data.student);
        }
        handleClose();
      }, 700);
    } catch (err) {
      console.error('Create student error:', err);
      setError(err.message || 'An unexpected error occurred while creating the student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', subject: '', currentLevel: '' });
    setLearningGoals([]);
    setWeakAreas([]);
    setGoalInput('');
    setWeakAreaInput('');
    setError(null);
    setSuccessMsg(null);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="modal-title">Enroll New Student</h2>
              <p className="modal-subtitle">Add a student profile to your TutorFlow management roster</p>
            </div>
          </div>
          <button onClick={handleClose} className="btn-modal-close" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Status Alerts */}
          {error && (
            <div className="form-alert error">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="form-alert success">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Grid: Basic Details */}
          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label" htmlFor="student-name">
                Student Full Name <span className="req">*</span>
              </label>
              <input
                id="student-name"
                name="name"
                type="text"
                className="form-input-clean"
                placeholder="e.g. Maya Lin"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="student-email">
                Student Email <span className="req">*</span>
              </label>
              <input
                id="student-email"
                name="email"
                type="email"
                className="form-input-clean"
                placeholder="e.g. maya.lin@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
            </div>
          </div>

          {/* Form Grid: Subject & Level */}
          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label" htmlFor="student-subject">
                Primary Subject <span className="req">*</span>
              </label>
              <input
                id="student-subject"
                name="subject"
                type="text"
                className="form-input-clean"
                placeholder="e.g. AP Calculus BC"
                value={formData.subject}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
              {/* Preset subject quick pills */}
              <div className="preset-pills-row">
                {PRESET_SUBJECTS.slice(0, 4).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    className="preset-chip"
                    onClick={() => setFormData((p) => ({ ...p, subject: sub }))}
                  >
                    + {sub}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="student-level">
                Current Academic Level <span className="req">*</span>
              </label>
              <input
                id="student-level"
                name="currentLevel"
                type="text"
                className="form-input-clean"
                placeholder="e.g. Grade 12 / Advanced"
                value={formData.currentLevel}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
              {/* Preset level quick pills */}
              <div className="preset-pills-row">
                {PRESET_LEVELS.slice(0, 4).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className="preset-chip"
                    onClick={() => setFormData((p) => ({ ...p, currentLevel: lvl }))}
                  >
                    + {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Learning Goals Tag Input */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="goal-input">
                <Target size={14} className="label-icon text-accent" />
                <span>Target Learning Goals</span>
              </label>
              <span className="form-hint">{learningGoals.length} added</span>
            </div>
            <div className="tag-input-wrapper">
              <input
                id="goal-input"
                type="text"
                className="form-input-clean"
                placeholder="e.g. Master Taylor Series convergence tests (Press Enter)"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGoal();
                  }
                }}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={handleAddGoal}
                className="btn-add-tag"
                disabled={!goalInput.trim() || submitting}
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {/* Tag Badges Container */}
            {learningGoals.length > 0 && (
              <div className="tags-container">
                {learningGoals.map((goal, idx) => (
                  <span key={idx} className="tag-chip goal">
                    <span>{goal}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(idx)}
                      className="btn-remove-tag"
                      title="Remove goal"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Weak Areas Tag Input */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="weak-input">
                <AlertTriangle size={14} className="label-icon text-warning" />
                <span>Weak Areas & Focus Topics</span>
              </label>
              <span className="form-hint">{weakAreas.length} added</span>
            </div>
            <div className="tag-input-wrapper">
              <input
                id="weak-input"
                type="text"
                className="form-input-clean"
                placeholder="e.g. Integration by parts with trig substitution (Press Enter)"
                value={weakAreaInput}
                onChange={(e) => setWeakAreaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddWeakArea();
                  }
                }}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={handleAddWeakArea}
                className="btn-add-tag"
                disabled={!weakAreaInput.trim() || submitting}
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {/* Tag Badges Container */}
            {weakAreas.length > 0 && (
              <div className="tags-container">
                {weakAreas.map((area, idx) => (
                  <span key={idx} className="tag-chip weak">
                    <span>{area}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWeakArea(idx)}
                      className="btn-remove-tag"
                      title="Remove topic"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-modal"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner-sm" />
                  <span>Enrolling Student...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Create Student Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
