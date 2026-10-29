import {
  createRunId,
  makePass,
  makeFail,
  makeSkipped,
  makeError,
  buildSummary,
} from "../../src/core/result-manager";
import { AuditRun } from "../../src/core/types";

describe("createRunId", () => {
  it("returns a non-empty string", () => {
    expect(createRunId()).toBeTruthy();
  });

  it("returns unique values", () => {
    const ids = new Set(Array.from({ length: 20 }, createRunId));
    expect(ids.size).toBe(20);
  });
});

describe("makePass", () => {
  it("creates a PASS result with correct fields", () => {
    const result = makePass({
      runId: "run-1",
      website: "nbp",
      category: "SEO",
      testId: "SEO-001",
      testName: "Title exists",
      pageUrl: "https://example.com",
      expected: "Title present",
      actual: "Title present",
    });

    expect(result.status).toBe("PASS");
    expect(result.website).toBe("nbp");
    expect(result.category).toBe("SEO");
    expect(result.timestamp).toBeTruthy();
  });
});

describe("makeFail", () => {
  it("creates a FAIL result with correct fields", () => {
    const result = makeFail({
      runId: "run-1",
      website: "nbp",
      category: "SEO",
      testId: "SEO-001",
      testName: "Title exists",
      pageUrl: "https://example.com",
      expected: "Title present",
      actual: "Title missing",
      severity: "HIGH",
      message: "No title tag",
      recommendation: "Add a title tag",
    });

    expect(result.status).toBe("FAIL");
    expect(result.severity).toBe("HIGH");
    expect(result.message).toBe("No title tag");
  });
});

describe("makeSkipped", () => {
  it("creates a SKIPPED result", () => {
    const result = makeSkipped({
      runId: "run-1",
      website: "nbp",
      category: "FUNCTIONAL",
      testId: "FUNC-001",
      testName: "Auth test",
      pageUrl: "https://example.com",
      message: "No test account configured",
    });

    expect(result.status).toBe("SKIPPED");
    expect(result.severity).toBe("INFO");
  });
});

describe("makeError", () => {
  it("creates an ERROR result from an Error object", () => {
    const result = makeError({
      runId: "run-1",
      website: "nbp",
      category: "SEO",
      testId: "SEO-ERR",
      testName: "SEO audit",
      pageUrl: "https://example.com",
      message: "Audit failed",
      error: new Error("connection refused"),
    });

    expect(result.status).toBe("ERROR");
    expect(result.actual).toContain("connection refused");
  });

  it("handles non-Error error values", () => {
    const result = makeError({
      runId: "run-1",
      website: "nbp",
      category: "SEO",
      testId: "SEO-ERR",
      testName: "SEO audit",
      pageUrl: "https://example.com",
      message: "Audit failed",
      error: "timeout",
    });

    expect(result.actual).toContain("timeout");
  });
});

describe("buildSummary", () => {
  const makeRun = (results: ReturnType<typeof makePass>[]): AuditRun => ({
    runId: "run-1",
    website: "nbp",
    startedAt: new Date(Date.now() - 5000).toISOString(),
    completedAt: new Date().toISOString(),
    auditType: "seo",
    environment: "production",
    results,
  });

  it("counts statuses correctly", () => {
    const run = makeRun([
      makePass({ runId: "run-1", website: "nbp", category: "SEO", testId: "T1", testName: "T1", pageUrl: "https://x.com", expected: "x", actual: "x" }),
      makeFail({ runId: "run-1", website: "nbp", category: "SEO", testId: "T2", testName: "T2", pageUrl: "https://x.com", expected: "x", actual: "y", severity: "HIGH", message: "m", recommendation: "r" }),
      makeFail({ runId: "run-1", website: "nbp", category: "SEO", testId: "T3", testName: "T3", pageUrl: "https://x.com", expected: "x", actual: "y", severity: "CRITICAL", message: "m", recommendation: "r" }),
      makeSkipped({ runId: "run-1", website: "nbp", category: "SEO", testId: "T4", testName: "T4", pageUrl: "https://x.com", message: "skip" }),
    ]);

    const summary = buildSummary(run);
    expect(summary.totalChecks).toBe(4);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(2);
    expect(summary.skipped).toBe(1);
    expect(summary.criticalIssues).toBe(1);
    expect(summary.highIssues).toBe(1);
  });

  it("does not count skipped as passed", () => {
    const run = makeRun([
      makeSkipped({ runId: "run-1", website: "nbp", category: "SEO", testId: "T1", testName: "T1", pageUrl: "https://x.com", message: "skip" }),
    ]);
    const summary = buildSummary(run);
    expect(summary.passed).toBe(0);
    expect(summary.skipped).toBe(1);
  });
});
