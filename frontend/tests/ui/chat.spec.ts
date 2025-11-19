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

  // The /api/decide request is triggered by the final Enter.
  const responsePromise = page.waitForResponse((resp) =>
    resp.url().includes("/api/decision") && resp.status() === 200
  );

  // Submit final answer
  await page.keyboard.press("Enter");

  // wait for decision card
  await responsePromise;

  // Check that decision card is displayed
  await expect(page.getByText("Decision:", { exact: true })).toBeVisible();

  const decisionStatus = page.locator(".decision-status");
  await expect(decisionStatus).toBeVisible();
  await expect(decisionStatus).toHaveText(
    /California Resident|Nonresident|Needs Review/i
  );

  // NEW: system explanation block
  await expect(page.getByText(/System Explanation:/i)).toBeVisible();

  // NEW: AI explanation block
  await expect(page.getByText(/AI Explanation:/i)).toBeVisible();
});
