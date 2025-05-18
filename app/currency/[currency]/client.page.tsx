/** @format */

'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import { useState, useMemo } from 'react';
import TradingViewSection from '@/containers/tradingview-section';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CurrencyList from '@/components/CurrencyList';

interface CurrencyPageProps {
  currency: string;
}

export default function CurrencyPageClient({ currency }: CurrencyPageProps) {
  const path = usePathname();

  // Extract currency symbol from URL (e.g., "btcusd-vs-btc" -> "BTCUSD")
  const currencySymbol = currency.split('-')[0].toUpperCase();

  const currencyList = useMemo(
    () => [
      { symbol: 'BTCUSD', name: 'US Dollar' },
      { symbol: 'BTCAUD', name: 'Australian Dollar' },
      { symbol: 'BTCEUR', name: 'Euro' },
      { symbol: 'BTCGBP', name: 'British Pound' },
      { symbol: 'BTCJPY', name: 'Japanese Yen' },
      { symbol: 'ETHBTC', name: 'Ethereum' },
      { symbol: 'LTCBTC', name: 'Litecoin' },
      { symbol: 'XRPBTC', name: 'XRP' },
    ],
    []
  );

  // Find currency name from currencyList
  const currencyInfo = currencyList.find(
    (curr) => curr.symbol === currencySymbol
  );
  const currencyName = currencyInfo ? currencyInfo.name : 'Unknown Currency';

  return (
    <main>
      <div className='flex w-full text-xs '>
        <Navbar />
        <div className='flex justify-between w-full'>
          <div className='flex flex-col w-full h-screen  overflow-y-scroll'>
            <Header />
            <div className='flex w-full h-screen'>
              <CurrencyList currencyList={currencyList} />
              <div className='w-full p-4'>
                <TradingViewSection
                  page='currency'
                  stocksList={currencyList}
                  initialStockTicker={currencySymbol}
                  initialTitle={currencyName + ' / BTC'}
                  TopTitle='Currency: '
                  selectedTimespan='day'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
