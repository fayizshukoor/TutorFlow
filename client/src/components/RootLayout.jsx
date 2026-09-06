import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function RootLayout() {
  return (
    <div className="app">
      <Navbar />
      <Outlet />
      <footer className="footer">
        <div className="container">
          <p>TutorFlow &copy; {new Date().getFullYear()} — Online Tutor & Student Session Management Platform</p>
        </div>
      </footer>
    </div>
  );
}
