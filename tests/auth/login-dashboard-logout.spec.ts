import { expect, test } from "@playwright/test";
import { login, logout } from "../helpers";

test.describe("authentication smoke", () => {
  test("logs in, loads the dashboard, and logs out", async ({ page }) => {
    test.skip(
      !process.env.E2E_EMAIL || !process.env.E2E_PASSWORD,
      "Set E2E_EMAIL and E2E_PASSWORD to run the login smoke test."
    );

    await login(page);

    await expect(page.getByText("Masjid Admin")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();

    await logout(page);
  });
});
