import { test, expect } from "@playwright/test";

const BASE_URL = process.env["NBP_BASE_URL"] ?? "https://near-by-pricesfrontend.vercel.app";

test.describe("NBP Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  });

  test("homepage loads with HTTP 200", async ({ request }) => {
    const response = await request.get(BASE_URL);
    expect(response.status()).toBe(200);
  });

  test("page title is not empty", async ({ page }) => {
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test("page has visible heading", async ({ page }) => {
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible({ timeout: 10000 });
  });

  test("page does not show a JavaScript error overlay", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("Non-Error promise rejection") &&
        !e.includes("ChunkLoadError")
    );
    expect(criticalErrors, `JavaScript errors: ${criticalErrors.join(", ")}`).toHaveLength(0);
  });

  test("main navigation is present", async ({ page }) => {
    const nav = page.locator("nav, [role='navigation'], header").first();
    await expect(nav).toBeVisible({ timeout: 10000 });
  });

  test("search input or search section is accessible", async ({ page }) => {
    const searchInput = page.locator(
      "input[type='search'], input[placeholder*='search' i], input[placeholder*='product' i], [data-testid*='search']"
    ).first();

    const searchSection = page.locator(
      "text=/search/i, text=/find/i, [aria-label*='search' i]"
    ).first();

    const hasSearch = (await searchInput.count()) > 0 || (await searchSection.count()) > 0;
    expect(hasSearch, "No search input or search section found on homepage").toBeTruthy();
  });

  test("no server 500 error message visible", async ({ page }) => {
    const errorIndicators = [
      "text=Internal Server Error",
      "text=500",
      "text=Application error",
      "text=An error occurred",
    ];
    for (const selector of errorIndicators) {
      const el = page.locator(selector).first();
      const isVisible = await el.isVisible().catch(() => false);
      if (isVisible) {
        const text = await el.textContent();
        throw new Error(`Server error visible: "${text}"`);
      }
    }
  });

  test("page renders content in under 10 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10000);
  });

  test("HTTPS is used", async ({ page }) => {
    const url = page.url();
    expect(url).toMatch(/^https:\/\//);
  });
});
