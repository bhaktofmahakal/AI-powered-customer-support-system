import { test, expect } from '@playwright/test';

test.describe('Customer Support AI', () => {
  test.beforeEach(async ({ page }) => {
    // Port 3000 is the standard Next.js port
    await page.goto('/?testAuth=true');
  });

  test('should route to Order Agent and fetch status', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message...');
    await input.fill('Where is my order ORD-1002?');
    await page.keyboard.press('Enter');

    // Wait for assistant response and agent badge
    await expect(page.locator('text=Order Agent')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=ORD-1002')).toBeVisible();
    await expect(page.locator('text=shipped')).toBeVisible();
  });

  test('should handle general support queries via FAQ', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message...');
    await input.fill('What is your return policy?');
    await page.keyboard.press('Enter');

    // Wait for assistant response and agent badge
    await expect(page.locator('text=Support Agent')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=30 days')).toBeVisible();
    await expect(page.locator('text=Refunds')).toBeVisible();
  });
});
