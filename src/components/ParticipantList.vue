<script setup lang="ts">
import type { Participant } from '@/types/peer'
import Panel from '@/components/shared/Panel.vue'

defineProps<{
  participants: readonly Participant[]
}>()
</script>

<template>
  <Panel>
    <div class="participant-list">
      <h3 class="participant-list__title">参加者 ({{ participants.length }})</h3>
      <ul class="participant-list__items">
        <li
          v-for="participant in participants"
          :key="participant.peerId"
          class="participant-list__item"
        >
          <span class="participant-list__name">{{ participant.displayName }}</span>
          <span class="participant-list__id">{{ participant.peerId.slice(0, 8) }}...</span>
        </li>
      </ul>
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.participant-list {
  &__title {
    margin: 0 0 12px;
    font-size: 0.875rem;
    color: var(--color-fg-muted);
  }

  &__items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--color-surface-alt);
    border-radius: 8px;
  }

  &__name {
    font-weight: 600;
    color: var(--color-fg);
    font-size: 0.875rem;
  }

  &__id {
    font-size: 0.75rem;
    color: var(--color-fg-dim);
  }
}
</style>
