/** @format */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-range-picker';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import VoiceInput from './VoiceInput';
import {
  categoryOptions,
  subcategories as defaultSubcategories,
} from '@/lib/utils';

export default function ExpenseForm() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categoryOptions[0]);
  const [subcategory, setSubcategory] = useState(
    defaultSubcategories[categoryOptions[0]][0]
  );
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [addingSubcategory, setAddingSubcategory] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!user || userError) {
      toast.error('User not authenticated.');
      setLoading(false);
      return;
    }
    const expense = {
      user_id: user.id,
      amount: parseFloat(amount),
      description: description.trim() === '' ? 'NULL' : description,
      category,
      subcategory,
      date: date ? format(date, 'yyyy-MM-dd') : undefined,
    };
    console.log(expense, 'expense');

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
    }
    setLoading(false);
  };

  // Helper to capitalize first letter
  function capitalizeFirst(str: string) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <form
      className='space-y-4'
      onSubmit={handleSubmit}>
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
        }}
      />
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
        <label className='block mb-1 font-medium text-sm'>Date</label>
        <DatePicker
          date={date}
          onDateChange={setDate}
        />
      </div>
      <Button
        type='submit'
        disabled={loading}>
        {loading ? 'Adding...' : 'Add Expense'}
      </Button>
    </form>
  );
}
