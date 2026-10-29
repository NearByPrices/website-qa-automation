import {
  normalizeUrl,
  isSameDomain,
  matchesExcludePattern,
  extractLinks,
  isResourceUrl,
} from "../../src/utils/url";

describe("normalizeUrl", () => {
  it("resolves relative URLs against a base", () => {
    expect(normalizeUrl("/about", "https://example.com")).toBe("https://example.com/about");
  });

  it("strips hash fragments", () => {
    expect(normalizeUrl("https://example.com/page#section")).toBe("https://example.com/page");
  });

  it("returns null for invalid URLs", () => {
    expect(normalizeUrl("not a url", undefined)).toBeNull();
  });

  it("handles absolute URLs", () => {
    expect(normalizeUrl("https://example.com/products?q=test")).toBe(
      "https://example.com/products?q=test"
    );
  });
});

describe("isSameDomain", () => {
  it("returns true for same domain", () => {
    expect(isSameDomain("https://example.com/page", "https://example.com")).toBeTruthy();
  });

  it("returns false for different domain", () => {
    expect(isSameDomain("https://other.com/page", "https://example.com")).toBeFalsy();
  });
});

describe("matchesExcludePattern", () => {
  it("matches simple prefix patterns", () => {
    expect(matchesExcludePattern("https://example.com/admin/users", ["/admin"])).toBeTruthy();
  });

  it("does not match unrelated paths", () => {
    expect(matchesExcludePattern("https://example.com/products", ["/admin"])).toBeFalsy();
  });
});

describe("isResourceUrl", () => {
  it("identifies CSS as a resource", () => {
    expect(isResourceUrl("https://example.com/styles.css")).toBeTruthy();
  });

  it("identifies HTML paths as non-resources", () => {
    expect(isResourceUrl("https://example.com/products")).toBeFalsy();
  });

  it("identifies images as resources", () => {
    expect(isResourceUrl("https://example.com/photo.jpg")).toBeTruthy();
  });
});

describe("extractLinks", () => {
  it("extracts href values from HTML", () => {
    const html = `<a href="/about">About</a><a href="/contact">Contact</a>`;
    const links = extractLinks(html, "https://example.com");
    expect(links).toContain("https://example.com/about");
    expect(links).toContain("https://example.com/contact");
  });

  it("excludes mailto links", () => {
    const html = `<a href="mailto:test@example.com">Email</a>`;
    const links = extractLinks(html, "https://example.com");
    expect(links).toHaveLength(0);
  });

  it("deduplicates links", () => {
    const html = `<a href="/page">1</a><a href="/page">2</a>`;
    const links = extractLinks(html, "https://example.com");
    expect(links.filter((l) => l === "https://example.com/page")).toHaveLength(1);
  });
});
