/** @format */

'use client';
import moment from 'moment';
import axios from 'axios';

export const useStocksTableLogic = () => {
  const API_URL = 'https://api.polygon.io/v2/aggs/ticker/';
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  // Date helpers (shared with tradingViewLogic)
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

  // Convert timestamp to date
  const convertTimestampToDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0]; // returns date in dd-MM-yyyy format
  };

  // Find currency data by date
  const findCurrencyDataByDate = (currencyData, date) => {
    return currencyData.find(
      (entry) => convertTimestampToDate(entry.t) === date
    );
  };

  // Get all stock data for a specific day
  const fetchAllStockData = async (
    stocksList,
    selectedTimespan,
    daysAgo = 0
  ) => {
    const formattedDate = moment()
      .subtract(daysAgo, 'days')
      .format('dd-MM-yyyy');

    try {
      const fetchPromises = stocksList.map((stock) => {
        const url = `${API_URL}${stock.symbol}/range/1/${selectedTimespan}/${formattedDate}/${formattedDate}?apiKey=${API_KEY}`;
        return axios.get(url).then((response) => ({
          symbol: stock.symbol,
          data: response.data.results,
        }));
      });

      const results = await Promise.all(fetchPromises);
      const hasData = results.some((result) => result?.data?.length > 0);

      if (!hasData) {
        console.log(
          `No results found for ${formattedDate}, retrying for previous day...`
        );
        // Try the previous day if no data is found
        return fetchAllStockData(stocksList, selectedTimespan, daysAgo + 1);
      }

      return results;
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
      // Try the previous day if there's an error
      return fetchAllStockData(stocksList, selectedTimespan, daysAgo + 1);
    }
  };

  // Get currency data for a year range
  const fetchYearCurrencyData = async () => {
    const { oneWeekYearAgo, formatted } = {
      oneWeekYearAgo: moment()
        .subtract(1, 'years')
        .subtract(1, 'weeks')
        .format('dd-MM-yyyy'),
      formatted: moment(new Date()).format('dd-MM-yyyy'),
    };

    try {
      const response = await axios.get(
        `${API_URL}X:BTCUSD/range/1/day/${oneWeekYearAgo}/${formatted}?apiKey=${API_KEY}`
      );
      return response.data.results;
    } catch (error) {
      console.error('Failed to fetch currency data:', error);
      return [];
    }
  };

  // Get special date data for comparison (7, 30, 90, 365 days ago)
  const fetchSpecialDateData = async (stocksList, daysAgo, currencyData) => {
    const formattedDate = moment()
      .subtract(daysAgo, 'days')
      .format('dd-MM-yyyy');

    try {
      const fetchPromises = stocksList.map((stock) => {
        const url = `${API_URL}${stock.symbol}/range/1/day/${formattedDate}/${formattedDate}?apiKey=${API_KEY}`;
        return axios.get(url).then((response) => ({
          symbol: stock.symbol,
          data: response.data.results,
        }));
      });

      const results = await Promise.all(fetchPromises);
      const hasData = results.some((result) => result?.data?.length > 0);

      if (!hasData) {
        console.log(
          `No results found for ${formattedDate}, retrying for previous day...`
        );
        // Try the previous day if no data is found
        return fetchSpecialDateData(stocksList, daysAgo + 1, currencyData);
      }

      // Convert and merge the data
      return convertAndMergeDataForTable(results, currencyData);
    } catch (error) {
      console.error('Failed to fetch special date data:', error);
      // Try the previous day if there's an error
      return fetchSpecialDateData(stocksList, daysAgo + 1, currencyData);
    }
  };

  // Sort stock data by date and rank
  const sortStockDataByDateAndRank = (allStockData, currencyData) => {
    // Flatten the stock data
    const flatStockData = allStockData
      .map((stock) =>
        stock?.data?.map((dataPoint) => ({
          symbol: stock.symbol,
          ...dataPoint,
          date: convertTimestampToDate(dataPoint.t),
        }))
      )
      .flat();

    // Map stock data with the ratio
    const mappedData = flatStockData
      .map((stockData) => {
        const currency = findCurrencyDataByDate(currencyData, stockData?.date);
        if (currency) {
          return { ...stockData, ratio: stockData.o / currency.o };
        }
        return null; // Discard if no corresponding currency data is found
      })
      .filter((stockData) => stockData !== null); // Remove nulls

    // Group by date
    const groupedByDate = mappedData.reduce((acc, cur) => {
      (acc[cur.date] = acc[cur.date] || []).push(cur);
      return acc;
    }, {});

    // Sort each group by ratio and assign rank
    Object.keys(groupedByDate).forEach((date) => {
      groupedByDate[date].sort((a, b) => b.ratio - a.ratio); // sort descending for rank
      groupedByDate[date].forEach((item, index) => {
        item.rank = index + 1; // assign rank starting from 1
      });
    });

    // Flatten the grouped data back into a single array, sorted by date
    const rankedData = Object.values(groupedByDate).flat();
    rankedData.sort((a, b) => a.date.localeCompare(b.date)); // Sort by date

    return rankedData;
  };

  // Calculate ratio data for table display
  const calculateRatioData = (specialDateData, symbol) => {
    const ratio = specialDateData.map((item) => {
      const stockSymbol = item.stock.symbol;
      const stockOpenPrice = item.stock.data[0].o;
      const currencyOpenPrice = item?.currency?.o;
      const ratio = stockOpenPrice / currencyOpenPrice;
      return { stockSymbol, ratio };
    });
    return ratio.find((a) => a.stockSymbol === symbol)?.ratio;
  };

  // Convert and merge data for table display
  const convertAndMergeDataForTable = (stockData, currencyData) => {
    const dateFormat = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    // Convert timestamp to date string
    const convertToDate = (t) =>
      new Date(t).toLocaleDateString('en-CA', dateFormat);

    // Preparing the data by adding a 'date' property
    stockData?.forEach((item) => (item.date = convertToDate(item.data[0].t)));
    currencyData?.forEach((item) => (item.date = convertToDate(item.t)));

    let mergedData = [];

    stockData?.forEach((stock) => {
      const currency = currencyData.find((c) => c.date === stock.date);
      mergedData.push({
        date: stock.date,
        stock: stock,
        currency: currency || null, // Fallback to null if no matching currency data
      });
    });

    return mergedData;
  };

  return {
    getCurrentDate,
    getDateRanges,
    fetchAllStockData,
    fetchYearCurrencyData,
    fetchSpecialDateData,
    sortStockDataByDateAndRank,
    calculateRatioData,
  };
};

export default useStocksTableLogic;
