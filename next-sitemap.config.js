/** @format */

module.exports = {
  // REQUIRED: add your own domain name here (e.g. https://ex.sagarjaid.com),
  siteUrl: 'https://ex.sagarjaid.com',
  generateRobotsTxt: true,
  // Block all bots
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: ['/'],
      },
    ],
  },
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
  // changefreq: 'daily',
  // priority: 0.7,
  // sitemapSize: 7000,
  // outDir: 'public',
  // Define dynamic route patterns
  // Transform function to handle dynamic routes
  // transform: async (config, path) => { ... },
};
