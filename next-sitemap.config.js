/** @format */

module.exports = {
  // REQUIRED: add your own domain name here (e.g. https://basedinbitcoin.com),
  siteUrl: 'https://basedinbitcoin.com',
  generateRobotsTxt: true,
  // use this to exclude routes from the sitemap (i.e. a user dashboard). By default, NextJS app router metadata files are excluded (https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
  exclude: [
    '/twitter-image.*',
    '/opengraph-image.*',
    '/icon.*',
    '/api/*',
    '/dash/*',
    '/signin/*',
    '/error',
    '/not-found',
  ],
  // Add additional options for better sitemap generation
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 7000,
  outDir: 'public',
  // Define dynamic route patterns
  additionalPaths: async () => {
    return [
      // Static routes
      '/',
      '/all',
      '/tos',
      '/privacy-policy',
      '/blog',

      // Dynamic routes for each category (stock, commodity, currency, real estate, index, bond)
      // Stocks
      '/stock',
      '/stock/aapl-vs-btc',
      '/stock/tsla-vs-btc',
      '/stock/msft-vs-btc',
      '/stock/nvda-vs-btc',
      '/stock/amzn-vs-btc',
      '/stock/googl-vs-btc',
      '/stock/meta-vs-btc',
      '/stock/brk.b-vs-btc',
      '/stock/xom-vs-btc',
      '/stock/bp-vs-btc',
      '/stock/mara-vs-btc',
      '/stock/mstr-vs-btc',
      '/stock/jpm-vs-btc',
      '/stock/gs-vs-btc',
      '/stock/ma-vs-btc',
      '/stock/v-vs-btc',
      '/stock/dis-vs-btc',
      '/stock/nke-vs-btc',
      '/stock/pep-vs-btc',
      '/stock/ko-vs-btc',
      '/stock/csl-vs-btc',
      '/stock/tsm-vs-btc',
      '/stock/ge-vs-btc',
      '/stock/gm-vs-btc',
      '/stock/f-vs-btc',

      // Commodities
      '/commodity',
      '/commodity/gld-vs-btc',
      '/commodity/slv-vs-btc',
      '/commodity/cper-vs-btc',
      '/commodity/pplt-vs-btc',
      '/commodity/uso-vs-btc',
      '/commodity/cane-vs-btc',
      '/commodity/corn-vs-btc',
      '/commodity/cofe-vs-btc',
      '/commodity/ung-vs-btc',
      '/commodity/weat-vs-btc',

      // Currencies
      '/currency',
      '/currency/btcusd-vs-btc',
      '/currency/btcaud-vs-btc',
      '/currency/btceur-vs-btc',
      '/currency/btcgbp-vs-btc',
      '/currency/btcjpy-vs-btc',
      '/currency/ethbtc-vs-btc',
      '/currency/ltcbtc-vs-btc',
      '/currency/xrpbtc-vs-btc',

      // Real Estate
      '/real-estate',
      '/real-estate/rwo-vs-btc',
      '/real-estate/iyr-vs-btc',
      '/real-estate/iyy-vs-btc',
      '/real-estate/reet-vs-btc',

      // Indices
      '/indices',
      '/indices/spy-vs-btc',
      '/indices/qqq-vs-btc',
      '/indices/iyy-vs-btc',
      '/indices/ibit-vs-btc',
      '/indices/fbtc-vs-btc',
      '/indices/gbtc-vs-btc',

      // Bonds
      '/bond',
      '/bond/govt-vs-btc',
      '/bond/agg-vs-btc',
      '/bond/lqd-vs-btc',
      '/bond/mbb-vs-btc',
    ].map((route) => ({
      loc: route,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.7,
    }));
  },
  // Transform function to handle dynamic routes
  transform: async (config, path) => {
    // Customize the sitemap entry for each path
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
};
