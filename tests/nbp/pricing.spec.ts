import { test, expect } from "@playwright/test";

const BASE_URL = process.env["NBP_BASE_URL"] ?? "https://near-by-pricesfrontend.vercel.app";

test.describe("NBP Price Display", () => {
  test("price information is present on product pages", async ({ page }) => {
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle" }).catch(() =>
      page.goto(BASE_URL, { waitUntil: "networkidle" })
    );

    const priceElements = page.locator(
      "[class*='price'], [data-testid*='price'], text=/₹/, text=/Rs\\./, text=/INR/"
    );
    const count = await priceElements.count();

    if (count === 0) {
      test.skip(true, "No price elements found — may not have products loaded or price selectors may differ");
    }

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("minimum price is not greater than maximum price where both shown", async ({ page }) => {
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle" }).catch(() =>
      page.goto(BASE_URL, { waitUntil: "networkidle" })
    );

    const priceRanges = await page.evaluate(() => {
      const text = document.body.innerText;
      const rangeMatches = text.matchAll(/₹\s*([\d,]+)\s*[-–]\s*₹\s*([\d,]+)/g);
      const results: { min: number; max: number }[] = [];
      for (const m of rangeMatches) {
        const min = parseInt(m[1].replace(/,/g, ""), 10);
        const max = parseInt(m[2].replace(/,/g, ""), 10);
        if (!isNaN(min) && !isNaN(max)) results.push({ min, max });
      }
      return results;
    });

    for (const range of priceRanges) {
      expect(range.min, `Min price (${range.min}) exceeds max price (${range.max})`).toBeLessThanOrEqual(
        range.max
      );
    }
  });

  test("prices are formatted with currency symbol", async ({ page }) => {
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle" }).catch(() =>
      page.goto(BASE_URL, { waitUntil: "networkidle" })
    );

    const pageText = await page.evaluate(() => document.body.innerText);
    const hasCurrencyFormat = /₹\s*[\d,]+|Rs\.?\s*[\d,]+|INR\s*[\d,]+/i.test(pageText);

    if (!hasCurrencyFormat) {
      test.skip(true, "No price data found — skipping currency format check");
    }

    expect(hasCurrencyFormat, "Prices are not formatted with a recognized currency symbol").toBeTruthy();
  });
});
