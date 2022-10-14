/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");

module.exports = withPWA({
  pwa: {
    dest: "public",
    dynamicStartUrl: false,
    runtimeCaching: [
      {
        urlPattern: /.*/i,
        handler: "CacheOnly",
        options: {
          cacheName: "whole-site",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
          },
        },
      },
    ],
  },
});
