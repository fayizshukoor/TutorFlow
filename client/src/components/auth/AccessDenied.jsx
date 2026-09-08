import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccessDenied({ onBackToDashboard }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else if (user?.role === 'student') {
      navigate('/student');
    } else if (user?.role === 'tutor') {
      navigate('/tutor');
    } else {
      navigate('/');
    }
  };

  const returnLabel = user?.role === 'student' 
    ? 'Return to Student Dashboard' 
    : user?.role === 'tutor'
    ? 'Return to Tutor Dashboard'
    : 'Return to Home';

  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="access-denied-icon-wrap">
          <ShieldAlert size={48} color="var(--error)" />
        </div>

        <div className="status-badge-403">HTTP 403 Forbidden</div>

        <h1 className="access-denied-title">Access Denied</h1>

        <p className="access-denied-message">
          You do not have permission to view or manage <strong>Tutor Administration Resources</strong>.
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
          <button onClick={handleReturn} className="btn-return-dashboard">
            <ArrowLeft size={16} />
            <span>{returnLabel}</span>
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
