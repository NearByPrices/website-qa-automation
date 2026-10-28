import { TestResult, SiteConfig, AuditCategory } from "../../core/types";
import { makeFail, makePass, makeError } from "../../core/result-manager";
import { httpGet } from "../../utils/http";
import { createLogger } from "../../utils/logger";

const log = createLogger("SEOAuditor");
const CATEGORY: AuditCategory = "SEO";

export interface PageSeoResult {
  url: string;
  results: TestResult[];
}

export class SeoAuditor {
  constructor(private siteConfig: SiteConfig, private runId: string) {}

  async auditPage(url: string): Promise<PageSeoResult> {
    log.info(`SEO audit: ${url}`);
    const results: TestResult[] = [];
    const start = Date.now();

    try {
      const response = await httpGet(url, { timeoutMs: this.siteConfig.crawl.timeoutMs });
      const html = response.body;
      const duration = Date.now() - start;

      results.push(...this.checkHttpStatus(url, response.status, duration));
      results.push(...this.checkHttpsEnforced(url, duration));

      if (html) {
        results.push(...this.checkTitle(url, html, duration));
        results.push(...this.checkMetaDescription(url, html, duration));
        results.push(...this.checkH1(url, html, duration));
        results.push(...this.checkCanonical(url, html, duration));
        results.push(...this.checkRobotsDirective(url, html, duration));
        results.push(...this.checkImages(url, html, duration));
        results.push(...this.checkStructuredData(url, html, duration));
      }

      results.push(...this.checkSecurityHeaders(url, response.headers, duration));
    } catch (err) {
      results.push(
        makeError({
          runId: this.runId,
          website: this.siteConfig.key,
          category: CATEGORY,
          testId: "SEO-ERR",
          testName: "SEO page audit",
          pageUrl: url,
          message: "Failed to fetch and audit page",
          error: err,
          severity: "HIGH",
        })
      );
    }

    return { url, results };
  }

  private checkHttpStatus(url: string, status: number, durationMs: number): TestResult[] {
    const ok = status === 200;
    return [
      ok
        ? makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "SEO-012", testName: "HTTP status 200",
            pageUrl: url, expected: "200", actual: String(status), durationMs,
          })
        : makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "SEO-012", testName: "HTTP status 200",
            pageUrl: url, expected: "200", actual: String(status),
            severity: status >= 500 ? "CRITICAL" : "HIGH",
            message: `Page returned HTTP ${status}`,
            recommendation: `Ensure the page returns HTTP 200. Current status: ${status}`,
            durationMs,
          }),
    ];
  }

  private checkHttpsEnforced(url: string, durationMs: number): TestResult[] {
    const isHttps = url.startsWith("https://");
    return [
      isHttps
        ? makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "SEC-001", testName: "HTTPS enforced",
            pageUrl: url, expected: "HTTPS URL", actual: "HTTPS", durationMs,
          })
        : makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "SEC-001", testName: "HTTPS enforced",
            pageUrl: url, expected: "HTTPS URL", actual: "HTTP URL",
            severity: "CRITICAL",
            message: "Page is served over HTTP, not HTTPS",
            recommendation: "Redirect all HTTP traffic to HTTPS",
            durationMs,
          }),
    ];
  }

  private checkTitle(url: string, html: string, durationMs: number): TestResult[] {
    const results: TestResult[] = [];
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;

    if (!title) {
      results.push(makeFail({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-001", testName: "Title tag exists",
        pageUrl: url, expected: "Non-empty title tag", actual: "Missing or empty title",
        severity: "HIGH",
        message: "Page has no title tag",
        recommendation: "Add a descriptive title tag to this page",
        durationMs,
      }));
      return results;
    }

    results.push(makePass({
      runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
      testId: "SEO-001", testName: "Title tag exists",
      pageUrl: url, expected: "Title tag present", actual: `"${title.slice(0, 60)}"`, durationMs,
    }));

    const { titleMinLength, titleMaxLength } = this.siteConfig.seo;
    if (title.length < titleMinLength || title.length > titleMaxLength) {
      results.push(makeFail({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-005", testName: "Title length within range",
        pageUrl: url,
        expected: `${titleMinLength}–${titleMaxLength} characters`,
        actual: `${title.length} characters`,
        severity: "LOW",
        message: `Title is ${title.length} characters (recommended ${titleMinLength}–${titleMaxLength})`,
        recommendation: "Adjust the title length for better display in search results",
        durationMs,
      }));
    } else {
      results.push(makePass({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-005", testName: "Title length within range",
        pageUrl: url, expected: `${titleMinLength}–${titleMaxLength} chars`,
        actual: `${title.length} chars`, durationMs,
      }));
    }

    return results;
  }

  private checkMetaDescription(url: string, html: string, durationMs: number): TestResult[] {
    const results: TestResult[] = [];
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
    const desc = descMatch ? descMatch[1].trim() : null;

    if (!desc) {
      results.push(makeFail({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-003", testName: "Meta description exists",
        pageUrl: url, expected: "Non-empty meta description", actual: "Missing or empty",
        severity: "MEDIUM",
        message: "Page has no meta description",
        recommendation: "Add a unique, descriptive meta description for this page",
        durationMs,
      }));
      return results;
    }

    results.push(makePass({
      runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
      testId: "SEO-003", testName: "Meta description exists",
      pageUrl: url, expected: "Meta description present", actual: `"${desc.slice(0, 60)}..."`, durationMs,
    }));

    const { descriptionMinLength, descriptionMaxLength } = this.siteConfig.seo;
    if (desc.length < descriptionMinLength || desc.length > descriptionMaxLength) {
      results.push(makeFail({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-006", testName: "Description length within range",
        pageUrl: url,
        expected: `${descriptionMinLength}–${descriptionMaxLength} characters`,
        actual: `${desc.length} characters`,
        severity: "LOW",
        message: `Description is ${desc.length} characters`,
        recommendation: "Adjust description length for optimal search result display",
        durationMs,
      }));
    } else {
      results.push(makePass({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-006", testName: "Description length within range",
        pageUrl: url, expected: `${descriptionMinLength}–${descriptionMaxLength} chars`,
        actual: `${desc.length} chars`, durationMs,
      }));
    }

    return results;
  }

  private checkH1(url: string, html: string, durationMs: number): TestResult[] {
    const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) ?? [];
    const h1Count = h1Matches.length;

    if (h1Count === 0) {
      return [makeFail({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-007", testName: "H1 exists",
        pageUrl: url, expected: "At least one H1", actual: "No H1 found",
        severity: "MEDIUM",
        message: "Page has no H1 heading",
        recommendation: "Add a descriptive H1 heading that reflects the page content",
        durationMs,
      })];
    }

    if (h1Count > 1) {
      return [makeFail({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-007", testName: "H1 exists",
        pageUrl: url, expected: "Exactly one H1", actual: `${h1Count} H1 elements found`,
        severity: "LOW",
        message: `Page has ${h1Count} H1 headings. Prefer a single H1.`,
        recommendation: "Use exactly one H1 per page for clear heading hierarchy",
        durationMs,
      })];
    }

    return [makePass({
      runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
      testId: "SEO-007", testName: "H1 exists",
      pageUrl: url, expected: "One H1", actual: "One H1 found", durationMs,
    })];
  }

  private checkCanonical(url: string, html: string, durationMs: number): TestResult[] {
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)
      ?? html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
    const canonical = canonicalMatch ? canonicalMatch[1].trim() : null;

    if (!canonical) {
      return [makeFail({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-008", testName: "Canonical URL present",
        pageUrl: url, expected: "Canonical link tag", actual: "Missing",
        severity: "MEDIUM",
        message: "Page has no canonical link tag",
        recommendation: "Add <link rel=\"canonical\"> to prevent duplicate content issues",
        durationMs,
      })];
    }

    const isValid = canonical.startsWith("http");
    return [
      isValid
        ? makePass({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "SEO-009", testName: "Canonical URL valid",
            pageUrl: url, expected: "Absolute canonical URL", actual: canonical, durationMs,
          })
        : makeFail({
            runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
            testId: "SEO-009", testName: "Canonical URL valid",
            pageUrl: url, expected: "Absolute canonical URL", actual: canonical,
            severity: "MEDIUM",
            message: `Canonical URL is not absolute: ${canonical}`,
            recommendation: "Use an absolute URL for the canonical tag",
            durationMs,
          }),
    ];
  }

  private checkRobotsDirective(url: string, html: string, durationMs: number): TestResult[] {
    const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i);
    const directive = robotsMatch ? robotsMatch[1].toLowerCase() : null;

    if (directive && (directive.includes("noindex") || directive.includes("none"))) {
      return [makeFail({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-011", testName: "No noindex on public pages",
        pageUrl: url, expected: "Indexable page", actual: `robots: ${directive}`,
        severity: "HIGH",
        message: `Page has robots directive: ${directive}`,
        recommendation: "Remove noindex unless this page should be excluded from search results",
        durationMs,
      })];
    }

    return [makePass({
      runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
      testId: "SEO-011", testName: "No noindex on public pages",
      pageUrl: url, expected: "Indexable", actual: directive ?? "No robots directive (default indexable)", durationMs,
    })];
  }

  private checkImages(url: string, html: string, durationMs: number): TestResult[] {
    const imgMatches = html.matchAll(/<img([^>]*)>/gi);
    const issues: string[] = [];

    for (const match of imgMatches) {
      const attrs = match[1];
      const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
      if (!altMatch) {
        issues.push("img missing alt");
      } else if (!altMatch[1].trim()) {
        // Empty alt is valid for decorative images
      }
      const srcMatch = attrs.match(/src=["']([^"']*)["']/i);
      if (!srcMatch || !srcMatch[1].trim()) {
        issues.push("img missing src");
      }
    }

    if (issues.length > 0) {
      return [makeFail({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-010", testName: "Images have alt text",
        pageUrl: url, expected: "All images have alt attributes",
        actual: `${issues.length} image(s) missing alt`,
        severity: "MEDIUM",
        message: `${issues.length} image(s) are missing alt attributes`,
        recommendation: "Add descriptive alt text to all meaningful images",
        durationMs,
      })];
    }

    return [makePass({
      runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
      testId: "SEO-010", testName: "Images have alt text",
      pageUrl: url, expected: "All images have alt", actual: "All images have alt", durationMs,
    })];
  }

  private checkStructuredData(url: string, html: string, durationMs: number): TestResult[] {
    const results: TestResult[] = [];
    const ldJsonMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    const schemas: unknown[] = [];

    for (const match of ldJsonMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        schemas.push(parsed);
      } catch {
        results.push(makeFail({
          runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
          testId: "SEO-014", testName: "Structured data valid JSON",
          pageUrl: url, expected: "Valid JSON-LD", actual: "Invalid JSON in structured data",
          severity: "MEDIUM",
          message: "Page contains malformed JSON-LD structured data",
          recommendation: "Fix the JSON syntax in the structured data script block",
          durationMs,
        }));
      }
    }

    if (schemas.length === 0) {
      results.push(makeFail({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-013", testName: "Structured data present",
        pageUrl: url, expected: "JSON-LD structured data", actual: "None found",
        severity: "LOW",
        message: "No structured data found on this page",
        recommendation: "Add relevant structured data (e.g. WebSite, Product, Organization)",
        durationMs,
      }));
    } else {
      results.push(makePass({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-013", testName: "Structured data present",
        pageUrl: url, expected: "JSON-LD present", actual: `${schemas.length} schema block(s) found`, durationMs,
      }));
    }

    return results;
  }

  private checkSecurityHeaders(
    url: string,
    headers: Record<string, string>,
    durationMs: number
  ): TestResult[] {
    const results: TestResult[] = [];

    const xContentType = headers["x-content-type-options"];
    if (!xContentType || xContentType.toLowerCase() !== "nosniff") {
      results.push(makeFail({
        runId: this.runId, website: this.siteConfig.key, category: "SECURITY",
        testId: "SEC-003", testName: "X-Content-Type-Options header",
        pageUrl: url, expected: "nosniff", actual: xContentType ?? "missing",
        severity: "MEDIUM",
        message: "Missing X-Content-Type-Options: nosniff header",
        recommendation: "Add 'X-Content-Type-Options: nosniff' to your server headers",
        durationMs,
      }));
    } else {
      results.push(makePass({
        runId: this.runId, website: this.siteConfig.key, category: "SECURITY",
        testId: "SEC-003", testName: "X-Content-Type-Options header",
        pageUrl: url, expected: "nosniff", actual: xContentType, durationMs,
      }));
    }

    const xFrame = headers["x-frame-options"] ?? headers["content-security-policy"];
    if (!xFrame) {
      results.push(makeFail({
        runId: this.runId, website: this.siteConfig.key, category: "SECURITY",
        testId: "SEC-002", testName: "X-Frame-Options header",
        pageUrl: url, expected: "X-Frame-Options or CSP frame-ancestors", actual: "missing",
        severity: "MEDIUM",
        message: "No clickjacking protection header found",
        recommendation: "Add X-Frame-Options: DENY or a CSP with frame-ancestors directive",
        durationMs,
      }));
    } else {
      results.push(makePass({
        runId: this.runId, website: this.siteConfig.key, category: "SECURITY",
        testId: "SEC-002", testName: "X-Frame-Options header",
        pageUrl: url, expected: "Frame protection header", actual: "Present", durationMs,
      }));
    }

    return results;
  }

  async auditSitemap(baseUrl: string): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    const resp = await httpGet(sitemapUrl, { timeoutMs: 15000 });

    if (resp.status !== 200) {
      results.push(makeFail({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-015", testName: "Sitemap accessible",
        pageUrl: sitemapUrl, expected: "HTTP 200", actual: String(resp.status),
        severity: "MEDIUM",
        message: `Sitemap returned HTTP ${resp.status}`,
        recommendation: "Create and publish an XML sitemap at /sitemap.xml",
        durationMs: resp.durationMs,
      }));
    } else {
      results.push(makePass({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-015", testName: "Sitemap accessible",
        pageUrl: sitemapUrl, expected: "HTTP 200", actual: "200", durationMs: resp.durationMs,
      }));
    }

    const robotsUrl = `${baseUrl}/robots.txt`;
    const robotsResp = await httpGet(robotsUrl, { timeoutMs: 10000 });
    if (robotsResp.status !== 200) {
      results.push(makeFail({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-016", testName: "robots.txt accessible",
        pageUrl: robotsUrl, expected: "HTTP 200", actual: String(robotsResp.status),
        severity: "LOW",
        message: "robots.txt not found",
        recommendation: "Create a robots.txt file at the root of your domain",
        durationMs: robotsResp.durationMs,
      }));
    } else {
      results.push(makePass({
        runId: this.runId, website: this.siteConfig.key, category: CATEGORY,
        testId: "SEO-016", testName: "robots.txt accessible",
        pageUrl: robotsUrl, expected: "HTTP 200", actual: "200", durationMs: robotsResp.durationMs,
      }));
    }

    return results;
  }
}
