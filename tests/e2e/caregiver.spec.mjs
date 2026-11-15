import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("caregiver can add a medicine and see it after a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("skip-tour").click();
  await page.getByRole("button", { name: "Open Sidebar" }).click();
  await page.getByRole("button", { name: "Open caregiver portal" }).click();
  await page.getByLabel("Family code").fill("1234");
  await page.getByRole("button", { name: "Unlock caregiver portal" }).click();
  await expect(page.getByText("Local demo data", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Add medicine" }).click();
  await page.getByRole("textbox", { name: "Medicine name" }).last().fill("E2E Test Medicine");
  await page.getByRole("textbox", { name: "Dosage" }).last().fill("25mg");
  await page.getByRole("textbox", { name: "Scheduled time" }).last().fill("07:30 PM");
  await page.getByRole("button", { name: "Save medicine" }).click();
  await expect(page.getByText("E2E Test Medicine")).toBeVisible();

  await page.reload();
  await page.getByTestId("skip-tour").click();
  await page.getByRole("button", { name: "Open Sidebar" }).click();
  await page.getByRole("button", { name: "Open caregiver portal" }).click();
  await page.getByLabel("Family code").fill("1234");
  await page.getByRole("button", { name: "Unlock caregiver portal" }).click();
  await expect(page.getByText("E2E Test Medicine")).toBeVisible();
});

test("welcome screen has no automatically detectable WCAG A/AA violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
});
