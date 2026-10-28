import { google, sheets_v4 } from "googleapis";
import { AuditRun, AuditSummary, TestResult } from "../core/types";
import { isConfigured } from "../core/config-loader";

const SHEET_NAMES = {
  dashboard: "Dashboard",
  testResults: "Test Results",
  bugTracker: "Bug Tracker",
  seoAudit: "SEO Audit",
  marketingAudit: "Marketing Audit",
  performance: "Performance",
} as const;

const TEST_RESULTS_HEADERS = [
  "Run ID", "Date/Time", "Website", "Category", "Test ID", "Test Name",
  "URL", "Status", "Severity", "Expected", "Actual", "Error Message",
  "Duration (ms)", "Evidence Link",
];

export class SheetsReporter {
  private sheets: sheets_v4.Sheets | null = null;
  private spreadsheetId: string | null = null;

  async init(): Promise<boolean> {
    const sheetsId = process.env["GOOGLE_SHEETS_ID"];
    const credJson = process.env["GOOGLE_SERVICE_ACCOUNT_JSON"];

    if (!isConfigured(sheetsId) || !isConfigured(credJson)) {
      console.warn(
        "Google Sheets not configured. Set GOOGLE_SHEETS_ID and GOOGLE_SERVICE_ACCOUNT_JSON to enable cloud reporting."
      );
      return false;
    }

    try {
      const credentials = JSON.parse(
        Buffer.from(credJson!, "base64").toString("utf-8")
      );

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      this.sheets = google.sheets({ version: "v4", auth });
      this.spreadsheetId = sheetsId!;
      return true;
    } catch (err) {
      console.error("Failed to initialize Google Sheets reporter:", err);
      return false;
    }
  }

  async writeResults(run: AuditRun): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) return;

    try {
      await this.ensureSheetExists(SHEET_NAMES.testResults, TEST_RESULTS_HEADERS);
      const rows = run.results.map((r) => resultToRow(r));
      await this.appendRows(SHEET_NAMES.testResults, rows);
      console.log(`Wrote ${rows.length} results to Google Sheets.`);
    } catch (err) {
      console.error("Failed to write results to Google Sheets:", err);
    }
  }

  async updateDashboard(summary: AuditSummary): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) return;

    try {
      await this.ensureSheetExists(SHEET_NAMES.dashboard, [
        "Metric", "Value", "Last Updated",
      ]);

      const now = new Date().toISOString();
      const dashRows = [
        ["Last Audit Date", summary.completedAt, now],
        ["Total Checks", summary.totalChecks, now],
        ["Passed", summary.passed, now],
        ["Failed", summary.failed, now],
        ["Warnings", summary.warnings, now],
        ["Skipped", summary.skipped, now],
        ["Errors", summary.errors, now],
        ["Critical Issues", summary.criticalIssues, now],
        ["High Issues", summary.highIssues, now],
        ["Pass Rate (%)", summary.totalChecks > 0
          ? ((summary.passed / (summary.totalChecks - summary.skipped)) * 100).toFixed(1)
          : "N/A", now],
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAMES.dashboard}!A2:C${2 + dashRows.length}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: dashRows },
      });

      console.log("Dashboard updated in Google Sheets.");
    } catch (err) {
      console.error("Failed to update dashboard in Google Sheets:", err);
    }
  }

  private async ensureSheetExists(sheetName: string, headers: string[]): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) return;

    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });

    const exists = spreadsheet.data.sheets?.some(
      (s) => s.properties?.title === sheetName
    );

    if (!exists) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
      await this.appendRows(sheetName, [headers]);
    }
  }

  private async appendRows(
    sheetName: string,
    rows: (string | number | boolean | null)[][]
  ): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) return;

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: rows },
    });
  }
}

function resultToRow(r: TestResult): (string | number | null)[] {
  return [
    r.runId,
    r.timestamp,
    r.website,
    r.category,
    r.testId,
    sanitizeForSheets(r.testName),
    r.pageUrl,
    r.status,
    r.severity,
    sanitizeForSheets(r.expected),
    sanitizeForSheets(r.actual),
    sanitizeForSheets(r.message),
    r.durationMs,
    r.evidencePath ?? "",
  ];
}

function sanitizeForSheets(value: string): string {
  if (!value) return "";
  // Prevent formula injection
  if (value.startsWith("=") || value.startsWith("+") || value.startsWith("-") || value.startsWith("@")) {
    return "'" + value;
  }
  return value.replace(/[\r\n]+/g, " ").slice(0, 5000);
}
