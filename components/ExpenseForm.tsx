/** @format */

'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-range-picker';
import { createClient } from '@/lib/supabase/client';

const categoryOptions = ['Needs', 'Wants', 'Investment'];

const subcategories: Record<string, string[]> = {
  Needs: [
    'Rent',
    'Food and Grocery',
    'Mobile',
    'Clothes',
    'Transport',
    'Bills',
    'Health insurance',
    'TDS',
    'Shopping',
    'Grooming',
    'Lending',
    'EMI',
    'Wife',
    'Other',
  ],
  Wants: [
    'Dining Out',
    'Entertainment',
    'Yearly travel plan',
    'Car/Bike',
    'New Gadget',
    'Phone',
    'Startup',
    'Other',
  ],
  Investment: [
    'PPF',
    'NPS',
    'Term Insurance',
    'Emergency Fund',
    'ELSS (MF)',
    'LIC',
    'Stocks/Index',
    'Home',
    'Other',
  ],
};

export default function ExpenseForm() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categoryOptions[0]);
  const [subcategory, setSubcategory] = useState(
    subcategories[categoryOptions[0]][0]
  );
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Update subcategory when category changes
  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setSubcategory(subcategories[cat][0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!user || userError) {
      setMessage('User not authenticated.');
      setLoading(false);
      return;
    }
    const expense = {
      user_id: user.id,
      amount: parseFloat(amount),
      description,
      category,
      subcategory,
      date: date ? date.toISOString().slice(0, 10) : undefined,
    };
    const { error } = await supabase.from('expenses').insert([expense]);
    if (error) {
      setMessage('Error adding expense: ' + error.message);
    } else {
      setMessage('Expense added successfully!');
      setAmount('');
      setDescription('');
      setCategory(categoryOptions[0]);
      setSubcategory(subcategories[categoryOptions[0]][0]);
      setDate(new Date());
    }
    setLoading(false);
  };

  return (
    <form
      className='space-y-4'
      onSubmit={handleSubmit}>
      <div>
        <label className='block mb-1 font-medium'>Amount</label>
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
        <label className='block mb-1 font-medium'>Description</label>
        <Input
          type='text'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <label className='block mb-1 font-medium'>Category</label>
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
        <label className='block mb-1 font-medium'>Subcategory</label>
        <select
          className='w-full h-9 rounded-md border px-3 py-1 text-base bg-transparent'
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          required>
          {subcategories[category].map((subcat) => (
            <option
              key={subcat}
              value={subcat}>
              {subcat}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className='block mb-1 font-medium'>Date</label>
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
      {message && <div className='text-sm mt-2'>{message}</div>}
    </form>
  );
}
