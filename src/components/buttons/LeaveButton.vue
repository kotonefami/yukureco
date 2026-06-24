<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePeer } from '@/composables/usePeer'
import { useMedia } from '@/composables/useMedia'
import { useRecording } from '@/composables/useRecording'
import Button from '@/components/shared/Button.vue'
import { Phone } from '@lucide/vue'

const router = useRouter()

const { leaveRoom } = usePeer()

const { stopScreen, activeMics, stopMic } = useMedia()

const { reset: resetRecording } = useRecording()

defineProps<{
  roomId?: string
}>()

function onClick(): void {
  stopScreen()
  for (const [deviceId] of activeMics.value) {
    stopMic(deviceId)
  }
  leaveRoom()
  resetRecording()
  router.push('/')
}
</script>

<template>
  <Button variant="danger" @click="onClick" :class="$style.button">
    <Phone :class="$style.icon" />
  </Button>
</template>

<style lang="scss" module>
.button {
  width: 5em;
}

.icon {
  transform: translateY(5%) rotate(135deg);
}
</style>
