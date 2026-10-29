export function normalizeUrl(url: string, base?: string): string | null {
  try {
    const resolved = new URL(url, base);
    // Strip hash fragments
    resolved.hash = "";
    // Normalize trailing slash for root
    if (resolved.pathname === "") resolved.pathname = "/";
    return resolved.href;
  } catch {
    return null;
  }
}

export function isSameDomain(url: string, baseUrl: string): boolean {
  try {
    const parsed = new URL(url);
    const baseParsed = new URL(baseUrl);
    return parsed.hostname === baseParsed.hostname;
  } catch {
    return false;
  }
}

export function isExternalUrl(url: string, baseUrl: string): boolean {
  return !isSameDomain(url, baseUrl);
}

export function matchesExcludePattern(url: string, patterns: string[]): boolean {
  const parsed = new URL(url);
  const pathAndQuery = parsed.pathname + parsed.search;
  return patterns.some((pattern) => {
    if (pattern.startsWith("^")) {
      return new RegExp(pattern).test(pathAndQuery);
    }
    return pathAndQuery.startsWith(pattern) || pathAndQuery.includes(pattern);
  });
}

export function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    if (
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:") ||
      href === "#"
    ) {
      continue;
    }
    const normalized = normalizeUrl(href, baseUrl);
    if (normalized) links.push(normalized);
  }

  return [...new Set(links)];
}

export function isResourceUrl(url: string): boolean {
  const resourceExtensions = [
    ".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".svg",
    ".ico", ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".webm",
    ".pdf", ".zip", ".tar", ".gz",
  ];
  try {
    const parsed = new URL(url);
    const ext = parsed.pathname.toLowerCase().split(".").pop() ?? "";
    return resourceExtensions.includes(`.${ext}`);
  } catch {
    return false;
  }
}
