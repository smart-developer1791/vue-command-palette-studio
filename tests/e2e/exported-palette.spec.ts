import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { build, preview } from 'vite'
import vue from '@vitejs/plugin-vue'

test('downloaded SFC runs independently and removes its directive listeners on unmount', async ({
  page,
}) => {
  test.setTimeout(60000)
  const root = path.resolve('artifacts/exported-palette')
  await fs.mkdir(root, { recursive: true })
  await page.goto('/')
  await page.getByLabel('Palette title', { exact: true }).fill('A <safe> little command palette')
  await page.getByRole('button', { name: 'Get the component' }).click()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download .vue' }).click()
  await fs.writeFile(
    path.join(root, 'Palette.vue'),
    await fs.readFile((await (await downloadEvent).path())!, 'utf8'),
  )
  await fs.writeFile(
    path.join(root, 'main.ts'),
    `import {createApp} from 'vue'; import Palette from './Palette.vue'; const app=createApp(Palette); app.mount('#app'); document.getElementById('unmount')!.onclick=()=>app.unmount()`,
  )
  await fs.writeFile(
    path.join(root, 'index.html'),
    '<!doctype html><html lang="en"><head><title>Standalone palette test</title></head><body><button id="unmount">Unmount palette</button><div id="app"></div><script type="module" src="./main.ts"></script></body></html>',
  )
  await build({
    configFile: false,
    root,
    base: './',
    plugins: [vue()],
    logLevel: 'error',
    build: { outDir: 'dist' },
  })
  const server = await preview({
    configFile: false,
    root,
    build: { outDir: 'dist' },
    preview: { host: '127.0.0.1', port: 5198, strictPort: true },
  })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    const listeners = new Set<EventListenerOrEventListenerObject>()
    const add = window.addEventListener.bind(window),
      remove = window.removeEventListener.bind(window)
    Object.assign(window, { __keyListeners: listeners })
    window.addEventListener = ((
      type: string,
      callback: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) => {
      if (type === 'keydown') listeners.add(callback)
      add(type, callback, options)
    }) as typeof window.addEventListener
    window.removeEventListener = ((
      type: string,
      callback: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ) => {
      if (type === 'keydown') listeners.delete(callback)
      remove(type, callback, options)
    }) as typeof window.removeEventListener
  })
  try {
    await page.goto('http://127.0.0.1:5198/')
    await page.keyboard.press('Control+k')
    await expect(
      page.getByRole('heading', { name: 'A <safe> little command palette' }),
    ).toBeVisible()
    await page.getByRole('combobox', { name: 'Search commands' }).fill('new idea')
    await page.keyboard.press('Enter')
    await expect(page.getByLabel('Scratchpad')).toHaveValue('A little idea worth keeping.')
    await page.getByRole('button', { name: 'Open command palette', exact: false }).focus()
    await page.keyboard.press('Alt+t')
    await expect(page.locator('.palette-workspace')).toHaveClass(/dark/)
    await page.keyboard.press('Alt+f')
    await expect(page.getByLabel('Scratchpad')).toBeFocused()
    await page.keyboard.press('Alt+n')
    await expect(page.getByLabel('Scratchpad')).toHaveValue('A little idea worth keeping.')
    await page.keyboard.press('Control+k')
    await page.keyboard.press('Escape')
    expect(
      await page.evaluate(
        () => (window as unknown as { __keyListeners: Set<unknown> }).__keyListeners.size,
      ),
    ).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Unmount palette' }).click()
    expect(
      await page.evaluate(
        () => (window as unknown as { __keyListeners: Set<unknown> }).__keyListeners.size,
      ),
    ).toBe(0)
    expect(errors).toEqual([])
  } finally {
    await new Promise<void>((resolve) => server.httpServer.close(() => resolve()))
  }
})
