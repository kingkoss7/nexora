import { expect, test } from "@playwright/test";

test("storefront loads and hero sign-in opens the login page", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto("/");
  await expect(page).toHaveTitle(/NEXORA/);
  await expect(page.getByRole("link", { name: /NEXORA/i }).first()).toBeVisible();
  await expect(page.getByTestId("launch-loader")).toBeHidden({ timeout: 5_000 });
  await page.getByRole("link", { name: "Sign in" }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(page.locator("form")).toBeVisible();
  await expect(page.getByText("Luxury technology for everyday performance. Created by Prayukth & Suhal.")).toBeVisible();
  await expect(page.getByText("NEXORA · skateboard studio")).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });
});
