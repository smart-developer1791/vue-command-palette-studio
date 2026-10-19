import { parseSettings, type Settings } from './palette.ts'
import { stamp } from '../services/files.ts'

export function componentSource(input: Settings) {
  const settings = parseSettings(input)
  const json = JSON.stringify(settings, null, 2).replace(/</g, '\\u003c')
  const color = { blue: '#315be8', violet: '#7a45c5', green: '#278568' }[settings.accent]
  return `<!-- Command Palette Studio · ${stamp('CP', settings)} · CodeSculptor -->
<script setup lang="ts">
import { computed, nextTick, ref, watch, type Directive } from 'vue'
const configuration = ${json}
type Command = typeof configuration.commands[number]
type Binding = { shortcut: string; handler: () => void; allowInInputs?: boolean }
const registrations = new WeakMap<HTMLElement, { binding: Binding; listener: (event: KeyboardEvent) => void }>()
const vHotkey: Directive<HTMLElement, Binding> = {
  mounted(element, { value }) {
    const entry = { binding: value, listener: (_event: KeyboardEvent) => {} }
    entry.listener = (event) => {
      if (event.defaultPrevented || event.repeat || event.isComposing || !entry.binding.shortcut) return
      if (!entry.binding.allowInInputs && event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable="true"]')) return
      const parts = entry.binding.shortcut.split('+')
      if (event.key.toLowerCase() !== parts.at(-1) || (event.ctrlKey || event.metaKey) !== parts.includes('mod') || event.altKey !== parts.includes('alt') || event.shiftKey !== parts.includes('shift')) return
      event.preventDefault()
      entry.binding.handler()
    }
    registrations.set(element, entry)
    window.addEventListener('keydown', entry.listener)
  },
  updated(element, { value }) { const entry = registrations.get(element); if (entry) entry.binding = value },
  unmounted(element) { const entry = registrations.get(element); if (entry) window.removeEventListener('keydown', entry.listener); registrations.delete(element) },
}
const dialog = ref<HTMLDialogElement>(), search = ref<HTMLInputElement>(), pad = ref<HTMLTextAreaElement>()
const open = ref(false), query = ref(''), active = ref(0), notes = ref(''), dark = ref(false), recent = ref<string[]>([])
const results = computed(() => {
  const words = query.value.toLowerCase().trim().split(/\\s+/).filter(Boolean)
  const score = (command: Command) => words.reduce((sum, word) => sum + (command.title.toLowerCase().startsWith(word) ? 4 : command.title.toLowerCase().includes(word) ? 2 : 1), 0)
  return configuration.commands.filter((command) => words.every((word) => (command.title + ' ' + command.category + ' ' + command.keywords).toLowerCase().includes(word))).sort((a,b) => words.length ? score(b)-score(a) : (recent.value.indexOf(a.id) < 0 ? 99 : recent.value.indexOf(a.id)) - (recent.value.indexOf(b.id) < 0 ? 99 : recent.value.indexOf(b.id)))
})
watch(query, () => { active.value = 0 })
watch(open, async (value) => {
  if (value) { query.value = ''; active.value = 0; dialog.value?.showModal(); await nextTick(); search.value?.focus() }
  else dialog.value?.close()
})
async function execute(command: Command) {
  open.value = false
  await nextTick()
  if (command.action === 'note') notes.value = [notes.value, command.text || command.title].filter(Boolean).join('\\n').slice(-6000)
  else if (command.action === 'theme') dark.value = !dark.value
  else if (command.action === 'clear') notes.value = ''
  else pad.value?.focus()
  recent.value = [command.id, ...recent.value.filter((id) => id !== command.id)].slice(0,5)
}
function navigate(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (results.value.length) active.value = (active.value + (event.key === 'ArrowDown' ? 1 : results.value.length - 1)) % results.value.length
    document.getElementById('export-command-' + active.value)?.scrollIntoView({ block: 'nearest' })
  } else if (event.key === 'Enter') { event.preventDefault(); const command = results.value[active.value]; if (command) void execute(command) }
}
</script>
<template>
  <section class="palette-workspace" :class="{ dark }">
    <button v-hotkey="{ shortcut: configuration.launcher, handler: () => { open = !open }, allowInInputs: true }" class="launcher" @click="open = true">Open command palette <kbd>{{ configuration.launcher }}</kbd></button>
    <button v-for="command in configuration.commands" :key="command.id" v-hotkey="{ shortcut: command.shortcut, handler: () => { if (!open) void execute(command) } }" class="shortcut-registration" tabindex="-1" aria-hidden="true" />
    <label>Scratchpad<textarea ref="pad" v-model="notes" maxlength="6000" rows="6" placeholder="Your ideas live here…" /></label>
    <Teleport to="body"><dialog ref="dialog" class="exported-palette" aria-labelledby="export-title" @close="open = false" @click="$event.target === $event.currentTarget && (open = false)">
      <div class="search-row"><label class="visually-hidden" for="export-search">Search commands</label><input id="export-search" ref="search" v-model="query" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls="export-results" :aria-activedescendant="results.length ? 'export-command-' + active : undefined" placeholder="Search commands…" @keydown="navigate" /><button aria-label="Close palette" @click="open = false">Esc</button></div>
      <h2 id="export-title">{{ configuration.title }}</h2>
      <ul id="export-results" role="listbox" aria-label="Matching commands"><li v-for="(command,index) in results" :id="'export-command-' + index" :key="command.id" role="option" :aria-selected="index === active" :class="{ active: index === active }" @mousemove="active = index" @click="execute(command)"><span>{{ command.title }}<small>{{ command.category }}</small></span><kbd>{{ command.shortcut }}</kbd></li><li v-if="!results.length" role="presentation">No commands found.</li></ul>
      <footer>↑ ↓ to move · Enter to run · Escape to close</footer>
    </dialog></Teleport>
  </section>
</template>
<style scoped>
.palette-workspace { font-family: system-ui,sans-serif; background: #f6f7fb; color: #222735; border: 1px solid #dde1eb; border-radius: 16px; padding: 24px; max-width: 640px; }
.palette-workspace.dark { background: #202635; color: #fff; }
.palette-workspace button { cursor: pointer; font: inherit; }
.launcher { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; padding: 14px; background: white; color: #222735; border: 1px solid #dde1eb; border-radius: 9px; }
.palette-workspace label { display: block; margin-top: 22px; font-size: 13px; }
.palette-workspace textarea { display: block; box-sizing: border-box; width: 100%; margin-top: 10px; font: inherit; resize: vertical; padding: 12px; background: transparent; color: inherit; border: 1px solid #929cb0; border-radius: 9px; }
.shortcut-registration { display: none; }
.exported-palette { font-family: system-ui,sans-serif; border: 1px solid #dde1eb; border-radius: 16px; padding: 0; width: min(560px,calc(100% - 28px)); max-height: calc(100dvh - 40px); background: #fff; color: #222735; margin: auto; box-shadow: 0 30px 100px #0004; }
.exported-palette::backdrop { background: #17234080; }
.search-row { display: flex; gap: 12px; padding: 20px; border-bottom: 1px solid #dde1eb; }
.search-row input { font: inherit; width: 100%; min-width: 0; border: 0; background: transparent; color: inherit; }
.search-row button { border: 1px solid #dde1eb; border-radius: 5px; background: #f6f7fb; color: inherit; cursor: pointer; }
.exported-palette h2 { font-size: 12px; padding: 16px 20px 0; color: #6e778a; overflow-wrap: anywhere; }
.exported-palette ul { list-style: none; margin: 0; padding: 12px; height: 310px; box-sizing: border-box; overflow: auto; }
.exported-palette li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 12px; border-radius: 8px; cursor: pointer; }
.exported-palette li.active { background: ${color}; color: white; }
.exported-palette small { display: block; font-size: 11px; margin-top: 5px; opacity: .7; }
.exported-palette kbd { font: 10px ui-monospace,monospace; white-space: nowrap; }
.exported-palette footer { padding: 14px 20px; font-size: 11px; color: #6e778a; border-top: 1px solid #dde1eb; }
.exported-palette input:focus-visible { outline: 2px solid ${color}; outline-offset: 5px; border-radius: 3px; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@media (max-width: 400px) { .exported-palette li { flex-wrap: wrap; } }
</style>
`
}
