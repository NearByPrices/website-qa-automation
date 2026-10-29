# Website QA Automation

Automated website testing, technical SEO auditing, performance measurement, marketing conversion analysis and accessibility checking for NearbyPrices (NBP) and future websites.

## What This Does

- **Functional QA**: Playwright-powered browser tests for critical user journeys
- **Technical SEO**: Page-level checks for metadata, canonical URLs, structured data, sitemaps
- **Marketing Audit**: CTA presence, value proposition, price clarity, empty state handling
- **Performance**: Lighthouse integration for Core Web Vitals and scores
- **Accessibility**: axe-core WCAG checks integrated into Playwright
- **Responsive**: Multi-viewport layout checks with screenshots
- **Link Checking**: Broken internal link detection
- **Security**: HTTPS, security headers, sensitive data exposure
- **Google Sheets**: Persistent audit history with tabbed reporting
- **GitHub Actions**: Scheduled daily smoke tests, weekly full audits, manual triggers

## Architecture

```
Layer A — Reusable Engine        Layer B — Site-Specific
─────────────────────────────    ─────────────────────────
src/core/          types, runner  config/sites/nbp.config.ts
src/crawler/       web crawler    tests/nbp/  playwright specs
src/audits/seo/    SEO auditor
src/audits/marketing/
src/audits/performance/  Lighthouse
src/audits/accessibility/ axe-core
src/audits/responsive/
src/audits/links/  link checker
src/reporters/     JSON, Sheets, summary
```

## Technology Stack

| Component | Library |
|---|---|
| Language | TypeScript + Node.js 22 |
| Browser automation | Playwright |
| Accessibility | axe-core + @axe-core/playwright |
| Performance | Google Lighthouse |
| Crawling | Custom TypeScript crawler |
| Reporting | Google Sheets API (googleapis) |
| CI/CD | GitHub Actions |

## Installation

```bash
git clone <repo>
cd website-qa-automation
npm install
cp .env.example .env
# Edit .env with your values
```

## Environment Configuration

Copy `.env.example` to `.env` and set:

```env
NBP_BASE_URL=https://near-by-pricesfrontend.vercel.app
GOOGLE_SHEETS_ID=             # Optional — see docs/google-sheets-setup.md
GOOGLE_SERVICE_ACCOUNT_JSON=  # Optional — base64 encoded JSON
```

All settings have working defaults. Google Sheets is optional — without it, results are saved as local JSON.

## Available Commands

```bash
npm run qa:smoke          # Quick homepage + critical SEO checks
npm run qa:functional     # Full Playwright browser test suite
npm run qa:seo            # Technical SEO audit on all important pages
npm run qa:marketing      # Marketing and conversion audit
npm run qa:performance    # Lighthouse audit (requires Chromium)
npm run qa:accessibility  # axe-core accessibility checks
npm run qa:full           # All audit types combined
npm run qa:report         # Re-generate report from latest results
npm run validate:config   # Check environment and configuration
npm run test:unit         # Run framework unit tests
npm run build             # TypeScript type check
npm run lint              # ESLint
```

## Results

Results are saved to `audit-results/` as JSON:
- `nbp-seo-latest.json` — last SEO audit run
- `nbp-marketing-latest.json` — last marketing audit
- Timestamped copies for history

Each result follows this schema:
```json
{
  "runId": "uuid",
  "website": "nbp",
  "category": "SEO",
  "testId": "SEO-001",
  "testName": "Title tag exists",
  "pageUrl": "https://...",
  "status": "FAIL",
  "severity": "HIGH",
  "expected": "...",
  "actual": "...",
  "message": "...",
  "recommendation": "...",
  "durationMs": 325,
  "timestamp": "2026-10-28T18:00:00Z"
}
```

**Status values**: `PASS`, `FAIL`, `WARNING`, `SKIPPED`, `ERROR`, `REVIEW_REQUIRED`  
**Severity values**: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`

## GitHub Actions

Three workflows are provided:

| Workflow | Trigger | Scope |
|---|---|---|
| `qa-manual.yml` | Manual (`workflow_dispatch`) | Configurable |
| `qa-daily.yml` | Daily 04:30 IST | Homepage smoke + critical SEO |
| `qa-weekly.yml` | Sunday 02:00 IST | Full suite |

**Required GitHub secrets:**
- `NBP_BASE_URL` — NBP production URL
- `GOOGLE_SHEETS_ID` — (optional) spreadsheet ID
- `GOOGLE_SERVICE_ACCOUNT_JSON` — (optional) base64-encoded service account JSON

## Adding Another Website

See `docs/adding-new-website.md`.

1. Create `config/sites/<key>.config.ts`
2. Add Playwright specs to `tests/<key>/`
3. Set `TARGET_SITE=<key>` when running

The entire `src/` engine is reusable and NBP-agnostic.

## Known Limitations

- Lighthouse requires a non-proxied network connection to the target site
- Google Sheets integration requires service account credentials
- Merchant-authenticated tests are not yet implemented (no test accounts)
- Automated accessibility checks do not replace full manual accessibility review
- Lighthouse scores vary between runs; a single run is not definitive

## Current Status

| Module | Status |
|---|---|
| TypeScript project setup | Complete |
| Results schema | Complete |
| Web crawler | Complete |
| SEO auditor | Complete |
| Marketing auditor | Complete |
| Link checker | Complete |
| Lighthouse integration | Complete (code; requires network) |
| Accessibility (axe-core) | Complete (code; requires browser) |
| Responsive auditor | Complete (code; requires browser) |
| Google Sheets reporter | Complete (code; requires credentials) |
| GitHub Actions workflows | Complete |
| NBP Playwright specs | Complete (5 spec files) |
| Unit tests | 31 passing |
| Documentation | Complete |
