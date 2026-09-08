import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  AlertTriangle,
  X,
  Check,
  Sparkles
} from 'lucide-react';
import { studentApi, sessionApi } from '../../services/api';

export default function SessionScheduleModal({ isOpen, onClose, onSessionCreated }) {
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentError, setStudentError] = useState(null);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [topic, setTopic] = useState('');
  const [scheduledAtLocal, setScheduledAtLocal] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Set default datetime to tomorrow at 10:00 AM local time
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      // Format for datetime-local input: YYYY-MM-DDTHH:MM
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      const hours = String(tomorrow.getHours()).padStart(2, '0');
      const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
      setScheduledAtLocal(`${year}-${month}-${day}T${hours}:${minutes}`);

      // Fetch tutor's students
      fetchStudents();
      setFormError(null);
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    setStudentError(null);
    try {
      const { ok, data } = await studentApi.getAll();
      if (ok && data.students) {
        setStudents(data.students);
        if (data.students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(data.students[0].id || data.students[0]._id);
        }
      } else {
        setStudentError('Could not load student roster.');
      }
    } catch (err) {
      console.error('Fetch students error:', err);
      setStudentError('Failed to fetch student roster.');
    } finally {
      setLoadingStudents(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedStudentId) {
      setFormError('Please select a student.');
      return;
    }
    if (!topic.trim()) {
      setFormError('Please provide a session topic or learning focus.');
      return;
    }
    if (!scheduledAtLocal) {
      setFormError('Please select a date and time.');
      return;
    }

    const scheduledDate = new Date(scheduledAtLocal);
    if (isNaN(scheduledDate.getTime())) {
      setFormError('Invalid date/time format.');
      return;
    }

    if (scheduledDate.getTime() < Date.now() - 60000) {
      setFormError('Cannot schedule a session in the past. Please select a future date and time.');
      return;
    }

    setSaving(true);
    try {
      const { ok, data } = await sessionApi.create({
        studentId: selectedStudentId,
        scheduledAt: scheduledDate.toISOString(),
        durationMinutes: Number(durationMinutes),
        topic: topic.trim(),
        notes: notes.trim()
      });

      if (!ok) {
        if (data?.conflict) {
          const start = new Date(data.conflict.scheduledAt);
          const end = new Date(start.getTime() + (data.conflict.durationMinutes || 60) * 60000);
          const formattedDate = start.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          });
          const formattedStartTime = start.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
          });
          const formattedEndTime = end.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
          });
          throw new Error(
            `Scheduling conflict: You already have a session ('${data.conflict.topic}') scheduled on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime}.`
          );
        }
        throw new Error(data.message || data.error || 'Failed to schedule session.');
      }

      // Reset & notify parent
      setTopic('');
      setNotes('');
      onSessionCreated?.(data.session);
      onClose();
    } catch (err) {
      console.error('Schedule session error:', err);
      setFormError(err.message || 'An error occurred while scheduling the session.');
    } finally {
      setSaving(false);
    }
  };

  const selectedStudentObj = students.find(
    (s) => (s.id || s._id) === selectedStudentId
  );

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Calendar size={22} />
            </div>
            <div>
              <h2 className="modal-title">Schedule Tutoring Session</h2>
              <p className="modal-subtitle">
                Set up a 1-on-1 session with conflict validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-modal-close"
            disabled={saving}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Notification */}
        {formError && (
          <div className="form-alert error" style={{ marginBottom: '1.25rem' }}>
            <AlertTriangle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Student Selector */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="select-student">
                <User size={14} className="label-icon text-accent" />
                <span>Select Enrolled Student <span className="req">*</span></span>
              </label>
              {loadingStudents && <span className="form-hint">Loading roster...</span>}
            </div>

            {studentError ? (
              <div className="form-alert error">{studentError}</div>
            ) : (
              <select
                id="select-student"
                className="form-input-clean"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={saving || loadingStudents || students.length === 0}
                required
              >
                {students.length === 0 ? (
                  <option value="">No students enrolled yet</option>
                ) : (
                  students.map((student) => (
                    <option key={student.id || student._id} value={student.id || student._id}>
                      {student.name} — {student.subject} ({student.currentLevel})
                    </option>
                  ))
                )}
              </select>
            )}

            {selectedStudentObj && (
              <div className="preset-pills-row" style={{ marginTop: '0.4rem' }}>
                <span className="badge-subject">
                  <BookOpen size={12} /> {selectedStudentObj.subject}
                </span>
                <span className="badge-level">{selectedStudentObj.currentLevel}</span>
              </div>
            )}
          </div>

          {/* Session Topic */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="session-topic">
                <span>Session Topic / Goal <span className="req">*</span></span>
              </label>
            </div>
            <input
              id="session-topic"
              type="text"
              className="form-input-clean"
              placeholder="e.g. Integration by Parts & Taylor Polynomials Drill"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={saving}
              required
            />
            {selectedStudentObj?.weakAreas?.length > 0 && (
              <div style={{ marginTop: '0.4rem' }}>
                <span className="form-hint" style={{ display: 'block', marginBottom: '0.2rem' }}>
                  Student Focus Topics:
                </span>
                <div className="preset-pills-row">
                  {selectedStudentObj.weakAreas.slice(0, 2).map((weak, i) => (
                    <button
                      key={i}
                      type="button"
                      className="preset-chip"
                      onClick={() => setTopic(`Review: ${weak}`)}
                    >
                      + {weak}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date & Time and Duration in 2 Columns */}
          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label" htmlFor="scheduled-datetime">
                <Calendar size={14} className="label-icon text-accent" />
                <span>Date & Time (Local) <span className="req">*</span></span>
              </label>
              <input
                id="scheduled-datetime"
                type="datetime-local"
                className="form-input-clean"
                min={(() => {
                  const now = new Date();
                  const yr = now.getFullYear();
                  const mo = String(now.getMonth() + 1).padStart(2, '0');
                  const da = String(now.getDate()).padStart(2, '0');
                  const hr = String(now.getHours()).padStart(2, '0');
                  const mi = String(now.getMinutes()).padStart(2, '0');
                  return `${yr}-${mo}-${da}T${hr}:${mi}`;
                })()}
                value={scheduledAtLocal}
                onChange={(e) => setScheduledAtLocal(e.target.value)}
                disabled={saving}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="duration-select">
                <Clock size={14} className="label-icon text-accent" />
                <span>Duration <span className="req">*</span></span>
              </label>
              <select
                id="duration-select"
                className="form-input-clean"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                disabled={saving}
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (Standard)</option>
                <option value={90}>90 Minutes (Deep Dive)</option>
                <option value={120}>120 Minutes (2 Hours)</option>
              </select>
            </div>
          </div>

          {/* Initial Prep Notes (Optional) */}
          <div className="form-group">
            <label className="form-label" htmlFor="prep-notes">
              <span>Preparation Agenda (Optional)</span>
            </label>
            <textarea
              id="prep-notes"
              rows={3}
              className="form-input-clean"
              placeholder="Key problems to cover, textbook page references, or warmup questions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-modal"
              disabled={saving || students.length === 0}
            >
              {saving ? (
                <>
                  <div className="spinner-sm" />
                  <span>Checking Schedule & Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Confirm Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
