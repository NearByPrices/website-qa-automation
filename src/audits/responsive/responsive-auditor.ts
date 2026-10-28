import { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { TestResult, SiteConfig, AuditCategory } from "../../core/types";
import { makeFail, makePass, makeError } from "../../core/result-manager";
import { createLogger } from "../../utils/logger";

const log = createLogger("ResponsiveAuditor");
const CATEGORY: AuditCategory = "RESPONSIVE";

export const VIEWPORTS = [
  { name: "mobile-small", width: 375, height: 812, isMobile: true },
  { name: "mobile-large", width: 390, height: 844, isMobile: true },
  { name: "tablet", width: 768, height: 1024, isMobile: false },
  { name: "desktop-hd", width: 1366, height: 768, isMobile: false },
  { name: "desktop-fhd", width: 1920, height: 1080, isMobile: false },
] as const;

export class ResponsiveAuditor {
  constructor(
    private siteConfig: SiteConfig,
    private runId: string,
    private screenshotsDir = "test-results/screenshots"
  ) {}

  async auditPage(page: Page, url: string): Promise<TestResult[]> {
    log.info(`Responsive audit: ${url}`);
    const results: TestResult[] = [];

    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }

    for (const viewport of VIEWPORTS) {
      const start = Date.now();
      try {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(url, { waitUntil: "networkidle", timeout: this.siteConfig.crawl.timeoutMs });
        await page.waitForTimeout(500);

        const duration = Date.now() - start;

        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        const screenshotName = `${viewport.name}-${encodeURIComponent(url).slice(0, 30)}-${Date.now()}.png`;
        const screenshotPath = path.join(this.screenshotsDir, screenshotName);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        if (hasHorizontalOverflow) {
          results.push(makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: `RESP-OVERFLOW-${viewport.name}`,
            testName: `No horizontal overflow (${viewport.name} ${viewport.width}x${viewport.height})`,
            pageUrl: url, expected: "No horizontal overflow",
            actual: `Horizontal overflow detected at ${viewport.width}px`,
            severity: viewport.isMobile ? "HIGH" : "MEDIUM",
            message: `Page overflows horizontally at ${viewport.width}x${viewport.height} (${viewport.name})`,
            recommendation: "Fix horizontal overflow — users on narrow viewports may need to scroll sideways",
            durationMs: duration, evidencePath: screenshotPath,
          }));
        } else {
          results.push(makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: `RESP-OVERFLOW-${viewport.name}`,
            testName: `No horizontal overflow (${viewport.name})`,
            pageUrl: url, expected: "No overflow", actual: "No horizontal overflow",
            durationMs: duration, evidencePath: screenshotPath,
          }));
        }
      } catch (err) {
        results.push(makeError({
          runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
          testId: `RESP-ERR-${viewport.name}`,
          testName: `Responsive check (${viewport.name})`,
          pageUrl: url, message: `Responsive check failed for ${viewport.name}`, error: err,
        }));
      }
    }

    return results;
  }
}
