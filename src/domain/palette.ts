export type Action = 'note' | 'theme' | 'focus' | 'clear'
export interface Command {
  id: string
  title: string
  category: string
  keywords: string
  shortcut: string
  action: Action
  text: string
}
export interface Settings {
  format: 'CP/1'
  title: string
  launcher: string
  accent: 'blue' | 'violet' | 'green'
  commands: Command[]
}
export const actions = [
  { id: 'note', label: 'Add a note' },
  { id: 'theme', label: 'Toggle preview theme' },
  { id: 'focus', label: 'Focus the scratchpad' },
  { id: 'clear', label: 'Clear the scratchpad' },
] as const
export const sample: Settings = {
  format: 'CP/1',
  title: 'What would you like to do?',
  launcher: 'mod+k',
  accent: 'blue',
  commands: [
    {
      id: 'capture',
      title: 'Capture a good idea',
      category: 'Create',
      keywords: 'new write note idea',
      shortcut: 'alt+n',
      action: 'note',
      text: 'A little idea worth keeping.',
    },
    {
      id: 'theme',
      title: 'Change the scenery',
      category: 'Workspace',
      keywords: 'dark light appearance theme',
      shortcut: 'alt+t',
      action: 'theme',
      text: '',
    },
    {
      id: 'focus',
      title: 'Find your focus',
      category: 'Workspace',
      keywords: 'editor scratchpad writing focus',
      shortcut: 'alt+f',
      action: 'focus',
      text: '',
    },
    {
      id: 'clear',
      title: 'Make a fresh start',
      category: 'Workspace',
      keywords: 'clear reset erase',
      shortcut: 'alt+c',
      action: 'clear',
      text: '',
    },
    {
      id: 'reminder',
      title: 'Leave a kind reminder',
      category: 'Create',
      keywords: 'note kindness reminder',
      shortcut: '',
      action: 'note',
      text: 'Make a little room for something good.',
    },
  ],
}
export function normalizeShortcut(value: string) {
  return value.trim().toLowerCase().replace(/\s/g, '')
}
export function validShortcut(value: string) {
  const shortcut = normalizeShortcut(value)
  if (!shortcut) return true
  return (
    /^alt\+(shift\+)?[a-z0-9]$/.test(shortcut) ||
    /^mod\+shift\+[a-z0-9]$/.test(shortcut) ||
    shortcut === 'mod+k'
  )
}
export function shortcutLabel(value: string) {
  return normalizeShortcut(value)
    .split('+')
    .map((part) =>
      part === 'mod'
        ? '⌘ / Ctrl'
        : part === 'alt'
          ? 'Alt'
          : part === 'shift'
            ? '⇧'
            : part.toUpperCase(),
    )
    .join(' + ')
}
export function matchesShortcut(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>,
  value: string,
) {
  const parts = normalizeShortcut(value).split('+')
  if (!value || !validShortcut(value)) return false
  const mod = parts.includes('mod')
  return (
    event.key.toLowerCase() === parts.at(-1) &&
    (event.ctrlKey || event.metaKey) === mod &&
    event.altKey === parts.includes('alt') &&
    event.shiftKey === parts.includes('shift')
  )
}
export function parseSettings(input: unknown): Settings {
  if (!input || typeof input !== 'object') throw new Error('Expected a palette object.')
  const v = input as Record<string, unknown>
  if (v.format !== 'CP/1') throw new Error('Expected CP/1 settings.')
  const text = (value: unknown, label: string, max: number, required = false) => {
    if (typeof value !== 'string' || value.length > max || (required && !value.trim()))
      throw new Error(`${label} must be ${required ? '1–' : 'at most '}${max} characters.`)
    return value
  }
  const title = text(v.title, 'Palette title', 80, true)
  const launcher = normalizeShortcut(text(v.launcher, 'Launcher shortcut', 30, true))
  if (!validShortcut(launcher))
    throw new Error('Use Mod+K, Alt+letter or Mod+Shift+letter shortcuts.')
  if (!['blue', 'violet', 'green'].includes(v.accent as string)) throw new Error('Unknown accent.')
  if (!Array.isArray(v.commands) || v.commands.length < 1 || v.commands.length > 20)
    throw new Error('A palette needs 1–20 commands.')
  const identities = new Set<string>(),
    shortcuts = new Set([launcher])
  const commands = v.commands.map((input) => {
    if (!input || typeof input !== 'object') throw new Error('Invalid command.')
    const c = input as Record<string, unknown>
    const id = text(c.id, 'Command identity', 40, true)
    if (!/^[a-z][a-z0-9-]*$/.test(id) || identities.has(id))
      throw new Error('Command identities must be safe and unique.')
    identities.add(id)
    const shortcut = normalizeShortcut(text(c.shortcut, 'Shortcut', 30))
    if (!validShortcut(shortcut))
      throw new Error('Use Mod+K, Alt+letter or Mod+Shift+letter shortcuts.')
    if (shortcut && shortcuts.has(shortcut))
      throw new Error('Every shortcut must be unique, including the launcher.')
    if (shortcut) shortcuts.add(shortcut)
    if (!actions.some((action) => action.id === c.action))
      throw new Error('Unknown command action.')
    return {
      id,
      title: text(c.title, 'Command title', 80, true),
      category: text(c.category, 'Category', 30, true),
      keywords: text(c.keywords, 'Keywords', 180),
      shortcut,
      action: c.action as Action,
      text: text(c.text, 'Note text', 300),
    }
  })
  return { format: 'CP/1', title, launcher, accent: v.accent as Settings['accent'], commands }
}
export function searchCommands(commands: Command[], query: string, recent: string[] = []) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const score = (command: Command) =>
    words.reduce(
      (total, word) =>
        total +
        (command.title.toLowerCase().startsWith(word)
          ? 4
          : command.title.toLowerCase().includes(word)
            ? 2
            : 1),
      0,
    )
  return commands
    .filter((command) =>
      words.every((word) =>
        `${command.title} ${command.category} ${command.keywords}`.toLowerCase().includes(word),
      ),
    )
    .sort((a, b) =>
      words.length
        ? score(b) - score(a)
        : (recent.indexOf(a.id) < 0 ? 99 : recent.indexOf(a.id)) -
          (recent.indexOf(b.id) < 0 ? 99 : recent.indexOf(b.id)),
    )
}
