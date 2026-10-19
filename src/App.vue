<script setup lang="ts">
import { computed, nextTick, provide, ref, watch } from 'vue'
import AppIcon from './components/AppIcon.vue'
import AppDialog from './components/AppDialog.vue'
import CommandPalette from './components/CommandPalette.vue'
import { actions, parseSettings, sample, shortcutLabel, type Command } from './domain/palette'
import { componentSource } from './domain/export'
import { createCommandRegistry, commandKey } from './composables/commands'
import { vHotkey } from './directives/hotkey'
import { useDraft } from './services/draft'
import { clone, download, stamp } from './services/files'
const { draft, storageStatus } = useDraft('command-palette:CP1', clone(sample), parseSettings)
const scratchpad = ref<HTMLTextAreaElement>()
const registry = createCommandRegistry(draft, () => scratchpad.value?.focus())
provide(commandKey, registry)
const { notes, dark, history, execute, reset } = registry
const open = ref(false),
  selected = ref(draft.value.commands[0]!.id)
const command = computed(
  () => draft.value.commands.find((item) => item.id === selected.value) ?? draft.value.commands[0]!,
)
const problem = computed(() => {
  try {
    parseSettings(draft.value)
    return ''
  } catch (error) {
    return (error as Error).message
  }
})
const marker = computed(() => {
  try {
    return stamp('CP', parseSettings(draft.value))
  } catch {
    return stamp('CP', draft.value)
  }
})
const exchange = ref(false),
  restore = ref(false),
  importText = ref(''),
  importError = ref('')
const shortcutEnabled = computed(() => !problem.value && !exchange.value && !restore.value)
watch(problem, (error) => {
  if (error) open.value = false
})
function add() {
  if (draft.value.commands.length >= 20) return
  let index = 1
  while (draft.value.commands.some((item) => item.id === `command-${index}`)) index++
  const item: Command = {
    id: `command-${index}`,
    title: 'A new little action',
    category: 'Create',
    keywords: '',
    shortcut: '',
    action: 'note',
    text: 'Something worth remembering.',
  }
  draft.value.commands.push(item)
  selected.value = item.id
}
function remove() {
  if (draft.value.commands.length <= 1) return
  draft.value.commands = draft.value.commands.filter((item) => item.id !== command.value.id)
  selected.value = draft.value.commands[0]!.id
}
async function run(item: Command) {
  if (problem.value) return
  open.value = false
  await nextTick()
  execute(item)
}
function exportData() {
  download(
    'command-palette.json',
    JSON.stringify(
      {
        ...parseSettings(draft.value),
        provenance: {
          project: 'vue-command-palette-studio',
          author: 'CodeSculptor',
          marker: marker.value,
        },
      },
      null,
      2,
    ),
  )
}
function importData() {
  try {
    draft.value = parseSettings(JSON.parse(importText.value))
    selected.value = draft.value.commands[0]!.id
    reset()
    importError.value = ''
    exchange.value = false
  } catch (error) {
    importError.value = (error as Error).message
  }
}
function restoreSample() {
  draft.value = clone(sample)
  selected.value = draft.value.commands[0]!.id
  reset()
  restore.value = false
}
</script>
<template>
  <div
    class="[&_main]:max-w-380 [&_main]:py-0 [&_main]:px-9.5 [&_main]:my-0 [&_main]:mx-auto [@media(width<=700px)]:[&_main]:px-4 [@media(700px<width<=1100px)]:[&_main]:px-6"
  >
    <header
      class="min-h-21.5 flex items-center justify-between gap-6 border-b [border-bottom-style:solid] border-b-line bg-surface py-5 px-9.5 [@media(width<=700px)]:gap-4 [@media(width<=700px)]:flex-wrap [@media(width<=700px)]:p-4 [@media(700px<width<=1100px)]:py-4.5 [@media(700px<width<=1100px)]:px-6 [@media(1600px<=width)]:px-[max(38px,_calc((100vw_-_1444px)_/_2))]"
    >
      <a
        href="/"
        class="font-display flex gap-[13px] items-center text-[length:24px] font-[650] tracking-[-0.8px] [@media(width<=700px)]:text-[length:22px]"
        ><span
          class="w-10.5 h-10.5 rounded-[11px] bg-accent text-on-accent grid place-items-center text-[length:29px] relative [&_span]:text-[length:16px] [&_span]:absolute [&_span]:right-[5px] [&_span]:bottom-1"
          >⌘</span
        ><span
          >command<span
            class="block font-sans text-[length:8px] tracking-[1.5px] font-semibold text-muted mt-[3px]"
            >PALETTE STUDIO</span
          ></span
        ></a
      >
      <div
        class="flex items-center gap-3 [@media(width<=700px)]:gap-2 [@media(width<=700px)]:w-full [@media(width<=700px)]:justify-end [@media(width<=700px)]:[&_>_button]:flex-1"
      >
        <span
          class="flex items-center gap-[7px] text-[length:11px] text-muted mr-3 [@media(width<=1100px)]:hidden"
          ><i class="inline-block w-1.5 h-1.5 rounded-[50%] bg-accent shrink-0" />{{
            storageStatus
          }}</span
        ><button
          data-ui="secondary"
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
          @click="exchange = true"
        >
          <AppIcon name="upload" />Import / export</button
        ><button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
          :disabled="!!problem"
          @click="exchange = true"
        >
          <AppIcon name="code" />Get the component
        </button>
      </div>
    </header>
    <main>
      <section
        class="flex justify-between items-center min-h-67.5 gap-8 py-8.5 px-0 [@media(width<=700px)]:min-h-auto [@media(width<=700px)]:py-7.5 [&_[data-ui~=eyebrow]]:mb-[15px] [&_>_div_>_p:last-child]:mt-4 [&_>_div_>_p:last-child]:text-[length:14px] [&_>_div_>_p:last-child]:text-muted [@media(width<=700px)]:[&_>_div_>_p:last-child]:text-[length:13px]"
      >
        <div>
          <p data-ui="eyebrow" class="text-[length:10px] font-[750] tracking-[1.8px] text-muted">
            LESS CLICKING. MORE DOING.
          </p>
          <h1>A shortcut to<br /><span class="text-accent">something good.</span></h1>
          <p>
            Shape a command palette that feels like second nature.<br />Give your ideas a name, a
            key, and a little purpose.
          </p>
        </div>
        <div
          class="flex relative gap-4.5 items-center pt-[55px] pb-[25px] [transform:rotate(-6deg)] mr-[45px] px-[35px] [@media(width<=1000px)]:hidden [@media(width<=1000px)]:mr-0 [@media(1000px<width<=1200px)]:mr-0 [&_>_span]:grid [&_>_span]:place-items-center [&_>_span]:w-24 [&_>_span]:h-22.5 [&_>_span]:border [&_>_span]:border-solid [&_>_span]:border-[#cfd8f0] [&_>_span]:border-b-[length:9px] [&_>_span]:[border-bottom-style:solid] [&_>_span]:border-b-[#cbd3e8] [&_>_span]:rounded-[17px] [&_>_span]:bg-[#fff] [&_>_span]:font-[family-name:'Bricolage_Grotesque_Variable'] [&_>_span]:text-[length:40px] [&_>_span]:shadow-[0_12px_20px_#2840810a] [&_>_span]:text-[#315be8] [&_>_span:last-of-type]:bg-[#e5ebfe] [&_>_span:last-of-type]:[transform:translateY(-10px)] [&_b]:text-[length:20px] [&_b]:text-[#95a5cb] [&_small]:absolute [&_small]:bottom-[-15px] [&_small]:right-10 [&_small]:italic [&_small]:text-[#8191b4]"
          aria-hidden="true"
        >
          <div
            class="absolute top-[5px] left-3 w-77.5 text-[length:8px] tracking-[1px] text-[#8694b8]"
          >
            YOUR NEXT GOOD IDEA IS ONE KEY AWAY.
          </div>
          <span>⌘</span><b>+</b><span>K</span><small>Make it yours.</small>
        </div>
      </section>
      <div
        class="grid grid-cols-[246px_minmax(0,_1fr)_290px] gap-[23px] items-stretch [@media(width<=700px)]:grid-cols-[minmax(0,_1fr)] [@media(width<=700px)]:gap-5 [@media(700px<width<=1000px)]:grid-cols-[250px_minmax(0,_1fr)] [@media(700px<width<=1000px)]:gap-4 [@media(1000px<width<=1200px)]:grid-cols-[210px_minmax(0,_1fr)_260px] [@media(1000px<width<=1200px)]:gap-4 [@media(width<=1200px)]:[&_[data-ui~=panel]]:p-4.5"
      >
        <section
          data-ui="panel"
          class="bg-surface border border-solid border-line rounded-[var(--radius)] min-w-0 h-201.5 flex flex-col p-[23px] [@media(width<=700px)]:h-[465px] [@media(width<=700px)]:p-5 [&_[data-ui~=side-note]]:mt-5.5"
        >
          <div class="flex items-center justify-between gap-3 mb-2 [&_+_p]:mb-5">
            <h2>Your commands</h2>
            <span
              class="text-[length:10px] font-semibold bg-hover border border-solid border-line rounded-[6px] whitespace-nowrap py-1 px-[7px]"
              >{{ draft.commands.length }}/20</span
            >
          </div>
          <p data-ui="muted" class="text-muted text-[length:12px]">
            Little actions. Big possibilities.
          </p>
          <div
            data-ui="library-list"
            class="flex-1 min-h-0 overflow-auto mt-[5px] mb-5 mx-[-9px] [@media(width<=700px)]:min-h-32.5 [&_>_button]:border-0 [&_>_button]:flex [&_>_button]:text-left [&_>_button]:items-center [&_>_button]:gap-3 [&_>_button]:w-full [&_>_button]:bg-[transparent] [&_>_button]:text-ink [&_>_button]:rounded-[10px] [&_>_button]:mb-[7px] [&_>_button]:py-4 [&_>_button]:px-2.5 [&_>_button.active]:bg-[#edf1ff] [&_>_button.active]:text-accent [&_>_button_>_span:last-child]:min-w-0 [&_strong]:block [&_strong]:text-[length:12px] [&_strong]:leading-[1.5] [&_small]:block [&_small]:text-muted [&_small]:mt-1 [&_small]:text-[length:10px]"
          >
            <button
              v-for="item in draft.commands"
              :key="item.id"
              v-hotkey="{
                shortcut: item.shortcut,
                handler: () => {
                  if (!open) void run(item)
                },
                enabled: shortcutEnabled,
              }"
              :class="{ active: command.id === item.id }"
              @click="selected = item.id"
            >
              <span
                class="w-[31px] h-[31px] bg-surface border border-solid border-line rounded-[8px] grid place-items-center shrink-0"
                ><AppIcon
                  :name="
                    item.action === 'note'
                      ? 'plus'
                      : item.action === 'theme'
                        ? 'grid'
                        : item.action === 'clear'
                          ? 'reset'
                          : 'arrow'
                  " /></span
              ><span
                ><strong>{{ item.title || 'Untitled command' }}</strong
                ><small>{{ item.category || 'Uncategorized' }}</small></span
              >
            </button>
          </div>
          <button
            data-ui="secondary"
            class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink w-full py-2.5 px-[15px] [&:hover]:bg-hover"
            :disabled="draft.commands.length >= 20"
            @click="add"
          >
            <AppIcon name="plus" />Add a command
          </button>
          <div
            data-ui="side-note"
            class="border-t [border-top-style:solid] border-t-line pt-5 flex items-start gap-[9px] text-muted text-[length:11px] [&_svg]:text-accent [&_svg]:mt-[3px]"
          >
            <AppIcon name="keyboard" />
            <p>
              Shortcuts run in the preview. Regular command shortcuts stay quiet while you're
              typing.
            </p>
          </div>
          <button
            class="inline-flex items-center justify-center gap-[9px] min-h-8 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-[transparent] text-muted mt-4.5 text-[length:11px] py-[7px] px-0.5"
            @click="restore = true"
          >
            <AppIcon name="reset" />Restore sample
          </button>
        </section>
        <section
          data-ui="preview-panel"
          class="h-201.5 border border-solid border-line rounded-[var(--radius)] overflow-hidden flex flex-col min-w-0 bg-surface [@media(width<=700px)]:h-182.5 [&_[data-ui~=canvas-footer]]:min-h-[49px] [&_[data-ui~=canvas-footer]]:text-[length:8px]"
          :data-accent="draft.accent"
        >
          <div
            class="h-[49px] flex items-center justify-between gap-3 border-b [border-bottom-style:solid] border-b-line text-[length:10px] text-muted tracking-[1px] py-[15px] px-5 [&_>_span]:flex [&_>_span]:items-center [&_>_span]:gap-[7px]"
          >
            <span
              ><i class="inline-block w-1.5 h-1.5 rounded-[50%] bg-accent shrink-0" />YOUR LITTLE
              WORKSPACE</span
            ><span>LIVE PREVIEW</span>
          </div>
          <div
            data-ui="workspace"
            class="bg-[#f4f6fc] flex-1 min-h-0 border border-solid border-[#e0e6f3] rounded-[12px] text-[#293348] overflow-auto [transition:background_0.15s] m-5 [@media(width<=1200px)]:m-3.5 [&.dark]:bg-[#252e44] [&.dark]:border-[#323e56] [&.dark]:text-[#edf0fa]"
            :class="{ dark }"
          >
            <div
              class="flex items-center gap-3 border-b [border-bottom-style:solid] border-b-[#ccd5ea69] text-[length:9px] text-[#8996b1] py-[15px] px-4.5"
            >
              <span
                class="font-[family-name:'Bricolage_Grotesque_Variable'] font-bold text-[length:24px] text-accent"
                >c.</span
              ><span>Personal space / today</span
              ><span
                class="ml-auto text-[length:8px] border border-solid border-[#ccd5e9] rounded-[50%] w-6.5 h-6.5 grid place-items-center"
                >YO</span
              >
            </div>
            <div
              class="py-10.5 px-[25px] [@media(width<=700px)]:py-[35px] [@media(width<=700px)]:px-5 [@media(700px<width<=1200px)]:py-[35px] [@media(700px<width<=1200px)]:px-4.5 [&_h2]:text-[length:34px] [&_h2]:leading-[1.15] [&_h2]:tracking-[-1.2px] [&_h2]:mt-[15px] [&_h2]:mb-[29px] [&_h2]:mx-0 [@media(width<=1200px)]:[&_h2]:text-[length:30px] [&_[data-ui~=eyebrow]]:text-[length:8px] [&_[data-ui~=eyebrow]]:tracking-[1.5px]"
            >
              <p
                data-ui="eyebrow"
                class="text-[length:10px] font-[750] tracking-[1.8px] text-muted"
              >
                A CLEAR SPACE FOR A GOOD IDEA.
              </p>
              <h2>Make room<br />for your next move.</h2>
              <button
                v-hotkey="{
                  shortcut: draft.launcher,
                  handler: () => {
                    open = !open
                  },
                  enabled: shortcutEnabled,
                  allowInInputs: true,
                }"
                data-ui="palette-launcher"
                class="flex items-center gap-[9px] w-full bg-[#fff] text-[#8a95aa] border border-solid border-[#dbe1ed] rounded-[9px] text-left text-[length:11px] shadow-[0_3px_6px_#26365606] py-[13px] px-3 [@media(width<=700px)]:flex-wrap [@media(700px<width<=1000px)]:flex-nowrap [@media(1000px<width<=1200px)]:flex-wrap [&_>_span]:flex-1 [@media(width<=700px)]:[&_kbd]:ml-[25px] [@media(700px<width<=1000px)]:[&_kbd]:ml-0 [@media(1000px<width<=1200px)]:[&_kbd]:ml-6.5"
                :disabled="!!problem"
                @click="open = true"
              >
                <AppIcon name="search" /><span>Find an action…</span
                ><kbd>{{ shortcutLabel(draft.launcher) }}</kbd></button
              ><label
                class="scratchpad-label text-[length:8px] tracking-[1.5px] text-[#8996b1] mt-8 [&_textarea]:text-[length:13px] [&_textarea]:tracking-[0] [&_textarea]:leading-[1.7] [&_textarea]:mt-[13px] [&_textarea]:bg-[transparent] [&_textarea]:text-[inherit] [&_textarea]:border [&_textarea]:border-dashed [&_textarea]:border-[#c7d0e2] [&_textarea]:resize-none [&_textarea]:h-49.5"
                >THE SCRATCHPAD<textarea
                  ref="scratchpad"
                  v-model="notes"
                  maxlength="6000"
                  rows="6"
                  placeholder="Run a command. Leave a thought. Start something small."
                />
              </label>
              <p class="text-[#8a95aa] text-[length:10px] mt-5">
                {{
                  history.length
                    ? 'A little progress, one action at a time.'
                    : 'Your first action is waiting.'
                }}
              </p>
            </div>
          </div>
          <div
            data-ui="canvas-footer"
            class="flex justify-between gap-3 border-t [border-top-style:solid] border-t-line text-[length:10px] text-muted py-[13px] px-5 [@media(width<=700px)]:flex-wrap"
          >
            <span>{{ marker }} / PALETTE STAMP</span><span>KEYBOARD FIRST.</span>
          </div>
        </section>
        <section
          data-ui="panel"
          class="bg-surface border border-solid border-line rounded-[var(--radius)] min-w-0 h-201.5 flex flex-col p-[23px] [@media(width<=700px)]:h-[825px] [@media(width<=700px)]:[grid-column:auto] [@media(width<=700px)]:p-5 [@media(700px<width<=1000px)]:h-[805px] [@media(700px<width<=1000px)]:[grid-column:1/-1]"
        >
          <div class="flex items-center justify-between gap-3 mb-2 [&_+_p]:mb-5">
            <h2>Make it yours</h2>
            <span
              class="text-[length:10px] font-semibold bg-hover border border-solid border-line rounded-[6px] whitespace-nowrap py-1 px-[7px]"
              >EDITOR</span
            >
          </div>
          <div
            class="flex justify-between gap-2.5 text-[length:9px] border-b [border-bottom-style:solid] border-b-line mb-[23px] text-muted py-4.5 px-0 [&_.active]:font-bold [&_.active]:text-accent [&_span:last-child]:overflow-hidden [&_span:last-child]:text-ellipsis"
          >
            <span class="active">COMMAND DETAILS</span><span>{{ command.id }}</span>
          </div>
          <div
            class="flex-1 min-h-0 overflow-y-auto pt-0.5 pr-1.5 pb-0 pl-0.5 mr-[-6px] ml-[-2px] my-0"
          >
            <label>Command title<input v-model="command.title" maxlength="80" /></label
            ><label>Category<input v-model="command.category" maxlength="30" /></label
            ><label
              >Search keywords<input
                v-model="command.keywords"
                maxlength="180"
                placeholder="Extra words to find this action" /></label
            ><label
              >Keyboard shortcut<input
                v-model="command.shortcut"
                maxlength="30"
                placeholder="alt+n"
            /></label>
            <p class="text-muted text-[length:10px] mt-[-9px] mb-[19px] leading-[1.7] mx-0">
              Alt+letter, Mod+Shift+letter, or Mod+K. Mod means ⌘ on Mac and Ctrl elsewhere.
            </p>
            <label
              >Action<select v-model="command.action">
                <option v-for="action in actions" :key="action.id" :value="action.id">
                  {{ action.label }}
                </option>
              </select></label
            >
            <div class="h-31 overflow-auto [&_textarea]:resize-none">
              <label v-if="command.action === 'note'"
                >Note text<textarea v-model="command.text" maxlength="300" rows="3" />
              </label>
              <p
                v-else
                class="text-[length:12px] border border-dashed border-line rounded-[8px] text-muted p-4"
              >
                {{
                  command.action === 'theme'
                    ? 'Switch between light and dark in the preview workspace.'
                    : command.action === 'clear'
                      ? 'Clear all text from the session scratchpad.'
                      : 'Move the cursor straight to the scratchpad.'
                }}
              </p>
            </div>
            <div class="flex justify-between mt-[7px] [&_[data-ui~=secondary]]:text-[length:11px]">
              <button
                data-ui="secondary"
                class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
                :disabled="!!problem"
                @click="run(command)"
              >
                <AppIcon name="play" />Try action</button
              ><button
                data-ui="danger"
                class="text-danger inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] w-9.5 bg-[transparent] p-2 [&:hover]:bg-hover"
                aria-label="Remove command"
                :disabled="draft.commands.length <= 1"
                @click="remove"
              >
                <AppIcon name="trash" />
              </button>
            </div>
            <hr />
            <label>Palette title<input v-model="draft.title" maxlength="80" /></label
            ><label>Launcher shortcut<input v-model="draft.launcher" maxlength="30" /></label
            ><label
              >Accent<select v-model="draft.accent">
                <option value="blue">Studio blue</option>
                <option value="violet">Soft violet</option>
                <option value="green">Garden green</option>
              </select></label
            >
          </div>
          <p class="text-danger h-12 overflow-auto text-[length:10px] pt-2.5" role="status">
            {{ problem }}
          </p>
        </section>
      </div>
      <section
        class="flex border border-solid border-line rounded-[12px] gap-7.5 bg-surface mt-6 h-38 items-start py-5 px-6 [@media(width<=700px)]:gap-2.5 [@media(width<=700px)]:h-[205px] [@media(width<=700px)]:flex-col [@media(width<=700px)]:px-5 [&_>_div]:flex [&_>_div]:items-center [&_>_div]:gap-2.5 [&_>_div]:pt-3 [&_>_div]:text-[length:11px] [&_>_div]:flex-wrap [&_>_div]:basis-[235px] [@media(width<=700px)]:[&_>_div]:basis-auto [@media(width<=700px)]:[&_>_div]:p-0 [&_ol]:[list-style:none] [&_ol]:flex-1 [&_ol]:min-w-0 [&_ol]:p-0 [&_ol]:m-0 [@media(width<=700px)]:[&_ol]:w-full [&_li]:flex [&_li]:justify-between [&_li]:gap-4 [&_li]:text-[length:11px] [&_li]:border-b [&_li]:[border-bottom-style:solid] [&_li]:border-b-line [&_li]:py-2 [&_li]:px-0 [&_li_span]:overflow-hidden [&_li_span]:whitespace-nowrap [&_li_span]:text-ellipsis [&_time]:font-[family-name:ui-monospace,_monospace] [&_time]:text-[length:9px] [&_time]:text-muted"
      >
        <div>
          <span class="inline-block w-1.5 h-1.5 rounded-[50%] bg-accent shrink-0" /><strong
            >A little history</strong
          ><span data-ui="muted" class="text-muted">Your latest actions.</span>
        </div>
        <ol>
          <li v-for="entry in history.slice(0, 3)" :key="entry.id">
            <span>{{ entry.title }}</span
            ><time>{{ entry.time }}</time>
          </li>
          <li v-if="!history.length" data-ui="muted" class="text-muted">
            Run a command to start the story.
          </li>
        </ol>
      </section>
      <footer
        data-ui="page-footer"
        class="flex justify-between gap-[15px] text-[length:9px] tracking-[1.3px] text-muted py-7.5 px-0 [@media(width<=700px)]:flex-col [@media(width<=700px)]:py-6 [&_>_span:first-child]:font-bold [&_>_span:first-child]:text-ink [&_[data-ui~=muted]]:font-normal [&_[data-ui~=muted]]:tracking-[0]"
      >
        <span>MAKE THE EVERYDAY FEEL EFFORTLESS.</span
        ><span>COMMAND PALETTE STUDIO / VUE NATIVE / BY CODESCULPTOR</span>
      </footer>
    </main>
    <CommandPalette v-model="open" />
    <AppDialog v-model="exchange" title="Take your palette with you"
      ><p data-ui="muted" class="text-muted">
        Download a self-contained Vue component with working shortcuts, search and a scratchpad, or
        save your CP/1 settings.
      </p>
      <div
        class="flex flex-wrap gap-2.5 my-5 mx-0 [@media(width<=700px)]:[&_>_button]:flex-1 [@media(width<=700px)]:[&_>_button]:min-w-32.5"
      >
        <button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
          :disabled="!!problem"
          @click="download('CommandPalette.vue', componentSource(draft), 'text/plain')"
        >
          Download .vue</button
        ><button
          data-ui="secondary"
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
          :disabled="!!problem"
          @click="exportData"
        >
          Download settings
        </button>
      </div>
      <pre v-if="!problem">{{ componentSource(draft) }}</pre>
      <label
        >Palette JSON<textarea
          v-model="importText"
          class="font-[family-name:ui-monospace,_monospace]! text-[length:12px]!"
          rows="5"
          placeholder="Paste CP/1 JSON…"
        />
      </label>
      <p v-if="importError" class="text-danger" role="alert">{{ importError }}</p>
      <button
        data-ui="secondary"
        class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
        @click="importData"
      >
        Import palette
      </button></AppDialog
    >
    <AppDialog v-model="restore" title="Restore the starting point?"
      ><p>This replaces your saved palette and clears the session scratchpad and action history.</p>
      <div
        class="flex flex-wrap gap-2.5 my-5 mx-0 [@media(width<=700px)]:[&_>_button]:flex-1 [@media(width<=700px)]:[&_>_button]:min-w-32.5"
      >
        <button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
          @click="restoreSample"
        >
          Restore sample</button
        ><button
          data-ui="secondary"
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
          @click="restore = false"
        >
          Keep my palette
        </button>
      </div></AppDialog
    >
  </div>
</template>
