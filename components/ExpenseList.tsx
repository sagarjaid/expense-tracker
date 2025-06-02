/** @format */

'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, RefreshCw, Trash2 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const categories = ['All', 'Needs', 'Wants', 'Investment'];
const subcategories: Record<string, string[]> = {
  Needs: [
    'Rent',
    'Food',
    'Grocery',
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

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getFirstAndLastDayOfMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return { first, last };
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  subcategory: string;
  date: string;
}

function CategoryPieChart({
  expenses,
  category,
}: {
  expenses: Expense[];
  category: string;
}) {
  // Calculate total amount for each subcategory
  const subcategoryTotals = expenses.reduce(
    (acc: Record<string, number>, exp) => {
      if (exp.category === category) {
        acc[exp.subcategory] = (acc[exp.subcategory] || 0) + Number(exp.amount);
      }
      return acc;
    },
    {}
  );

  // Convert to array format for Recharts
  const data = Object.entries(subcategoryTotals).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }));

  // Set color by category
  let mainColor = '#8884d8';
  if (category === 'Needs') mainColor = '#ef4444'; // red-500
  if (category === 'Wants') mainColor = '#3b82f6'; // blue-500
  if (category === 'Investment') mainColor = '#22c55e'; // green-500

  // Distinct color palette
  const PALETTE = [
    '#ef4444', // red
    '#3b82f6', // blue
    '#22c55e', // green
    '#f59e42', // orange
    '#a855f7', // purple
    '#eab308', // yellow
    '#14b8a6', // teal
    '#6366f1', // indigo
    '#f43f5e', // pink
    '#0ea5e9', // sky
    '#84cc16', // lime
    '#f97316', // orange dark
    '#b91c1c', // red dark
    '#7c3aed', // violet
    '#d97706', // amber
  ];

  let COLORS: string[] = [];
  if (data.length <= 1) {
    COLORS = [mainColor];
  } else {
    COLORS = data.map((_, i) => PALETTE[i % PALETTE.length]);
  }

  if (data.length === 0) return null;

  return (
    <div className='h-[340px] mb-20 w-full'>
      <h3 className='text-lg font-semibold mb-2'>{category} Distribution</h3>
      <ResponsiveContainer
        width='100%'
        height='100%'>
        <PieChart>
          <Pie
            data={data}
            cx='50%'
            cy='50%'
            labelLine={false}
            label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
            outerRadius={80}
            fill={COLORS[0]}
            dataKey='value'>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ExpenseList({
  initialCategory = 'All',
}: {
  initialCategory?: string;
}) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const { first: defaultStart, last: defaultEnd } = getFirstAndLastDayOfMonth(
    selectedYear,
    selectedMonth
  );
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStart);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEnd);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Update start/end date when month/year changes
  useEffect(() => {
    const { first, last } = getFirstAndLastDayOfMonth(
      selectedYear,
      selectedMonth
    );
    setStartDate(first);
    setEndDate(last);
  }, [selectedYear, selectedMonth]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchExpenses();
    setIsRefreshing(false);
  };

  const fetchExpenses = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    let query = supabase
      .from('expenses')
      .select('id, amount, description, category, subcategory, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    if (category !== 'All') {
      query = query.eq('category', category);
    }
    if (category !== 'All' && subcategory) {
      query = query.eq('subcategory', subcategory);
    }
    if (startDate) {
      query = query.gte('date', format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      query = query.lte('date', format(endDate, 'yyyy-MM-dd'));
    }
    const { data, error } = await query;
    if (!error) {
      setExpenses(data || []);
    } else {
      setExpenses([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, [category, subcategory, startDate, endDate]);

  // Reset subcategory when category changes
  useEffect(() => {
    setSubcategory('');
  }, [category]);

  // Years for dropdown (current year +/- 5)
  const yearOptions = Array.from(
    { length: 11 },
    (_, i) => now.getFullYear() - 5 + i
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      alert('Error deleting expense: ' + error.message);
    } else {
      // Refresh the list after successful deletion
      await fetchExpenses();
    }
    setDeletingId(null);
  };

  return (
    <Card className='mt-4'>
      <CardContent className='p-4'>
        <div className='flex flex-wrap gap-4 mb-4 items-center justify-between'>
          <div className='flex flex-wrap gap-4 items-center'>
            <select
              className='w-fit h-9 rounded-md border px-3 py-1 text-base bg-transparent'
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {monthNames.map((name, idx) => (
                <option
                  key={name}
                  value={idx}>
                  {name}
                </option>
              ))}
            </select>
            {/* <select
              className='h-9 rounded-md border px-3 py-1 text-base bg-transparent'
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {yearOptions.map((y) => (
                <option
                  key={y}
                  value={y}>
                  {y}
                </option>
              ))}
            </select> */}

            {category === 'All' && (
              <select
                className='w-36 h-9 rounded-md border px-2 py-1 text-base bg-transparent'
                value={category}
                onChange={(e) => setCategory(e.target.value)}>
                {categories.map((cat) => (
                  <option
                    key={cat}
                    value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
            {category !== 'All' && (
              <select
                className='w-36 h-9 rounded-md border px-2 py-1 text-base bg-transparent'
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}>
                <option value=''>Subcategory</option>
                {subcategories[category]?.map((subcat) => (
                  <option
                    key={subcat}
                    value={subcat}>
                    {subcat}
                  </option>
                ))}
              </select>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='h-9 px-3 py-1'>
                  <CalendarIcon className='h-4 w-4 mr-2' />
                  {startDate && endDate
                    ? `${format(startDate, 'dd/MM/yyyy')} - ${format(
                        endDate,
                        'dd/MM/yyyy'
                      )}`
                    : 'Select Dates'}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className='w-auto p-4'
                align='start'>
                <div className='flex flex-col gap-4 justify-end'>
                  <div className='flex gap-2 items-center justify-end'>
                    <span className='text-sm'>From:</span>
                    <DatePicker
                      date={startDate}
                      onDateChange={setStartDate}
                    />
                  </div>
                  <div className='flex gap-2 items-center justify-end'>
                    <span className='text-sm'>To:</span>
                    <DatePicker
                      date={endDate}
                      onDateChange={setEndDate}
                    />
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full'
                    onClick={() => {
                      setStartDate(undefined);
                      setEndDate(undefined);
                    }}>
                    Clear
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className='flex items-center gap-2'>
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>
        {loading ? (
          <div className='text-center py-8'>Loading...</div>
        ) : expenses.length === 0 ? (
          <div className='text-center py-8'>No expenses found.</div>
        ) : (
          <>
            {category !== 'All' && (
              <div className='mb-8'>
                <Card className='p-4'>
                  <CategoryPieChart
                    expenses={expenses}
                    category={category}
                  />
                </Card>
              </div>
            )}
            <div className='overflow-x-auto'>
              <table className='min-w-full text-sm'>
                <thead>
                  <tr className='border'>
                    <th className='px-2 py-4 text-left'>Date</th>
                    <th className='px-2 py-4 text-left'>Category</th>
                    <th className='px-2 py-4 text-left'>Subcategory</th>
                    <th className='px-2 py-4 text-left'>Amount</th>
                    <th className='px-2 py-4 text-center'>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className='border hover:bg-muted/30'>
                      <td className='p-2'>
                        {exp.date
                          ? format(
                              new Date(exp.date + 'T00:00:00'),
                              'dd/MM/yyyy'
                            )
                          : ''}
                      </td>
                      <td className='px-2 py-2'>{exp.category}</td>
                      <td className='px-2 py-2'>{exp.subcategory}</td>
                      <td className='px-2 py-2'>
                        ₹{Number(exp.amount).toFixed(2)}
                      </td>
                      <td className='px-2 py-2 text-center'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(exp.id)}
                          disabled={deletingId === exp.id}
                          className='h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground'>
                          <Trash2
                            className={`h-4 w-4 ${
                              deletingId === exp.id ? 'animate-pulse' : ''
                            }`}
                          />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
