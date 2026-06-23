<script setup lang="ts">
import type { Participant } from "@/types/peer"

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
    background: #1a1a2e;
    border-radius: 12px;

    &__avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #0f3460;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: #e94560;
        font-size: 1.125rem;
    }

    &__name {
        font-weight: 600;
        color: #eee;
        font-size: 0.875rem;
    }
}
</style>
