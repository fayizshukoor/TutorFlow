import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  BookOpen,
  GraduationCap,
  Target,
  AlertTriangle,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { studentApi } from '../../services/api';
import StudentCreateModal from './StudentCreateModal';

export default function StudentList({ isCompact = false }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { ok, data } = await studentApi.getAll();

      if (!ok) {
        throw new Error(data.message || data.error || 'Failed to fetch students.');
      }

      setStudents(data.students || []);
    } catch (err) {
      console.error('Fetch students error:', err);
      setError(err.message || 'Could not load student roster.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filter students based on search input (name or subject)
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.subject?.toLowerCase().includes(query) ||
        s.currentLevel?.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Derived statistics
  const stats = useMemo(() => {
    const subjectsSet = new Set(students.map((s) => s.subject).filter(Boolean));
    const totalGoals = students.reduce((acc, s) => acc + (s.learningGoals?.length || 0), 0);
    const totalWeakAreas = students.reduce((acc, s) => acc + (s.weakAreas?.length || 0), 0);

    return {
      total: students.length,
      subjectsCount: subjectsSet.size,
      totalGoals,
      totalWeakAreas
    };
  }, [students]);

  const handleStudentCreated = (newStudent) => {
    if (newStudent) {
      setStudents((prev) => [newStudent, ...prev]);
    } else {
      fetchStudents();
    }
  };

  return (
    <div className="student-list-wrapper">
      {/* Top Roster Header */}
      <div className="roster-header-row">
        <div>
          <div className="roster-pill-row">
            <span className="role-tag-badge tutor">
              <Users size={13} />
              STUDENT ROSTER
            </span>
            <span className="milestone-badge">Milestone 3 Live</span>
          </div>
          <h2 className="roster-title">Enrolled Students & Profiles</h2>
          <p className="roster-subtitle">
            Manage your student roster, academic levels, focus subjects, and target learning milestones.
          </p>
        </div>

        <div className="roster-actions">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary-enroll"
            title="Enroll a new student"
          >
            <UserPlus size={16} />
            <span>Enroll New Student</span>
          </button>
        </div>
      </div>

      {/* Roster Stat Counters */}
      {!isCompact && (
        <div className="roster-stats-grid">
          <div className="stat-card">
            <div className="stat-icon-box tutor">
              <Users size={20} />
            </div>
            <div>
              <div className="stat-number">{loading ? '...' : stats.total}</div>
              <div className="stat-label">Enrolled Students</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box subject">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="stat-number">{loading ? '...' : stats.subjectsCount}</div>
              <div className="stat-label">Active Subjects</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box goals">
              <Target size={20} />
            </div>
            <div>
              <div className="stat-number">{loading ? '...' : stats.totalGoals}</div>
              <div className="stat-label">Target Learning Goals</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box weak">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="stat-number">{loading ? '...' : stats.totalWeakAreas}</div>
              <div className="stat-label">Weak Areas Tracked</div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="roster-toolbar">
        <div className="search-box-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by student name, email, subject, or level..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn-clear-search"
              title="Clear search"
            >
              Clear
            </button>
          )}
        </div>

        <div className="toolbar-count">
          <span>Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students</span>
          <button
            onClick={fetchStudents}
            className="btn-refresh-icon"
            title="Refresh student list"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Content Area: Loading, Error, Empty, or List */}
      {loading ? (
        /* SKELETON LOADING STATE */
        <div className="student-cards-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="student-card skeleton">
              <div className="skeleton-avatar" />
              <div className="skeleton-line full" />
              <div className="skeleton-line half" />
              <div className="skeleton-tags" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* ERROR STATE */
        <div className="roster-error-card">
          <AlertTriangle size={24} className="text-error" />
          <div>
            <h4 className="error-title">Failed to load student roster</h4>
            <p className="error-desc">{error}</p>
          </div>
          <button onClick={fetchStudents} className="btn-retry">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : filteredStudents.length === 0 ? (
        /* EMPTY STATE */
        students.length === 0 ? (
          <div className="roster-empty-card">
            <div className="empty-icon-wrap">
              <Users size={32} />
            </div>
            <h3 className="empty-title">No Students Enrolled Yet</h3>
            <p className="empty-desc">
              Your roster is currently empty. Add your first student to track learning goals, manage weak areas, and prepare AI lesson plans.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary-auth"
              style={{ width: 'auto', padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <UserPlus size={16} />
              <span>Enroll Your First Student</span>
            </button>
          </div>
        ) : (
          <div className="roster-empty-card">
            <Search size={30} className="text-muted" />
            <h3 className="empty-title">No Matching Students Found</h3>
            <p className="empty-desc">
              No students match your search query: "<em>{searchQuery}</em>".
            </p>
            <button onClick={() => setSearchQuery('')} className="btn-secondary">
              Clear Search Filter
            </button>
          </div>
        )
      ) : (
        /* STUDENT CARDS GRID */
        <div className="student-cards-grid">
          {filteredStudents.map((st) => {
            const studentId = st._id || st.id;
            const initials = st.name
              ? st.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'ST';

            return (
              <div key={studentId} className="student-card">
                {/* Card Top */}
                <div className="student-card-top">
                  <div className="student-avatar-md">{initials}</div>
                  <div className="student-card-main-info">
                    <h3 className="student-card-name">{st.name}</h3>
                    <p className="student-card-email">{st.email}</p>
                  </div>
                </div>

                {/* Subject & Level Badges */}
                <div className="student-badges-row">
                  <span className="badge-subject">
                    <BookOpen size={12} />
                    <span>{st.subject}</span>
                  </span>
                  <span className="badge-level">
                    <GraduationCap size={12} />
                    <span>{st.currentLevel}</span>
                  </span>
                </div>

                {/* Goals & Weak Areas Snippet */}
                <div className="card-targets-section">
                  {/* Learning Goals */}
                  <div className="target-row">
                    <div className="target-label">
                      <Target size={13} className="text-accent" />
                      <span>Goals ({st.learningGoals?.length || 0}):</span>
                    </div>
                    <div className="target-chips-preview">
                      {st.learningGoals && st.learningGoals.length > 0 ? (
                        <>
                          <span className="chip-mini goal">{st.learningGoals[0]}</span>
                          {st.learningGoals.length > 1 && (
                            <span className="chip-mini-more">+{st.learningGoals.length - 1} more</span>
                          )}
                        </>
                      ) : (
                        <span className="chip-mini empty">None defined</span>
                      )}
                    </div>
                  </div>

                  {/* Weak Areas */}
                  <div className="target-row">
                    <div className="target-label">
                      <AlertTriangle size={13} className="text-warning" />
                      <span>Focus ({st.weakAreas?.length || 0}):</span>
                    </div>
                    <div className="target-chips-preview">
                      {st.weakAreas && st.weakAreas.length > 0 ? (
                        <>
                          <span className="chip-mini weak">{st.weakAreas[0]}</span>
                          {st.weakAreas.length > 1 && (
                            <span className="chip-mini-more">+{st.weakAreas.length - 1} more</span>
                          )}
                        </>
                      ) : (
                        <span className="chip-mini empty">None tracked</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="student-card-footer">
                  <Link
                    to={`/tutor/students/${studentId}`}
                    className="btn-view-profile"
                    style={{ textDecoration: 'none' }}
                  >
                    <span>View & Edit Profile</span>
                    <ChevronRight size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enroll Student Modal */}
      <StudentCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStudentCreated={handleStudentCreated}
      />
    </div>
  );
}
