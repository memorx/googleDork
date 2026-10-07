import { expect, test } from '@playwright/test'

test.describe('GoogleDork app', () => {
  test('loads and displays dorks', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /GoogleDork/i })).toBeVisible()
    await expect(page.getByTestId('dork-card').first()).toBeVisible()
  })

  test('shows a tab per engine', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('engine-tab')).toHaveCount(16)
    await expect(page.getByRole('tab', { name: /Shodan/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Netlas/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /SearXNG/i })).toBeVisible()
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

  test('hacker theme applies data-theme="hacker" and persists across reloads', async ({ page }) => {
    await page.goto('/')
    // claro → oscuro → hacker
    await page.getByRole('button', { name: /cambiar a modo oscuro/i }).click()
    await expect(page.locator('html[data-theme="dark"]')).toBeAttached()
    await page.getByRole('button', { name: /cambiar a modo hacker/i }).click()
    await expect(page.locator('html[data-theme="hacker"]')).toBeAttached()

    await page.reload()
    await expect(page.locator('html[data-theme="hacker"]')).toBeAttached()
    await expect(page.getByRole('button', { name: /cambiar a modo claro/i })).toBeVisible()
  })

  test('marks a favorite and sees it in the favorites view', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Agregar a favoritos' }).first().click()
    await page.getByRole('button', { name: /^Favoritos/ }).click()
    await expect(page.getByText(/Tus favoritos/)).toBeVisible()
    await expect(page.getByTestId('dork-card')).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Quitar de favoritos' })).toBeVisible()
  })

  test('dork builder generates a combined query', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Constructor de dorks' }).click()
    await page.getByLabel('Operador de la condición 1').selectOption('site:')
    await page.getByLabel('Valor de la condición 1').fill('example.com')
    await expect(page.getByTestId('builder-preview')).toHaveText('site:example.com')

    await page.getByRole('button', { name: 'Agregar condición' }).click()
    await page.getByLabel('Valor de la condición 2').fill('admin')
    await expect(page.getByTestId('builder-preview')).toHaveText('site:example.com admin')
  })

  test('pressing / focuses the search box', async ({ page }) => {
    await page.goto('/')
    // Esperar a que React monte y registre los atajos de teclado
    await expect(page.getByTestId('dork-card').first()).toBeVisible()
    await page.keyboard.press('/')
    await expect(page.getByLabel('Buscar dorks')).toBeFocused()
  })

  test('URL reflects the state with deep links', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /Shodan/i }).click()
    await expect(page).toHaveURL(/engine=shodan/)

    await page.goto('/?engine=shodan&q=mongodb')
    await expect(page.getByText(/Dorks en Shodan/i)).toBeVisible()
    await expect(page.getByLabel('Buscar dorks')).toHaveValue('mongodb')
  })

  test('shows the ethics notice', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('ethics-banner')).toBeVisible()
    await expect(page.getByText(/211 bis/)).toBeVisible()
  })

  test('recipes panel shows combined dorks with try buttons', async ({ page, context }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Recetas', exact: true }).click()
    await expect(page.getByTestId('recipe-card').first()).toBeVisible()
    await expect(page.getByText('Cámaras Axis abiertas en México')).toBeVisible()

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page
        .getByRole('button', {
          name: /Probar receta Cámaras Axis abiertas en México en Google/i,
        })
        .click(),
    ])
    await expect(newPage).toHaveURL(/google\.com/)
    await newPage.close()
  })
})
