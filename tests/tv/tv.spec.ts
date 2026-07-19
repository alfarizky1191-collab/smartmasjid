import { expect, test } from "@playwright/test";

const slug = process.env.E2E_MOSQUE_SLUG || "jamie";

test.describe("TV display page", () => {
  test("loads mosque name and prayer times", async ({ page }) => {
    await page.goto(`/tv/${slug}`);
    // Mosque name visible
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
    // Clock visible (HH:MM:SS format)
    await expect(page.getByText(/\d{2}:\d{2}:\d{2}/)).toBeVisible({ timeout: 10_000 });
  });

  test("shows prayer schedule grid", async ({ page }) => {
    await page.goto(`/tv/${slug}`);
    // Prayer times load from external API — give extra time
    await expect(page.getByText("Subuh", { exact: true })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("Maghrib", { exact: true })).toBeVisible();
    await expect(page.getByText("Isya", { exact: true })).toBeVisible();
  });

  test("shows countdown to next prayer", async ({ page }) => {
    await page.goto(`/tv/${slug}`);
    await expect(page.getByText(/Adzan .+ dalam/)).toBeVisible({ timeout: 60_000 });
  });

  test("shows 404 for unknown slug", async ({ page }) => {
    await page.goto("/tv/masjid-tidak-ada-xyz123");
    await expect(page.getByText(/tidak ditemukan/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
