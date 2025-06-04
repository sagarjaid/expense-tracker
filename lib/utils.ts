/** @format */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createClient } from '@/lib/supabase/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const categoryOptions = ['Needs', 'Wants', 'Investment'];

// Static fallback for subcategories (useful for SSR or as a default)
export const subcategories: Record<string, string[]> = {
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

// Use this async function to fetch subcategories from Supabase
export async function fetchSubcategories(category: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('subcategories')
    .select('name')
    .eq('category', category)
    .order('name', { ascending: true });
  if (error) return [];
  return data.map((row) => row.name);
}
