/** @format */

'use client';
import { useEffect, useState, useMemo } from 'react';
import useStocksTableLogic from '../../utlities/stocksTableLogic';
import useDateUtils from '../../utlities/dateUtils';
import Link from 'next/link';

const StocksTable = ({ stocksList = [], path }) => {
  // Initialize our utility hooks
  const stocksTableLogic = useStocksTableLogic();
  const dateUtils = useDateUtils();

  // Get date ranges
  const { formatted: currentDateFormat } = dateUtils.getCurrentDate();
  const dateRanges = dateUtils.getDateRanges();

  // State variables
  const [selectedTimespan, setSelectedTimespan] = useState('day');
  const [startDate, setStartDate] = useState(dateRanges.oneYearAgo);
  const [endDate, setEndDate] = useState(currentDateFormat);

  // Data states
  const [allStockData, setAllStockData] = useState([]);
  const [currencyData, setCurrencyData] = useState([]);
  const [sortedTableData, setSortedTableData] = useState([]);
  const [sevenDayStockData, setSevenDayStockData] = useState([]);
  const [thirtyDayStockData, setThirtyDayStockData] = useState([]);
  const [ninetyDayStockData, setNineDayStockData] = useState([]);
  const [yearyDayStockData, setYearDayStockData] = useState([]);
  const [oneYearCurrencyData, setOneYearCurrencyData] = useState([]);

  // Get all stock data for the current day
  useEffect(() => {
    const getAllStockData = async () => {
      const results = await stocksTableLogic.fetchAllStockData(
        stocksList,
        selectedTimespan
      );
      setAllStockData(results);
    };

    getAllStockData();
  }, [selectedTimespan, stocksList, currentDateFormat]);

  // Get currency data for a year
  useEffect(() => {
    const fetchCurrencyData = async () => {
      const yearData = await stocksTableLogic.fetchYearCurrencyData();
      setOneYearCurrencyData(yearData);

      // Get current period currency data for table calculations
      setCurrencyData(
        yearData.filter((item) => {
          const itemDate = dateUtils.timestampToISODate(item.t);
          return itemDate >= startDate && itemDate <= endDate;
        })
      );
    };

    fetchCurrencyData();
  }, [startDate, endDate]);

  // Sort and rank the table data
  useEffect(() => {
    if (allStockData.length === 0 || currencyData.length === 0) return;

    const sortedData = stocksTableLogic.sortStockDataByDateAndRank(
      allStockData,
      currencyData
    );
    setSortedTableData(sortedData);
  }, [allStockData, currencyData]);

  // Get comparison data for different time periods
  useEffect(() => {
    const fetchComparisonData = async () => {
      if (oneYearCurrencyData.length === 0) return;

      const sevenDayData = await stocksTableLogic.fetchSpecialDateData(
        stocksList,
        7,
        oneYearCurrencyData
      );
      setSevenDayStockData(sevenDayData);

      const thirtyDayData = await stocksTableLogic.fetchSpecialDateData(
        stocksList,
        30,
        oneYearCurrencyData
      );
      setThirtyDayStockData(thirtyDayData);

      const ninetyDayData = await stocksTableLogic.fetchSpecialDateData(
        stocksList,
        90,
        oneYearCurrencyData
      );
      setNineDayStockData(ninetyDayData);

      const yearData = await stocksTableLogic.fetchSpecialDateData(
        stocksList,
        365,
        oneYearCurrencyData
      );
      setYearDayStockData(yearData);
    };

    fetchComparisonData();
  }, [stocksList, oneYearCurrencyData]);

  // Helper functions for calculating ratios
  const sevenDaySingleStockData = (symbol) => {
    return stocksTableLogic.calculateRatioData(sevenDayStockData, symbol);
  };

  const thirtyDaySingleStockData = (symbol) => {
    return stocksTableLogic.calculateRatioData(thirtyDayStockData, symbol);
  };

  const ninetyDaySingleStockData = (symbol) => {
    return stocksTableLogic.calculateRatioData(ninetyDayStockData, symbol);
  };

  const yearDaySingleStockData = (symbol) => {
    return stocksTableLogic.calculateRatioData(yearyDayStockData, symbol);
  };

  // Get stock name by symbol
  const getNameBySymbol = (symbol) => {
    const stock = stocksList.find((stock) => stock.symbol === symbol);
    return stock ? stock.name : undefined;
  };

  // Set date range based on period
  const setDateRangeByPeriod = (period) => {
    const range = dateUtils.setDateRangeByPeriod(period);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  return (
    <div className='list-scrollbar my-8 relative sm:rounded-lg border rounded-lg border-border bg-background'>
      <table className='w-full text-sm text-left rtl:text-right text-foreground/70'>
        <thead className='text-xs uppercase bg-background dark:bg-gray-800'>
          <tr className='border-border border-b'>
            <th
              scope='col'
              className='p-4 whitespace-nowrap'>
              Rank
            </th>
            <th
              scope='col'
              className=' p-4 whitespace-nowrap'>
              Instrument
            </th>
            <th
              scope='col'
              className=' p-4 whitespace-nowrap'>
              Last Price
            </th>
            <th
              scope='col'
              className=' p-4 whitespace-nowrap'>
              24h
            </th>
            <th
              scope='col'
              className=' p-4 whitespace-nowrap'>
              7Day
            </th>
            <th
              scope='col'
              className=' p-4 whitespace-nowrap'>
              30Day
            </th>
            <th
              scope='col'
              className=' p-4 whitespace-nowrap'>
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
          {sortedTableData &&
            sortedTableData.map((item, idx) => (
              <tr
                key={idx}
                className='border-border bg-background border-b hover:bg-accent/50'>
                <td className='p-4'>{item.rank}</td>
                <td className='p-4 whitespace-nowrap'>
                  <Link
                    href={`${path}/${item.symbol.toLowerCase()}-vs-btc`}
                    className='text-foreground hover:text-primary transition-colors'>
                    {getNameBySymbol(item.symbol)} / BTC
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
                    item.c /
                      (item.o / item.ratio) /
                      sevenDaySingleStockData(item.symbol) >
                    1
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                  <Link
                    href={`${path}/${item.symbol.toLowerCase()}-vs-btc`}
                    className='hover:text-primary transition-colors'>
                    {(
                      (item.c /
                        (item.o / item.ratio) /
                        sevenDaySingleStockData(item.symbol) -
                        1) *
                      100
                    ).toFixed(2)}
                    %
                  </Link>
                </td>
                <td
                  className={`p-4 whitespace-nowrap ${
                    item.c /
                      (item.o / item.ratio) /
                      thirtyDaySingleStockData(item.symbol) >
                    1
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                  <Link
                    href={`${path}/${item.symbol.toLowerCase()}-vs-btc`}
                    className='hover:text-primary transition-colors'>
                    {(
                      (item.c /
                        (item.o / item.ratio) /
                        thirtyDaySingleStockData(item.symbol) -
                        1) *
                      100
                    ).toFixed(2)}
                    %
                  </Link>
                </td>
                <td
                  className={`p-4 whitespace-nowrap ${
                    item.c /
                      (item.o / item.ratio) /
                      ninetyDaySingleStockData(item.symbol) >
                    1
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                  <Link
                    href={`${path}/${item.symbol.toLowerCase()}-vs-btc`}
                    className='hover:text-primary transition-colors'>
                    {(
                      (item.c /
                        (item.o / item.ratio) /
                        ninetyDaySingleStockData(item.symbol) -
                        1) *
                      100
                    ).toFixed(2)}
                    %
                  </Link>
                </td>
                <td
                  className={`p-4 whitespace-nowrap ${
                    item.c /
                      (item.o / item.ratio) /
                      yearDaySingleStockData(item.symbol) >
                    1
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                  <Link
                    href={`${path}/${item.symbol.toLowerCase()}-vs-btc`}
                    className='hover:text-primary transition-colors'>
                    {(
                      (item.c /
                        (item.o / item.ratio) /
                        yearDaySingleStockData(item.symbol) -
                        1) *
                      100
                    ).toFixed(2)}
                    %
                  </Link>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default StocksTable;
