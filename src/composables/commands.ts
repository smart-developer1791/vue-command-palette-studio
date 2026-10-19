import { computed, inject, ref, type InjectionKey, type Ref } from 'vue'
import type { Command, Settings } from '../domain/palette.ts'

export function createCommandRegistry(settings: Ref<Settings>, focus: () => void) {
  const notes = ref(''),
    dark = ref(false),
    recent = ref<string[]>([]),
    history = ref<{ id: number; title: string; time: string }[]>([])
  let sequence = 0
  const commands = computed(() => settings.value.commands)
  function execute(command: Command) {
    if (command.action === 'note')
      notes.value = [notes.value, command.text || command.title]
        .filter(Boolean)
        .join('\n')
        .slice(-6000)
    else if (command.action === 'theme') dark.value = !dark.value
    else if (command.action === 'clear') notes.value = ''
    else focus()
    recent.value = [command.id, ...recent.value.filter((id) => id !== command.id)].slice(0, 5)
    history.value.unshift({
      id: ++sequence,
      title: command.title,
      time: new Date().toLocaleTimeString('en-GB'),
    })
    history.value = history.value.slice(0, 20)
  }
  function reset() {
    notes.value = ''
    dark.value = false
    recent.value = []
    history.value = []
  }
  return { settings, commands, notes, dark, recent, history, execute, reset }
}
export type CommandRegistry = ReturnType<typeof createCommandRegistry>
export const commandKey: InjectionKey<CommandRegistry> = Symbol('command-palette-registry')
export function useCommands() {
  const registry = inject(commandKey)
  if (!registry) throw new Error('Command registry is missing.')
  return registry
}
