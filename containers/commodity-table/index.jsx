/** @format */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import axios from 'axios';
import useCommodityTableLogic from '../../utlities/commodityTableLogic';
import useDateUtils from '../../utlities/dateUtils';
import Link from 'next/link';

const CommodityTable = ({ commoditiesList = [], path }) => {
  const router = useRouter();
  const API_URL = 'https://api.polygon.io/v2/aggs/ticker/';
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  // Initialize our utility hooks
  const commodityTableLogic = useCommodityTableLogic();
  const dateUtils = useDateUtils();

  // Get date ranges
  const { formatted: currentDateFormat } = dateUtils.getCurrentDate();
  const dateRanges = dateUtils.getDateRanges();

  // State variables
  const [selectedTimespan, setSelectedTimespan] = useState('day');
  const [startDate, setStartDate] = useState(dateRanges.oneYearAgo);
  const [endDate, setEndDate] = useState(currentDateFormat);

  // Data states
  const [allCommodityData, setAllCommodityData] = useState([]);
  const [currencyData, setCurrencyData] = useState([]);
  const [sortedTableData, setSortedTableData] = useState([]);
  const [sevenDayCommodityData, setSevenDayCommodityData] = useState([]);
  const [thirtyDayCommodityData, setThirtyDayCommodityData] = useState([]);
  const [ninetyDayCommodityData, setNineDayCommodityData] = useState([]);
  const [yearyDayCommodityData, setYearDayCommodityData] = useState([]);
  const [oneYearCurrencyData, setOneYearCurrencyData] = useState([]);

  // Get all commodity data for the current day
  useEffect(() => {
    const getAllCommodityData = async () => {
      const results = await commodityTableLogic.fetchAllCommodityData(
        commoditiesList,
        selectedTimespan
      );
      setAllCommodityData(results);
    };

    getAllCommodityData();
  }, [selectedTimespan, commoditiesList, currentDateFormat]);

  // Get currency data for a year
  useEffect(() => {
    const fetchCurrencyData = async () => {
      const yearData = await commodityTableLogic.fetchYearCurrencyData();
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
    if (allCommodityData.length === 0 || currencyData.length === 0) return;

    const sortedData = commodityTableLogic.sortCommodityDataByDateAndRank(
      allCommodityData,
      currencyData
    );
    setSortedTableData(sortedData);
  }, [allCommodityData, currencyData]);

  // Get comparison data for different time periods
  useEffect(() => {
    const fetchComparisonData = async () => {
      if (oneYearCurrencyData.length === 0) return;

      const sevenDayData = await commodityTableLogic.fetchSpecialDateData(
        commoditiesList,
        7,
        oneYearCurrencyData
      );
      setSevenDayCommodityData(sevenDayData);

      const thirtyDayData = await commodityTableLogic.fetchSpecialDateData(
        commoditiesList,
        30,
        oneYearCurrencyData
      );
      setThirtyDayCommodityData(thirtyDayData);

      const ninetyDayData = await commodityTableLogic.fetchSpecialDateData(
        commoditiesList,
        90,
        oneYearCurrencyData
      );
      setNineDayCommodityData(ninetyDayData);

      const yearData = await commodityTableLogic.fetchSpecialDateData(
        commoditiesList,
        365,
        oneYearCurrencyData
      );
      setYearDayCommodityData(yearData);
    };

    fetchComparisonData();
  }, [commoditiesList, oneYearCurrencyData]);

  // Helper functions for calculating ratios
  const sevenDaySingleCommodityData = (symbol) => {
    return commodityTableLogic.calculateRatioData(
      sevenDayCommodityData,
      symbol
    );
  };

  const thirtyDaySingleCommodityData = (symbol) => {
    return commodityTableLogic.calculateRatioData(
      thirtyDayCommodityData,
      symbol
    );
  };

  const ninetyDaySingleCommodityData = (symbol) => {
    return commodityTableLogic.calculateRatioData(
      ninetyDayCommodityData,
      symbol
    );
  };

  const yearDaySingleCommodityData = (symbol) => {
    return commodityTableLogic.calculateRatioData(
      yearyDayCommodityData,
      symbol
    );
  };

  // Get commodity name by symbol
  const getNameBySymbol = (symbol) => {
    const commodity = commoditiesList.find(
      (commodity) => commodity.symbol === symbol
    );
    return commodity ? commodity.name : undefined;
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
                      sevenDaySingleCommodityData(item.symbol) >
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
                        sevenDaySingleCommodityData(item.symbol) -
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
                      thirtyDaySingleCommodityData(item.symbol) >
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
                        thirtyDaySingleCommodityData(item.symbol) -
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
                      ninetyDaySingleCommodityData(item.symbol) >
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
                        ninetyDaySingleCommodityData(item.symbol) -
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
                      yearDaySingleCommodityData(item.symbol) >
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
                        yearDaySingleCommodityData(item.symbol) -
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

export default CommodityTable;
