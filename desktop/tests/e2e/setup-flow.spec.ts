import { test, expect, type ElectronApplication, type Page } from '@playwright/test'
import { _electron as electron } from 'playwright'
import path from 'path'
import fs from 'fs'

let app: ElectronApplication
let page: Page

const MAIN_JS = path.join(__dirname, '../../out/main/index.js')

const MOCK_SERVICE_ACCOUNT = JSON.stringify({
  type: 'service_account',
  project_id: 'test-project-123',
  private_key_id: 'key123',
  private_key: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA2a2rwplBQLZ8LMzz\n-----END RSA PRIVATE KEY-----\n',
  client_email: 'test@test-project-123.iam.gserviceaccount.com',
  client_id: '123456789',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
})

function getSettingsDir(): string {
  const possibleDirs = [
    path.join(process.env.HOME || '', 'Library', 'Application Support', 'openloom', 'config'),
    path.join(process.env.HOME || '', 'Library', 'Application Support', 'Electron', 'config'),
  ]
  // Return whichever exists, or fallback to the Electron default
  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) return dir
  }
  return possibleDirs[1]
}

function clearSettings() {
  const dir = getSettingsDir()
  const file = path.join(dir, 'settings.json')
  if (fs.existsSync(file)) fs.unlinkSync(file)
}

// --- Setup Wizard Tests ---

test.describe('Setup Wizard', () => {
  test.beforeEach(async () => {
    clearSettings()
    app = await electron.launch({ args: [MAIN_JS] })
    page = await app.firstWindow()
    // Clear settings via the app's own IPC to handle encrypted files
    await page.evaluate(() => window.api.clearSettings())
    // Reload to pick up the cleared state
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
  })

  test.afterEach(async () => {
    await app.close()
  })

  test('appears on fresh launch', async () => {
    await expect(page.getByText('Welcome to OpenLoom')).toBeVisible()
    await expect(page.getByTestId('service-account-json')).toBeVisible()
  })

  test('connect button is disabled when fields are empty', async () => {
    await expect(page.getByTestId('connect-button')).toBeDisabled()
  })

  test('invalid JSON shows error', async () => {
    await page.getByTestId('service-account-json').fill('not valid json')
    await page.getByTestId('connect-button').click()

    await expect(page.getByTestId('error-message')).toContainText(
      'Invalid JSON',
    )
  })

  test('valid credentials with successful validation shows provisioning', async () => {
    // Mock the Firebase connection validation in the main process
    await app.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('validate-firebase')
      ipcMain.handle('validate-firebase', async () => ({
        ok: true,
        projectId: 'test-project-123',
      }))
    })

    await fillCredentials(page)
    await page.getByTestId('connect-button').click()

    // After connecting, provisioning screen should appear (isProvisioned is false)
    await expect(page.getByTestId('provisioning-screen')).toBeVisible()
  })

  test('failed validation shows connection error', async () => {
    // Wait for the wizard to be fully rendered
    await expect(page.getByTestId('service-account-json')).toBeVisible()

    // Mock validation failure
    await app.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('validate-firebase')
      ipcMain.handle('validate-firebase', async () => ({
        ok: false,
        error: 'Firebase connection failed: Invalid credentials',
      }))
    })

    await fillCredentials(page)
    await page.getByTestId('connect-button').click()

    await expect(page.getByTestId('error-message')).toBeVisible({ timeout: 15000 })
  })
})

// --- Provisioning Tests ---

test.describe('Provisioning', () => {
  test.beforeEach(async () => {
    clearSettings()
    app = await electron.launch({ args: [MAIN_JS] })
    page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    // Seed settings with isProvisioned: false
    await page.evaluate(
      (saJson) =>
        window.api.saveSettings({
          firebaseProjectId: 'test-project-123',
          serviceAccountJson: saJson,
          isProvisioned: false,
        }),
      MOCK_SERVICE_ACCOUNT,
    )
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
  })

  test.afterEach(async () => {
    await app.close()
  })

  test('provisioning screen appears when isProvisioned is false', async () => {
    await expect(page.getByTestId('provisioning-screen')).toBeVisible()
    await expect(page.getByTestId('step-firestore')).toBeVisible()
    await expect(page.getByTestId('step-storage')).toBeVisible()
  })
})

// --- Sidebar & Settings Tests (pre-seeded settings, bypass wizard) ---

test.describe('Sidebar & Settings', () => {
  test.beforeEach(async () => {
    clearSettings()
    app = await electron.launch({ args: [MAIN_JS] })
    page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    // Seed settings via the app's own IPC (handles encryption properly)
    // isProvisioned: true to skip provisioning and go straight to Layout
    await page.evaluate(
      (saJson) =>
        window.api.saveSettings({
          firebaseProjectId: 'test-project-123',
          serviceAccountJson: saJson,
          isProvisioned: true,
        }),
      MOCK_SERVICE_ACCOUNT,
    )
    // Reload so the app picks up the seeded settings
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
  })

  test.afterEach(async () => {
    await app.close()
  })

  test('sidebar appears when settings exist', async () => {
    await expect(page.getByTestId('sidebar')).toBeVisible()
    await expect(page.getByTestId('tab-library')).toBeVisible()
    await expect(page.getByTestId('tab-record')).toBeVisible()
    await expect(page.getByTestId('tab-settings')).toBeVisible()
  })

  test('navigation switches views', async () => {
    await expect(page.getByTestId('library-view')).toBeVisible()

    await page.getByTestId('tab-record').click()
    await expect(page.getByTestId('recording-view')).toBeVisible()

    await page.getByTestId('tab-settings').click()
    await expect(page.getByTestId('settings-view')).toBeVisible()

    await page.getByTestId('tab-library').click()
    await expect(page.getByTestId('library-view')).toBeVisible()
  })

  test('settings shows connection info', async () => {
    await page.getByTestId('tab-settings').click()

    await expect(page.getByTestId('settings-project-id')).toContainText(
      'test-project-123',
    )
  })

  test('settings shows re-provision button', async () => {
    await page.getByTestId('tab-settings').click()
    await expect(page.getByTestId('reprovision-button')).toBeVisible()
  })

  test('disconnect returns to setup wizard', async () => {
    await page.getByTestId('tab-settings').click()
    await page.getByTestId('disconnect-button').click()

    await expect(page.getByText('Welcome to OpenLoom')).toBeVisible()
  })
})

async function fillCredentials(page: Page) {
  await page.getByTestId('service-account-json').fill(MOCK_SERVICE_ACCOUNT)
}
