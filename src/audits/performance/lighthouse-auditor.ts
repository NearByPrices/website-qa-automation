import * as fs from "fs";
import * as path from "path";
import { TestResult, SiteConfig, AuditCategory } from "../../core/types";
import { makeFail, makePass, makeError } from "../../core/result-manager";
import { createLogger } from "../../utils/logger";

const log = createLogger("LighthouseAuditor");
const CATEGORY: AuditCategory = "PERFORMANCE";

export interface LighthouseScore {
  performance?: number;
  accessibility?: number;
  bestPractices?: number;
  seo?: number;
  lcp?: number;
  cls?: number;
  tbt?: number;
  fcp?: number;
  speedIndex?: number;
}

export class LighthouseAuditor {
  constructor(private siteConfig: SiteConfig, private runId: string, private outputDir = "audit-results/lighthouse") {}

  async auditPage(url: string, deviceType: "mobile" | "desktop" = "mobile"): Promise<TestResult[]> {
    log.info(`Lighthouse audit (${deviceType}): ${url}`);
    const results: TestResult[] = [];

    try {
      // Dynamic import to handle ESM/CJS issues
      const lighthouse = await import("lighthouse").then((m) => m.default ?? m);
      const chromeLauncher = await import("chrome-launcher");

      const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless", "--no-sandbox"] });

      try {
        const flags = {
          port: chrome.port,
          output: "json" as const,
          logLevel: "error" as const,
          formFactor: deviceType,
          screenEmulation:
            deviceType === "mobile"
              ? { mobile: true, width: 375, height: 812, deviceScaleFactor: 3 }
              : { mobile: false, width: 1366, height: 768, deviceScaleFactor: 1 },
        };

        const runnerResult = await lighthouse(url, flags);
        if (!runnerResult?.lhr) {
          throw new Error("Lighthouse returned no results");
        }

        const lhr = runnerResult.lhr as unknown as Record<string, unknown>;
        const scores = extractScores(lhr);

        if (!fs.existsSync(this.outputDir)) {
          fs.mkdirSync(this.outputDir, { recursive: true });
        }
        const reportFile = path.join(
          this.outputDir,
          `${encodeURIComponent(url).slice(0, 40)}-${deviceType}-${Date.now()}.json`
        );
        fs.writeFileSync(reportFile, JSON.stringify(lhr, null, 2));
        log.info(`Lighthouse report saved: ${reportFile}`);

        const thresholds = this.siteConfig.performance.thresholds;
        results.push(...this.checkScore(url, "Performance", scores.performance, thresholds.performanceScore, deviceType));
        results.push(...this.checkScore(url, "Accessibility", scores.accessibility, thresholds.accessibilityScore, deviceType));
        results.push(...this.checkScore(url, "Best Practices", scores.bestPractices, thresholds.bestPracticesScore, deviceType));
        results.push(...this.checkScore(url, "SEO", scores.seo, thresholds.seoScore, deviceType));

        if (scores.lcp !== undefined) {
          results.push(...this.checkMetric(url, "LCP", scores.lcp, thresholds.lcpMs, "ms", deviceType));
        }
        if (scores.cls !== undefined) {
          results.push(...this.checkMetricLte(url, "CLS", scores.cls, thresholds.cls, deviceType));
        }
      } finally {
        await chrome.kill();
      }
    } catch (err) {
      results.push(makeError({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "PERF-ERR", testName: `Lighthouse ${deviceType} audit`,
        pageUrl: url, message: "Lighthouse audit failed", error: err, severity: "HIGH",
      }));
    }

    return results;
  }

  private checkScore(
    url: string,
    metric: string,
    score: number | undefined,
    threshold: number,
    deviceType: string
  ): TestResult[] {
    if (score === undefined) return [];
    const pct = Math.round((score ?? 0) * 100);
    const ok = pct >= threshold;
    const id = `PERF-${metric.replace(/\s+/g, "").slice(0, 8).toUpperCase()}`;

    return [
      ok
        ? makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: id, testName: `Lighthouse ${metric} score (${deviceType})`,
            pageUrl: url, expected: `≥ ${threshold}`, actual: `${pct}`,
          })
        : makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: id, testName: `Lighthouse ${metric} score (${deviceType})`,
            pageUrl: url, expected: `≥ ${threshold}`, actual: `${pct}`,
            severity: pct < threshold * 0.5 ? "HIGH" : "MEDIUM",
            message: `Lighthouse ${metric} score is ${pct} (threshold: ${threshold})`,
            recommendation: `Improve ${metric} score to meet the ${threshold} threshold`,
          }),
    ];
  }

  private checkMetric(
    url: string,
    metric: string,
    value: number,
    threshold: number,
    unit: string,
    deviceType: string
  ): TestResult[] {
    const ok = value <= threshold;
    return [
      ok
        ? makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: `PERF-${metric}`, testName: `${metric} (${deviceType})`,
            pageUrl: url, expected: `≤ ${threshold}${unit}`, actual: `${Math.round(value)}${unit}`,
          })
        : makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: `PERF-${metric}`, testName: `${metric} (${deviceType})`,
            pageUrl: url, expected: `≤ ${threshold}${unit}`, actual: `${Math.round(value)}${unit}`,
            severity: "MEDIUM",
            message: `${metric} is ${Math.round(value)}${unit}, threshold is ${threshold}${unit}`,
            recommendation: `Optimize to reduce ${metric} below the ${threshold}${unit} threshold`,
          }),
    ];
  }

  private checkMetricLte(
    url: string,
    metric: string,
    value: number,
    threshold: number,
    deviceType: string
  ): TestResult[] {
    const ok = value <= threshold;
    return [
      ok
        ? makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: `PERF-${metric}`, testName: `${metric} (${deviceType})`,
            pageUrl: url, expected: `≤ ${threshold}`, actual: value.toFixed(3),
          })
        : makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: `PERF-${metric}`, testName: `${metric} (${deviceType})`,
            pageUrl: url, expected: `≤ ${threshold}`, actual: value.toFixed(3),
            severity: "MEDIUM",
            message: `${metric} is ${value.toFixed(3)}, threshold is ${threshold}`,
            recommendation: `Reduce layout shifts to improve ${metric} below ${threshold}`,
          }),
    ];
  }
}

function extractScores(lhr: Record<string, unknown>): LighthouseScore {
  const categories = lhr["categories"] as Record<string, { score: number }> | undefined;
  const audits = lhr["audits"] as Record<string, { numericValue?: number }> | undefined;

  return {
    performance: (categories?.["performance"] as { score?: number } | undefined)?.score,
    accessibility: (categories?.["accessibility"] as { score?: number } | undefined)?.score,
    bestPractices: (categories?.["best-practices"] as { score?: number } | undefined)?.score,
    seo: (categories?.["seo"] as { score?: number } | undefined)?.score,
    lcp: (audits?.["largest-contentful-paint"] as { numericValue?: number } | undefined)?.numericValue,
    cls: (audits?.["cumulative-layout-shift"] as { numericValue?: number } | undefined)?.numericValue,
    tbt: (audits?.["total-blocking-time"] as { numericValue?: number } | undefined)?.numericValue,
    fcp: (audits?.["first-contentful-paint"] as { numericValue?: number } | undefined)?.numericValue,
    speedIndex: (audits?.["speed-index"] as { numericValue?: number } | undefined)?.numericValue,
  };
}
