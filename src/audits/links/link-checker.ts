import { TestResult, SiteConfig, AuditCategory } from "../../core/types";
import { makeFail, makePass } from "../../core/result-manager";
import { httpHead } from "../../utils/http";
import { extractLinks, isSameDomain, normalizeUrl } from "../../utils/url";
import { httpGet } from "../../utils/http";
import { createLogger } from "../../utils/logger";
import { sleep } from "../../utils/retry";

const log = createLogger("LinkChecker");
const CATEGORY: AuditCategory = "LINKS";

export class LinkChecker {
  constructor(private siteConfig: SiteConfig, private runId: string) {}

  async checkPage(url: string): Promise<TestResult[]> {
    log.info(`Link check: ${url}`);
    const results: TestResult[] = [];

    try {
      const resp = await httpGet(url, { timeoutMs: this.siteConfig.crawl.timeoutMs });
      if (!resp.body) return results;

      const links = extractLinks(resp.body, url);
      const internalLinks = links.filter((l) => isSameDomain(l, this.siteConfig.baseUrl));
      const externalLinks = links.filter((l) => !isSameDomain(l, this.siteConfig.baseUrl));

      log.info(`Found ${links.length} links on ${url} (${internalLinks.length} internal, ${externalLinks.length} external)`);

      for (const link of internalLinks.slice(0, 50)) {
        const normalized = normalizeUrl(link, this.siteConfig.baseUrl);
        if (!normalized) continue;

        await sleep(200);
        const check = await httpHead(normalized, { timeoutMs: 10000 });

        if (check.status === 0 || check.status >= 400) {
          results.push(makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "LNK-001", testName: "Internal link resolves",
            pageUrl: url, expected: "HTTP 2xx or 3xx",
            actual: check.error ? `Error: ${check.error}` : `HTTP ${check.status}`,
            severity: check.status === 404 ? "HIGH" : "MEDIUM",
            message: `Internal link broken: ${normalized} → ${check.status || check.error}`,
            recommendation: `Fix or remove the broken link to: ${normalized}`,
            durationMs: check.durationMs,
            metadata: { brokenUrl: normalized, sourceUrl: url },
          }));
        } else {
          results.push(makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "LNK-001", testName: "Internal link resolves",
            pageUrl: url, expected: "HTTP 2xx/3xx", actual: `HTTP ${check.status}`,
            durationMs: check.durationMs,
          }));
        }
      }
    } catch (err) {
      log.warn(`Link check failed for ${url}: ${err}`);
    }

    return results;
  }
}
