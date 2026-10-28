import { CrawlConfig, CrawlResult } from "../core/types";
import { httpGet } from "../utils/http";
import { extractLinks, normalizeUrl } from "../utils/url";
import { UrlFilter } from "./url-filter";
import { fetchAndParseSitemap } from "./sitemap-parser";
import { createLogger } from "../utils/logger";
import { sleep } from "../utils/retry";

const log = createLogger("Crawler");

export interface CrawlOptions {
  baseUrl: string;
  config: CrawlConfig;
}

export class WebCrawler {
  private results: CrawlResult[] = [];
  private queue: Array<{ url: string; depth: number }> = [];
  private filter: UrlFilter;
  private robotsDisallowed: string[] = [];

  constructor(private options: CrawlOptions) {
    this.filter = new UrlFilter({
      baseUrl: options.baseUrl,
      excludePatterns: options.config.excludePatterns,
    });
  }

  async crawl(): Promise<CrawlResult[]> {
    log.info(`Starting crawl of ${this.options.baseUrl}`);

    if (this.options.config.respectRobotsTxt) {
      await this.loadRobotsTxt();
    }

    const seedUrls: string[] = [this.options.baseUrl];

    if (this.options.config.followSitemaps) {
      const sitemapEntries = await fetchAndParseSitemap(
        this.options.baseUrl,
        this.options.config.timeoutMs
      );
      for (const entry of sitemapEntries.slice(0, 100)) {
        if (this.filter.shouldCrawl(entry.url)) {
          seedUrls.push(entry.url);
        }
      }
    }

    for (const url of seedUrls) {
      this.enqueue(url, 0);
    }

    while (this.queue.length > 0 && this.results.length < this.options.config.maxPages) {
      const batch = this.queue.splice(0, this.options.config.concurrency);
      await Promise.all(batch.map((item) => this.crawlPage(item.url, item.depth)));
      if (this.options.config.delayBetweenRequestsMs > 0) {
        await sleep(this.options.config.delayBetweenRequestsMs);
      }
    }

    log.info(`Crawl complete. Visited ${this.results.length} pages.`);
    return this.results;
  }

  private async crawlPage(url: string, depth: number): Promise<void> {
    if (this.results.length >= this.options.config.maxPages) return;

    const start = Date.now();
    const result: CrawlResult = {
      url,
      status: 0,
      discoveredAt: new Date().toISOString(),
      depth,
      linksFound: 0,
    };

    try {
      const response = await httpGet(url, { timeoutMs: this.options.config.timeoutMs });

      result.status = response.status;
      if (response.url !== url) {
        result.redirectedTo = response.url;
      }

      if (response.status >= 200 && response.status < 400 && response.body) {
        if (depth < this.options.config.maxDepth) {
          const links = extractLinks(response.body, url);
          result.linksFound = links.length;

          for (const link of links) {
            this.enqueue(link, depth + 1);
          }
        }
      }
    } catch (err) {
      result.error = err instanceof Error ? err.message : String(err);
    }

    this.results.push(result);
    const status = result.error ? "ERROR" : result.status;
    log.debug(`[${status}] ${url} (${Date.now() - start}ms, depth=${depth})`);
  }

  private enqueue(url: string, depth: number): void {
    const normalized = normalizeUrl(url, this.options.baseUrl);
    if (!normalized) return;
    if (!this.filter.shouldCrawl(normalized)) return;
    if (!this.filter.markSeen(normalized)) return;
    if (this.isRobotsDisallowed(normalized)) return;

    this.queue.push({ url: normalized, depth });
  }

  private async loadRobotsTxt(): Promise<void> {
    const robotsUrl = `${this.options.baseUrl}/robots.txt`;
    try {
      const resp = await httpGet(robotsUrl, { timeoutMs: 10000 });
      if (resp.status === 200) {
        const disallowed: string[] = [];
        for (const line of resp.body.split("\n")) {
          const trimmed = line.trim();
          if (trimmed.toLowerCase().startsWith("disallow:")) {
            const path = trimmed.substring("disallow:".length).trim();
            if (path) disallowed.push(path);
          }
        }
        this.robotsDisallowed = disallowed;
        log.info(`robots.txt: ${disallowed.length} disallow rules`);
      }
    } catch {
      log.warn("Could not fetch robots.txt");
    }
  }

  private isRobotsDisallowed(url: string): boolean {
    try {
      const parsed = new URL(url);
      return this.robotsDisallowed.some((path) => parsed.pathname.startsWith(path));
    } catch {
      return false;
    }
  }

  getDiscoveredUrls(): string[] {
    return this.results.map((r) => r.url);
  }
}
