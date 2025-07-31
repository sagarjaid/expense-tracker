/** @format */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-range-picker';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import VoiceInput from './VoiceInput';
import { Plus, Mic, X, Pencil } from 'lucide-react';
import {
  categoryOptions,
  subcategories as defaultSubcategories,
} from '@/lib/utils';

interface ExpenseFormProps {
  initialValues?: {
    amount: string;
    description: string;
    category: string;
    subcategory: string;
    date: Date | undefined;
    source: string;
  };
  onSubmit?: (formData: {
    amount: string;
    description: string;
    category: string;
    subcategory: string;
    date: Date | undefined;
    source: string;
  }) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
  showVoiceInput?: boolean;
  isModal?: boolean;
  onClose?: () => void;
  mode?: 'add' | 'edit';
  expenseId?: string;
  showBalanceSummary?: boolean;
  startingBalance?: number | null;
  totals?: Record<string, Record<string, number>>;
  onBalanceUpdate?: (newBalance: number) => void;
}

export default function ExpenseForm({
  initialValues,
  onSubmit,
  loading: externalLoading,
  submitLabel,
  showVoiceInput = true,
  isModal = false,
  onClose,
  mode = 'add',
  expenseId,
  showBalanceSummary = false,
  startingBalance,
  totals = {},
  onBalanceUpdate,
}: ExpenseFormProps) {
  const defaultSubmitLabel = mode === 'edit' ? 'Update Expense' : 'Add Expense';
  const finalSubmitLabel = submitLabel || defaultSubmitLabel;
  const [amount, setAmount] = useState(initialValues?.amount || '');
  const [description, setDescription] = useState(
    initialValues?.description || ''
  );
  const [category, setCategory] = useState(
    initialValues?.category || categoryOptions[0]
  );
  const [subcategory, setSubcategory] = useState(
    initialValues?.subcategory || defaultSubcategories[categoryOptions[0]][0]
  );
  const [date, setDate] = useState<Date | undefined>(
    initialValues?.date || new Date()
  );
  const [source, setSource] = useState(initialValues?.source || 'Bank A/C');
  const [internalLoading, setInternalLoading] = useState(false);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [addingSubcategory, setAddingSubcategory] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState('');
  
  // Balance summary states
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [tempBalance, setTempBalance] = useState<string>('');
  const [savingBalance, setSavingBalance] = useState(false);
  const balanceCardRef = useRef<HTMLDivElement>(null);

  const loading =
    externalLoading !== undefined ? externalLoading : internalLoading;

  const fetchSubcategories = useCallback(async (cat: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subcategories')
      .select('name')
      .eq('category', cat)
      .order('name', { ascending: true });
    if (!error && data) {
      setSubcategories(data.map((row) => row.name));
    } else {
      setSubcategories([]); // fallback
    }
  }, []);

  useEffect(() => {
    fetchSubcategories(category);
  }, [category, fetchSubcategories]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setAddingSubcategory(false);
    setNewSubcategory('');
    setSubcategory('');
    fetchSubcategories(cat);
  };

  const handleAddSubcategory = async () => {
    const trimmed = newSubcategory.trim();
    if (!trimmed || subcategories.includes(trimmed)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('subcategories')
      .insert([{ category, name: trimmed }]);
    if (!error) {
      setSubcategories((prev) => [...prev, trimmed]);
      setSubcategory(trimmed);
      setAddingSubcategory(false);
      setNewSubcategory('');
    } else {
      toast.error('Failed to add subcategory');
    }
  };

  // Balance management functions
  const handleBalanceEdit = () => {
    setIsEditingBalance(true);
    setTempBalance(startingBalance?.toString() || '');
  };

  const handleBalanceSave = async () => {
    if (!tempBalance.trim()) return;
    
    setSavingBalance(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setSavingBalance(false);
      return;
    }

    const amount = Number(tempBalance);
    const currentDate = new Date();
    
    // First, try to find existing balance for the current month/year
    const { data: existingBalance } = await supabase
      .from('monthly_balances')
      .select('id')
      .eq('user_id', user.id)
      .eq('month', currentDate.getMonth())
      .eq('year', currentDate.getFullYear())
      .single();

    let result;
    if (existingBalance) {
      // Update existing record
      result = await supabase
        .from('monthly_balances')
        .update({ amount: amount })
        .eq('id', existingBalance.id);
    } else {
      // Insert new record
      result = await supabase
        .from('monthly_balances')
        .insert({
          user_id: user.id,
          month: currentDate.getMonth(),
          year: currentDate.getFullYear(),
          amount: amount,
        });
    }

    if (!result.error) {
      setIsEditingBalance(false);
      if (onBalanceUpdate) {
        onBalanceUpdate(amount);
      }
    } else {
      console.error('Error saving balance:', result.error);
    }
    setSavingBalance(false);
  };

  const handleBalanceCancel = () => {
    setIsEditingBalance(false);
    setTempBalance('');
  };

  // Handle click outside to cancel editing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (balanceCardRef.current && !balanceCardRef.current.contains(event.target as Node)) {
        if (isEditingBalance) {
          setIsEditingBalance(false);
          setTempBalance('');
        }
      }
    };

    if (isEditingBalance) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (onSubmit) {
      await onSubmit({
        amount,
        description,
        category,
        subcategory,
        date,
        source,
      });
      return;
    }

    setInternalLoading(true);
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!user || userError) {
      toast.error('User not authenticated.');
      setInternalLoading(false);
      return;
    }

    // Convert date to local timezone
    let localDate;
    if (date) {
      const userDate = new Date(date);
      localDate = new Date(
        userDate.getTime() - userDate.getTimezoneOffset() * 60000
      );
    }

    const expense = {
      user_id: user.id,
      amount: parseFloat(amount),
      description: description.trim() === '' ? 'NULL' : description,
      category,
      subcategory,
      date: localDate ? format(localDate, 'yyyy-MM-dd') : undefined,
      source,
    };

    if (mode === 'edit' && expenseId) {
      // Update existing expense
      const { error } = await supabase
        .from('expenses')
        .update(expense)
        .eq('id', expenseId);
      
      if (error) {
        toast.error('Error updating expense: ' + error.message);
      } else {
        toast.success('Expense updated successfully!');
        if (isModal && onClose) {
          onClose();
        }
      }
    } else {
      // Add new expense
      const { error } = await supabase.from('expenses').insert([expense]);
      if (error) {
        toast.error('Error adding expense: ' + error.message);
      } else {
        toast.success('Expense added successfully!');
        setAmount('');
        setDescription('');
        setCategory(categoryOptions[0]);
        setSubcategory(defaultSubcategories[categoryOptions[0]][0]);
        setDate(new Date());
        setSource('Bank A/C'); // Reset source to default
        if (isModal && onClose) {
          onClose();
        }
      }
    }
    setInternalLoading(false);
  };

  // Helper to capitalize first letter
  function capitalizeFirst(str: string) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const formContent = (
    <form
      className='space-y-4'
      onSubmit={handleSubmit}>
      {showVoiceInput && (
        <VoiceInput
          onResult={(data) => {
            if (data.amount !== undefined) setAmount(data.amount);
            if (data.description !== undefined)
              setDescription(capitalizeFirst(data.description));
            if (data.category && categoryOptions.includes(data.category)) {
              setCategory(data.category);
              setAddingSubcategory(false);
              setNewSubcategory('');
              setSubcategory('');
              fetchSubcategories(data.category);
            }
            if (data.subcategory && subcategories.includes(data.subcategory)) {
              setSubcategory(data.subcategory);
            }
            if (data.date) setDate(data.date);
            if (data.source && ['Bank A/C', 'Credit Card', 'BNPL'].includes(data.source)) {
              setSource(data.source);
            }
          }}
        />
      )}
      <div>
        <label className='block mb-1 font-medium text-sm'>Amount</label>
        <Input
          type='number'
          min='0'
          step='0.01'
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div>
        <label className='block mb-1 font-medium text-sm'>Description</label>
        <Input
          type='text'
          value={description}
          onChange={(e) => setDescription(capitalizeFirst(e.target.value))}
        />
      </div>
      <div>
        <label className='block mb-1 font-medium text-sm'>Category</label>
        <select
          className='w-full h-9 rounded-md border px-3 py-1 text-base bg-transparent'
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          required>
          {categoryOptions.map((cat) => (
            <option
              key={cat}
              value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className='block mb-1 font-medium text-sm'>Subcategory</label>
        <select
          className='w-full h-9 rounded-md border px-3 py-1 text-base bg-transparent'
          value={addingSubcategory ? '__add_new__' : subcategory}
          onChange={(e) => {
            if (e.target.value === '__add_new__') {
              setAddingSubcategory(true);
              setNewSubcategory('');
            } else {
              setSubcategory(e.target.value);
              setAddingSubcategory(false);
              setNewSubcategory('');
            }
          }}
          required>
          {subcategories.map((subcat) => (
            <option
              key={subcat}
              value={subcat}>
              {subcat}
            </option>
          ))}
          <option value='__add_new__'>+ Add new subcategory</option>
        </select>
        {addingSubcategory && (
          <div className='flex mt-2 gap-2'>
            <Input
              type='text'
              placeholder='New subcategory'
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              className='flex-1'
              autoFocus
            />
            <Button
              type='button'
              onClick={handleAddSubcategory}
              disabled={
                !newSubcategory.trim() ||
                subcategories.includes(newSubcategory.trim())
              }>
              Add
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setAddingSubcategory(false);
                setNewSubcategory('');
              }}>
              Cancel
            </Button>
          </div>
        )}
      </div>
 
      <div>
        <label className='block mb-1 font-medium text-sm'>Source</label>
        <select
          className='w-full h-9 rounded-md border px-3 py-1 text-base bg-transparent'
          value={source}
          onChange={(e) => setSource(e.target.value)}
          required>
          <option value='Bank A/C'>Bank A/C</option>
          <option value='Credit Card'>Credit Card</option>
          <option value='BNPL'>BNPL</option>
        </select>
      </div>
      <div>
        <label className='block mb-1 font-medium text-sm'>Date</label>
        <DatePicker
          date={date}
          onDateChange={setDate}
        />
      </div>
              <Button
          type='submit'
          disabled={loading}
          className='w-full'>
          {loading ? 'Saving...' : finalSubmitLabel}
        </Button>
    </form>
  );

  if (isModal) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-2 sm:p-4'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto'>
          <div className='flex justify-between items-center p-4 sm:p-6 border-b'>
            <h2 className='text-lg sm:text-xl font-semibold'>
              {mode === 'edit' ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='h-8 w-8 p-0'>
              <X className='h-4 w-4' />
            </Button>
          </div>
          <div className='p-4 sm:p-6'>
            {/* Balance Summary */}
            {showBalanceSummary && (
              <div ref={balanceCardRef} className='bg-gray-100 rounded-md p-2 sm:p-3 border border-gray-200 mb-4'>
                {isEditingBalance ? (
                  <div className='space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-gray-600'>Balance:</span>
                      <input
                        type='number'
                        value={tempBalance}
                        onChange={(e) => setTempBalance(e.target.value)}
                        placeholder='Enter balance'
                        className='flex-1 sm:w-32 h-9 px-2 sm:px-3 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                        autoFocus
                      />
                    </div>
                    <div className='flex gap-2 sm:flex-shrink-0'>
                      <Button
                        size='sm'
                        onClick={handleBalanceSave}
                        disabled={savingBalance || !tempBalance.trim()}
                        className='flex-1 sm:flex-none h-9 px-3 sm:px-4 bg-black text-white hover:bg-gray-800 text-xs sm:text-sm'>
                        {savingBalance ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={handleBalanceCancel}
                        className='flex-1 sm:flex-none h-9 px-3 sm:px-4 text-xs sm:text-sm'>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className='space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between'>
                    {/* Top row on mobile, horizontal on desktop */}
                    <div className='grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-4'>
                      <div className='flex flex-col sm:flex-row sm:items-center sm:gap-1 w-fit'>
                        <span className='text-xs text-muted-foreground'>Remaining:</span>
                        <span className={`text-sm font-semibold ${
                          (startingBalance || 0) - Object.values(totals).reduce(
                            (sum, cat) => sum + Object.values(cat).reduce((a, b) => a + b, 0),
                            0
                          ) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ₹{((startingBalance || 0) - Object.values(totals).reduce(
                            (sum, cat) => sum + Object.values(cat).reduce((a, b) => a + b, 0),
                            0
                          )).toFixed(2)}
                        </span>
                      </div>
                      <div className='flex flex-col sm:flex-row sm:items-center sm:gap-1 w-fit'>
                        <span className='text-xs text-muted-foreground'>Spent:</span>
                        <span className='text-sm font-semibold text-destructive'>
                          ₹{Object.values(totals).reduce(
                            (sum, cat) => sum + Object.values(cat).reduce((a, b) => a + b, 0),
                            0
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className='flex flex-col sm:flex-row sm:items-center sm:gap-1 w-fit'>
                        <span className='text-xs text-muted-foreground'>Balance:</span>
                        <span className='text-sm font-semibold'>₹{startingBalance?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    {/* Edit button - positioned on the right */}
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={handleBalanceEdit}
                      className='h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground flex-shrink-0 self-end sm:self-auto'>
                      <Pencil className='h-4 w-4' />
                    </Button>
                  </div>
                )}
              </div>
            )}
            {formContent}
          </div>
        </div>
      </div>
    );
  }

  return formContent;
}
