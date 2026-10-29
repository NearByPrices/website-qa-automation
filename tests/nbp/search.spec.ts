import { test, expect } from "@playwright/test";

const BASE_URL = process.env["NBP_BASE_URL"] ?? "https://near-by-pricesfrontend.vercel.app";

test.describe("NBP Product Search", () => {
  test("search page or search endpoint returns 200", async ({ request }) => {
    const searchPaths = ["/search", "/products", "/search?q=samsung"];
    let found = false;
    for (const p of searchPaths) {
      const resp = await request.get(`${BASE_URL}${p}`);
      if (resp.status() === 200) {
        found = true;
        break;
      }
    }
    expect(found, "No search-related page returned HTTP 200").toBeTruthy();
  });

  test("search for 'samsung' returns results or empty state", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

    const searchInput = page
      .locator(
        "input[type='search'], input[placeholder*='search' i], input[placeholder*='product' i], input[name*='search' i], input[name*='query' i]"
      )
      .first();

    if ((await searchInput.count()) === 0) {
      test.skip(true, "No search input found — product search test not applicable");
      return;
    }

    await searchInput.fill("samsung");
    await page.keyboard.press("Enter");
    await page.waitForLoadState("networkidle").catch(() => {});

    const hasResults = (await page.locator("[data-testid*='product'], .product-card, [class*='product']").count()) > 0;
    const hasEmptyState = await page
      .locator("text=/no results/i, text=/not found/i, text=/no products/i")
      .isVisible()
      .catch(() => false);

    expect(hasResults || hasEmptyState, "Search returned neither results nor an empty state").toBeTruthy();
  });

  test("search with special characters does not cause server error", async ({ page }) => {
    await page.goto(`${BASE_URL}/search?q=%3Cscript%3E&q='; DROP TABLE`, {
      waitUntil: "domcontentloaded",
    });
    const title = await page.title();
    expect(title).not.toMatch(/error|500|exception/i);
  });

  test("search page does not leak server internals in response", async ({ request }) => {
    const resp = await request.get(`${BASE_URL}/search?q=test`).catch(() => null);
    if (!resp) return;
    const body = await resp.text();
    expect(body).not.toMatch(/stack trace|at Object\.|node_modules/i);
  });
});
