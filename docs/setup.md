# Setup Guide

## Prerequisites

- Node.js 18 or later (Node.js 22 recommended)
- npm 9 or later
- Chromium (pre-installed at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` in the cloud environment)

## Local Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd website-qa-automation

# 2. Install dependencies
npm install

# 3. Copy example environment file
cp .env.example .env

# 4. Edit .env — at minimum set:
# NBP_BASE_URL=https://near-by-pricesfrontend.vercel.app

# 5. Validate configuration
npm run validate:config

# 6. Run your first smoke test
npm run qa:smoke
```

## Running on a Different Machine (Without Pre-installed Browser)

If Chromium is not pre-installed:

```bash
# Install Playwright's bundled Chromium
npx playwright install chromium

# Remove the executablePath override in playwright.config.ts
# (or set CHROMIUM_PATH to your Chromium binary)
```

## Environment Variables

See `.env.example` for all available variables. The only required variable for basic operation is `NBP_BASE_URL`.

## GitHub Actions Setup

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `NBP_BASE_URL` — the NBP production URL
   - `GOOGLE_SHEETS_ID` — (optional) spreadsheet ID
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — (optional) base64 service account JSON

3. Go to **Actions** → **QA Audit — Manual** → **Run workflow**
4. Select audit type (`smoke` for first run) and click **Run workflow**

## Folder Structure

```
audit-results/    Generated JSON reports (gitignored)
playwright-report/ Playwright HTML report (gitignored)
test-results/     Screenshots and traces (gitignored)
src/              Core engine
config/           Site configurations and audit rules
tests/            Playwright specs
scripts/          CLI entry points
docs/             This documentation
.github/workflows/ GitHub Actions
```
