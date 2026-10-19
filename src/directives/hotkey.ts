import type { Directive } from 'vue'
import { matchesShortcut } from '../domain/palette.ts'
export interface HotkeyBinding {
  shortcut: string
  handler: () => void
  enabled?: boolean
  allowInInputs?: boolean
}
export function createHotkeyHandler(getBinding: () => HotkeyBinding) {
  return (event: KeyboardEvent) => {
    const binding = getBinding()
    if (binding.enabled === false || event.defaultPrevented || event.repeat || event.isComposing)
      return
    const target = event.target
    if (
      !binding.allowInInputs &&
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        !!target.closest('input, textarea, select, [contenteditable="true"]'))
    )
      return
    if (!matchesShortcut(event, binding.shortcut)) return
    event.preventDefault()
    binding.handler()
  }
}
const registrations = new WeakMap<
  HTMLElement,
  { binding: HotkeyBinding; listener: (event: KeyboardEvent) => void }
>()
export const vHotkey: Directive<HTMLElement, HotkeyBinding> = {
  mounted(element, { value }) {
    const registration = { binding: value, listener: (_event: KeyboardEvent) => {} }
    registration.listener = createHotkeyHandler(() => registration.binding)
    registrations.set(element, registration)
    window.addEventListener('keydown', registration.listener)
  },
  updated(element, { value }) {
    const registration = registrations.get(element)
    if (registration) registration.binding = value
  },
  unmounted(element) {
    const registration = registrations.get(element)
    if (registration) window.removeEventListener('keydown', registration.listener)
    registrations.delete(element)
  },
}
