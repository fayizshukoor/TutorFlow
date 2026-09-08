import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from '../components/layout/RootLayout';
import HomePage from '../components/common/HomePage';
import LoginPage from '../components/auth/LoginPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AccessDenied from '../components/auth/AccessDenied';
import TutorDashboard from '../features/dashboard/TutorDashboard';
import TutorConsole from '../features/dashboard/TutorConsole';
import StudentDashboard from '../features/dashboard/StudentDashboard';
import StudentList from '../features/students/StudentList';
import StudentProfile from '../features/students/StudentProfile';
import SessionList from '../features/sessions/SessionList';
import SessionWorkspace from '../features/sessions/SessionWorkspace';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'login',
        element: <LoginPage />
      },
      {
        path: 'tutor',
        element: (
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'tutor/students',
        element: (
          <ProtectedRoute allowedRoles={['tutor']}>
            <div className="dashboard-container">
              <StudentList />
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: 'tutor/students/:id',
        element: (
          <ProtectedRoute allowedRoles={['tutor']}>
            <StudentProfile />
          </ProtectedRoute>
        )
      },
      {
        path: 'tutor/sessions',
        element: (
          <ProtectedRoute allowedRoles={['tutor']}>
            <SessionList />
          </ProtectedRoute>
        )
      },
      {
        path: 'tutor/sessions/:id',
        element: (
          <ProtectedRoute allowedRoles={['tutor']}>
            <SessionWorkspace />
          </ProtectedRoute>
        )
      },
      {
        path: 'tutor/console',
        element: (
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorConsole />
          </ProtectedRoute>
        )
      },
      {
        path: 'student',
        element: (
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'student/sessions/:id',
        element: (
          <ProtectedRoute allowedRoles={['student']}>
            <SessionWorkspace />
          </ProtectedRoute>
        )
      },
      {
        path: 'access-denied',
        element: <AccessDenied />
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
]);

export default router;
