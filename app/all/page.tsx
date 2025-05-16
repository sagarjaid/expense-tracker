/** @format */

'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import { useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import { usePathname } from 'next/navigation';
import AssetCard from '@/components/AssetCard';
import { assetData } from '@/app/all/assetData';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import config from '@/config';

// Define types for our assets
interface Asset {
  name: string;
  symbol: string;
  category: string;
}

function AssetGrid() {
  const [activeCategory, setActiveCategory] = useState('All');

  const allAssets = useMemo(
    () => [
      // Stocks
      ...assetData.stocksList.map(
        (stock: { name: string; symbol: string }) => ({
          ...stock,
          category: 'stock',
        })
      ),
      // Commodities
      ...assetData.commodityList.map(
        (commodity: { name: string; symbol: string }) => ({
          ...commodity,
          category: 'commodity',
        })
      ),
      // Cryptocurrencies
      ...assetData.currencyList.map(
        (currency: { name: string; symbol: string }) => ({
          ...currency,
          category: 'currency',
        })
      ),
      // Real Estate
      ...assetData.estateList.map(
        (estate: { name: string; symbol: string }) => ({
          ...estate,
          category: 'real-estate',
        })
      ),
      // Indices
      ...assetData.indexList.map((index: { name: string; symbol: string }) => ({
        ...index,
        category: 'indices',
      })),
      // Bonds
      ...assetData.bondsList.map((bond: { name: string; symbol: string }) => ({
        ...bond,
        category: 'bond',
      })),
    ],
    []
  );

  const filteredAssets = useMemo(() => {
    if (activeCategory === 'All') return allAssets;
    return allAssets.filter((asset) => asset.category === activeCategory);
  }, [allAssets, activeCategory]);

  const categories = [
    { name: 'All', value: 'All' },
    { name: 'Stocks', value: 'stock' },
    { name: 'Commodities', value: 'commodity' },
    { name: 'Currencies', value: 'currency' },
    { name: 'Real Estate', value: 'real-estate' },
    { name: 'Indices', value: 'indices' },
    { name: 'Bonds', value: 'bond' },
  ];

  return (
    <div className='space-y-4'>
      <Tabs
        defaultValue='All'
        value={activeCategory}
        onValueChange={setActiveCategory}
        className='w-full'>
        <div className='border-b hover:overflow-x-auto'>
          <TabsList className='bg-transparent h-auto p-0'>
            {categories.map((category) => (
              <TabsTrigger
                key={category.value}
                value={category.value}
                className={cn(
                  'px-4 py-1.5 my-2 rounded-full data-[state=active]:bg-muted data-[state=active]:text-foreground',
                  category.value === 'All' && 'm-1'
                )}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {filteredAssets.map((asset) => (
          <AssetCard
            key={asset.symbol}
            name={asset.name}
            symbol={asset.symbol}
            category={asset.category}
          />
        ))}
      </div>
    </div>
  );
}

function AllAssetsContent() {
  const path = usePathname();

  return (
    <main className='h-screen'>
      <div className='flex w-full text-xs'>
        <Navbar />
        <div className='flex justify-between w-full'>
          <div className='flex flex-col w-full'>
            <Header />
            <div className='flex flex-col w-full p-4'>
              <h2 className='text-2xl font-bold mb-4'>All Assets</h2>
              <AssetGrid />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AllAssets() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AllAssetsContent />
    </Suspense>
  );
}
