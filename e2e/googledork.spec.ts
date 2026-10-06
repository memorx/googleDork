import { expect, test } from '@playwright/test'

test.describe('GoogleDork app', () => {
  test('loads and displays dorks', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'GoogleDork' })).toBeVisible()
    await expect(page.getByTestId('dork-card').first()).toBeVisible()
  })

  test('search filters dorks', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.getByLabel('Buscar dorks')
    await searchInput.fill('site:')
    await expect(page.getByTestId('dork-card').first()).toBeVisible()
    const countText = await page.locator('header >> text=/de \\d+ dorks/').textContent()
    expect(countText).not.toContain(`de ${0} dorks`)
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
      page.getByRole('button', { name: /Probar en Google/i }).first().click(),
    ])
    await expect(newPage).toHaveURL(/google\.com/)
    await newPage.close()
  })
})
