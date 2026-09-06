import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TutorConsole({ onBack }) {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [tutorData, setTutorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTutorData() {
      try {
        const res = await authFetch('/auth/tutor-test');
        const data = await res.json();
        setTutorData(data);
      } catch (err) {
        console.error('Failed to load tutor data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTutorData();
  }, [authFetch]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/tutor');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="console-nav">
        <button onClick={handleBack} className="btn-back">
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="dashboard-header-card tutor">
        <div className="dashboard-header-left">
          <div className="role-avatar-lg tutor">
            🔒
          </div>
          <div>
            <div className="dashboard-pill-row">
              <span className="role-tag-badge tutor">
                <Shield size={13} />
                TUTOR RESTRICTED ROUTE
              </span>
              <span className="milestone-badge">HTTP 200 Authorized</span>
            </div>
            <h1 className="dashboard-title">Tutor Management Console</h1>
            <p className="dashboard-subtitle">
              Exclusive tutor administration workspace. Verified via <code>requireRole('tutor')</code> middleware.
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="console-info-card">
          <h3 className="console-info-title">
            <CheckCircle2 size={18} color="var(--success)" />
            <span>Tutor Authorization Verified</span>
          </h3>
          <p className="console-info-desc">
            Your JWT token carries role <code>tutor</code>. The backend server successfully granted access to protected tutor endpoints.
          </p>
          {loading ? (
            <div className="console-loading">
              <RefreshCw size={16} className="spin" /> Verifying server authorization...
            </div>
          ) : (
            <div className="console-res-box">
              <div className="console-res-header">Backend Response (/api/auth/tutor-test):</div>
              <pre><code>{JSON.stringify(tutorData, null, 2)}</code></pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
