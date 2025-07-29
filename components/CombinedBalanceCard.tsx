/** @format */

'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Save, X } from 'lucide-react';

interface StartingBalanceRecord {
  id: string;
  amount: number;
  month: number;
  year: number;
  user_id: string;
}

export default function CombinedBalanceCard({
  selectedMonth,
  selectedYear,
}: {
  selectedMonth: number;
  selectedYear: number;
}) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempBalance, setTempBalance] = useState<number | null>(null);
  const [balanceId, setBalanceId] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState<number>(0);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setBalance(null);
      setTotalSpent(0);
      setLoading(false);
      return;
    }

    // Fetch starting balance
    const { data: balanceData } = await supabase
      .from('monthly_balances')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
      .single();

    if (balanceData) {
      setBalance(balanceData.amount);
      setBalanceId(balanceData.id);
      setTempBalance(balanceData.amount);
    } else {
      setBalance(null);
      setBalanceId(null);
      setTempBalance(null);
    }

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

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (balance === null) {
      setIsEditing(true);
      setTempBalance(null);
    } else {
      setIsEditing(false);
      setTempBalance(balance);
    }
  }, [balance, selectedMonth, selectedYear]);

  const handleSave = async () => {
    if (tempBalance === null) return;

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('User not authenticated');
      setSaving(false);
      return;
    }

    const payload: any = {
      user_id: user.id,
      month: selectedMonth,
      year: selectedYear,
      amount: tempBalance,
    };
    if (balanceId) payload.id = balanceId;

    const { error } = await supabase.from('monthly_balances').upsert(payload);

    if (error) {
      toast.error('Error saving balance');
    } else {
      toast.success('Balance saved successfully');
      setBalance(tempBalance);
      setIsEditing(false);
    }
    setSaving(false);
  };



  const startEditing = () => {
    setTempBalance(balance);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setTempBalance(balance);
    setIsEditing(false);
  };

  const remainingBalance = typeof balance === 'number' && !isNaN(balance)
    ? balance - totalSpent
    : 0 - totalSpent;

  if (loading) {
    return <div className='text-center py-4'>Loading balance...</div>;
  }

  return (
    <Card className='mb-4'>
      <CardContent className='p-3'>
        <div className='flex flex-col lg:flex-row gap-6 items-start lg:items-center'>
          {/* Starting Balance Section */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-3 mb-1'>
              <label className='text-sm font-medium text-muted-foreground'>
                Starting Balance for {format(new Date(selectedYear, selectedMonth), 'MMMM yyyy')}
              </label>
              {!isEditing && balance !== null && (
                <Button
                  onClick={startEditing}
                  variant='ghost'
                  size='sm'
                  className='h-5 w-5 p-0'>
                  <Pencil className='h-3 w-3' />
                </Button>
              )}
            </div>
            {isEditing ? (
              <div className='flex items-center gap-2'>
                <Input
                  type='number'
                  value={tempBalance || ''}
                  onChange={(e) =>
                    setTempBalance(e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder='Enter starting balance'
                  className='w-32'
                />
                <Button
                  onClick={handleSave}
                  disabled={saving || tempBalance === null}
                  size='sm'
                  className='flex items-center gap-1'>
                  <Save className='h-3 w-3' />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={cancelEditing}
                  variant='outline'
                  size='sm'
                  className='flex items-center gap-1'>
                  <X className='h-3 w-3' />
                  Cancel
                </Button>
              </div>
            ) : (
              <div className='text-xl font-bold'>
                ₹{balance !== null ? balance.toFixed(2) : '0.00'}
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div className='flex gap-8'>
            <div className='text-left'>
              <div className='text-xs text-muted-foreground mb-1'>Total Spent</div>
              <div className='text-lg font-semibold text-destructive'>
                ₹{totalSpent.toFixed(2)}
              </div>
            </div>
            <div className='text-left'>
              <div className='text-xs text-muted-foreground mb-1'>Remaining</div>
              <div className={`text-lg font-semibold ${remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{remainingBalance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 