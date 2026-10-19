import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import { parseSettings } from '../../src/domain/palette.ts'
import { stamp } from '../../src/services/files.ts'

test('palette searches keywords and executes keyboard-selected actions', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('combobox', { name: 'Search commands' }).fill('new idea')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('textbox', { name: 'THE SCRATCHPAD', exact: true })).toHaveValue(
    'A little idea worth keeping.',
  )
  await page.keyboard.press('Control+k')
  await page.getByRole('combobox', { name: 'Search commands' }).fill('dark')
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-ui~="workspace"]')).toHaveClass(/dark/)
  await page.keyboard.press('Control+k')
  await page.getByRole('combobox', { name: 'Search commands' }).fill('zzzzzz')
  await expect(page.getByText('No commands found. Try a different word.')).toBeVisible()
  await page.keyboard.press('Escape')
})
test('direct shortcuts stay quiet while typing and focus actions reach the scratchpad', async ({
  page,
}) => {
  await page.goto('/')
  await page.locator('h1').click()
  await page.keyboard.press('Alt+n')
  await expect(page.getByRole('textbox', { name: 'THE SCRATCHPAD', exact: true })).toHaveValue(
    'A little idea worth keeping.',
  )
  await page.getByRole('textbox', { name: 'THE SCRATCHPAD', exact: true }).focus()
  await page.keyboard.press('Alt+n')
  await expect(page.getByRole('textbox', { name: 'THE SCRATCHPAD', exact: true })).toHaveValue(
    'A little idea worth keeping.',
  )
  await page.locator('h1').click()
  await page.keyboard.press('Alt+f')
  await expect(page.getByRole('textbox', { name: 'THE SCRATCHPAD', exact: true })).toBeFocused()
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('combobox', { name: 'Search commands' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('dialog').getByRole('option').nth(1)).toHaveAttribute(
    'aria-selected',
    'true',
  )
})
test('command edits persist and invalid data preserves the existing palette', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Command title').fill('Write a small poem')
  await page.getByLabel('Note text').fill('A quiet little line.')
  await page.reload()
  await expect(page.getByLabel('Command title')).toHaveValue('Write a small poem')
  await page.getByRole('button', { name: 'Try action' }).click()
  await expect(page.getByRole('textbox', { name: 'THE SCRATCHPAD', exact: true })).toHaveValue(
    'A quiet little line.',
  )
  await page.getByLabel('Keyboard shortcut', { exact: true }).fill('mod+k')
  await expect(page.getByRole('status')).toContainText('unique')
  await expect(page.locator('[data-ui~="palette-launcher"]')).toBeDisabled()
  await page.getByLabel('Keyboard shortcut', { exact: true }).fill(' ALT + N ')
  await page.getByRole('button', { name: 'Import / export' }).click()
  const event = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download settings' }).click()
  const config = JSON.parse(await fs.readFile((await (await event).path())!, 'utf8'))
  expect(config.provenance.marker).toMatch(/^CP-[A-F0-9]{8}$/)
  expect(config.provenance.marker).toBe(stamp('CP', parseSettings(config)))
  await expect(page.locator('[data-ui~="preview-panel"] [data-ui~="canvas-footer"]')).toContainText(
    config.provenance.marker,
  )
  await page.getByLabel('Palette JSON').fill(JSON.stringify({ ...config, commands: [] }))
  await page.getByRole('button', { name: 'Import palette' }).click()
  await expect(page.getByRole('alert')).toContainText('1–20')
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await expect(page.getByLabel('Command title')).toHaveValue('Write a small poem')
})
test('mobile palette stays accessible and editor selections do not move the footer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const before = await page
    .locator('[data-ui~="page-footer"]')
    .evaluate((element) => element.getBoundingClientRect().top + scrollY)
  await page
    .locator('[data-ui~="library-list"]')
    .getByRole('button', { name: /Change the scenery/ })
    .click()
  expect(
    await page
      .locator('[data-ui~="page-footer"]')
      .evaluate((element) => element.getBoundingClientRect().top + scrollY),
  ).toBe(before)
  await page.locator('[data-ui~="palette-launcher"]').click()
  await expect(page.getByRole('combobox', { name: 'Search commands' })).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-ui~="palette-launcher"]')).toBeFocused()
})

test('a queued close event preserves a reopened palette', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-ui~="palette-launcher"]').click()
  await expect(page.getByRole('combobox', { name: 'Search commands' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-ui~="command-dialog"]')).not.toBeVisible()
  await page.locator('[data-ui~="palette-launcher"]').click()
  await expect(page.getByRole('combobox', { name: 'Search commands' })).toBeFocused()
  // Native close events are queued; an earlier event may arrive after showModal().
  await page.locator('[data-ui~="command-dialog"]').dispatchEvent('close')
  await expect(page.locator('[data-ui~="command-dialog"]')).toBeVisible()
  await page.getByRole('combobox', { name: 'Search commands' }).fill('dark')
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-ui~="workspace"]')).toHaveClass(/dark/)
  await expect(page.locator('[data-ui~="command-dialog"]')).not.toBeVisible()
})
