/** @format */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import moment from 'moment';

interface CurrencyTableProps {
  currencyList: {
    symbol: string;
    name: string;
  }[];
  path: string;
}

interface StockData {
  symbol: string;
  data: any[];
}

interface ProcessedData {
  symbol: string;
  name: string;
  c: number;
  o: number;
  ratio: number;
  sevenDayChange: number;
  thirtyDayChange: number;
  ninetyDayChange: number;
  yearDayChange: number;
  rank: number;
}

export default function CurrencyTable({
  currencyList,
  path,
}: CurrencyTableProps) {
  const [currencyData, setCurrencyData] = useState<StockData[]>([]);
  const [BTCData, setBTCData] = useState<any[]>([]);
  const [sortedTableData, setSortedTableData] = useState<ProcessedData[]>([]);
  const [sevenDayStockData, setSevenDayStockData] = useState<StockData[]>([]);
  const [thirtyDayStockData, setThirtyDayStockData] = useState<StockData[]>([]);
  const [ninetyDayStockData, setNineDayStockData] = useState<StockData[]>([]);
  const [yearyDayStockData, setYearDayStockData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'https://api.polygon.io/v2/aggs/ticker/X:';
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  // Get current date and date ranges
  const currentDate = new Date();
  const currentDateFormat = moment(currentDate).format('YYYY-MM-DD');
  const oneDayAgo = moment().subtract(1, 'days').format('YYYY-MM-DD');
  const sevenDaysAgo = moment().subtract(7, 'days').format('YYYY-MM-DD');
  const thirtyDaysAgo = moment().subtract(30, 'days').format('YYYY-MM-DD');
  const ninetyDaysAgo = moment().subtract(90, 'days').format('YYYY-MM-DD');
  const oneYearAgo = moment().subtract(1, 'years').format('YYYY-MM-DD');

  // Fetch all currency data
  useEffect(() => {
    const getAllStockData = async (daysAgo = 0): Promise<void> => {
      setIsLoading(true);
      setError(null);
      const formattedDate = moment()
        .subtract(daysAgo, 'days')
        .format('YYYY-MM-DD');
      try {
        const fetchPromises = currencyList.map((stock) => {
          const url = `${API_URL}${stock.symbol}/range/1/day/${formattedDate}/${formattedDate}?apiKey=${API_KEY}`;
          return axios.get(url).then((response) => ({
            symbol: stock.symbol,
            data: response.data.results || [],
          }));
        });

        const results = await Promise.all(fetchPromises);
        const hasData = results.some((result) => result?.data?.length > 0);

        if (!hasData) {
          console.log(
            `No results found for ${formattedDate}, retrying for previous day...`
          );
          return getAllStockData(daysAgo + 1);
        }

        setCurrencyData(results);
      } catch (error) {
        console.error('Failed to fetch stock data:', error);
        setError('Failed to fetch currency data. Please try again later.');
        return getAllStockData(daysAgo + 1);
      } finally {
        setIsLoading(false);
      }
    };

    getAllStockData();
  }, [currencyList]);

  // Fetch BTC data
  useEffect(() => {
    const getBTCData = async () => {
      try {
        const response = await axios.get(
          `${API_URL}BTCUSD/range/1/day/${oneYearAgo}/${currentDateFormat}?apiKey=${API_KEY}`
        );
        setBTCData(response.data.results || []);
      } catch (error) {
        console.error('Failed to fetch BTC data:', error);
        setError('Failed to fetch BTC data. Please try again later.');
      }
    };

    getBTCData();
  }, []);

  // Fetch comparison data for different time periods
  useEffect(() => {
    const getSpecialDateData = async (daysAgo = 0): Promise<void> => {
      const formattedDate = moment()
        .subtract(daysAgo, 'days')
        .format('YYYY-MM-DD');
      try {
        const fetchPromises = currencyList.map((stock) => {
          const url = `${API_URL}${stock.symbol}/range/1/day/${formattedDate}/${formattedDate}?apiKey=${API_KEY}`;
          return axios.get(url).then((response) => ({
            symbol: stock.symbol,
            data: response.data.results || [],
          }));
        });

        const results = await Promise.all(fetchPromises);
        const hasData = results.some((result) => result?.data?.length > 0);

        if (!hasData) {
          console.log(
            `No results found for ${formattedDate}, retrying for previous day...`
          );
          return getSpecialDateData(daysAgo + 1);
        }

        if (daysAgo >= 365) {
          setYearDayStockData(results);
        } else if (daysAgo >= 90) {
          setNineDayStockData(results);
        } else if (daysAgo >= 30) {
          setThirtyDayStockData(results);
        } else {
          setSevenDayStockData(results);
        }
      } catch (error) {
        console.error('Failed to fetch stock data:', error);
        setError('Failed to fetch comparison data. Please try again later.');
        return getSpecialDateData(daysAgo + 1);
      }
    };

    getSpecialDateData(7);
    getSpecialDateData(30);
    getSpecialDateData(90);
    getSpecialDateData(365);
  }, [currencyList]);

  // Helper functions for calculating ratios
  const sevenDaySingleStockData = (symbol: string): number => {
    return sevenDayStockData.find((a) => a.symbol === symbol)?.data[0]?.o || 0;
  };

  const thirtyDaySingleStockData = (symbol: string): number => {
    return thirtyDayStockData.find((a) => a.symbol === symbol)?.data[0]?.o || 0;
  };

  const ninetyDaySingleStockData = (symbol: string): number => {
    return ninetyDayStockData.find((a) => a.symbol === symbol)?.data[0]?.o || 0;
  };

  const yearDaySingleStockData = (symbol: string): number => {
    return yearyDayStockData.find((a) => a.symbol === symbol)?.data[0]?.o || 0;
  };

  // Sort and process table data
  useEffect(() => {
    if (currencyData.length === 0 || BTCData.length === 0) return;

    const processData = () => {
      const processedData = currencyData
        .map((currency) => {
          if (!currency.data || currency.data.length === 0) return null;

          const currentData = currency.data[0];
          if (!currentData) return null;

          const ratio = currentData.o > 1 ? 1 / currentData.o : currentData.o;
          const sevenDayChange = sevenDaySingleStockData(currency.symbol);
          const thirtyDayChange = thirtyDaySingleStockData(currency.symbol);
          const ninetyDayChange = ninetyDaySingleStockData(currency.symbol);
          const yearDayChange = yearDaySingleStockData(currency.symbol);

          return {
            symbol: currency.symbol,
            name:
              currencyList.find((c) => c.symbol === currency.symbol)?.name ||
              '',
            c: currentData.c,
            o: currentData.o,
            ratio,
            sevenDayChange,
            thirtyDayChange,
            ninetyDayChange,
            yearDayChange,
            rank: 0, // Will be set after sorting
          };
        })
        .filter((item): item is ProcessedData => item !== null);

      // Sort by ratio
      processedData.sort((a, b) => b.ratio - a.ratio);

      // Add rank
      processedData.forEach((item, index) => {
        item.rank = index + 1;
      });

      setSortedTableData(processedData);
    };

    processData();
  }, [
    currencyData,
    BTCData,
    sevenDayStockData,
    thirtyDayStockData,
    ninetyDayStockData,
    yearyDayStockData,
  ]);

  if (isLoading) {
    return <div className='text-center py-4'>Loading...</div>;
  }

  if (error) {
    return <div className='text-center py-4 text-red-500'>{error}</div>;
  }

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
              Currency
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
          {sortedTableData.map((item) => (
            <tr
              key={item.symbol}
              className='border-border bg-background border-b hover:bg-accent/50'>
              <td className='p-4'>{item.rank}</td>
              <td className='p-4 whitespace-nowrap'>
                <Link
                  href={`${path}/${item.symbol.toLowerCase()}-vs-btc`}
                  className='text-foreground hover:text-primary transition-colors'>
                  {item.name}
                </Link>
              </td>
              <td className='p-4 whitespace-nowrap'>
                <Link
                  href={`${path}/${item.symbol.toLowerCase()}-vs-btc`}
                  className='text-foreground hover:text-primary transition-colors'>
                  {(item.c / (item.o / item.ratio)).toFixed(5)}
                </Link>
              </td>
              <td
                className={`p-4 whitespace-nowrap ${
                  item.c / item.o > 1 ? 'text-green-500' : 'text-red-500'
                }`}>
                <Link
                  href={`${path}/${item.symbol.toLowerCase()}-vs-btc`}
                  className='hover:text-primary transition-colors'>
                  {((item.c / item.o - 1) * 100).toFixed(2)}%
                </Link>
              </td>
              <td
                className={`p-4 whitespace-nowrap ${
                  item.c / item.sevenDayChange > 1
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                <Link
                  href={`${path}/${item.symbol.toLowerCase()}-vs-btc`}
                  className='hover:text-primary transition-colors'>
                  {((item.c / item.sevenDayChange - 1) * 100).toFixed(2)}%
                </Link>
              </td>
              <td
                className={`p-4 whitespace-nowrap ${
                  item.c / item.thirtyDayChange > 1
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                <Link
                  href={`${path}/${item.symbol.toLowerCase()}-vs-btc`}
                  className='hover:text-primary transition-colors'>
                  {((item.c / item.thirtyDayChange - 1) * 100).toFixed(2)}%
                </Link>
              </td>
              <td
                className={`p-4 whitespace-nowrap ${
                  item.c / item.ninetyDayChange > 1
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                <Link
                  href={`${path}/${item.symbol.toLowerCase()}-vs-btc`}
                  className='hover:text-primary transition-colors'>
                  {((item.c / item.ninetyDayChange - 1) * 100).toFixed(2)}%
                </Link>
              </td>
              <td
                className={`p-4 whitespace-nowrap ${
                  item.c / item.yearDayChange > 1
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                <Link
                  href={`${path}/${item.symbol.toLowerCase()}-vs-btc`}
                  className='hover:text-primary transition-colors'>
                  {((item.c / item.yearDayChange - 1) * 100).toFixed(2)}%
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
