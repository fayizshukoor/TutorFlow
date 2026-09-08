import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RootLayout from './components/RootLayout';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import TutorDashboard from './components/TutorDashboard';
import TutorConsole from './components/TutorConsole';
import StudentRosterPage from './components/StudentRosterPage';
import StudentProfile from './components/StudentProfile';
import StudentDashboard from './components/StudentDashboard';
import AccessDenied from './components/AccessDenied';
import ProtectedRoute from './components/ProtectedRoute';

// Create router outside the React component tree
const router = createBrowserRouter([
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
            <StudentRosterPage />
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

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
