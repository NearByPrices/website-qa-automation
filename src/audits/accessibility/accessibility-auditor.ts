import { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { TestResult, SiteConfig, AuditCategory } from "../../core/types";
import { makeFail, makePass, makeError } from "../../core/result-manager";
import { createLogger } from "../../utils/logger";

const log = createLogger("A11yAuditor");
const CATEGORY: AuditCategory = "ACCESSIBILITY";

const IMPACT_SEVERITY: Record<string, "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"> = {
  critical: "CRITICAL",
  serious: "HIGH",
  moderate: "MEDIUM",
  minor: "LOW",
};

export class AccessibilityAuditor {
  constructor(private siteConfig: SiteConfig, private runId: string) {}

  async auditPage(page: Page, url: string): Promise<TestResult[]> {
    log.info(`Accessibility audit: ${url}`);
    const results: TestResult[] = [];
    const start = Date.now();

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: this.siteConfig.crawl.timeoutMs });

      const axeResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();

      const duration = Date.now() - start;

      if (axeResults.violations.length === 0) {
        results.push(makePass({
          runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
          testId: "A11Y-001", testName: "No axe-core accessibility violations",
          pageUrl: url, expected: "0 violations", actual: "0 violations", durationMs: duration,
        }));
      }

      for (const violation of axeResults.violations) {
        const severity = IMPACT_SEVERITY[violation.impact ?? "minor"] ?? "LOW";
        results.push(makeFail({
          runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
          testId: `A11Y-${violation.id.slice(0, 10).toUpperCase()}`,
          testName: `Accessibility: ${violation.help}`,
          pageUrl: url,
          expected: "No violations",
          actual: `${violation.nodes.length} element(s) affected`,
          severity,
          message: `${violation.help}: ${violation.description}`,
          recommendation: `${violation.help}. See: ${violation.helpUrl}`,
          durationMs: duration,
          metadata: {
            wcagCriteria: violation.tags,
            affectedElements: violation.nodes.slice(0, 3).map((n) => n.html).join(" | "),
          },
        }));
      }

      for (const incomplete of axeResults.incomplete.slice(0, 5)) {
        results.push({
          runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
          testId: `A11Y-REVIEW-${incomplete.id.slice(0, 8).toUpperCase()}`,
          testName: `Accessibility review: ${incomplete.help}`,
          pageUrl: url,
          status: "REVIEW_REQUIRED",
          severity: "LOW",
          expected: "Manual review",
          actual: `${incomplete.nodes.length} element(s) need review`,
          message: `${incomplete.help}: requires manual verification`,
          recommendation: incomplete.help,
          durationMs: duration,
          timestamp: new Date().toISOString(),
        });
      }

      log.info(`Accessibility: ${axeResults.violations.length} violations, ${axeResults.passes.length} passes`);
    } catch (err) {
      results.push(makeError({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "A11Y-ERR", testName: "Accessibility audit",
        pageUrl: url, message: "Accessibility audit failed", error: err,
      }));
    }

    return results;
  }
}
