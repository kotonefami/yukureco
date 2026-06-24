<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { RecordingState } from '@/types/media'
import { useRecording } from '../../composables/useRecording'
import Button from '@/components/shared/Button.vue'

defineProps<{
  isHost: boolean
}>()

const emit = defineEmits<{
  start: []
  stop: []
}>()

const { recordingState } = useRecording()

const elapsedSeconds = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const isRecording = computed(() => recordingState.value === RecordingState.RECORDING)

const formattedTime = computed(() => {
  const h = Math.floor(elapsedSeconds.value / 3600)
  const m = Math.floor((elapsedSeconds.value % 3600) / 60)
  const s = elapsedSeconds.value % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
})

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

watch(isRecording, (recording) => {
  if (recording) {
    elapsedSeconds.value = 0
    timerInterval = setInterval(() => {
      elapsedSeconds.value++
    }, 1000)
  } else {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

function toggleRecording() {
  if (recordingState.value === RecordingState.IDLE) {
    emit('start')
  } else {
    emit('stop')
  }
}
</script>

<template>
  <Button v-if="isHost" variant="danger" @click="toggleRecording"
    :class="[$style.wrapper, isRecording ? $style.recording : '']">
    <span :class="$style.icon" />
    <span :class="$style.label">{{ isRecording ? formattedTime : 'REC' }}</span>
  </Button>
</template>

<style lang="scss" module>
.wrapper {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  box-sizing: border-box;
  width: 5em;
  overflow: hidden;

  &,
  &>* {
    transition: 300ms ease;
  }

  &.recording {
    width: 10em;
    gap: 0.5em;

    background-color: transparent;
    color: var(--color-fg);
    border: 2px solid currentColor;
  }
}

.icon {
  display: block;
  width: 1.2em;
  height: 1.2em;
  border-radius: 100%;
  flex-shrink: 0;

  background-color: currentColor;

  .recording>& {
    background-color: var(--color-danger);
    border-radius: 2px;
  }
}

.label {
  font-size: 1em;
  font-variant-numeric: tabular-nums;

  :not(.recording)>& {
    font-size: 0.8em;
  }
}
</style>
