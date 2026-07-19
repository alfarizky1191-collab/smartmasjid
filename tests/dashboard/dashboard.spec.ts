import { expect, test } from "@playwright/test";
import { login } from "../helpers";

test.describe("dashboard pages", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, "Set E2E_EMAIL and E2E_PASSWORD");
    await login(page);
  });

  test("main dashboard loads", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible();
  });

  test("events page loads without realtime error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/dashboard/events");
    await expect(page.getByRole("heading", { name: "Jadwal Kegiatan" }).first()).toBeVisible({ timeout: 10_000 });
    expect(errors.filter(e => e.includes("postgres_changes"))).toHaveLength(0);
  });

  test("donasi page loads without realtime error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/dashboard/donasi");
    await expect(page.getByText(/qris donasi/i)).toBeVisible({ timeout: 10_000 });
    expect(errors.filter(e => e.includes("postgres_changes"))).toHaveLength(0);
  });

  test("finance page loads", async ({ page }) => {
    await page.goto("/dashboard/finance");
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });

  test("petugas page loads", async ({ page }) => {
    await page.goto("/dashboard/petugas");
    await expect(page.getByText(/manajemen petugas/i)).toBeVisible({ timeout: 10_000 });
  });

  test("settings page loads with data intact after reload", async ({ page }) => {
    await page.goto("/dashboard/settings");
    const nameValue = await page.locator("input").first().inputValue();
    await page.reload();
    await expect(page.locator("input").first()).toHaveValue(nameValue, { timeout: 10_000 });
  });
});
