import { test, expect } from '@playwright/test';

test('user can complete a residency flow', async ({ page }) => {
  await page.goto('/');

  // 初始欢迎内容
  await expect(
    page.getByText(/RDS Assistant for UC Riverside/i)
  ).toBeVisible();

  // 输入年龄
  await page.getByPlaceholder(/Type your answer here…/i).fill('19');
  await page.keyboard.press('Enter');

  // 输入 months
  await page.getByPlaceholder(/Type your answer here…/i).fill('14');
  await page.keyboard.press('Enter');

  // CA Driver License
  await page.getByPlaceholder(/Type your answer here…/i).fill('yes');
  await page.keyboard.press('Enter');

  // Vote
  await page.getByPlaceholder(/Type your answer here…/i).fill('yes');
  await page.keyboard.press('Enter');

  // Tax
  await page.getByPlaceholder(/Type your answer here…/i).fill('yes');
  await page.keyboard.press('Enter');

  // Independent
  await page.getByPlaceholder(/Type your answer here…/i).fill('no');
  await page.keyboard.press('Enter');

  // 等待结果卡片出现
  await expect(
    page.getByText(/Decision:/i)
  ).toBeVisible();

  await expect(
    page.getByText(/California Resident|Nonresident|Needs Review/i)
  ).toBeVisible();
});
