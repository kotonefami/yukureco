<script setup lang="ts">
defineProps<{
    roomId?: string
}>()
</script>

<template>
    <header class="top-bar">
        <h1 class="top-bar__title">ゆくレコ</h1>
        <span v-if="roomId" class="top-bar__room-id">ルーム: {{ roomId }}</span>
    </header>
</template>

<style scoped lang="scss">
.top-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 24px;
    background: #1a1a2e;
    color: #eee;

    &__title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
    }

    &__room-id {
        font-size: 0.875rem;
        color: #aaa;
    }
}
</style>
