/** @format */

'use client';
import moment from 'moment';
import axios from 'axios';

export const useTradingViewLogic = () => {
  const API_URL = 'https://api.polygon.io/v2/aggs/ticker/';
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  // Date helpers
  const getCurrentDate = () => {
    return {
      current: new Date(),
      formatted: moment(new Date()).format('dd-MM-yyyy'),
    };
  };

  const getDateRanges = () => {
    const currentDate = new Date();
    return {
      oneDayAgo: moment().subtract(1, 'days').format('dd-MM-yyyy'),
      fiveDaysAgo: moment().subtract(5, 'days').format('dd-MM-yyyy'),
      oneMonthsAgo: moment().subtract(1, 'months').format('dd-MM-yyyy'),
      sixMonthsAgo: moment().subtract(6, 'months').format('dd-MM-yyyy'),
      startOfYear: moment().startOf('year').format('dd-MM-yyyy'),
      oneYearAgo: moment().subtract(1, 'years').format('dd-MM-yyyy'),
      oneWeekYearAgo: moment()
        .subtract(1, 'years')
        .subtract(1, 'weeks')
        .format('dd-MM-yyyy'),
      fiveYearsAgo: moment().subtract(5, 'years').format('dd-MM-yyyy'),
      tenYearsAgo: moment().subtract(10, 'years').format('dd-MM-yyyy'),
    };
  };

  // Data fetching functions
  const fetchStockData = async (stockTicker, timespan, startDate, endDate) => {
    try {
      const response = await axios.get(
        `${API_URL}${stockTicker}/range/1/${timespan}/${startDate}/${endDate}?limit=50000&apiKey=${API_KEY}`
      );
      return response.data.results;
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
      return [];
    }
  };

  const fetchCurrencyData = async (
    currencyTicker,
    timespan,
    startDate,
    endDate
  ) => {
    try {
      const url = `${API_URL}X:${currencyTicker}/range/1/${timespan}/${startDate}/${endDate}?apiKey=${API_KEY}`;
      console.log('Fetching:', url);
      const response = await axios.get(url);
      return response.data.results;
    } catch (error) {
      console.error('Failed to fetch currency data:', error);
      return [];
    }
  };

  // Data merging and transformation
  const mergeStockAndCurrencyData = (
    stockData,
    currencyData,
    selectedTimespan
  ) => {
    const dateFormat =
      selectedTimespan === 'hour' || selectedTimespan === 'minute'
        ? {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }
        : { year: 'numeric', month: '2-digit', day: '2-digit' };

    // Convert timestamp to date string
    const convertToDate = (t) =>
      new Date(t).toLocaleDateString('en-CA', dateFormat);

    // Add date property to data
    stockData?.forEach((item) => (item.date = convertToDate(item.t)));
    currencyData?.forEach((item) => (item.date = convertToDate(item.t)));

    let mergedData = [];

    stockData?.forEach((stock) => {
      const currency = currencyData.find((c) => c.date === stock.date);
      mergedData.push({
        date: stock.date,
        stock: stock,
        currency: currency || null,
      });
    });

    return mergedData;
  };

  // Convert data for chart display
  const convertDataForChart = (chartData, selectedTimespan, page = 'stock') => {
    let convertedChartData = [];

    if (page === 'stock') {
      convertedChartData = chartData.map((item) => ({
        time:
          selectedTimespan === 'day'
            ? moment(item?.stock?.t).format('dd-MM-yyyy')
            : Math.floor(item?.stock?.t / 1000),
        value: item?.stock?.o / item?.currency?.o,
      }));
    } else if (page === 'currency') {
      convertedChartData = chartData.map((item) => ({
        time:
          selectedTimespan === 'day'
            ? moment(item?.t).format('dd-MM-yyyy')
            : Math.floor(item?.t / 1000),
        value: item?.o > 1 ? 1 / item?.o : item?.o,
      }));
    } else if (page === 'commodity') {
      convertedChartData = chartData.map((item) => ({
        time:
          selectedTimespan === 'day'
            ? moment(item?.stock?.t).format('dd-MM-yyyy')
            : Math.floor(item?.stock?.t / 1000),
        value: item?.stock?.o / item?.currency?.o,
      }));
    }

    return convertedChartData;
  };

  return {
    getCurrentDate,
    getDateRanges,
    fetchStockData,
    fetchCurrencyData,
    mergeStockAndCurrencyData,
    convertDataForChart,
  };
};

export default useTradingViewLogic;
