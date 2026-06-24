<script setup lang="ts">
import type { Participant } from '@/types/peer'

defineProps<{
  participant: Participant
}>()
</script>

<template>
  <div class="participant-video">
    <div class="participant-video__avatar">
      {{ participant.displayName.charAt(0) }}
    </div>
    <span class="participant-video__name">{{ participant.displayName }}</span>
  </div>
</template>

<style scoped lang="scss">
.participant-video {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-surface-alt);
  border-radius: 12px;

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: var(--color-danger);
    font-size: 1.125rem;
  }

  &__name {
    font-weight: 600;
    color: var(--color-fg);
    font-size: 0.875rem;
  }
}
</style>
