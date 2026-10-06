import { expect, test } from '@playwright/test'

test.describe('GoogleDork app', () => {
  test('loads and displays dorks', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /GoogleDork/i })).toBeVisible()
    await expect(page.getByTestId('dork-card').first()).toBeVisible()
  })

  test('shows a tab per engine', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('engine-tab')).toHaveCount(11)
    await expect(page.getByRole('tab', { name: /Shodan/i })).toBeVisible()
  })

  test('switching engine tab updates the grid', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /Shodan/i }).click()
    await expect(page.getByText(/Dorks en Shodan/i)).toBeVisible()
    await expect(page.getByTestId('dork-card').first()).toBeVisible()
    await expect(page.getByTestId('dork-card').first().getByText('Shodan', { exact: true })).toBeVisible()
  })

  test('search filters dorks', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.getByLabel('Buscar dorks')
    await searchInput.fill('site:')
    await expect(page.getByTestId('dork-card').first()).toBeVisible()
    await expect(page.getByText(/Mostrando/)).toBeVisible()
  })

  test('search works within the selected engine', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /Shodan/i }).click()
    const searchInput = page.getByLabel('Buscar dorks')
    await searchInput.fill('mongodb')
    await expect(page.getByTestId('dork-card')).toHaveCount(1)
    await expect(page.getByText(/MongoDB/i).first()).toBeVisible()
  })

  test('category filter works', async ({ page }) => {
    await page.goto('/')
    const categoryButton = page.getByRole('button', { name: /Seguridad \/ Google Hacking/i })
    await categoryButton.click()
    await expect(page.getByTestId('dork-card').first()).toBeVisible()
  })

  test('copy button shows copied state', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
    const copyButton = page.getByRole('button', { name: /Copiar/i }).first()
    await copyButton.click()
    await expect(page.getByText('Copiado')).toBeVisible()
  })

  test('try button opens Google', async ({ page, context }) => {
    await page.goto('/')
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /Probar/i }).first().click(),
    ])
    await expect(newPage).toHaveURL(/google\.com/)
    await newPage.close()
  })

  test('try button of a Shodan dork opens shodan.io', async ({ page, context }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /Shodan/i }).click()
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /Probar en Shodan/i }).first().click(),
    ])
    await expect(newPage).toHaveURL(/shodan\.io/)
    await newPage.close()
  })

  test('theme toggle works', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: /modo/i })
    await toggle.click()
    await expect(page.locator('html[data-theme="dark"]')).toBeAttached()
  })
})
