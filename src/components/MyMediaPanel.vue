<script setup lang="ts">
import type { AudioDeviceInfo, ActiveMicInfo } from "@/types/media"
import { ref } from "vue"

defineProps<{
    isScreenCapturing: boolean
    activeMics: ReadonlyMap<string, ActiveMicInfo>
    audioDevices: readonly AudioDeviceInfo[]
}>()

const emit = defineEmits<{
    startScreen: []
    stopScreen: []
    addMic: [deviceId: string]
    removeMic: [deviceId: string]
}>()

const selectedDeviceId = ref("")
</script>

<template>
    <div class="my-media-panel">
        <div class="my-media-panel__item">
            <span class="my-media-panel__label">画面</span>
            <span class="my-media-panel__name">
                {{ isScreenCapturing ? "共有中" : "未共有" }}
            </span>
            <button
                v-if="!isScreenCapturing"
                class="my-media-panel__button my-media-panel__button--start"
                @click="emit('startScreen')"
            >
                共有開始
            </button>
            <button
                v-else
                class="my-media-panel__button my-media-panel__button--stop"
                @click="emit('stopScreen')"
            >
                共有停止
            </button>
        </div>

        <div class="my-media-panel__section">
            <span class="my-media-panel__label">マイク</span>
            <div class="my-media-panel__mic-add">
                <select v-model="selectedDeviceId" class="my-media-panel__select">
                    <option value="">デフォルト</option>
                    <option
                        v-for="device in audioDevices"
                        :key="device.deviceId"
                        :value="device.deviceId"
                    >
                        {{ device.label }}
                    </option>
                </select>
                <button
                    class="my-media-panel__button my-media-panel__button--start"
                    @click="emit('addMic', selectedDeviceId)"
                >
                    追加
                </button>
            </div>
            <div class="my-media-panel__mic-list">
                <div
                    v-for="[deviceId, info] of activeMics"
                    :key="deviceId"
                    class="my-media-panel__mic-item"
                >
                    <span class="my-media-panel__mic-label">{{ info.label }}</span>
                    <button
                        class="my-media-panel__button my-media-panel__button--stop"
                        @click="emit('removeMic', deviceId)"
                    >
                        停止
                    </button>
                </div>
                <p v-if="activeMics.size === 0" class="my-media-panel__mic-empty">
                    マイク未接続
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.my-media-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: #16213e;
    border-radius: 12px;

    &__item {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    &__section {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    &__label {
        font-weight: 600;
        color: #ddd;
        min-width: 40px;
        font-size: 0.8125rem;
    }

    &__name {
        font-size: 0.75rem;
        color: #888;
        flex: 1;
    }

    &__mic-add {
        display: flex;
        gap: 8px;
    }

    &__select {
        flex: 1;
        padding: 6px 8px;
        border: 1px solid #0f3460;
        border-radius: 6px;
        background: #1a1a2e;
        color: #eee;
        font-size: 0.75rem;
    }

    &__mic-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    &__mic-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 8px;
        background: #1a1a2e;
        border-radius: 6px;
    }

    &__mic-label {
        font-size: 0.75rem;
        color: #4ecca3;
    }

    &__mic-empty {
        font-size: 0.75rem;
        color: #666;
        margin: 0;
    }

    &__button {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        font-size: 0.75rem;
        cursor: pointer;

        &--start {
            background: #0f3460;
            color: #eee;
        }

        &--stop {
            background: #e94560;
            color: #fff;
        }
    }
}
</style>
