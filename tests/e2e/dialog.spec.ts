import { test, expect } from '@playwright/test'

test('a queued close event preserves a reopened dialog and Escape restores focus', async ({
  page,
}) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Import / export', exact: true })
  await trigger.click()
  const dialog = page.locator('dialog[open]')
  await expect(dialog).toBeVisible()
  await trigger.evaluate(async (element) => {
    const dialog = document.querySelector<HTMLDialogElement>('dialog[open]')!
    dialog.querySelector<HTMLButtonElement>('button[aria-label="Close dialog"]')!.click()
    await Promise.resolve()
    await Promise.resolve()
    if (dialog.open) throw new Error('The close button did not close the dialog')
    ;(element as HTMLButtonElement).click()
    await Promise.resolve()
    await Promise.resolve()
    if (!dialog.open) throw new Error('The trigger did not reopen the dialog')
  })
  await page.waitForTimeout(100)
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(dialog).toBeVisible()
})
