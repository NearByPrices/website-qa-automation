import { v4 as uuidv4 } from "uuid";
import {
  TestResult,
  AuditRun,
  AuditSummary,
  TestStatus,
  TestSeverity,
  AuditCategory,
} from "./types";

export function createRunId(): string {
  return uuidv4();
}

export function createTestResult(
  partial: Omit<TestResult, "runId" | "timestamp"> & { runId?: string }
): TestResult {
  return {
    runId: partial.runId ?? createRunId(),
    timestamp: new Date().toISOString(),
    ...partial,
  };
}

export function makePass(
  params: {
    runId: string;
    website: string;
    category: AuditCategory;
    testId: string;
    testName: string;
    pageUrl: string;
    expected: string;
    actual: string;
    severity?: TestSeverity;
    durationMs?: number;
    message?: string;
    recommendation?: string;
    evidencePath?: string;
    metadata?: Record<string, unknown>;
  }
): TestResult {
  return createTestResult({
    ...params,
    status: "PASS",
    severity: params.severity ?? "INFO",
    durationMs: params.durationMs ?? 0,
    message: params.message ?? "",
    recommendation: params.recommendation ?? "",
  });
}

export function makeFail(
  params: {
    runId: string;
    website: string;
    category: AuditCategory;
    testId: string;
    testName: string;
    pageUrl: string;
    expected: string;
    actual: string;
    severity: TestSeverity;
    message: string;
    recommendation: string;
    durationMs?: number;
    evidencePath?: string;
    metadata?: Record<string, unknown>;
  }
): TestResult {
  return createTestResult({
    ...params,
    status: "FAIL",
    durationMs: params.durationMs ?? 0,
  });
}

export function makeSkipped(
  params: {
    runId: string;
    website: string;
    category: AuditCategory;
    testId: string;
    testName: string;
    pageUrl: string;
    message: string;
    reason?: string;
  }
): TestResult {
  return createTestResult({
    ...params,
    status: "SKIPPED",
    severity: "INFO",
    expected: "N/A — test not configured",
    actual: params.reason ?? "Not configured",
    message: params.message,
    recommendation: "Configure required environment variables or test accounts to enable this check.",
    durationMs: 0,
  });
}

export function makeError(
  params: {
    runId: string;
    website: string;
    category: AuditCategory;
    testId: string;
    testName: string;
    pageUrl: string;
    message: string;
    error: unknown;
    severity?: TestSeverity;
  }
): TestResult {
  const err = params.error instanceof Error ? params.error.message : String(params.error);
  return createTestResult({
    ...params,
    status: "ERROR",
    severity: params.severity ?? "HIGH",
    expected: "Check completed without error",
    actual: `Error: ${err}`,
    message: params.message,
    recommendation: "Investigate the error and re-run the check.",
    durationMs: 0,
  });
}

export function buildSummary(run: AuditRun): AuditSummary {
  const results = run.results;
  const completedAt = run.completedAt ?? new Date().toISOString();
  const durationMs =
    new Date(completedAt).getTime() - new Date(run.startedAt).getTime();

  const counts = countByStatus(results);
  const severityCounts = countBySeverity(results.filter((r) => r.status === "FAIL"));

  const topIssues = results
    .filter((r) => r.status === "FAIL" || r.status === "ERROR")
    .sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity))
    .slice(0, 10);

  const evidencePaths = results
    .filter((r) => r.evidencePath)
    .map((r) => r.evidencePath as string);

  return {
    runId: run.runId,
    website: run.website,
    auditType: run.auditType,
    startedAt: run.startedAt,
    completedAt,
    durationMs,
    totalChecks: results.length,
    passed: counts["PASS"] ?? 0,
    failed: counts["FAIL"] ?? 0,
    warnings: counts["WARNING"] ?? 0,
    errors: counts["ERROR"] ?? 0,
    skipped: counts["SKIPPED"] ?? 0,
    reviewRequired: counts["REVIEW_REQUIRED"] ?? 0,
    criticalIssues: severityCounts["CRITICAL"] ?? 0,
    highIssues: severityCounts["HIGH"] ?? 0,
    mediumIssues: severityCounts["MEDIUM"] ?? 0,
    lowIssues: severityCounts["LOW"] ?? 0,
    topIssues,
    evidencePaths: [...new Set(evidencePaths)],
  };
}

function countByStatus(results: TestResult[]): Partial<Record<TestStatus, number>> {
  const counts: Partial<Record<TestStatus, number>> = {};
  for (const r of results) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }
  return counts;
}

function countBySeverity(results: TestResult[]): Partial<Record<TestSeverity, number>> {
  const counts: Partial<Record<TestSeverity, number>> = {};
  for (const r of results) {
    counts[r.severity] = (counts[r.severity] ?? 0) + 1;
  }
  return counts;
}

function severityOrder(s: TestSeverity): number {
  const order: Record<TestSeverity, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
    INFO: 4,
  };
  return order[s];
}
