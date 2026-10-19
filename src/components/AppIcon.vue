<script setup lang="ts">
withDefaults(defineProps<{ name?: string; size?: number }>(), { name: 'arrow', size: 18 })
const paths: Record<string, string> = {
  pause: 'M8 5v14M16 5v14',
  sound: 'M4 9v6h4l5 5V4L8 9zM17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6',
  keyboard: 'M2 5h20v14H2zM6 9h1m3 0h1m3 0h1m3 0h1M6 13h1m3 0h1m3 0h1m-9 3h12',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4',
  upload: 'M12 16V4m-5 5 5-5 5 5M4 17v3h16v-3',
  check: 'm5 12 4 4L19 6',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
  close: 'm6 6 12 12M6 18 18 6',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  play: 'm8 4 13 8-13 8z',
  reset: 'M4 9a8 8 0 1 1 0 6M4 3v6h6',
  trash: 'M4 7h16M9 7V3h6v4M6 7l1 14h10l1-14M10 11v6m4-6v6',
  up: 'm6 15 6-6 6 6',
  down: 'm6 9 6 6 6-6',
  branch: 'M6 4v16m0-8h7a5 5 0 0 0 5-5V4M4 4h4M4 20h4M16 4h4',
}
</script>
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.arrow" />
  </svg>
</template>
