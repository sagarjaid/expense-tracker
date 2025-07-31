/** @format */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ExpenseForm from './ExpenseForm';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

// Helper function to get first and last day of month
function getFirstAndLastDayOfMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return { first, last };
}

interface FloatingActionButtonProps {
  onExpenseAdded?: () => void;
}

export default function FloatingActionButton({ onExpenseAdded }: FloatingActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startingBalance, setStartingBalance] = useState<number | null>(null);
  const [totals, setTotals] = useState<Record<string, Record<string, number>>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch balance and totals data
  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Fetch starting balance
      const currentDate = new Date();
      const { data: balanceData } = await supabase
        .from('monthly_balances')
        .select('amount')
        .eq('user_id', user.id)
        .eq('month', currentDate.getMonth())
        .eq('year', currentDate.getFullYear())
        .single();

      setStartingBalance(balanceData?.amount || null);

      // Fetch expenses for totals (current month only)
      const { first: monthStart, last: monthEnd } = getFirstAndLastDayOfMonth(
        currentDate.getFullYear(),
        currentDate.getMonth()
      );
      
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, category, subcategory, date')
        .eq('user_id', user.id)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      if (expenses) {
        const totalsData: Record<string, Record<string, number>> = {};
        expenses.forEach((exp) => {
          if (!totalsData[exp.category]) {
            totalsData[exp.category] = {};
          }
          if (!totalsData[exp.category][exp.subcategory]) {
            totalsData[exp.category][exp.subcategory] = 0;
          }
          totalsData[exp.category][exp.subcategory] += Number(exp.amount);
        });
        setTotals(totalsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      window.location.href = '/';
      return;
    }
    
    setIsModalOpen(true);
  };

  // Don't render if still loading
  if (isLoading) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <div 
        className='fixed bottom-8 right-8 z-[9999] pointer-events-auto'
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          pointerEvents: 'auto'
        }}
      >
        {/* Test button to verify positioning */}
        {/* <div className='mb-4'>
          <Button
            onClick={() => console.log('Test button clicked!')}
            className='bg-red-500 hover:bg-red-600 text-white'
          >
            Test Button
          </Button>
        </div> */}
        <Button
          onClick={handleButtonClick}
          size='icon'
          className='w-16 h-16 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 text-white border-2 border-white transition-all duration-200 hover:scale-110'
          style={{ 
            minWidth: '64px', 
            minHeight: '64px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            zIndex: 9999
          }}
        >
          <Plus className='h-8 w-8' />
        </Button>
      </div>

      {/* Expense Form Modal */}
      {isModalOpen && isAuthenticated && (
        <ExpenseForm
          isModal={true}
          onClose={() => {
            setIsModalOpen(false);
            // Refresh data and notify parent after modal closes
            fetchData();
            if (onExpenseAdded) {
              onExpenseAdded();
            }
          }}
          showVoiceInput={false}
          showBalanceSummary={true}
          startingBalance={startingBalance}
          totals={totals}
          onBalanceUpdate={(newBalance) => {
            setStartingBalance(newBalance);
            // Refresh totals after balance update
            fetchData();
          }}
        />
      )}
    </>
  );
} 