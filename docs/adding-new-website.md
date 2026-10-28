# Adding a New Website

The QA engine is designed to support multiple websites. Adding a new site requires:

1. A site configuration file
2. Optional: site-specific Playwright tests

The shared engine (`src/`) never needs to change.

---

## Step 1 — Create a Site Configuration

Create `config/sites/<your-key>.config.ts`:

```typescript
import { SiteConfig } from "../../src/core/types";

const config: SiteConfig = {
  key: "mysite",
  name: "My Website",
  baseUrl: process.env["MYSITE_BASE_URL"] ?? "https://mysite.example.com",
  environment: "production",

  crawl: {
    maxPages: 50,
    maxDepth: 4,
    concurrency: 2,
    timeoutMs: 30000,
    delayBetweenRequestsMs: 500,
    respectRobotsTxt: true,
    followSitemaps: true,
    excludePatterns: ["/admin", "/api/"],
  },

  seo: {
    titleMinLength: 10,
    titleMaxLength: 70,
    descriptionMinLength: 50,
    descriptionMaxLength: 165,
  },

  marketing: {
    primaryCta: "Get Started",
    conversionJourneys: [
      {
        name: "Main conversion",
        steps: ["Visit homepage", "Browse product", "Sign up"],
      },
    ],
  },

  performance: {
    thresholds: {
      performanceScore: 70,
      accessibilityScore: 80,
      bestPracticesScore: 80,
      seoScore: 80,
      lcpMs: 3000,
      cls: 0.1,
      tbtMs: 300,
    },
    importantPagesOnly: true,
  },

  importantPages: [
    { name: "Homepage", path: "/", priority: "critical" },
    { name: "About", path: "/about", priority: "medium" },
  ],

  excludePatterns: ["/admin", "/api/"],
};

export default config;
```

---

## Step 2 — Add Site-Specific Playwright Tests (Optional)

Create `tests/mysite/homepage.spec.ts` with site-specific assertions.

Use the NBP specs in `tests/nbp/` as a reference. Keep tests in `tests/<site-key>/`.

---

## Step 3 — Add Environment Variable

Add to `.env.example`:
```
MYSITE_BASE_URL=
```

The config loader automatically picks up `<SITE_KEY_UPPERCASE>_BASE_URL` from the environment.

---

## Step 4 — Run Audits for the New Site

```bash
TARGET_SITE=mysite MYSITE_BASE_URL=https://mysite.example.com npm run qa:smoke
```

Or set `TARGET_SITE=mysite` in your `.env` file.

---

## What the Engine Provides Automatically

When you add a site config, the engine runs these against it without any further changes:

- Website crawling (respecting `crawl` config)
- Sitemap parsing
- Technical SEO audit (all SEO rules)
- Marketing audit (CTA, value proposition, pricing clarity)
- Link checking
- Security headers check
- Google Sheets reporting
- GitHub Actions artifacts

Only site-specific Playwright browser tests need to be written per site.
