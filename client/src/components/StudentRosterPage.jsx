import React from 'react';
import StudentList from './StudentList';

export default function StudentRosterPage() {
  return (
    <div className="dashboard-container">
      <StudentList isCompact={false} />
    </div>
  );
}
