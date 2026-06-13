import { test, expect } from '@playwright/test'

test.describe('Job Tracker E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Job Tracker', { timeout: 10000 })
  })

  test('loads the application with sample data', async ({ page }) => {
    await expect(page.locator('text=Job Tracker')).toBeVisible()
  })

  test('shows dashboard stats', async ({ page }) => {
    await expect(page.locator('text=Total')).toBeVisible()
  })

  test('opens and closes add job modal', async ({ page }) => {
    await page.click('text=+ Add Job')
    await expect(page.locator('text=Basic Information')).toBeVisible()
    await page.click('text=Cancel')
    await expect(page.locator('text=Basic Information')).not.toBeVisible()
  })

  test('creates a new job', async ({ page }) => {
    await page.click('text=+ Add Job')
    await page.fill('input[placeholder="Acme Corp"]', 'TestCompany')
    await page.fill('input[placeholder="Software Engineer"]', 'TestRole')
    await page.click('text=Add Job')
    await expect(page.locator('text=TestCompany')).toBeVisible()
  })

  test('shows kanban columns', async ({ page }) => {
    await expect(page.locator('text=WISHLIST')).toBeVisible()
    await expect(page.locator('text=APPLIED')).toBeVisible()
    await expect(page.locator('text=INTERVIEW')).toBeVisible()
    await expect(page.locator('text=OFFER')).toBeVisible()
  })

  test('toggles dark mode', async ({ page }) => {
    const darkButton = page.locator('button:has-text("☀️"), button:has-text("🌙")')
    await darkButton.click()
    await page.waitForTimeout(300)
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    expect(isDark).toBe(true)
  })

  test('shows export button', async ({ page }) => {
    await expect(page.locator('button:has-text("Export")')).toBeVisible()
  })

  test('shows monthly goal section', async ({ page }) => {
    await expect(page.locator('text=Monthly Goal')).toBeVisible()
  })
})
