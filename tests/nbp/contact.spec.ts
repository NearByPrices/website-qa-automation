import { test, expect } from "@playwright/test";

const BASE_URL = process.env["NBP_BASE_URL"] ?? "https://near-by-pricesfrontend.vercel.app";

test.describe("NBP Contact and Shop Availability", () => {
  test("contact page exists or contact section is present", async ({ page, request }) => {
    const contactPaths = ["/contact", "/about", "/help"];
    let found = false;
    for (const p of contactPaths) {
      const r = await request.get(`${BASE_URL}${p}`).catch(() => null);
      if (r && r.status() === 200) {
        found = true;
        break;
      }
    }

    if (!found) {
      await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
      const contactLink = await page.locator("a[href*='contact' i], a:text-is('Contact')").count();
      found = contactLink > 0;
    }

    expect(found, "No contact page or contact link found").toBeTruthy();
  });

  test("shop availability shows helpful state when no merchants onboarded", async ({ page }) => {
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle" }).catch(() =>
      page.goto(BASE_URL, { waitUntil: "networkidle" })
    );

    const noMerchants = await page
      .locator(
        "text=/no shops/i, text=/no merchants/i, text=/coming soon/i, text=/be the first/i, text=/no local/i"
      )
      .isVisible()
      .catch(() => false);

    const hasMerchants = await page
      .locator("[class*='shop'], [class*='merchant'], [data-testid*='shop']")
      .count();

    expect(
      noMerchants || hasMerchants > 0,
      "Page shows neither merchant listings nor an empty state — this may be a rendering issue"
    ).toBeTruthy();
  });

  test("navigation links do not lead to 404 pages", async ({ page, request }) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

    const navLinks = await page.locator("nav a, header a").evaluateAll((els) =>
      els.map((el) => (el as { href?: string }).href ?? "").filter((h) => h && h.startsWith("http"))
    );

    const unique = [...new Set(navLinks)].slice(0, 10);
    const broken: string[] = [];

    for (const link of unique) {
      const resp = await request.get(link).catch(() => null);
      if (resp && resp.status() === 404) {
        broken.push(`${link} → 404`);
      }
    }

    expect(broken, `Broken navigation links: ${broken.join(", ")}`).toHaveLength(0);
  });
});
