/** @format */

'use client';
import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker-new';
import { Button } from '@/components/ui/button';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';

import { CalendarIcon, RefreshCw, Trash2, Pencil, ChevronDown, ChevronRight, ChevronUp, ChevronDown as ChevronDownIcon } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  fetchSubcategories,
  subcategories as staticSubcategories,
} from '@/lib/utils';
import BalanceSummaryBar from './BalanceSummaryBar';
import ExportCSVButton from './ExportCSVButton';
import StartingBalance from './StartingBalance';
import CombinedBalanceCard from './CombinedBalanceCard';
import ExpenseForm from './ExpenseForm';



const categories = ['All', 'Needs', 'Wants', 'Investment'];
const mainCategories = ['Needs', 'Wants', 'Investment'] as const;
type MainCategory = (typeof mainCategories)[number];

type TotalsType = {
  [K in MainCategory]: { [subcat: string]: number };
};

const initialTotals: TotalsType = {
  Needs: {},
  Wants: {},
  Investment: {},
};

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  subcategory: string;
  date: string;
  source: string;
}

interface DetailedExpense {
  id: string;
  amount: number;
  description: string;
  category: string;
  subcategory: string;
  date: string;
  source: string;
}

interface ChartDataPoint {
  date: string;
  total: number;
  [key: string]: number | string;
}



function getFirstAndLastDayOfMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  // Convert to local timezone
  const firstLocal = new Date(
    first.getTime() - first.getTimezoneOffset() * 60000
  );
  const lastLocal = new Date(last.getTime() - last.getTimezoneOffset() * 60000);

  return { first: firstLocal, last: lastLocal };
}

// Simplified color mapping for categories
const categoryColors: Record<MainCategory, string> = {
  Needs: '#ef4444', // red-500
  Wants: '#3b82f6', // blue-500
  Investment: '#22c55e', // green-500
};

// Custom tooltip for main categories only
const MainCategoryTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce(
      (sum: number, p: any) => sum + (p.value || 0),
      0
    );
    return (
      <div className='bg-white p-4 border rounded-lg shadow-lg'>
        <p className='font-medium mb-2'>Date: {label}</p>
        {payload.map((p: any) => (
          <p
            key={p.name}
            className='font-semibold'
            style={{ color: p.fill }}>
            {p.name}: ₹{p.value.toFixed(2)}
          </p>
        ))}
        <hr className='my-2' />
        <p className='font-medium'>Total: ₹ {total.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function ExpenseDashboard() {
  const now = new Date();
  const { first: defaultStart, last: defaultEnd } = getFirstAndLastDayOfMonth(
    now.getFullYear(),
    now.getMonth()
  );
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStart);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEnd);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [subcategory, setSubcategory] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<string[]>([]);


  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Summary states
  const [totals, setTotals] = useState<TotalsType>(initialTotals);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [mainCatChartData, setMainCatChartData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'summary'>('list');
  const [pieData, setPieData] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [summarySubcategories, setSummarySubcategories] = useState<
    Record<MainCategory, string[]>
  >({
    Needs: [],
    Wants: [],
    Investment: [],
  });
  const [startingBalance, setStartingBalance] = useState<number | null>(null);
  const mergedSubcategoriesRef = useRef<Record<MainCategory, string[]>>({
    Needs: [],
    Wants: [],
    Investment: [],
  });

  // Summary expansion states
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});
  const [detailedExpenses, setDetailedExpenses] = useState<Record<string, DetailedExpense[]>>({});
  const [loadingExpenses, setLoadingExpenses] = useState<Record<string, boolean>>({});
  
  // Sorting state
  const [sortField, setSortField] = useState<'date' | 'category' | 'subcategory' | 'amount' | 'source'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');



  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchExpenses();
    await fetchSummary();
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
      .select('id, amount, description, category, subcategory, date, source')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    if (category !== 'All') {
      query = query.eq('category', category);
    }
    if (category !== 'All' && subcategory) {
      query = query.eq('subcategory', subcategory);
    }
    if (startDate) {
      const localStartDate = new Date(
        startDate.getTime() - startDate.getTimezoneOffset() * 60000
      );
      query = query.gte('date', format(localStartDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      const localEndDate = new Date(
        endDate.getTime() - endDate.getTimezoneOffset() * 60000
      );
      query = query.lte('date', format(localEndDate, 'yyyy-MM-dd'));
    }
    const { data, error } = await query;
    if (!error) {
      setExpenses(data || []);
    } else {
      setExpenses([]);
    }
    setLoading(false);
  };

  const fetchSummary = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setTotals(initialTotals);
      setChartData([]);
      setMainCatChartData([]);
      setPieData([]);
      setStartingBalance(null);
      mergedSubcategoriesRef.current = {
        Needs: [...staticSubcategories.Needs],
        Wants: [...staticSubcategories.Wants],
        Investment: [...staticSubcategories.Investment],
      };
      return;
    }

    // Fetch starting balance - use current month/year since we removed the selectors
    const currentDate = new Date();
    const { data: balanceData } = await supabase
      .from('monthly_balances')
      .select('amount')
      .eq('user_id', user.id)
      .eq('month', currentDate.getMonth())
      .eq('year', currentDate.getFullYear())
      .single();

    setStartingBalance(balanceData?.amount || null);

    let query = supabase
      .from('expenses')
      .select('amount, category, subcategory, date, source')
      .eq('user_id', user.id);
    if (startDate) {
      const localStartDate = new Date(
        startDate.getTime() - startDate.getTimezoneOffset() * 60000
      );
      query = query.gte('date', format(localStartDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      const localEndDate = new Date(
        endDate.getTime() - endDate.getTimezoneOffset() * 60000
      );
      query = query.lte('date', format(localEndDate, 'yyyy-MM-dd'));
    }
    const { data, error } = await query;
    
    if (error || !data) {
      setTotals(initialTotals);
      setChartData([]);
      setMainCatChartData([]);
      setPieData([]);
      mergedSubcategoriesRef.current = {
        Needs: [...staticSubcategories.Needs],
        Wants: [...staticSubcategories.Wants],
        Investment: [...staticSubcategories.Investment],
      };
      return;
    }

    // Build merged subcategory list for each category
    const mergedSubcategories: Record<MainCategory, string[]> = {
      Needs: [],
      Wants: [],
      Investment: [],
    };
    
    for (const cat of mainCategories) {
      const staticList = staticSubcategories[cat] || [];
      const fetchedList = summarySubcategories[cat] || [];
      const dataList = (data || [])
        .filter((exp) => (exp.category?.trim() ?? '') === cat)
        .map((exp) => exp.subcategory?.trim() || '')
        .filter(Boolean);
      
      const seen = new Set();
      mergedSubcategories[cat] = [
        ...staticList,
        ...fetchedList,
        ...dataList,
      ].filter((subcat) => {
        const norm = subcat.toLowerCase();
        if (!norm || seen.has(norm)) return false;
        seen.add(norm);
        return true;
      });
    }
    mergedSubcategoriesRef.current = mergedSubcategories;

    // Calculate totals
    const sums: TotalsType = {
      Needs: {},
      Wants: {},
      Investment: {},
    };
    for (const cat of mainCategories) {
      for (const subcat of mergedSubcategories[cat]) {
        sums[cat][subcat] = 0;
      }
    }
    
    data.forEach((exp) => {
      const category = (exp.category?.trim() ?? '') as MainCategory;
      const subcategory = exp.subcategory?.trim() ?? '';
      if (
        mainCategories.includes(category) &&
        mergedSubcategories[category].some(
          (s) => s.toLowerCase() === subcategory.toLowerCase()
        )
      ) {
        const matchedSubcat = mergedSubcategories[category].find(
          (s) => s.toLowerCase() === subcategory.toLowerCase()
        );
        if (matchedSubcat) {
          sums[category][matchedSubcat] += Number(exp.amount);
        }
      }
    });
    setTotals(sums);

    // Prepare data for the main category stacked bar chart
    const days = eachDayOfInterval({ start: startDate!, end: endDate! });
    const mainCatData = days.map((day) => {
      const dayExpenses = data.filter((exp) =>
        isSameDay(new Date(exp.date), day)
      );
      const dayObj: any = {
        date: format(day, 'd MMMM'),
        Needs: 0,
        Wants: 0,
        Investment: 0,
      };
      dayExpenses.forEach((exp) => {
        if (mainCategories.includes(exp.category as MainCategory)) {
          const amount = Number(exp.amount);
          const category = exp.category as MainCategory;
          dayObj[category] += amount;
        }
      });
      return dayObj;
    });
    setMainCatChartData(mainCatData);

    // Pie chart data
    const pieSums = { Needs: 0, Wants: 0, Investment: 0 };
    data.forEach((exp) => {
      if (mainCategories.includes(exp.category as MainCategory)) {
        pieSums[exp.category as MainCategory] += Number(exp.amount);
      }
    });
    setPieData(
      mainCategories.map((cat) => ({
        name: cat,
        value: pieSums[cat],
        color: categoryColors[cat],
      }))
    );
  };

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, [category, subcategory, startDate, endDate]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (category !== 'All') {
      fetchSubcategories(category).then((subs) => {
        if (!subs || subs.length === 0) {
          setSubcategories(staticSubcategories[category] || []);
        } else {
          setSubcategories(subs);
        }
      });
    } else {
      setSubcategories([]);
    }
  }, [category]);

  // Reset subcategory when category changes
  useEffect(() => {
    setSubcategory('');
  }, [category]);

  // Fetch subcategories for all categories on mount
  useEffect(() => {
    (async () => {
      let needs = await fetchSubcategories('Needs');
      if (!needs || needs.length === 0) needs = staticSubcategories['Needs'];
      let wants = await fetchSubcategories('Wants');
      if (!wants || wants.length === 0) wants = staticSubcategories['Wants'];
      let investment = await fetchSubcategories('Investment');
      if (!investment || investment.length === 0)
        investment = staticSubcategories['Investment'];
      setSummarySubcategories({ Needs: needs, Wants: wants, Investment: investment });
    })();
  }, []);



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
      await fetchExpenses();
      await fetchSummary();
    }
    setDeletingId(null);
  };

  const handleEdit = (id: string) => {
    const expense = expenses.find((exp) => exp.id === id);
    if (expense) {
      setEditingExpense(expense);
      setIsEditModalOpen(true);
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingExpense(null);
    fetchExpenses();
    fetchSummary();
  };

  // Summary expansion functions
  const toggleSubcategory = async (category: MainCategory, subcategory: string) => {
    const key = `${category}-${subcategory}`;
    const isExpanded = expandedSubcategories[key];
    
    if (isExpanded) {
      setExpandedSubcategories(prev => ({ ...prev, [key]: false }));
    } else {
      setExpandedSubcategories(prev => ({ ...prev, [key]: true }));
      setLoadingExpenses(prev => ({ ...prev, [key]: true }));
      
      await fetchDetailedExpenses(category, subcategory);
      setLoadingExpenses(prev => ({ ...prev, [key]: false }));
    }
  };

  const fetchDetailedExpenses = async (category: MainCategory, subcategory: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) return;

    let query = supabase
      .from('expenses')
      .select('id, amount, description, category, subcategory, date, source')
      .eq('user_id', user.id)
      .eq('category', category)
      .eq('subcategory', subcategory)
      .order('date', { ascending: false });

    if (startDate) {
      const localStartDate = new Date(
        startDate.getTime() - startDate.getTimezoneOffset() * 60000
      );
      query = query.gte('date', format(localStartDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      const localEndDate = new Date(
        endDate.getTime() - endDate.getTimezoneOffset() * 60000
      );
      query = query.lte('date', format(localEndDate, 'yyyy-MM-dd'));
    }

    const { data, error } = await query;
    if (!error && data) {
      const key = `${category}-${subcategory}`;
      setDetailedExpenses(prev => ({ ...prev, [key]: data }));
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }
    
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      alert('Error deleting expense: ' + error.message);
    } else {
      await fetchExpenses();
      await fetchSummary();
      
      // Refresh all expanded subcategories
      for (const [key, isExpanded] of Object.entries(expandedSubcategories)) {
        if (isExpanded) {
          const [category, subcategory] = key.split('-');
          await fetchDetailedExpenses(category as MainCategory, subcategory);
        }
      }
    }
    setDeletingId(null);
  };

  // Sorting function
  const handleSort = (field: 'date' | 'category' | 'subcategory' | 'amount' | 'source') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };



  // Sort expenses
  const sortedExpenses = [...expenses].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'date':
        aValue = new Date(a.date);
        bValue = new Date(b.date);
        break;
      case 'category':
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
        break;
      case 'subcategory':
        aValue = a.subcategory.toLowerCase();
        bValue = b.subcategory.toLowerCase();
        break;
      case 'amount':
        aValue = Number(a.amount);
        bValue = Number(b.amount);
        break;
      case 'source':
        aValue = a.source.toLowerCase();
        bValue = b.source.toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  // Tab UI
  const tabClass = (tab: 'list' | 'summary') =>
    `px-4 py-2 rounded-t-md text-sm cursor-pointer ${
      activeTab === tab ? 'border border-b-0 font-medium' : 'border-gray-200'
    }`;

  return (
    <Card className='mt-0 space-t-0'>
      <CardHeader className='pb-3'>
        <div className='flex justify-between flex-wrap gap-2 items-center'>
          <div className='flex items-center gap-2'>
           
            
            <DateRangePicker
              initialDateFrom={startDate}
              initialDateTo={endDate}
              onUpdate={({ from, to }) => {
                setStartDate(from);
                setEndDate(to);
              }}
              align="start"
              className='w-fit'
            />
        
          

          </div>
          
          <div className='flex items-center gap-2'>
          {activeTab === 'list' && (
              <>
                <select
                  className='w-24 h-8 rounded-md border px-2 py-1 text-sm bg-transparent'
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                                  {category !== 'All' && (
                    <select
                      className='w-28 h-8 rounded-md border px-2 py-1 text-sm bg-transparent'
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}>
                      <option value=''>All Subcategories</option>
                      {subcategories.map((subcat) => (
                        <option key={subcat} value={subcat}>
                          {subcat}
                        </option>
                      ))}
                    </select>
                  )}
              </>
            )}
            <ExportCSVButton />
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className='h-8 px-2'>
              <RefreshCw
                className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
            <CardContent className='pt-0'>
        {/* Tabs */}
        <div className='flex border-b'>
          <div
            className={tabClass('list')}
            onClick={() => setActiveTab('list')}>
            Recent Expenses
          </div>
          <div
            className={tabClass('summary')}
            onClick={() => setActiveTab('summary')}>
            Summary
          </div>
        </div>



        {loading ? (
          <div className='text-center py-8'>Loading...</div>
        ) : (
          <>
            {/* Recent Expenses Tab */}
            {activeTab === 'list' && (
              <div className='mt-4 space-y-6'>
                {/* Daily Trend Chart */}
                <div className='h-[300px] mb-6 pb-4 border-b border-x'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart
                      data={mainCatChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis
                        dataKey='date'
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor='end'
                        height={60}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <Tooltip content={<MainCategoryTooltip />} />
                      <Legend
                        payload={mainCategories.map((cat) => {
                          const total = mainCatChartData.reduce((sum, day) => sum + (day[cat] || 0), 0);
                          const grandTotal = mainCatChartData.reduce((sum, day) => 
                            sum + (day.Needs || 0) + (day.Wants || 0) + (day.Investment || 0), 0
                          );
                          const percentage = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : '0.0';
                          return {
                            value: `${cat} (${percentage}%)`,
                            type: 'square',
                            color: categoryColors[cat],
                            id: cat,
                          };
                        })}
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                      {mainCategories.map((category) => (
                        <Bar
                          key={category}
                          dataKey={category}
                          name={category}
                          fill={categoryColors[category]}
                          stackId='main'
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Expenses Table */}
                {expenses.length === 0 ? (
                  <div className='text-center py-8'>No expenses found.</div>
                ) : (
                  <div className='overflow-x-auto'>
                    <table className='min-w-full text-sm'>
                      <thead>
                        <tr className='border'>
                          <th 
                            className='px-3 py-2 text-left whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none'
                            onClick={() => handleSort('date')}
                          >
                            <div className='flex items-center gap-1'>
                              Date
                              {sortField === 'date' && (
                                sortDirection === 'asc' ? 
                                  <ChevronUp className='h-3 w-3' /> : 
                                  <ChevronDownIcon className='h-3 w-3' />
                              )}
                            </div>
                          </th>
                          <th 
                            className='px-3 py-2 text-left whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none'
                            onClick={() => handleSort('category')}
                          >
                            <div className='flex items-center gap-1'>
                              Category
                              {sortField === 'category' && (
                                sortDirection === 'asc' ? 
                                  <ChevronUp className='h-3 w-3' /> : 
                                  <ChevronDownIcon className='h-3 w-3' />
                              )}
                            </div>
                          </th>
                          <th 
                            className='px-3 py-2 text-left whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none'
                            onClick={() => handleSort('subcategory')}
                          >
                            <div className='flex items-center gap-1'>
                              Subcategory
                              {sortField === 'subcategory' && (
                                sortDirection === 'asc' ? 
                                  <ChevronUp className='h-3 w-3' /> : 
                                  <ChevronDownIcon className='h-3 w-3' />
                              )}
                            </div>
                          </th>
                          <th className='px-3 py-2 text-left whitespace-nowrap'>Description</th>
                          <th 
                            className='px-3 py-2 text-left whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none'
                            onClick={() => handleSort('source')}
                          >
                            <div className='flex items-center gap-1'>
                              Source
                              {sortField === 'source' && (
                                sortDirection === 'asc' ? 
                                  <ChevronUp className='h-3 w-3' /> : 
                                  <ChevronDownIcon className='h-3 w-3' />
                              )}
                            </div>
                          </th>
                          <th 
                            className='px-3 py-2 text-left whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none'
                            onClick={() => handleSort('amount')}
                          >
                            <div className='flex items-center gap-1'>
                              Amount
                              {sortField === 'amount' && (
                                sortDirection === 'asc' ? 
                                  <ChevronUp className='h-3 w-3' /> : 
                                  <ChevronDownIcon className='h-3 w-3' />
                              )}
                            </div>
                          </th>
                          <th className='px-3 py-2 text-center whitespace-nowrap'>Delete</th>
                          <th className='px-3 py-2 text-center whitespace-nowrap'>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedExpenses.map((exp) => (
                          <tr key={exp.id} className='border hover:bg-muted/30'>
                            <td className='p-3 whitespace-nowrap'>
                              {exp.date
                                ? format(new Date(exp.date + 'T00:00:00'), 'dd/MM/yyyy')
                                : ''}
                            </td>
                            <td className='px-3 py-2 whitespace-nowrap'>{exp.category}</td>
                            <td className='px-3 py-2 whitespace-nowrap'>{exp.subcategory}</td>
                            <td className='px-3 py-2 whitespace-nowrap'>
                              {exp.description?.trim() ? exp.description : 'NA'}
                            </td>
                            <td className='px-3 py-2 whitespace-nowrap'>{exp.source || 'Bank A/C'}</td>
                            <td className='px-3 py-2 whitespace-nowrap'>
                              {Number(exp.amount).toFixed(2)}
                            </td>
                            <td className='px-3 py-2 text-center whitespace-nowrap'>
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
                            <td className='px-3 py-2 text-center whitespace-nowrap'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleEdit(exp.id)}
                                className='h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground'>
                                <Pencil className='h-4 w-4' />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className='mt-4 space-y-6'>
                {/* Category Split Chart */}
                <div className='h-[250px] mb-6 flex items-center justify-center'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey='value'
                        nameKey='name'
                        cx='50%'
                        cy='50%'
                        outerRadius={90}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(1)}%`
                        }>
                        {pieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Breakdown */}
                {mainCategories.map((cat) => (
                  <div key={cat} className=''>
                    <div className='text-lg font-semibold mb-2'>{cat}</div>
                    <div className='grid grid-cols-1 gap-2'>
                      {mergedSubcategoriesRef.current[cat].map((subcat: string) => {
                        const key = `${cat}-${subcat}`;
                        const isExpanded = expandedSubcategories[key];
                        const expenses = detailedExpenses[key] || [];
                        const isLoading = loadingExpenses[key];
                        
                        return (
                          <div key={subcat}>
                            <div
                              className='flex justify-between py-1 cursor-pointer hover:bg-muted/50'
                              onClick={() => toggleSubcategory(cat, subcat)}>
                              <div className='flex items-center gap-2'>
                                {isExpanded ? (
                                  <ChevronDown className='h-4 w-4' />
                                ) : (
                                  <ChevronRight className='h-4 w-4' />
                                )}
                                <span>{subcat}</span>
                              </div>
                              <span className='text-sm'>
                                ₹{totals[cat]?.[subcat]?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                            
                            {isExpanded && (
                              <div className='ml-6 mt-2 mb-4 border-l-2 border-muted'>
                                {isLoading ? (
                                  <div className='text-center py-4 text-sm'>Loading expenses...</div>
                                ) : expenses.length === 0 ? (
                                  <div className='text-center py-4 text-sm'>No expenses found for this subcategory</div>
                                ) : (
                                  <div className='overflow-x-auto border rounded-md'>
                                    <table className='w-full text-sm'>
                                      <thead>
                                        <tr className='bg-muted/50 border-b'>
                                          <th className='px-4 py-3 text-left font-medium'>Date</th>
                                          <th className='px-4 py-3 text-left font-medium'>Description</th>
                                          <th className='px-3 py-3 text-left font-medium'>Source</th>
                                          <th className='px-3 py-3 text-center font-medium w-12'>Delete</th>
                                          <th className='px-3 py-3 text-center font-medium w-12'>Edit</th>
                                          <th className='px-3 py-3 text-right font-medium w-[140px]'>Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {expenses.map((exp) => (
                                          <tr key={exp.id} className='border-b hover:bg-muted/20 transition-colors'>
                                            <td className='px-4 py-3 whitespace-nowrap font-medium'>
                                              {exp.date
                                                ? format(new Date(exp.date + 'T00:00:00'), 'dd/MM/yyyy')
                                                : ''}
                                            </td>
                                            <td className='px-4 py-3 max-w-xs truncate'>
                                              {exp.description?.trim() ? exp.description : 'NA'}
                                            </td>
                                            <td className='px-3 py-3 whitespace-nowrap'>{exp.source || 'Bank A/C'}</td>
                                            <td className='px-3 py-3 text-center'>
                                              <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteExpense(exp.id);
                                                }}
                                                disabled={deletingId === exp.id}
                                                className='h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground transition-colors'>
                                                <Trash2
                                                  className={`h-3.5 w-3.5 ${
                                                    deletingId === exp.id ? 'animate-pulse' : ''
                                                  }`}
                                                />
                                              </Button>
                                            </td>
                                            <td className='px-3 py-3 text-center'>
                                              <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleEdit(exp.id);
                                                }}
                                                className='h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground transition-colors'>
                                                <Pencil className='h-3.5 w-3.5' />
                                              </Button>
                                            </td>
                                            <td className='px-3 py-3 text-right font-medium'>
                                              ₹{Number(exp.amount).toFixed(2)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      {expenses.length > 2 && (
                                        <tfoot>
                                          <tr className='border-t-2 border-muted bg-muted/50'>
                                            <td className='px-4 py-3 font-semibold'>Total</td>
                                            <td className='px-4 py-3'></td>
                                            <td className='px-3 py-3'></td>
                                            <td className='px-3 py-3'></td>
                                            <td className='px-3 py-3'></td>
                                            <td className='px-3 py-3 text-right font-semibold'>
                                              ₹{expenses.reduce((sum, exp) => sum + Number(exp.amount), 0).toFixed(2)}
                                            </td>
                                          </tr>
                                        </tfoot>
                                      )}
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className='mt-2 font-medium text-sm text-right'>
                      Total: ₹
                      {Object.values(totals[cat] || {})
                        .reduce((a, b) => a + b, 0)
                        .toFixed(2)}
                    </div>
                  </div>
                ))}

                {/* Grand Total Section */}
                <div className='mt-8 pt-4 border-t-2 border-gray-200'>
                  <div className='flex justify-between items-center'>
                    <div className='text-lg font-bold'>Grand Total</div>
                    <div className='text-lg font-bold'>
                      ₹
                      {mainCategories
                        .reduce(
                          (sum, cat) =>
                            sum +
                            Object.values(totals[cat] || {}).reduce(
                              (a, b) => a + b,
                              0
                            ),
                          0
                        )
                        .toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}


          </>
        )}
      </CardContent>
      {/* Edit Expense Modal */}
      {isEditModalOpen && editingExpense && (
        <ExpenseForm
          mode="edit"
          expenseId={editingExpense.id}
          initialValues={{
            amount: editingExpense.amount.toString(),
            description: editingExpense.description,
            category: editingExpense.category,
            subcategory: editingExpense.subcategory,
            date: new Date(editingExpense.date),
            source: editingExpense.source || 'Bank A/C',
          }}
          isModal={true}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingExpense(null);
            fetchExpenses();
            fetchSummary();
          }}
          showVoiceInput={false}
          showBalanceSummary={true}
          startingBalance={startingBalance}
          totals={totals}
          onBalanceUpdate={(newBalance) => setStartingBalance(newBalance)}
        />
      )}
    </Card>
  );
} 