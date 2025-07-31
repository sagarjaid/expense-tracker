/** @format */

'use client';

import React, { useRef } from 'react';
import ExpenseDashboard from './ExpenseDashboard';
import FloatingActionButton from './FloatingActionButton';

export default function DashboardWrapper() {
  const dashboardRef = useRef<{ refresh: () => void }>(null);

  const handleExpenseAdded = () => {
    if (dashboardRef.current?.refresh) {
      dashboardRef.current.refresh();
    }
  };

  return (
    <>
      <ExpenseDashboard ref={dashboardRef} />
      <FloatingActionButton onExpenseAdded={handleExpenseAdded} />
    </>
  );
} 