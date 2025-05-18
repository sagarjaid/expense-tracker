/** @format */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import moment from 'moment';

interface Bond {
  symbol: string;
  name: string;
}

interface BondsTableProps {
  bondsList?: Bond[];
  path: string;
}

const BondsTable = ({ bondsList = [], path }: BondsTableProps) => {
  const [bondData, setBondData] = useState([]);

  // Date ranges
  const currentDateFormat = moment().format('YYYY-MM-DD');
  const oneDayAgo = moment().subtract(1, 'days').format('YYYY-MM-DD');
  const sevenDaysAgo = moment().subtract(7, 'days').format('YYYY-MM-DD');
  const thirtyDaysAgo = moment().subtract(30, 'days').format('YYYY-MM-DD');
  const ninetyDaysAgo = moment().subtract(90, 'days').format('YYYY-MM-DD');
  const oneYearAgo = moment().subtract(1, 'years').format('YYYY-MM-DD');

  useEffect(() => {
    const fetchData = async () => {
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
      const API_URL = 'https://api.polygon.io/v2/aggs/ticker/';
      try {
        const promises = bondsList.map(async (bond) => {
          const [
            currentData,
            sevenDayData,
            thirtyDayData,
            ninetyDayData,
            oneYearData,
          ] = await Promise.all([
            axios.get(
              `${API_URL}${bond.symbol}/range/1/day/${oneDayAgo}/${currentDateFormat}?apiKey=${API_KEY}`
            ),
            axios.get(
              `${API_URL}${bond.symbol}/range/1/day/${sevenDaysAgo}/${currentDateFormat}?apiKey=${API_KEY}`
            ),
            axios.get(
              `${API_URL}${bond.symbol}/range/1/day/${thirtyDaysAgo}/${currentDateFormat}?apiKey=${API_KEY}`
            ),
            axios.get(
              `${API_URL}${bond.symbol}/range/1/day/${ninetyDaysAgo}/${currentDateFormat}?apiKey=${API_KEY}`
            ),
            axios.get(
              `${API_URL}${bond.symbol}/range/1/day/${oneYearAgo}/${currentDateFormat}?apiKey=${API_KEY}`
            ),
          ]);
          return {
            symbol: bond.symbol,
            name: bond.name,
            currentData: currentData.data.results?.[0],
            sevenDayData: sevenDayData.data.results?.[0],
            thirtyDayData: thirtyDayData.data.results?.[0],
            ninetyDayData: ninetyDayData.data.results?.[0],
            oneYearData: oneYearData.data.results?.[0],
          };
        });
        const results = await Promise.all(promises);
        setBondData(results);
      } catch (error) {
        setBondData([]);
      }
    };
    fetchData();
  }, [bondsList]);

  const calculateChange = (
    current: number | undefined,
    previous: number | undefined
  ): number => {
    if (!current || !previous || previous === 0) return NaN;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className='list-scrollbar my-8 relative sm:rounded-lg border rounded-lg border-border bg-background'>
      <table className='w-full text-sm text-left rtl:text-right text-foreground/70'>
        <thead className='text-xs uppercase bg-background dark:bg-gray-800'>
          <tr className='border-border border-b'>
            <th
              scope='col'
              className='p-4'>
              Rank
            </th>
            <th
              scope='col'
              className='p-4 whitespace-nowrap'>
              Instrument
            </th>
            <th
              scope='col'
              className='p-4 whitespace-nowrap'>
              Last Price
            </th>
            <th
              scope='col'
              className='p-4 whitespace-nowrap'>
              24h
            </th>
            <th
              scope='col'
              className='p-4 whitespace-nowrap'>
              7Day
            </th>
            <th
              scope='col'
              className='p-4 whitespace-nowrap'>
              30Day
            </th>
            <th
              scope='col'
              className='p-4 whitespace-nowrap'>
              90Day
            </th>
            <th
              scope='col'
              className='p-4 whitespace-nowrap'>
              1Year
            </th>
          </tr>
        </thead>
        <tbody>
          {bondData &&
            bondData.map((item, idx) => {
              const currentPrice = item.currentData?.c;
              const oneDayChange = calculateChange(
                item.currentData?.c,
                item.currentData?.o
              );
              const sevenDayChange = calculateChange(
                item.currentData?.c,
                item.sevenDayData?.o
              );
              const thirtyDayChange = calculateChange(
                item.currentData?.c,
                item.thirtyDayData?.o
              );
              const ninetyDayChange = calculateChange(
                item.currentData?.c,
                item.ninetyDayData?.o
              );
              const oneYearChange = calculateChange(
                item.currentData?.c,
                item.oneYearData?.o
              );
              return (
                <tr
                  key={item.symbol}
                  className='border-border bg-background border-b hover:bg-accent/50'>
                  <td className='p-4'>{idx + 1}</td>
                  <td className='p-4 whitespace-nowrap'>
                    <Link
                      href={`/bond/${item.symbol.toLowerCase()}-vs-btc`}
                      className='text-foreground hover:text-primary transition-colors'>
                      {item.name} / BTC
                    </Link>
                  </td>
                  <td className='p-4 whitespace-nowrap'>
                    {currentPrice ? currentPrice.toFixed(5) : '-'}
                  </td>
                  <td
                    className={`p-4 whitespace-nowrap ${
                      oneDayChange >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                    {isNaN(oneDayChange) ? '-' : `${oneDayChange.toFixed(2)}%`}
                  </td>
                  <td
                    className={`p-4 whitespace-nowrap ${
                      sevenDayChange >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                    {isNaN(sevenDayChange)
                      ? '-'
                      : `${sevenDayChange.toFixed(2)}%`}
                  </td>
                  <td
                    className={`p-4 whitespace-nowrap ${
                      thirtyDayChange >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                    {isNaN(thirtyDayChange)
                      ? '-'
                      : `${thirtyDayChange.toFixed(2)}%`}
                  </td>
                  <td
                    className={`p-4 whitespace-nowrap ${
                      ninetyDayChange >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                    {isNaN(ninetyDayChange)
                      ? '-'
                      : `${ninetyDayChange.toFixed(2)}%`}
                  </td>
                  <td
                    className={`p-4 whitespace-nowrap ${
                      oneYearChange >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                    {isNaN(oneYearChange)
                      ? '-'
                      : `${oneYearChange.toFixed(2)}%`}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

export default BondsTable;
