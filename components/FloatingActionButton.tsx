/** @format */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ExpenseForm from './ExpenseForm';
import { createClient } from '@/lib/supabase/client';

export default function FloatingActionButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startingBalance, setStartingBalance] = useState<number | null>(null);
  const [totals, setTotals] = useState<Record<string, Record<string, number>>>({});

  // Fetch balance and totals data
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

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

      // Fetch expenses for totals
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, category, subcategory')
        .eq('user_id', user.id);

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
    };

    fetchData();
  }, []);

  return (
    <>
      {/* Floating Action Button */}
      <div className='fixed bottom-8 right-8 z-40'>
        <Button
          onClick={() => setIsModalOpen(true)}
          className='w-16 h-16 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center'
          size='lg'>
          <Plus className='h-8 w-8' />
        </Button>
      </div>

      {/* Expense Form Modal */}
      {isModalOpen && (
        <ExpenseForm
          isModal={true}
          onClose={() => setIsModalOpen(false)}
          showVoiceInput={false}
          showBalanceSummary={true}
          startingBalance={startingBalance}
          totals={totals}
          onBalanceUpdate={(newBalance) => setStartingBalance(newBalance)}
        />
      )}
    </>
  );
} 