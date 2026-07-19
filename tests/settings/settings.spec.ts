import { expect, test } from "@playwright/test";
import { login } from "../helpers";

test.describe("dashboard settings", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, "Set E2E_EMAIL and E2E_PASSWORD");
    await login(page);
  });

  test("settings page renders all sections", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { name: "Pengaturan Masjid" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Logo Masjid" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Profil" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Link Publik" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Audio Adzan/i })).toBeVisible();
  });

  test("can click simpan profil button", async ({ page }) => {
    await page.goto("/dashboard/settings");
    page.on("dialog", (d) => d.accept());
    const saveBtn = page.getByRole("button", { name: /simpan profil/i });
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await saveBtn.click();
    await page.waitForTimeout(2000);
  });

  test("link publik section visible and shows correct labels", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.getByText("Landing Page")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("TV Display").first()).toBeVisible();
  });
});
