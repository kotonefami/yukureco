<script setup lang="ts">
import RecordButton from '@/components/buttons/RecordButton.vue'
import LeaveButton from '@/components/buttons/LeaveButton.vue'

defineProps<{
  isHost: boolean
  roomId: string
}>()

const emit = defineEmits<{
  startRecording: []
  stopRecording: []
}>()
</script>

<template>
  <div :class="$style.controls">
    <RecordButton v-if="isHost" :is-host="isHost" @start="emit('startRecording')" @stop="emit('stopRecording')" />
    <LeaveButton :room-id="roomId" />
  </div>
</template>

<style lang="scss" module>
.controls {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  width: 100%;

  button {
    height: 3.5em;
  }
}
</style>
