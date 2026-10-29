import { UrlFilter } from "../../src/crawler/url-filter";

const BASE_URL = "https://example.com";

function makeFilter(extra: string[] = []) {
  return new UrlFilter({ baseUrl: BASE_URL, excludePatterns: extra });
}

describe("UrlFilter.shouldCrawl", () => {
  it("allows same-domain HTML paths", () => {
    const filter = makeFilter();
    expect(filter.shouldCrawl("https://example.com/products")).toBeTruthy();
  });

  it("blocks external domains", () => {
    const filter = makeFilter();
    expect(filter.shouldCrawl("https://other.com/page")).toBeFalsy();
  });

  it("blocks /admin paths by default", () => {
    const filter = makeFilter();
    expect(filter.shouldCrawl("https://example.com/admin/users")).toBeFalsy();
  });

  it("blocks resource files", () => {
    const filter = makeFilter();
    expect(filter.shouldCrawl("https://example.com/style.css")).toBeFalsy();
    expect(filter.shouldCrawl("https://example.com/logo.png")).toBeFalsy();
  });

  it("blocks custom exclude patterns", () => {
    const filter = makeFilter(["/custom-exclude"]);
    expect(filter.shouldCrawl("https://example.com/custom-exclude/path")).toBeFalsy();
  });
});

describe("UrlFilter.markSeen", () => {
  it("returns true the first time", () => {
    const filter = makeFilter();
    expect(filter.markSeen("https://example.com/page")).toBeTruthy();
  });

  it("returns false for a duplicate", () => {
    const filter = makeFilter();
    filter.markSeen("https://example.com/page");
    expect(filter.markSeen("https://example.com/page")).toBeFalsy();
  });

  it("increments visitedCount", () => {
    const filter = makeFilter();
    filter.markSeen("https://example.com/a");
    filter.markSeen("https://example.com/b");
    expect(filter.visitedCount).toBe(2);
  });
});
