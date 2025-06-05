/** @format */

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ButtonAccount from '@/components/ButtonAccount';
import { Button } from '@/components/ui/button';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import ExpenseSummary from '@/components/ExpenseSummary';
import ExportCSVButton from '@/components/ExportCSVButton';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import config from '@/config';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import Logo from '@/components/Logo';
import heroExpenslly from '@/app/hero-expenslly.png';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className='min-h-screen p-4 pb-40'>
        <section className='max-w-2xl mx-auto space-y-8'>
          <div className='flex justify-between items-center'>
            {/* <h1 className='text-3xl md:text-4xl font-extrabold'>Expenslly</h1> */}
            <Logo />
            <div className='flex items-end justify-end gap-2'>
              <ButtonAccount />
              <ThemeToggleButton />
            </div>
          </div>
          <div className='flex justify-center py-20 items-center'>
            <Image
              src={heroExpenslly}
              width={1000}
              height={1000}
              className='w-full h-auto'
              alt='Hero Expenslly'
            />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className='min-h-screen p-4 pb-24'>
      <section className='max-w-2xl mx-auto space-y-8'>
        <div className='flex justify-between items-center'>
          {/* <h1 className='text-2xl md:text-4xl font-extrabold'>Expenslly</h1> */}
          <Logo />
          <div className='flex items-end justify-end gap-2'>
            <ButtonAccount />
            <ThemeToggleButton />
          </div>
        </div>
        <Tabs
          defaultValue='all'
          className='w-full'>
          <TabsList className='mb-4'>
            <TabsTrigger value='all'>All</TabsTrigger>
            <TabsTrigger value='needs'>Needs</TabsTrigger>
            <TabsTrigger value='wants'>Wants</TabsTrigger>
            <TabsTrigger value='investment'>Investment</TabsTrigger>
            <TabsTrigger value='summary'>Summary</TabsTrigger>
          </TabsList>
          <TabsContent value='all'>
            <Card>
              <CardHeader>
                <CardTitle>Add Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseForm />
                <ExpenseList />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='needs'>
            <Card>
              <CardHeader>
                <CardTitle>Needs</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseList initialCategory='Needs' />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='wants'>
            <Card>
              <CardHeader>
                <CardTitle>Wants</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseList initialCategory='Wants' />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='investment'>
            <Card>
              <CardHeader>
                <CardTitle>Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseList initialCategory='Investment' />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='summary'>
            <Card>
              <CardHeader>
                <CardTitle>Expense Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseSummary />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
