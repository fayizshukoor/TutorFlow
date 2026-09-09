import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  FileText,
  Sparkles
} from 'lucide-react';
import { sessionApi } from '../../services/api';
import SessionScheduleModal from './SessionScheduleModal';

export default function SessionList() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Filter: 'all', 'scheduled', 'in_progress', 'completed'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { ok, data } = await sessionApi.getAll();
      if (!ok) {
        throw new Error(data.message || data.error || 'Failed to fetch sessions.');
      }
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Fetch sessions error:', err);
      setError(err.message || 'An error occurred while loading sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Handle Quick Lifecycle Transition
  const handleQuickStatusChange = async (e, sessionId, targetStatus) => {
    e.stopPropagation();
    e.preventDefault();
    setActionLoadingId(sessionId);
    try {
      const { ok, data } = await sessionApi.updateStatus(sessionId, targetStatus);
      if (!ok) {
        alert(data.message || 'Failed to update session status.');
        return;
      }
      // Update local state
      setSessions((prev) =>
        prev.map((s) =>
          (s.id || s._id) === sessionId ? data.session : s
        )
      );

      // If starting, optionally redirect to workspace
      if (targetStatus === 'in_progress') {
        navigate(`/tutor/sessions/${sessionId}`);
      }
    } catch (err) {
      console.error('Quick status update error:', err);
      alert('An error occurred while updating session status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSessionCreated = (newSession) => {
    setSessions((prev) => [newSession, ...prev]);
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: sessions.length,
      scheduled: sessions.filter((s) => s.status === 'scheduled').length,
      in_progress: sessions.filter((s) => s.status === 'in_progress').length,
      completed: sessions.filter((s) => s.status === 'completed' || s.status === 'ai_reviewed').length
    };
  }, [sessions]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed') {
          if (session.status !== 'completed' && session.status !== 'ai_reviewed') return false;
        } else if (session.status !== statusFilter) {
          return false;
        }
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const studentName = session.studentId?.name?.toLowerCase() || '';
        const topic = session.topic?.toLowerCase() || '';
        const subject = session.studentId?.subject?.toLowerCase() || '';
        return studentName.includes(q) || topic.includes(q) || subject.includes(q);
      }

      return true;
    });
  }, [sessions, statusFilter, searchQuery]);

  // Helpers for formatting date/time in user's local timezone
  const formatDateTime = (isoDateString) => {
    if (!isoDateString) return 'Unscheduled';
    const date = new Date(isoDateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
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
      {/* Header Row */}
      <div className="sessions-header-row">
        <div className="sessions-title-group">
          <div className="roster-pill-row">
            <span className="badge-subject">
              <Calendar size={13} />
              1-on-1 Sessions
            </span>
            <span className="badge-level">Active Schedule</span>
          </div>
          <h1 className="sessions-title">Session Scheduling & Lifecycle</h1>
          <p className="sessions-subtitle">
            Manage upcoming tutoring sessions, launch live workspaces with autosaving notes, and review completed lesson history.
          </p>
        </div>

        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="btn-primary-schedule"
        >
          <Plus size={18} />
          <span>Schedule New Session</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="roster-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-box tutor">
            <Calendar size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Sessions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box subject">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.scheduled}</div>
            <div className="stat-label">Upcoming / Scheduled</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box weak">
            <Play size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.in_progress}</div>
            <div className="stat-label">Live In Progress</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box goals">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="roster-toolbar">
        <div className="session-filter-tabs" style={{ margin: 0, border: 'none', background: 'transparent', padding: 0 }}>
          <button
            className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All <span className="tab-count">{stats.total}</span>
          </button>
          <button
            className={`tab-btn ${statusFilter === 'scheduled' ? 'active' : ''}`}
            onClick={() => setStatusFilter('scheduled')}
          >
            Scheduled <span className="tab-count">{stats.scheduled}</span>
          </button>
          <button
            className={`tab-btn ${statusFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter('in_progress')}
          >
            In Progress <span className="tab-count">{stats.in_progress}</span>
          </button>
          <button
            className={`tab-btn ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed <span className="tab-count">{stats.completed}</span>
          </button>
        </div>

        <div className="toolbar-count">
          <button
            onClick={fetchSessions}
            className="btn-refresh-icon"
            title="Refresh sessions"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="roster-error-card" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={24} />
          <div>
            <strong>Error Loading Sessions:</strong> {error}
          </div>
          <button onClick={fetchSessions} className="btn-retry">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="sessions-cards-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="session-card skeleton">
              <div className="skeleton-avatar" style={{ width: '100%', height: '80px' }} />
              <div className="skeleton-line full" />
              <div className="skeleton-line half" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredSessions.length === 0 && (
        <div className="roster-empty-card">
          <div className="empty-icon-wrap">
            <Calendar size={32} />
          </div>
          <h3 className="empty-title">No Sessions Found</h3>
          <p className="empty-desc">
            {statusFilter !== 'all'
              ? `There are no sessions with status '${statusFilter}'.`
              : 'You have not scheduled any tutoring sessions yet.'}
          </p>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="btn-primary-modal"
          >
            <Plus size={16} />
            <span>Schedule First Session</span>
          </button>
        </div>
      )}

      {/* Sessions Grid */}
      {!loading && !error && filteredSessions.length > 0 && (
        <div className="sessions-cards-grid">
          {filteredSessions.map((session) => {
            const sid = session.id || session._id;
            const isActing = actionLoadingId === sid;

            return (
              <div key={sid} className="session-card">
                {/* Top Section */}
                <div className="session-card-header">
                  <div>
                    <h3 className="session-topic-title">{session.topic}</h3>
                    <div className="session-student-row">
                      <User size={13} />
                      <span className="session-student-name">
                        {session.studentId?.name || 'Student Profile'}
                      </span>
                      {session.studentId?.subject && (
                        <>
                          <span>•</span>
                          <span>{session.studentId.subject}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className={`status-pill ${session.status}`}>
                    <span className="status-dot" />
                    {session.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Metadata Grid */}
                <div className="session-meta-grid">
                  <div className="session-meta-item">
                    <Calendar size={14} className="meta-icon-accent" />
                    <span>{formatDateTime(session.scheduledAt)}</span>
                  </div>
                  <div className="session-meta-item">
                    <Clock size={14} className="meta-icon-accent" />
                    <span>Duration: {session.durationMinutes} Minutes</span>
                  </div>
                </div>

                {/* Notes Preview if available */}
                {session.notes && (
                  <div className="session-notes-snippet">
                    <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {session.notes}
                  </div>
                )}

                {/* Card Actions */}
                <div className="session-card-actions">
                  {/* Status Action Buttons */}
                  <div>
                    {session.status === 'scheduled' && (
                      <button
                        onClick={(e) => handleQuickStatusChange(e, sid, 'in_progress')}
                        className="btn-start-action"
                        disabled={isActing}
                        title="Start live session"
                      >
                        <Play size={13} />
                        <span>{isActing ? 'Starting...' : 'Start Session'}</span>
                      </button>
                    )}

                    {session.status === 'in_progress' && (
                      <button
                        onClick={(e) => handleQuickStatusChange(e, sid, 'completed')}
                        className="btn-complete-action"
                        disabled={isActing}
                        title="Mark session as completed"
                      >
                        <CheckCircle2 size={13} />
                        <span>{isActing ? 'Completing...' : 'Complete Session'}</span>
                      </button>
                    )}

                    {session.status === 'ai_reviewed' && (
                      <span className="badge-status-active" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.35)', color: '#D8B4FE' }}>
                        <Sparkles size={12} /> AI Reviewed
                      </span>
                    )}

                    {session.status === 'completed' && (
                      <span className="badge-status-active" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    )}
                  </div>

                  {/* Link to Workspace */}
                  <Link
                    to={`/tutor/sessions/${sid}`}
                    className="btn-workspace-link"
                  >
                    <span>{session.status === 'in_progress' ? 'Open Workspace' : 'View Details'}</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      <SessionScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  );
}
