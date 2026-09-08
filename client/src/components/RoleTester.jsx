import React, { useState } from 'react';
import { ShieldCheck, Play, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RoleTester() {
  const { authFetch, user } = useAuth();
  const [activeEndpoint, setActiveEndpoint] = useState('/api/auth/test');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const testEndpoints = [
    {
      id: 'students-list',
      path: '/students',
      label: 'GET /api/students',
      desc: 'Tutor-only student roster (Students get 403 Forbidden)',
      role: 'tutor'
    },
    {
      id: 'student-me',
      path: '/students/profile/me',
      label: 'GET /api/students/profile/me',
      desc: 'Student self-profile (Tutors get 403 Forbidden)',
      role: 'student'
    },
    {
      id: 'tutor-test',
      path: '/auth/tutor-test',
      label: 'GET /api/auth/tutor-test',
      desc: 'Tutor auth test route (Students get 403 Forbidden)',
      role: 'tutor'
    },
    {
      id: 'auth-me',
      path: '/auth/me',
      label: 'GET /api/auth/me',
      desc: 'Current user session profile',
      role: 'all'
    }
  ];

  const handleTest = async (endpointPath) => {
    setLoading(true);
    setActiveEndpoint(endpointPath);
    const startTime = performance.now();

    try {
      const res = await authFetch(endpointPath);
      const latency = Math.round(performance.now() - startTime);
      const data = await res.json();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        latency,
        data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      setResponse({
        status: 0,
        statusText: 'Network Error',
        ok: false,
        latency: Math.round(performance.now() - startTime),
        data: { error: err.message },
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tester-card">
      <div className="tester-header">
        <div className="tester-title-group">
          <div className="tester-icon">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="tester-title">Live Server-Side Auth & RBAC Verifier</h3>
            <p className="tester-subtitle">
              Verify your active JWT token and test server-side student ownership & role gating in real time
            </p>
          </div>
        </div>
      </div>

      <div className="tester-buttons-grid">
        {testEndpoints.map((ep) => {
          const willSucceed =
            ep.role === 'all' ||
            (ep.role === 'tutor' && user?.role === 'tutor') ||
            (ep.role === 'student' && user?.role === 'student');

          return (
            <button
              key={ep.id}
              onClick={() => handleTest(ep.path)}
              disabled={loading}
              className={`tester-btn ${activeEndpoint === ep.path ? 'selected' : ''}`}
            >
              <div className="tester-btn-top">
                <span className="tester-btn-label">{ep.label}</span>
                <span className={`tester-pill ${willSucceed ? 'allow' : 'deny'}`}>
                  {willSucceed ? 'Expect 200' : 'Expect 403'}
                </span>
              </div>
              <span className="tester-btn-desc">{ep.desc}</span>
            </button>
          );
        })}
      </div>

      {response && (
        <div className="tester-output">
          <div className="tester-output-header">
            <div className="tester-output-status">
              {response.ok ? (
                <CheckCircle2 size={16} color="var(--success)" />
              ) : response.status === 403 ? (
                <AlertTriangle size={16} color="var(--warning)" />
              ) : (
                <XCircle size={16} color="var(--error)" />
              )}
              <span className={`status-code ${response.ok ? 'code-ok' : response.status === 403 ? 'code-forbidden' : 'code-error'}`}>
                HTTP {response.status} {response.statusText}
              </span>
              <span className="tester-latency">({response.latency}ms)</span>
            </div>
            <span className="tester-time">{response.timestamp}</span>
          </div>

          <pre className="tester-code-box">
            <code>{JSON.stringify(response.data, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
