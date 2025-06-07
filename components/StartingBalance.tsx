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

export default function StartingBalance({
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

  const fetchBalance = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('monthly_balances')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
      .single();

    if (error && error.code !== 'PGRST116') {
      toast.error('Error fetching balance');
    }

    if (data) {
      setBalance(data.amount);
      setBalanceId(data.id);
      setTempBalance(data.amount);
    } else {
      setBalance(null);
      setBalanceId(null);
      setTempBalance(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBalance();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (balance === null) {
      setIsEditing(true);
      setTempBalance(null);
    } else {
      setIsEditing(false);
      setTempBalance(balance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleDelete = async () => {
    if (!balanceId) return;

    if (!confirm('Are you sure you want to delete this balance?')) {
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('monthly_balances')
      .delete()
      .eq('id', balanceId);

    if (error) {
      toast.error('Error deleting balance');
    } else {
      toast.success('Balance deleted successfully');
      setBalance(null);
      setBalanceId(null);
      setTempBalance(null);
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

  if (loading) {
    return <div className='text-center py-4'>Loading balance...</div>;
  }

  return (
    <Card className='mb-4'>
      <CardContent className='p-4'>
        <div className='flex items-center gap-4'>
          <div className='flex-1'>
            <label className='block text-sm font-medium mb-1'>
              Starting Balance for{' '}
              {format(new Date(selectedYear, selectedMonth), 'MMMM yyyy')}
            </label>
            {isEditing ? (
              <Input
                type='number'
                value={tempBalance || ''}
                onChange={(e) =>
                  setTempBalance(e.target.value ? Number(e.target.value) : null)
                }
                placeholder='Enter starting balance'
                className='w-full'
              />
            ) : (
              <div className='text-lg font-semibold'>
                ₹{balance !== null ? balance.toFixed(2) : ''}
              </div>
            )}
          </div>
          <div className='flex gap-2 mt-6'>
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={saving || tempBalance === null}
                  className='flex items-center gap-2'>
                  <Save className='h-4 w-4' />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={cancelEditing}
                  variant='outline'
                  className='flex items-center gap-2'>
                  <X className='h-4 w-4' />
                  Cancel
                </Button>
              </>
            ) : (
              balance !== null && (
                <>
                  <Button
                    onClick={startEditing}
                    variant='outline'
                    className='flex items-center gap-2'>
                    <Pencil className='h-4 w-4' />
                    Edit
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant='default'
                    className='flex items-center gap-2'>
                    <Trash2 className='h-4 w-4' />
                    Delete
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
