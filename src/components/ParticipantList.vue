<script setup lang="ts">
import type { Participant } from "@/types/peer"

defineProps<{
    participants: readonly Participant[]
}>()
</script>

<template>
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
</template>

<style scoped lang="scss">
.participant-list {
    padding: 16px;
    background: #16213e;
    border-radius: 12px;

    &__title {
        margin: 0 0 12px;
        font-size: 0.875rem;
        color: #aaa;
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
        background: #1a1a2e;
        border-radius: 8px;
    }

    &__name {
        font-weight: 600;
        color: #eee;
        font-size: 0.875rem;
    }

    &__id {
        font-size: 0.75rem;
        color: #666;
    }
}
</style>
