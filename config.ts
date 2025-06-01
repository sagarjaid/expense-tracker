/** @format */

import { ConfigProps } from './types/config';

const config: ConfigProps = {
  // REQUIRED
  appName: 'ex.sagarjaid',
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    'Compare any asset values directly against Bitcoin current market price.',
  // REQUIRED (no https://, not trailing slash at the end, just the naked domain)
  domainName: 'ex.sagarjaid.com',
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (resend.supportEmail) otherwise customer support won't work.
    id: '',
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ['/'],
  },
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the priceId
    plans: [
      {
        // REQUIRED — we use this to find the plan in the webhook (for instance if you want to update the user's credits based on the plan)
        priceId:
          process.env.NODE_ENV === 'development'
            ? 'price_1Niyy5AxyNprDp7iZIqEyD2h'
            : 'price_456',
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: 'Starter',
        // A friendly description of the plan, displayed on the pricing page. Tip: explain why this plan and not others
        description: 'Perfect for small projects',
        // The price you want to display, the one user will be charged on Stripe.
        price: 99,
        // If you have an anchor price (i.e. $29) that you want to display crossed out, put it here. Otherwise, leave it empty
        priceAnchor: 149,
        features: [
          {
            name: 'NextJS boilerplate',
          },
          { name: 'User oauth' },
          { name: 'Database' },
          { name: 'Emails' },
        ],
      },
      {
        priceId:
          process.env.NODE_ENV === 'development'
            ? 'price_1O5KtcAxyNprDp7iftKnrrpw'
            : 'price_456',
        // This plan will look different on the pricing page, it will be highlighted. You can only have one plan with isFeatured: true
        isFeatured: true,
        name: 'Advanced',
        description: 'You need more power',
        price: 149,
        priceAnchor: 299,
        features: [
          {
            name: 'NextJS boilerplate',
          },
          { name: 'User oauth' },
          { name: 'Database' },
          { name: 'Emails' },
          { name: '1 year of updates' },
          { name: '24/7 support' },
        ],
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: 'bucket-name',
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: 'https://cdn-id.cloudfront.net/',
  },
  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `ex.sagarjaid <noreply@resend.ex.sagarjaid.com>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `Kris at ex.sagarjaid <ex.sagarjaid@gmail.com>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: 'ex.sagarjaid@gmail.com',
  },
  colors: {
    // The primary color of your app
    main: 'hsl(var(--primary))',
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: '/signin',
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: '/',
  },
} as ConfigProps;

export default config;
