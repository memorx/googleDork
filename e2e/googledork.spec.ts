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

  test('command palette opens with Ctrl+K and closes with Escape', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('dork-card').first()).toBeVisible()

    await page.keyboard.press('Control+k')
    await expect(page.getByTestId('command-palette')).toBeVisible()

    await page.getByLabel('Buscar en la paleta de comandos').fill('shodan')
    await expect(page.getByRole('option').first()).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('command-palette')).toBeHidden()
  })

  test('recon panel generates queries for a domain and shows live data', async ({ page }) => {
    // Mock de las fuentes en vivo para no depender de la red en CI
    await page.route('**/crt.sh/**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([
          { name_value: 'www.example.com\nmail.example.com' },
          { name_value: 'www.example.com' },
        ]),
      }),
    )
    await page.route('**/dns.google/**', (route) => {
      const type = new URL(route.request().url()).searchParams.get('type')
      const data =
        type === 'A'
          ? '93.184.216.34'
          : type === 'MX'
            ? '10 mx.ejemplo.net'
            : type === 'TXT'
              ? 'v=spf1 include:_spf.ejemplo.net ~all'
              : 'ns1.ejemplo.net'
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          Status: 0,
          Answer: [{ name: 'example.com', type: 1, data }],
        }),
      })
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Recon de objetivo' }).click()
    await page.getByLabel('Dominio objetivo').fill('example.com')
    await page.getByRole('button', { name: 'Analizar' }).click()

    await expect(page.getByText('site:example.com filetype:pdf', { exact: true })).toBeVisible()
    await expect(page.getByText('hostname:example.com', { exact: true })).toBeVisible()
    await expect(page.getByText('"example.com" filename:.env', { exact: true })).toBeVisible()
    await expect(page.getByText('2 subdominios')).toBeVisible()
    const subdomainsSection = page.getByRole('region', { name: 'Subdominios encontrados' })
    await expect(subdomainsSection.getByText('mail.example.com', { exact: true })).toBeVisible()
    await expect(page.getByText('93.184.216.34', { exact: true }).first()).toBeVisible()
  })

  test('recon panel validates the domain input', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Recon de objetivo' }).click()
    await page.getByLabel('Dominio objetivo').fill('no es un dominio')
    await page.getByRole('button', { name: 'Analizar' }).click()
    await expect(page.getByRole('alert')).toContainText('dominio válido')
  })

  test('playbooks panel tracks progress with checkboxes', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Playbooks', exact: true }).click()
    await expect(page.getByTestId('playbook-card')).toHaveCount(4)

    const panel = page.getByTestId('playbooks-panel')
    await panel.getByText('Recon de dominio completo').click()
    await panel.getByRole('checkbox').first().check()
    await expect(panel.getByText('1/7')).toBeVisible()
  })

  test('resources panel lists curated OSINT links', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Recursos OSINT' }).click()
    await expect(page.getByTestId('resources-panel')).toBeVisible()
    expect(await page.getByTestId('resource-card').count()).toBeGreaterThanOrEqual(8)
    const ghdb = page.getByRole('link', { name: /Google Hacking Database/i })
    await expect(ghdb).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('workspace: create project, target and note with severity', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Workspace', exact: true }).click()
    await expect(page.getByTestId('workspace-panel')).toBeVisible()

    await page.getByLabel('Nombre del proyecto nuevo').fill('Auditoría ACME')
    await page.getByRole('button', { name: 'Crear proyecto' }).click()
    await expect(page.getByTestId('project-card')).toHaveCount(1)

    await page.getByLabel('Dominio del objetivo para Auditoría ACME').fill('example.com')
    await page.getByRole('button', { name: 'Agregar objetivo a Auditoría ACME' }).click()
    await expect(page.getByTestId('target-card')).toHaveCount(1)

    await page.getByRole('button', { name: 'Expandir objetivo example.com' }).click()
    await page.getByLabel('Texto de la nota para example.com').fill('Panel admin expuesto')
    await page.getByLabel('Severidad de la nota para example.com').selectOption('high')
    await page.getByRole('button', { name: 'Agregar nota a example.com' }).click()
    await expect(page.getByText('Panel admin expuesto')).toBeVisible()
    // El badge de severidad (span) refleja "Alta"
    await expect(page.locator('span').filter({ hasText: /^Alta$/ })).toBeVisible()

    // Persiste tras recargar
    await page.reload()
    await page.getByRole('button', { name: 'Workspace', exact: true }).click()
    await expect(page.getByTestId('target-card')).toHaveCount(1)
  })

  test('workspace: import subfinder output shows import count', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Workspace', exact: true }).click()
    await page.getByLabel('Nombre del proyecto nuevo').fill('P1')
    await page.getByRole('button', { name: 'Crear proyecto' }).click()
    await page.getByLabel('Dominio del objetivo para P1').fill('example.com')
    await page.getByRole('button', { name: 'Agregar objetivo a P1' }).click()
    await page.getByRole('button', { name: 'Expandir objetivo example.com' }).click()

    await page
      .getByLabel('Resultados de herramientas externas para example.com')
      .fill('www.example.com\napi.example.com\nwww.example.com\notro-dominio.org')
    await page.getByRole('button', { name: 'Importar hosts externos a example.com' }).click()

    await expect(page.getByRole('status')).toContainText('2 hosts importados, 1 ignorados')
    await expect(page.getByText('externo', { exact: true })).toHaveCount(2)
  })

  test('snapshot diff shows NUEVO badge on second save', async ({ page }) => {
    const crtPayload = (subs: string[]) =>
      JSON.stringify([{ name_value: subs.join('\n') }])
    await page.route('**/crt.sh/**', (route) =>
      route.fulfill({ contentType: 'application/json', body: crtPayload(['www.example.com']) }),
    )
    await page.route('**/dns.google/**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ Status: 0, Answer: [{ name: 'example.com', type: 1, data: '1.1.1.1' }] }),
      }),
    )

    await page.goto('/')
    await page.getByRole('button', { name: 'Workspace', exact: true }).click()
    await page.getByLabel('Nombre del proyecto nuevo').fill('P1')
    await page.getByRole('button', { name: 'Crear proyecto' }).click()
    await page.getByLabel('Dominio del objetivo para P1').fill('example.com')
    await page.getByRole('button', { name: 'Agregar objetivo a P1' }).click()
    await page.getByRole('button', { name: 'Abrir en Recon' }).click()

    // El panel se auto-analiza con el dominio precargado
    await expect(page.getByText('1 subdominios')).toBeVisible()
    await expect(page.getByText('1.1.1.1', { exact: true }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Guardar snapshot en workspace' }).click()
    await expect(page.getByText('Primer snapshot guardado')).toBeVisible()

    // Segundo escaneo con un subdominio nuevo
    await page.route('**/crt.sh/**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: crtPayload(['www.example.com', 'nuevo.example.com']),
      }),
    )
    await page.getByRole('button', { name: 'Analizar' }).click()
    await expect(page.getByText('2 subdominios')).toBeVisible()
    await page.getByRole('button', { name: 'Guardar snapshot en workspace' }).click()

    const diff = page.getByTestId('snapshot-diff')
    await expect(diff).toBeVisible()
    await expect(diff.getByText('NUEVO', { exact: true })).toBeVisible()
    await expect(diff).toContainText('nuevo.example.com')
  })

  // Mocks compartidos de las fuentes pasivas nuevas (CDX, permutaciones, urlscan)
  const mockPassiveSources = async (page: import('@playwright/test').Page) => {
    await page.route('**/crt.sh/**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([{ name_value: 'www.example.com' }]),
      }),
    )
    await page.route('**/dns.google/**', (route) => {
      const name = new URL(route.request().url()).searchParams.get('name')
      const answers =
        name === 'dev.example.com' ? [{ name, type: 1, data: '10.0.0.9' }] : []
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ Status: answers.length > 0 ? 0 : 3, Answer: answers }),
      })
    })
    await page.route('**/web.archive.org/cdx/**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([
          ['original'],
          ['http://example.com/index.php?page=1'],
          ['http://example.com/backup.sql'],
          ['http://example.com/.env'],
        ]),
      }),
    )
    await page.route('**/urlscan.io/api/**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          total: 1,
          results: [
            {
              page: { url: 'https://example.com/login', ip: '93.184.216.34', server: 'nginx' },
              task: { time: '2024-05-01T10:00:00.000Z' },
              result: 'https://urlscan.io/result/abc123/',
            },
          ],
        }),
      }),
    )
  }

  test('recon completo muestra wayback, permutaciones y urlscan', async ({ page }) => {
    await mockPassiveSources(page)

    await page.goto('/')
    await page.getByRole('button', { name: 'Recon de objetivo' }).click()
    await page.getByLabel('Dominio objetivo').fill('example.com')
    await page.getByRole('button', { name: 'Analizar' }).click()

    // Wayback: conteo y URLs con badge de sensible
    const waybackSection = page.getByRole('region', {
      name: 'URLs históricas de la Wayback Machine',
    })
    await expect(waybackSection.getByText('3 URLs', { exact: true })).toBeVisible()
    await expect(
      waybackSection.getByText('http://example.com/backup.sql', { exact: true }),
    ).toBeVisible()
    await expect(
      waybackSection.getByText('sensible', { exact: true }).first(),
    ).toBeVisible()

    // Permutaciones: solo dev.example.com resuelve
    const permSection = page.getByRole('region', { name: 'Permutaciones de subdominios' })
    await expect(permSection.getByText('1 activos', { exact: true })).toBeVisible()
    await expect(permSection.getByText('dev.example.com', { exact: true })).toBeVisible()
    await expect(permSection.getByText('activo', { exact: true })).toBeVisible()

    // urlscan: tarjeta con página, IP, servidor y link al resultado
    const urlscanSection = page.getByRole('region', { name: 'Escaneos de urlscan.io' })
    await expect(urlscanSection.getByText('1 escaneos', { exact: true })).toBeVisible()
    await expect(
      urlscanSection.getByText('https://example.com/login', { exact: true }),
    ).toBeVisible()
    await expect(
      urlscanSection.getByRole('link', { name: 'Ver resultado en urlscan.io' }),
    ).toHaveAttribute('href', 'https://urlscan.io/result/abc123/')
  })

  test('wayback filtra URLs por extensión con las pills', async ({ page }) => {
    await mockPassiveSources(page)

    await page.goto('/')
    await page.getByRole('button', { name: 'Recon de objetivo' }).click()
    await page.getByLabel('Dominio objetivo').fill('example.com')
    await page.getByRole('button', { name: 'Analizar' }).click()

    const waybackSection = page.getByRole('region', {
      name: 'URLs históricas de la Wayback Machine',
    })
    await expect(waybackSection.getByText('3 URLs', { exact: true })).toBeVisible()

    await waybackSection.getByRole('button', { name: '.env (1)', exact: true }).click()
    await expect(
      waybackSection.getByText('http://example.com/.env', { exact: true }),
    ).toBeVisible()
    await expect(
      waybackSection.getByText('http://example.com/backup.sql', { exact: true }),
    ).toBeHidden()
    await expect(
      waybackSection.getByText('http://example.com/index.php?page=1', { exact: true }),
    ).toBeHidden()

    // La pill "con parámetros" deja solo la URL con query string
    await waybackSection
      .getByRole('button', { name: 'con parámetros (1)', exact: true })
      .click()
    await expect(
      waybackSection.getByText('http://example.com/index.php?page=1', { exact: true }),
    ).toBeVisible()
    await expect(
      waybackSection.getByText('http://example.com/.env', { exact: true }),
    ).toBeHidden()
  })

  test('dorks de segunda generación aparecen con los subdominios encontrados', async ({
    page,
  }) => {
    await page.route('**/crt.sh/**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([{ name_value: 'api.example.com\ninternal.example.com' }]),
      }),
    )
    await page.route('**/dns.google/**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ Status: 3 }),
      }),
    )
    await page.route('**/web.archive.org/cdx/**', (route) =>
      route.fulfill({ contentType: 'application/json', body: '[]' }),
    )
    await page.route('**/urlscan.io/api/**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ total: 0, results: [] }),
      }),
    )

    await page.goto('/')
    await page.getByRole('button', { name: 'Recon de objetivo' }).click()
    await page.getByLabel('Dominio objetivo').fill('example.com')
    await page.getByRole('button', { name: 'Analizar' }).click()

    const gen2Section = page.getByRole('region', { name: 'Dorks de segunda generación' })
    await expect(gen2Section).toBeVisible()

    // El primer subdominio (orden alfabético) queda seleccionado por defecto
    const selector = gen2Section.getByLabel('Subdominio para dorks de segunda generación')
    await expect(selector).toHaveValue('api.example.com')
    await expect(
      gen2Section.getByText('site:api.example.com inurl:admin', { exact: true }),
    ).toBeVisible()
    await expect(
      gen2Section.getByText('site:api.example.com filetype:pdf', { exact: true }),
    ).toBeVisible()

    // Al cambiar de subdominio cambian las queries
    await selector.selectOption('internal.example.com')
    await expect(
      gen2Section.getByText('hostname:internal.example.com', { exact: true }),
    ).toBeVisible()
    await expect(
      gen2Section.getByText('"internal.example.com" filename:.env', { exact: true }),
    ).toBeVisible()
    await expect(
      gen2Section.getByText('site:api.example.com inurl:admin', { exact: true }),
    ).toBeHidden()
  })
})
