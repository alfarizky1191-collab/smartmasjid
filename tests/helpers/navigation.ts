import type { Page } from "@playwright/test";

export async function gotoDashboard(page: Page) {
  await page.goto("/dashboard");
}

export async function gotoTV(page: Page, slugOrId: string) {
  if (!slugOrId?.trim()) {
    throw new Error("gotoTV requires a slug or mosque id.");
  }
  await page.goto(`/tv/${encodeURIComponent(slugOrId.trim())}`);
}

export async function gotoMobile(page: Page, slug: string) {
  if (!slug?.trim()) {
    throw new Error("gotoMobile requires a mosque slug.");
  }
  await page.goto(`/m/${encodeURIComponent(slug.trim())}`);
}

export async function clearStorage(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
}

export async function waitForDashboard(page: Page) {
  await page.waitForURL(/\/dashboard/);
  await page.getByText("Masjid Admin").waitFor({ state: "visible", timeout: 10_000 });
}
