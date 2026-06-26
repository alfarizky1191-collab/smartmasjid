import { test as base, expect, type Page } from "@playwright/test";
import { clearStorage, gotoDashboard, login } from "../helpers";
import type { UserRole } from "../helpers/auth";

export type AppFixtures = {
  anonymousPage: Page;
  authenticatedPage: Page;
  adminPage: Page;
  operatorPage: Page;
};

const loginAs = async (page: Page, role: UserRole) => {
  await clearStorage(page);
  await login(page, role);
  await gotoDashboard(page);
};

export const test = base.extend<AppFixtures>({
  anonymousPage: async ({ page }, use) => {
    await clearStorage(page);
    await use(page);
  },

  authenticatedPage: async ({ page }, use) => {
    await loginAs(page, "super_admin");
    await use(page);
  },

  adminPage: async ({ page }, use) => {
    await loginAs(page, "admin_masjid");
    await use(page);
  },

  operatorPage: async ({ page }, use) => {
    await loginAs(page, "operator_tv");
    await use(page);
  },
});

export { expect };
