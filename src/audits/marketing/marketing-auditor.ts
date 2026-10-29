import { TestResult, SiteConfig, AuditCategory } from "../../core/types";
import { makeFail, makePass, makeError } from "../../core/result-manager";
import { httpGet } from "../../utils/http";
import { createLogger } from "../../utils/logger";

const log = createLogger("MarketingAuditor");
const CATEGORY: AuditCategory = "MARKETING";

const PLACEHOLDER_PATTERNS = [
  /lorem\s+ipsum/i,
  /placeholder/i,
  /coming\s+soon/i,
  /under\s+construction/i,
  /test\s+content/i,
  /dummy\s+content/i,
];

export class MarketingAuditor {
  constructor(private siteConfig: SiteConfig, private runId: string) {}

  async auditHomepage(url: string): Promise<TestResult[]> {
    log.info(`Marketing audit: ${url}`);
    const results: TestResult[] = [];

    try {
      const resp = await httpGet(url, { timeoutMs: this.siteConfig.crawl.timeoutMs });
      const html = resp.body ?? "";
      const durationMs = resp.durationMs;

      results.push(...this.checkValueProposition(url, html, durationMs));
      results.push(...this.checkPrimaryCta(url, html, durationMs));
      results.push(...this.checkSearchAccessibility(url, html, durationMs));
      results.push(...this.checkPlaceholderContent(url, html, durationMs));
      results.push(...this.checkBrokenImages(url, html, durationMs));
    } catch (err) {
      results.push(makeError({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "MKT-ERR", testName: "Marketing homepage audit",
        pageUrl: url, message: "Failed to audit homepage", error: err,
      }));
    }

    return results;
  }

  async auditProductPage(url: string): Promise<TestResult[]> {
    log.info(`Marketing product audit: ${url}`);
    const results: TestResult[] = [];

    try {
      const resp = await httpGet(url, { timeoutMs: this.siteConfig.crawl.timeoutMs });
      const html = resp.body ?? "";
      const durationMs = resp.durationMs;

      results.push(...this.checkPriceDisplayed(url, html, durationMs));
      results.push(...this.checkPriceClarity(url, html, durationMs));
      results.push(...this.checkContactShopCta(url, html, durationMs));
      results.push(...this.checkEmptyStateHandling(url, html, durationMs));
    } catch (err) {
      results.push(makeError({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "MKT-ERR-PROD", testName: "Marketing product audit",
        pageUrl: url, message: "Failed to audit product page", error: err,
      }));
    }

    return results;
  }

  private checkValueProposition(url: string, html: string, durationMs: number): TestResult[] {
    const textContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const hasValueProp =
      /price[s]?\s+(compare|comparison|near|local)/i.test(textContent) ||
      /compare\s+prices/i.test(textContent) ||
      /local\s+(shop|store|prices)/i.test(textContent) ||
      /nearby\s+(prices|shop|store)/i.test(textContent) ||
      /find\s+(product|price)/i.test(textContent);

    return [
      hasValueProp
        ? makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-002", testName: "Value proposition present",
            pageUrl: url, expected: "Clear value proposition text",
            actual: "Value proposition detected", durationMs,
          })
        : makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-002", testName: "Value proposition present",
            pageUrl: url, expected: "Clear value proposition text",
            actual: "No clear value proposition detected",
            severity: "HIGH",
            message: "Homepage does not clearly communicate what NearbyPrices offers",
            recommendation:
              "Add a prominent headline explaining the service (e.g. 'Compare prices at local shops near you')",
            durationMs,
          }),
    ];
  }

  private checkPrimaryCta(url: string, html: string, durationMs: number): TestResult[] {
    const ctaPatterns = [
      /compare\s+prices/i,
      /search\s+(products|for)/i,
      /find\s+(products|prices)/i,
      /get\s+started/i,
      /explore/i,
    ];
    const hasCta = ctaPatterns.some((p) => p.test(html));

    return [
      hasCta
        ? makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-001", testName: "Primary CTA visible on homepage",
            pageUrl: url, expected: "Primary CTA present",
            actual: "CTA detected", durationMs,
          })
        : makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-001", testName: "Primary CTA visible on homepage",
            pageUrl: url, expected: "Primary CTA present", actual: "No primary CTA detected",
            severity: "HIGH",
            message: "No clear primary call to action found on homepage",
            recommendation: "Add a prominent search or compare button above the fold",
            durationMs,
          }),
    ];
  }

  private checkSearchAccessibility(url: string, html: string, durationMs: number): TestResult[] {
    const hasSearch =
      /<input[^>]*type=["']search["']/i.test(html) ||
      /<input[^>]*placeholder=[^>]*search/i.test(html) ||
      /<form[^>]*search/i.test(html) ||
      /search[^<]{0,100}input/i.test(html);

    return [
      hasSearch
        ? makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-003", testName: "Search functionality accessible",
            pageUrl: url, expected: "Search input visible",
            actual: "Search input detected", durationMs,
          })
        : makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-003", testName: "Search functionality accessible",
            pageUrl: url, expected: "Search input visible", actual: "No search input detected",
            severity: "CRITICAL",
            message: "No product search input found on the page",
            recommendation:
              "Ensure a product search input is prominent and accessible without scrolling",
            durationMs,
          }),
    ];
  }

  private checkPlaceholderContent(url: string, html: string, durationMs: number): TestResult[] {
    const textContent = html.replace(/<[^>]+>/g, " ");
    const found = PLACEHOLDER_PATTERNS.filter((p) => p.test(textContent));

    return [
      found.length === 0
        ? makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-009", testName: "No placeholder content",
            pageUrl: url, expected: "No placeholder text",
            actual: "No placeholder patterns found", durationMs,
          })
        : makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-009", testName: "No placeholder content",
            pageUrl: url, expected: "No placeholder text",
            actual: `Placeholder patterns found: ${found.map((p) => p.source).join(", ")}`,
            severity: "MEDIUM",
            message: "Page may contain placeholder or dummy content",
            recommendation: "Replace placeholder content with real, production-ready copy",
            durationMs,
          }),
    ];
  }

  private checkBrokenImages(url: string, html: string, durationMs: number): TestResult[] {
    const imgSrcRegex = /src=["']([^"']+)["']/gi;
    const allSrcs: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = imgSrcRegex.exec(html)) !== null) {
      const src = match[1];
      if (src.match(/\.(png|jpg|jpeg|gif|svg|webp)/i)) {
        allSrcs.push(src);
      }
    }

    const emptySrcs = allSrcs.filter((s) => !s.trim());
    return [
      emptySrcs.length === 0
        ? makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-008", testName: "Broken images on key pages",
            pageUrl: url, expected: "No empty image src",
            actual: `${allSrcs.length} images checked, none empty`, durationMs,
          })
        : makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-008", testName: "Broken images on key pages",
            pageUrl: url, expected: "All images have valid src",
            actual: `${emptySrcs.length} image(s) with empty src`,
            severity: "MEDIUM",
            message: `${emptySrcs.length} image(s) have empty or missing src attributes`,
            recommendation: "Fix or remove images with empty src attributes",
            durationMs,
          }),
    ];
  }

  private checkPriceDisplayed(url: string, html: string, durationMs: number): TestResult[] {
    const hasPriceIndicator =
      /₹\s*[\d,]+/i.test(html) ||
      /rs\.?\s*[\d,]+/i.test(html) ||
      /price/i.test(html) ||
      /inr/i.test(html);

    return [
      hasPriceIndicator
        ? makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-004", testName: "Product price displayed",
            pageUrl: url, expected: "Price information visible",
            actual: "Price indicator found", durationMs,
          })
        : makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-004", testName: "Product price displayed",
            pageUrl: url, expected: "Price information visible",
            actual: "No price information found",
            severity: "HIGH",
            message: "Product page does not appear to display price information",
            recommendation: "Ensure price information is displayed on product pages",
            durationMs,
          }),
    ];
  }

  private checkPriceClarity(url: string, html: string, durationMs: number): TestResult[] {
    const textContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const hasOnlineEstimateLabel =
      /online\s+(price|estimate|range)/i.test(textContent) ||
      /indicative/i.test(textContent) ||
      /approximate/i.test(textContent) ||
      /estimated/i.test(textContent) ||
      /market\s+price/i.test(textContent);

    return [
      {
        runId: this.runId,
        website: this.siteConfig.key,
        category: CATEGORY,
        testId: "MKT-006",
        testName: "Price range notation clear",
        pageUrl: url,
        status: hasOnlineEstimateLabel ? "PASS" : "REVIEW_REQUIRED",
        severity: "HIGH",
        expected: "Prices clearly labeled as estimates or indicative",
        actual: hasOnlineEstimateLabel
          ? "Estimate label detected"
          : "No explicit estimate label found — manual review required",
        message: hasOnlineEstimateLabel
          ? "Price label appears to distinguish estimates from confirmed offers"
          : "Verify that online indicative prices are clearly distinguished from confirmed merchant prices",
        recommendation:
          "Label any online price ranges clearly as 'indicative' or 'estimated' to avoid misleading customers",
        durationMs,
        timestamp: new Date().toISOString(),
      },
    ];
  }

  private checkContactShopCta(url: string, html: string, durationMs: number): TestResult[] {
    const hasContactCta =
      /contact\s+(shop|seller|store)/i.test(html) ||
      /call\s+(shop|store)/i.test(html) ||
      /whatsapp/i.test(html) ||
      /get\s+(directions|location)/i.test(html) ||
      /view\s+(shop|store)/i.test(html);

    return [
      hasContactCta
        ? makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-005", testName: "Contact shop CTA present",
            pageUrl: url, expected: "Contact shop action available",
            actual: "Contact action detected", durationMs,
          })
        : makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "MKT-005", testName: "Contact shop CTA present",
            pageUrl: url, expected: "Contact shop action available",
            actual: "No contact shop action found",
            severity: "HIGH",
            message: "No 'contact shop' or 'call shop' action found on product page",
            recommendation:
              "Add a clear action for users to contact or reach local shops from product pages",
            durationMs,
          }),
    ];
  }

  private checkEmptyStateHandling(url: string, html: string, durationMs: number): TestResult[] {
    const textContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const hasEmptyStateMsg =
      /no\s+(results|products|shops|merchants)\s*(found|available)/i.test(textContent) ||
      /be\s+the\s+first/i.test(textContent) ||
      /coming\s+soon/i.test(textContent) ||
      /not\s+(available|found)\s+in\s+your\s+area/i.test(textContent);

    return [
      {
        runId: this.runId,
        website: this.siteConfig.key,
        category: CATEGORY,
        testId: "MKT-007",
        testName: "Empty state handled",
        pageUrl: url,
        status: hasEmptyStateMsg ? "PASS" : "REVIEW_REQUIRED",
        severity: "MEDIUM",
        expected: "Helpful message when no merchants available",
        actual: hasEmptyStateMsg
          ? "Empty state message detected"
          : "No empty state message found — may not apply or may require manual check",
        message: hasEmptyStateMsg
          ? "Page appears to handle the empty/no-results state"
          : "Verify that the page shows a helpful message when no local shops are available",
        recommendation:
          "Display a clear, helpful message when no merchants are available in the area",
        durationMs,
        timestamp: new Date().toISOString(),
      },
    ];
  }
}
