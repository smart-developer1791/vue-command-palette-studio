<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useCommands } from '../composables/commands'
import { searchCommands, shortcutLabel, type Command } from '../domain/palette'
import AppIcon from './AppIcon.vue'
const open = defineModel<boolean>({ required: true })
const { commands, settings, recent, execute } = useCommands()
const dialog = ref<HTMLDialogElement>(),
  input = ref<HTMLInputElement>(),
  query = ref(''),
  active = ref(0)
const results = computed(() => searchCommands(commands.value, query.value, recent.value))
watch(query, () => {
  active.value = 0
})
watch(results, () => {
  active.value = Math.min(active.value, Math.max(0, results.value.length - 1))
})
watch(open, async (value) => {
  if (value) {
    query.value = ''
    active.value = 0
    dialog.value?.showModal()
    await nextTick()
    input.value?.focus()
  } else dialog.value?.close()
})
async function run(command: Command) {
  open.value = false
  await nextTick()
  execute(command)
}
function syncClosedDialog() {
  // A queued native close event can arrive after the palette has opened again.
  if (!dialog.value?.open) open.value = false
}
function navigate(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (results.value.length)
      active.value =
        (active.value + (event.key === 'ArrowDown' ? 1 : results.value.length - 1)) %
        results.value.length
    document.getElementById(`palette-option-${active.value}`)?.scrollIntoView({ block: 'nearest' })
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const command = results.value[active.value]
    if (command) void run(command)
  }
}
</script>
<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      data-ui="command-dialog"
      class="w-[min(570px,_calc(100%_-_28px))] rounded-[15px] bg-[#fff] text-[#263149]"
      :data-accent="settings.accent"
      aria-labelledby="palette-title"
      @close="syncClosedDialog"
      @click="$event.target === $event.currentTarget && (open = false)"
    >
      <div
        class="command-search flex gap-3 items-center border-b [border-bottom-style:solid] border-b-[#e3e7f0] text-accent p-5.5 [@media(width<=700px)]:gap-2 [@media(width<=700px)]:py-4.5 [@media(width<=700px)]:px-3.5 [&_input]:border-0! [&_input]:bg-[transparent]! [&_input]:text-[#263149]! [&_input]:min-h-5! [&_input]:p-1! [&_input]:m-0! [&_input:focus]:[outline-offset:2px] [&_input:focus]:[outline-width:1px]"
      >
        <AppIcon name="search" :size="21" /><label class="sr-only" for="palette-query"
          >Search commands</label
        ><input
          id="palette-query"
          ref="input"
          v-model="query"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls="palette-results"
          :aria-activedescendant="results.length ? `palette-option-${active}` : undefined"
          placeholder="Type a command or a little idea…"
          @keydown="navigate"
        /><button
          class="font-[family-name:ui-monospace,_monospace] text-[length:9px] border border-solid border-[#dce1ed] rounded-[5px] whitespace-nowrap text-[#7d879c] bg-[#f7f9fd] py-[5px] px-[7px]"
          aria-label="Close palette"
          @click="open = false"
        >
          Esc
        </button>
      </div>
      <h2
        id="palette-title"
        class="font-[family-name:'DM_Sans_Variable'] text-[length:10px] tracking-[0.3px] text-[#7b8398] pt-4.5 pb-0 wrap-anywhere px-5.5"
      >
        {{ settings.title }}
      </h2>
      <ul
        id="palette-results"
        class="[list-style:none] h-83 overflow-auto p-3 m-0 [&_li]:flex [&_li]:items-center [&_li]:gap-3 [&_li]:rounded-[9px] [&_li]:cursor-pointer [&_li]:py-3.5 [&_li]:px-[11px] [@media(width<=700px)]:[&_li]:flex-wrap [&_li.active]:bg-accent [&_li.active]:text-[#fff] [&_li_>_span:nth-child(2)]:min-w-0 [@media(width<=700px)]:[&_li_>_span:nth-child(2)]:flex-1 [&_strong]:block [&_strong]:text-[length:12px] [&_strong]:font-[550] [&_strong]:wrap-anywhere [&_small]:block [&_small]:text-[length:9px] [&_small]:mt-[5px] [&_small]:opacity-65 [&_li.active_[data-ui~=command-glyph]]:border-[#ffffff33] [&_li.active_[data-ui~=command-glyph]]:bg-[#ffffff15] [&_li.active_[data-ui~=command-glyph]]:text-[white] [&_kbd]:ml-auto [&_kbd]:text-[length:8px] [@media(width<=700px)]:[&_kbd]:ml-11 [&_li.active_kbd]:border-[#ffffff30] [&_li.active_kbd]:text-[#fff] [&_li.active_kbd]:bg-[#ffffff18] [&_li[data-ui~=no-commands]]:cursor-default [&_li[data-ui~=no-commands]]:justify-center [&_li[data-ui~=no-commands]]:pt-15 [&_li[data-ui~=no-commands]]:text-[#7b8398] [&_li[data-ui~=no-commands]]:text-[length:12px]"
        role="listbox"
        aria-label="Matching commands"
      >
        <li
          v-for="(command, index) in results"
          :id="`palette-option-${index}`"
          :key="command.id"
          role="option"
          :aria-selected="index === active"
          :class="{ active: index === active }"
          @mousemove="active = index"
          @click="run(command)"
        >
          <span
            data-ui="command-glyph"
            class="grid place-items-center w-8 h-8 border border-solid border-[#dee3ef] rounded-[7px] bg-[#f8f9fd] text-[#8a96b0]"
            ><AppIcon
              :name="
                command.action === 'note'
                  ? 'plus'
                  : command.action === 'theme'
                    ? 'grid'
                    : command.action === 'clear'
                      ? 'reset'
                      : 'arrow'
              " /></span
          ><span
            ><strong>{{ command.title }}</strong
            ><small>{{ command.category }}</small></span
          ><kbd v-if="command.shortcut">{{ shortcutLabel(command.shortcut) }}</kbd>
        </li>
        <li v-if="!results.length" data-ui="no-commands" role="presentation">
          No commands found. Try a different word.
        </li>
      </ul>
      <footer
        class="flex justify-between gap-2.5 border-t [border-top-style:solid] border-t-[#e3e7f0] text-[#7b8398] text-[length:9px] py-[17px] px-5.5 [@media(width<=700px)]:text-[length:8px] [@media(width<=700px)]:py-[15px] [@media(width<=700px)]:px-3.5 [&_kbd]:mr-1.5 [@media(width<=700px)]:[&_>_span:last-child]:hidden"
      >
        <span><kbd>↑ ↓</kbd> to move <kbd>↵</kbd> to run</span
        ><span>{{ results.length }} commands</span>
      </footer>
    </dialog>
  </Teleport>
</template>
