import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, UserX, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccessDenied({ onBackToDashboard }) {
  const { user } = useAuth();

  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="access-denied-icon-wrap">
          <ShieldAlert size={48} color="var(--error)" />
        </div>

        <div className="status-badge-403">HTTP 403 Forbidden</div>

        <h1 className="access-denied-title">Access Denied</h1>

        <p className="access-denied-message">
          You do not have permission to view or manage the <strong>Tutor Console</strong>.
        </p>

        <div className="role-comparison-box">
          <div className="role-comp-item current">
            <span className="comp-label">Your Active Role</span>
            <span className="comp-val error">👨‍🎓 {user?.role || 'student'}</span>
            <span className="comp-sub">{user?.email}</span>
          </div>

          <div className="role-comp-divider">
            <Lock size={16} />
          </div>

          <div className="role-comp-item required">
            <span className="comp-label">Required Role</span>
            <span className="comp-val ok">👨‍🏫 tutor</span>
            <span className="comp-sub">TutorFlow Tutor Account</span>
          </div>
        </div>

        <div className="access-denied-actions">
          <button onClick={onBackToDashboard} className="btn-return-dashboard">
            <ArrowLeft size={16} />
            <span>Return to Student Dashboard</span>
          </button>
        </div>

        <div className="security-note">
          <p>
            🛡️ <strong>Server-Side Protection Note:</strong> Frontend view gating is backed by Express <code>requireRole('tutor')</code> middleware. Any unauthorized API calls are strictly rejected with HTTP 403.
          </p>
        </div>
      </div>
    </div>
  );
}
