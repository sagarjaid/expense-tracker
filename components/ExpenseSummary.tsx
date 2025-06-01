/** @format */

'use client';
import React, { useEffect, useState } from 'react';
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

const subcategories: Record<Category, string[]> = {
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
const generateSubcategoryColors = (category: Category) => {
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

  return subcategories[category].reduce((acc, subcat, index) => {
    acc[subcat] = baseColors[category][index % baseColors[category].length];
    return acc;
  }, {} as Record<string, string>);
};

const subcategoryColors = {
  Needs: generateSubcategoryColors('Needs'),
  Wants: generateSubcategoryColors('Wants'),
  Investment: generateSubcategoryColors('Investment'),
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
        <p className='font-medium'>Total: ₹{total.toFixed(2)}</p>
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

  // Update start/end date when month/year changes
  useEffect(() => {
    const { first, last } = getFirstAndLastDayOfMonth(
      selectedYear,
      selectedMonth
    );
    setStartDate(first);
    setEndDate(last);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
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
        setLoading(false);
        return;
      }
      let query = supabase
        .from('expenses')
        .select('amount, category, subcategory, date')
        .eq('user_id', user.id);
      if (startDate) {
        query = query.gte('date', startDate.toISOString().slice(0, 10));
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString().slice(0, 10));
      }
      const { data, error } = await query;
      if (error || !data) {
        setTotals(initialTotals);
        setChartData([]);
        setMainCatChartData([]);
        setPieData([]);
      } else {
        // Calculate totals for the summary table
        const sums: TotalsType = {
          Needs: {},
          Wants: {},
          Investment: {},
        };

        // Initialize subcategory totals
        for (const cat of categories) {
          for (const subcat of subcategories[cat]) {
            sums[cat][subcat] = 0;
          }
        }

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
              // Update summary totals
              if (subcategories[category]?.includes(exp.subcategory)) {
                sums[category][exp.subcategory] += amount;
              }
            }
          });
          return dayObj;
        });
        setTotals(sums);
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
            subcategories[cat].forEach((subcat) => {
              dayTotal[`${cat}-${subcat}`] = 0;
            });
          });

          // Sum up expenses by subcategory for this day
          dayExpenses.forEach((exp) => {
            if (categories.includes(exp.category as Category)) {
              const amount = Number(exp.amount);
              const category = exp.category as Category;
              const subcat = exp.subcategory;

              if (subcategories[category]?.includes(subcat)) {
                dayTotal[`${category}-${subcat}`] =
                  (dayTotal[`${category}-${subcat}`] as number) + amount;
                dayTotal.total += amount;
                sums[category][subcat] += amount;
              }
            }
          });

          return dayTotal;
        });

        setChartData(dailyData);
      }
      setLoading(false);
    };
    fetchSummary();
  }, [startDate, endDate]);

  // Years for dropdown (current year +/- 5)
  const yearOptions = Array.from(
    { length: 11 },
    (_, i) => now.getFullYear() - 5 + i
  );

  // Tab UI
  const tabClass = (tab: 'trend' | 'pie') =>
    `px-4 py-2 rounded-t-md font-semibold cursor-pointer ${
      activeTab === tab ? 'bg-gray-200' : 'bg-gray-100 text-gray-500'
    }`;

  return (
    <Card className='mt-6'>
      <CardHeader>
        <CardTitle>Expense Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex flex-wrap gap-4 mb-4 items-center'>
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
              <div className='h-[400px] mb-8 border-b border-x '>
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
                    {subcategories[cat].map((subcat) => (
                      <div
                        key={subcat}
                        className='flex justify-between border-b py-1'>
                        <span>{subcat}</span>
                        <span className='font-medium'>
                          ₹{totals[cat]?.[subcat]?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className='mt-2 font-medium text-right'>
                    Total: ₹
                    {Object.values(totals[cat] || {})
                      .reduce((a, b) => a + b, 0)
                      .toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
