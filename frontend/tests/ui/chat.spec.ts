import { test, expect } from "@playwright/test";

test("user can complete a residency flow", async ({ page }) => {
  await page.goto("/");

  // Wait for initial welcome messages
  await expect(page.getByText(/RDS Assistant for UC Riverside/i)).toBeVisible();

  // Age
  await page.getByPlaceholder(/Type your answer here…/i).fill("19");
  await page.keyboard.press("Enter");

  // Months
  await page.getByPlaceholder(/Type your answer here…/i).fill("14");
  await page.keyboard.press("Enter");

  // CA Driver License
  await page.getByPlaceholder(/Type your answer here…/i).fill("yes");
  await page.keyboard.press("Enter");

  // Vote
  await page.getByPlaceholder(/Type your answer here…/i).fill("yes");
  await page.keyboard.press("Enter");

  // Tax
  await page.getByPlaceholder(/Type your answer here…/i).fill("yes");
  await page.keyboard.press("Enter");

  // Independent
  await page.getByPlaceholder(/Type your answer here…/i).fill("no");
  await page.keyboard.press("Enter");

  // wauit for decision card
  await expect(page.getByText("Decision:", { exact: true })).toBeVisible();

  await expect(
    page.getByText(/California Resident|Nonresident|Needs Review/i)
  ).toBeVisible();

  // NEW: system explanation block
  await expect(page.getByText(/System Explanation:/i)).toBeVisible();

  // NEW: AI explanation block
  await expect(page.getByText(/AI Explanation:/i)).toBeVisible();
});
