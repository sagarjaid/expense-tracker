/** @format */

'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

const categories = ['Needs', 'Wants', 'Investment'];

export default function BalanceSummaryBar({
  selectedMonth,
  selectedYear,
}: {
  selectedMonth: number;
  selectedYear: number;
}) {
  const [startingBalance, setStartingBalance] = useState<number | null>(null);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStartingBalance(null);
        setTotalSpent(0);
        setLoading(false);
        return;
      }
      // Fetch starting balance
      const { data: balanceData } = await supabase
        .from('monthly_balances')
        .select('amount')
        .eq('user_id', user.id)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .single();
      setStartingBalance(balanceData?.amount || null);
      // Fetch total spent
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('amount, category, date')
        .eq('user_id', user.id)
        .gte(
          'date',
          format(new Date(selectedYear, selectedMonth, 1), 'yyyy-MM-dd')
        )
        .lte(
          'date',
          format(new Date(selectedYear, selectedMonth + 1, 0), 'yyyy-MM-dd')
        );
      if (!error && expenses) {
        const spent = expenses.reduce(
          (sum, exp) => sum + Number(exp.amount),
          0
        );
        setTotalSpent(spent);
      } else {
        setTotalSpent(0);
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return <div className='text-center py-4'>Loading balance summary...</div>;
  }

  return (
    <div className='mb-6  p-4 bg-muted rounded-lg shadow-sm px-4 py-3 flex flex-col sm:flex-row  justify-between gap-4'>
      <div className='flex-1'>
        <div className='text-xs text-muted-foreground mb-0.5'>
          Balance
        </div>
        <div className='text-lg font-bold text-foreground'>
          ₹
          {typeof startingBalance === 'number' && !isNaN(startingBalance)
            ? startingBalance.toFixed(2)
            : '0.00'}
        </div>
      </div>
      <div className='flex-1 '>
        <div className='text-xs text-muted-foreground mb-0.5'>Total Spent</div>
        <div className='text-lg font-bold text-foreground'>₹{totalSpent.toFixed(2)}</div>
      </div>
      <div className='flex-1 '>
        <div className='text-xs text-muted-foreground mb-0.5'>
          Remaining Balance
        </div>
        <div className='text-lg font-bold text-foreground'>
          ₹
          {typeof startingBalance === 'number' && !isNaN(startingBalance)
            ? (startingBalance - totalSpent).toFixed(2)
            : (0 - totalSpent).toFixed(2)}
        </div>
      </div>
    </div>
  );
}
