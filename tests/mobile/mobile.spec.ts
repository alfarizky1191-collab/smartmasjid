import { expect, test } from "@playwright/test";

const slug = process.env.E2E_MOSQUE_SLUG || "jamie";

test.describe("mobile landing page /m/[slug]", () => {
  test("loads mosque name and clock", async ({ page }) => {
    await page.goto(`/m/${slug}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/\d{2}:\d{2}:\d{2}/)).toBeVisible({ timeout: 10_000 });
  });

  test("shows prayer schedule", async ({ page }) => {
    await page.goto(`/m/${slug}`);
    await expect(page.getByText("Subuh", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Maghrib", { exact: true })).toBeVisible();
  });

  test("shows countdown banner", async ({ page }) => {
    await page.goto(`/m/${slug}`);
    await expect(page.getByText(/Adzan .+ dalam/)).toBeVisible({ timeout: 15_000 });
  });

  test("shows 404 for unknown slug", async ({ page }) => {
    await page.goto("/m/masjid-tidak-ada-xyz123");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible({ timeout: 10_000 });
  });

  test("responsive layout fits mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    await page.goto(`/m/${slug}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});
