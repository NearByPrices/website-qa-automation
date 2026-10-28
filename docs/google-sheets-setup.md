# Google Sheets Setup

This guide sets up persistent audit reporting to a Google Spreadsheet.

## What You Get

- **Dashboard tab**: Live summary of latest audit results
- **Test Results tab**: Every check result with status and severity
- **Bug Tracker tab**: Persistent issue log across runs
- **SEO Audit tab**: Page-level SEO findings
- **Marketing Audit tab**: Conversion and content findings
- **Performance tab**: Lighthouse scores over time

---

## Step 1 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**
3. Name it (e.g. `nbp-qa-automation`) and click **Create**

---

## Step 2 — Enable the Google Sheets API

1. In your new project, go to **APIs & Services** → **Library**
2. Search for **Google Sheets API**
3. Click it and press **Enable**

---

## Step 3 — Create a Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Name it (e.g. `nbp-qa-sheets-writer`)
4. Click **Create and Continue**
5. Grant the role **Editor** (or a custom role with Sheets write access)
6. Click **Done**

---

## Step 4 — Download the Credentials File

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** → **Create New Key** → **JSON**
4. Download the `.json` file — keep it safe and never commit it

---

## Step 5 — Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it (e.g. `NBP QA Audit Results`)
4. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```

---

## Step 6 — Share the Sheet with the Service Account

1. Open the sheet
2. Click **Share** (top right)
3. Paste the service account's email address (from the JSON file, field `client_email`)
4. Set the role to **Editor**
5. Click **Send**

---

## Step 7 — Configure Local Environment

Convert the JSON file to base64:
```bash
base64 -w0 your-service-account.json
```

Add to your `.env` file:
```env
GOOGLE_SHEETS_ID=your-spreadsheet-id-here
GOOGLE_SERVICE_ACCOUNT_JSON=<base64-output-from-above>
```

---

## Step 8 — Configure GitHub Actions Secrets

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Add two secrets:
   - `GOOGLE_SHEETS_ID` — your spreadsheet ID
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — the base64-encoded JSON

---

## Step 9 — Verify the Connection

Run:
```bash
npm run validate:config
```

Then run a smoke audit:
```bash
npm run qa:smoke
```

If `GOOGLE_SHEETS_ID` and `GOOGLE_SERVICE_ACCOUNT_JSON` are set, results will be written to the spreadsheet automatically.

---

## Troubleshooting

**"Request had insufficient authentication scopes"**  
→ Make sure you enabled the Google Sheets API in Step 2.

**"The caller does not have permission"**  
→ Make sure you shared the spreadsheet with the service account email in Step 6.

**"Unable to parse JSON credentials"**  
→ Make sure `GOOGLE_SERVICE_ACCOUNT_JSON` contains the base64-encoded content, not the raw JSON.
