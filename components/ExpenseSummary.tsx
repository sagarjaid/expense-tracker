/** @format */

'use client';
import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExportCSVButton from './ExportCSVButton';
import {
  fetchSubcategories,
  subcategories as staticSubcategories,
} from '@/lib/utils';

const categories = ['Needs', 'Wants', 'Investment'] as const;
type Category = (typeof categories)[number];

type TotalsType = {
  [K in Category]: { [subcat: string]: number };
};

const initialTotals: TotalsType = {
  Needs: {},
  Wants: {},
  Investment: {},
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

// Simplified color mapping for categories
const categoryColors: Record<Category, string> = {
  Needs: '#ef4444', // red-500
  Wants: '#3b82f6', // blue-500
  Investment: '#22c55e', // green-500
};

// Generate colors for subcategories
const generateSubcategoryColors = (
  category: Category,
  subcatList: string[]
) => {
  const baseColors = {
    Needs: [
      '#ef4444',
      '#f87171',
      '#fca5a5',
      '#fecaca',
      '#fee2e2',
      '#fef2f2',
      '#dc2626',
      '#b91c1c',
      '#991b1b',
      '#7f1d1d',
      '#450a0a',
      '#ef4444',
      '#f87171',
      '#fca5a5',
    ],
    Wants: [
      '#3b82f6',
      '#60a5fa',
      '#93c5fd',
      '#bfdbfe',
      '#dbeafe',
      '#eff6ff',
      '#2563eb',
      '#1d4ed8',
      '#1e40af',
      '#1e3a8a',
      '#172554',
      '#3b82f6',
      '#60a5fa',
      '#93c5fd',
    ],
    Investment: [
      '#22c55e',
      '#4ade80',
      '#86efac',
      '#bbf7d0',
      '#dcfce7',
      '#f0fdf4',
      '#16a34a',
      '#15803d',
      '#166534',
      '#14532d',
      '#052e16',
      '#22c55e',
      '#4ade80',
      '#86efac',
    ],
  };

  return subcatList.reduce((acc, subcat, index) => {
    acc[subcat] = baseColors[category][index % baseColors[category].length];
    return acc;
  }, {} as Record<string, string>);
};

interface ChartDataPoint {
  date: string;
  total: number;
  [key: string]: number | string;
}

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

export default function ExpenseSummary() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const { first: defaultStart, last: defaultEnd } = getFirstAndLastDayOfMonth(
    selectedYear,
    selectedMonth
  );
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStart);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEnd);
  const [totals, setTotals] = useState<TotalsType>(initialTotals);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [mainCatChartData, setMainCatChartData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'trend' | 'pie'>('trend');
  const [pieData, setPieData] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subcategories, setSubcategories] = useState<
    Record<Category, string[]>
  >({
    Needs: [],
    Wants: [],
    Investment: [],
  });
  const mergedSubcategoriesRef = useRef<Record<Category, string[]>>({
    Needs: [],
    Wants: [],
    Investment: [],
  });

  // Update start/end date when month/year changes
  useEffect(() => {
    const { first, last } = getFirstAndLastDayOfMonth(
      selectedYear,
      selectedMonth
    );
    setStartDate(first);
    setEndDate(last);
  }, [selectedYear, selectedMonth]);

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
      setSubcategories({ Needs: needs, Wants: wants, Investment: investment });
    })();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSummary();
    setIsRefreshing(false);
  };

  const fetchSummary = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setTotals(initialTotals);
      setChartData([]);
      setMainCatChartData([]);
      setPieData([]);
      mergedSubcategoriesRef.current = {
        Needs: [...staticSubcategories.Needs],
        Wants: [...staticSubcategories.Wants],
        Investment: [...staticSubcategories.Investment],
      };
    } else {
      let query = supabase
        .from('expenses')
        .select('amount, category, subcategory, date')
        .eq('user_id', user.id);
      if (startDate) {
        query = query.gte('date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        query = query.lte('date', format(endDate, 'yyyy-MM-dd'));
      }
      const { data, error } = await query;
      console.log('Fetched expenses:', data);
      console.log('Subcategories object:', subcategories);
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
      } else {
        // --- Robust subcategory merging ---
        const normalize = (s: string) => (s || '').trim().toLowerCase();
        // Build merged subcategory list for each category
        const mergedSubcategories: Record<Category, string[]> = {
          Needs: [],
          Wants: [],
          Investment: [],
        };
        for (const cat of categories) {
          const staticList = staticSubcategories[cat] || [];
          const fetchedList = subcategories[cat] || [];
          // All subcats from expenses data for this category
          const dataList = (data || [])
            .filter((exp) => (exp.category?.trim() ?? '') === cat)
            .map((exp) => exp.subcategory?.trim() || '')
            .filter(Boolean);
          // Merge and dedupe, preserving order: static, then fetched, then data
          const seen = new Set();
          mergedSubcategories[cat] = [
            ...staticList,
            ...fetchedList,
            ...dataList,
          ].filter((subcat) => {
            const norm = normalize(subcat);
            if (!norm || seen.has(norm)) return false;
            seen.add(norm);
            return true;
          });
        }
        mergedSubcategoriesRef.current = mergedSubcategories;
        // Use mergedSubcategories for summary
        const sums: TotalsType = {
          Needs: {},
          Wants: {},
          Investment: {},
        };
        for (const cat of categories) {
          for (const subcat of mergedSubcategories[cat]) {
            sums[cat][subcat] = 0;
          }
        }
        // Sum expenses for all subcategories in merged list
        data.forEach((exp) => {
          const category = (exp.category?.trim() ?? '') as Category;
          const subcategory = exp.subcategory?.trim() ?? '';
          if (
            categories.includes(category) &&
            mergedSubcategories[category].some(
              (s) => normalize(s) === normalize(subcategory)
            )
          ) {
            const matchedSubcat = mergedSubcategories[category].find(
              (s) => normalize(s) === normalize(subcategory)
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
            if (categories.includes(exp.category as Category)) {
              const amount = Number(exp.amount);
              const category = exp.category as Category;
              dayObj[category] += amount;
            }
          });
          return dayObj;
        });
        setMainCatChartData(mainCatData);

        // Pie chart data: sum for each main category over the date range
        const pieSums = { Needs: 0, Wants: 0, Investment: 0 };
        data.forEach((exp) => {
          if (categories.includes(exp.category as Category)) {
            pieSums[exp.category as Category] += Number(exp.amount);
          }
        });
        setPieData(
          categories.map((cat) => ({
            name: cat,
            value: pieSums[cat],
            color: categoryColors[cat],
          }))
        );

        // Prepare data for the chart
        const dailyData = days.map((day) => {
          const dayExpenses = data.filter((exp) =>
            isSameDay(new Date(exp.date), day)
          );
          const dayTotal: ChartDataPoint = {
            date: format(day, 'dd/MM'),
            total: 0,
          };

          // Initialize all subcategory totals for this day
          categories.forEach((cat) => {
            mergedSubcategories[cat].forEach((subcat) => {
              dayTotal[`${cat}-${subcat}`] = 0;
            });
          });

          // Sum up expenses by subcategory for this day
          dayExpenses.forEach((exp) => {
            if (categories.includes(exp.category as Category)) {
              const amount = Number(exp.amount);
              const category = exp.category as Category;
              const subcat = exp.subcategory;

              if (mergedSubcategories[category]?.includes(subcat)) {
                dayTotal[`${category}-${subcat}`] =
                  (dayTotal[`${category}-${subcat}`] as number) + amount;
                dayTotal.total += amount;
              }
            }
          });

          return dayTotal;
        });

        setChartData(dailyData);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [startDate, endDate]);

  // Years for dropdown (current year +/- 5)
  const yearOptions = Array.from(
    { length: 11 },
    (_, i) => now.getFullYear() - 5 + i
  );

  // Tab UI
  const tabClass = (tab: 'trend' | 'pie') =>
    `px-4 py-2 rounded-t-md text-sm cursor-pointer ${
      activeTab === tab ? 'border border-b-0 font-medium' : '  border-gray-200'
    }`;

  return (
    <Card className=''>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <div className='flex flex-wrap gap-4  items-center'>
            <select
              className='h-9 rounded-md border px-3 py-1 text-base bg-transparent'
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
            <select
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
            </select>
          </div>

          <div className='flex items-center gap-2'>
            <ExportCSVButton />
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
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className='flex border-b'>
          <div
            className={tabClass('trend')}
            onClick={() => setActiveTab('trend')}>
            Daily Trend
          </div>
          <div
            className={tabClass('pie')}
            onClick={() => setActiveTab('pie')}>
            Category Split
          </div>
        </div>
        {loading ? (
          <div className='text-center py-8'>Loading...</div>
        ) : Object.keys(totals).length === 0 ? (
          <div className='text-center py-8'>No expenses found.</div>
        ) : (
          <>
            {/* Tab content */}
            {activeTab === 'trend' && (
              <div className='h-[400px] mb-8 pb-4 border-b border-x '>
                <ResponsiveContainer
                  width='100%'
                  height='100%'>
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
                      payload={categories.map((cat) => ({
                        value: cat,
                        type: 'square',
                        color: categoryColors[cat],
                        id: cat,
                      }))}
                    />
                    {categories.map((category) => (
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
            )}
            {activeTab === 'pie' && (
              <div className='h-[400px] mb-8 flex items-center justify-center'>
                <ResponsiveContainer
                  width='100%'
                  height='100%'>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey='value'
                      nameKey='name'
                      cx='50%'
                      cy='50%'
                      outerRadius={120}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(1)}%`
                      }>
                      {pieData.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Existing summary table */}
            <div className='space-y-8'>
              {categories.map((cat) => (
                <div
                  key={cat}
                  className=''>
                  <div className='text-lg font-semibold mb-2'>{cat}</div>
                  <div className='grid grid-cols-1 gap-2'>
                    {mergedSubcategoriesRef.current[cat].map(
                      (subcat: string) => (
                        <div
                          key={subcat}
                          className='flex justify-between border-b py-1'>
                          <span>{subcat}</span>
                          <span className='text-sm'>
                            ₹{totals[cat]?.[subcat]?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      )
                    )}
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
                    {categories
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
