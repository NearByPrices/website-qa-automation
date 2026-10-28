import { isSameDomain, matchesExcludePattern, isResourceUrl, normalizeUrl } from "../utils/url";

export interface UrlFilterOptions {
  baseUrl: string;
  excludePatterns: string[];
  allowQueryParams?: boolean;
}

const DEFAULT_EXCLUDE_PATTERNS = [
  "/admin",
  "/api/",
  "/login",
  "/logout",
  "/signup",
  "/checkout",
  "/cart",
  "/_next/",
  "/__next",
  "/static/",
  "/public/",
];

export class UrlFilter {
  private seenUrls = new Set<string>();

  constructor(private options: UrlFilterOptions) {}

  shouldCrawl(url: string): boolean {
    const normalized = normalizeUrl(url, this.options.baseUrl);
    if (!normalized) return false;

    if (!isSameDomain(normalized, this.options.baseUrl)) return false;
    if (isResourceUrl(normalized)) return false;

    const allExcludes = [...DEFAULT_EXCLUDE_PATTERNS, ...this.options.excludePatterns];
    if (matchesExcludePattern(normalized, allExcludes)) return false;

    return true;
  }

  markSeen(url: string): boolean {
    const normalized = normalizeUrl(url, this.options.baseUrl);
    if (!normalized) return false;

    if (this.seenUrls.has(normalized)) return false;

    this.seenUrls.add(normalized);
    return true;
  }

  isNew(url: string): boolean {
    const normalized = normalizeUrl(url, this.options.baseUrl);
    if (!normalized) return false;
    return !this.seenUrls.has(normalized);
  }

  get visitedCount(): number {
    return this.seenUrls.size;
  }
}
