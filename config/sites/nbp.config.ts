import { SiteConfig } from "../../src/core/types";

const config: SiteConfig = {
  key: "nbp",
  name: "NearbyPrices",
  baseUrl: process.env["NBP_BASE_URL"] ?? "https://near-by-pricesfrontend.vercel.app",
  environment: "production",

  crawl: {
    maxPages: Number(process.env["AUDIT_MAX_PAGES"] ?? 50),
    maxDepth: 4,
    concurrency: Number(process.env["AUDIT_CONCURRENCY"] ?? 2),
    timeoutMs: Number(process.env["AUDIT_TIMEOUT_MS"] ?? 30000),
    delayBetweenRequestsMs: 500,
    respectRobotsTxt: true,
    followSitemaps: true,
    excludePatterns: [
      "/admin",
      "/api/",
      "/login",
      "/logout",
      "/signup",
      "/checkout",
      "/cart",
      "/_next/",
      "/static/",
      "?debug=",
    ],
  },

  seo: {
    titleMinLength: 10,
    titleMaxLength: 70,
    descriptionMinLength: 50,
    descriptionMaxLength: 165,
    expectedSchemaTypes: ["WebSite", "Product", "Offer", "Organization"],
  },

  marketing: {
    primaryCta: "Compare Prices",
    conversionJourneys: [
      {
        name: "Price Comparison",
        steps: [
          "Visit homepage",
          "Search for a product",
          "View product results",
          "View product details",
          "Compare prices",
          "Contact local shop",
        ],
      },
    ],
    analyticsIdentifiers: [],
  },

  performance: {
    thresholds: {
      performanceScore: 60,
      accessibilityScore: 80,
      bestPracticesScore: 80,
      seoScore: 80,
      lcpMs: 4000,
      cls: 0.25,
      tbtMs: 600,
    },
    importantPagesOnly: true,
  },

  importantPages: [
    { name: "Homepage", path: "/", priority: "critical" },
    { name: "Search", path: "/search", priority: "critical" },
    { name: "Products", path: "/products", priority: "high" },
    { name: "About", path: "/about", priority: "medium" },
    { name: "Contact", path: "/contact", priority: "medium" },
  ],

  excludePatterns: ["/admin", "/api/", "/login", "/logout"],
};

export default config;
