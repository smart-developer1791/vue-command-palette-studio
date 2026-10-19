<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import AppIcon from './AppIcon.vue'
const props = defineProps<{ title: string }>()
const open = defineModel<boolean>({ required: true })
const dialog = ref<HTMLDialogElement>()
const titleId = `dialog-${props.title.toLowerCase().replace(/[^a-z]+/g, '-')}`
watchEffect(
  () => {
    if (!dialog.value) return
    if (open.value && !dialog.value.open) dialog.value.showModal()
    else if (!open.value && dialog.value.open) dialog.value.close()
  },
  { flush: 'post' },
)
function syncClosedDialog() {
  // A queued native close event may arrive after this dialog has reopened.
  if (!dialog.value?.open) open.value = false
}
</script>
<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      :aria-labelledby="titleId"
      @close="syncClosedDialog"
      @click="$event.target === $event.currentTarget && (open = false)"
    >
      <header
        class="border-b [border-bottom-style:solid] border-b-line flex items-center justify-between gap-5 py-5.5 px-[25px] [@media(width<=700px)]:p-4.5 [@media(width<=700px)]:[&_h2]:text-[length:18px]"
      >
        <h2 :id="titleId">{{ title }}</h2>
        <button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] w-9.5 bg-[transparent] p-2 [&:hover]:bg-hover"
          aria-label="Close dialog"
          autofocus
          @click="open = false"
        >
          <AppIcon name="close" />
        </button>
      </header>
      <div
        class="overflow-y-auto p-[25px] [@media(width<=700px)]:p-4.5 [&_>_p]:mb-5 [&_>_pre]:mb-5"
      >
        <slot />
      </div>
    </dialog>
  </Teleport>
</template>
