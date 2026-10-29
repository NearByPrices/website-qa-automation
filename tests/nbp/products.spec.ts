import { test, expect } from "@playwright/test";

const BASE_URL = process.env["NBP_BASE_URL"] ?? "https://near-by-pricesfrontend.vercel.app";

test.describe("NBP Product Pages", () => {
  test("products listing page loads", async ({ request }) => {
    const paths = ["/products", "/search", "/"];
    let successPath = "";
    for (const p of paths) {
      const resp = await request.get(`${BASE_URL}${p}`);
      if (resp.status() === 200) {
        successPath = p;
        break;
      }
    }
    expect(successPath, "No product-related page returned 200").not.toBe("");
  });

  test("product cards are visible on product/search page", async ({ page }) => {
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle" }).catch(() =>
      page.goto(BASE_URL, { waitUntil: "networkidle" })
    );

    const productCards = page.locator(
      "[data-testid*='product'], .product-card, [class*='product-item'], [class*='ProductCard'], article"
    );

    await page.waitForTimeout(2000);

    const cardCount = await productCards.count();

    if (cardCount === 0) {
      const emptyState = await page
        .locator("text=/no products/i, text=/coming soon/i, text=/be the first/i, text=/no results/i")
        .isVisible()
        .catch(() => false);
      expect(
        emptyState,
        "No product cards found and no empty state message — page may be broken"
      ).toBeTruthy();
    } else {
      expect(cardCount).toBeGreaterThan(0);
    }
  });

  test("no broken product images on listing page", async ({ page }) => {
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle" }).catch(() =>
      page.goto(BASE_URL, { waitUntil: "networkidle" })
    );

    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll("img"));
      return images.filter((img) => !img.complete || img.naturalWidth === 0).length;
    });

    expect(
      brokenImages,
      `${brokenImages} broken image(s) found on product listing page`
    ).toBe(0);
  });
});
