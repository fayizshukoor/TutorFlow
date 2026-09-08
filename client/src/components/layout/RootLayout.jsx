import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function RootLayout() {
  return (
    <div className="app-root">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
