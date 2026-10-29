import { parseStringPromise } from "xml2js";
import { httpGet } from "../utils/http";
import { normalizeUrl } from "../utils/url";
import { createLogger } from "../utils/logger";

const log = createLogger("SitemapParser");

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export async function fetchAndParseSitemap(
  baseUrl: string,
  timeoutMs = 15000
): Promise<SitemapEntry[]> {
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap/sitemap.xml`,
  ];

  for (const url of sitemapUrls) {
    const entries = await trySitemap(url, baseUrl, timeoutMs);
    if (entries.length > 0) {
      log.info(`Found ${entries.length} URLs in sitemap at ${url}`);
      return entries;
    }
  }

  log.warn("No sitemap found or sitemap is empty");
  return [];
}

async function trySitemap(
  url: string,
  baseUrl: string,
  timeoutMs: number
): Promise<SitemapEntry[]> {
  const resp = await httpGet(url, { timeoutMs });
  if (resp.status !== 200 || !resp.body) return [];

  try {
    const parsed = await parseStringPromise(resp.body, { explicitArray: false });

    if (parsed.sitemapindex) {
      return await parseSitemapIndex(parsed.sitemapindex, baseUrl, timeoutMs);
    }

    if (parsed.urlset) {
      return parseUrlset(parsed.urlset, baseUrl);
    }
  } catch (err) {
    log.warn(`Failed to parse sitemap at ${url}: ${err}`);
  }

  return [];
}

async function parseSitemapIndex(
  index: Record<string, unknown>,
  baseUrl: string,
  timeoutMs: number
): Promise<SitemapEntry[]> {
  const sitemaps = Array.isArray(index["sitemap"]) ? index["sitemap"] : [index["sitemap"]];
  const allEntries: SitemapEntry[] = [];

  for (const sm of sitemaps) {
    if (!sm || typeof sm !== "object") continue;
    const smRecord = sm as Record<string, unknown>;
    const loc = smRecord["loc"];
    if (typeof loc === "string") {
      const entries = await trySitemap(loc, baseUrl, timeoutMs);
      allEntries.push(...entries);
    }
  }

  return allEntries;
}

function parseUrlset(
  urlset: Record<string, unknown>,
  baseUrl: string
): SitemapEntry[] {
  const urls = Array.isArray(urlset["url"]) ? urlset["url"] : [urlset["url"]];
  const entries: SitemapEntry[] = [];

  for (const u of urls) {
    if (!u || typeof u !== "object") continue;
    const uRecord = u as Record<string, unknown>;
    const loc = uRecord["loc"];
    if (typeof loc !== "string") continue;

    const normalized = normalizeUrl(loc, baseUrl);
    if (!normalized) continue;

    entries.push({
      url: normalized,
      lastmod: typeof uRecord["lastmod"] === "string" ? uRecord["lastmod"] : undefined,
      changefreq:
        typeof uRecord["changefreq"] === "string" ? uRecord["changefreq"] : undefined,
      priority: typeof uRecord["priority"] === "string" ? uRecord["priority"] : undefined,
    });
  }

  return entries;
}
