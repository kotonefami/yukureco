<script setup lang="ts">
import { RecordingState } from "@/types/media"

defineProps<{
    recordingState: RecordingState
    isHost: boolean
}>()

const emit = defineEmits<{
    startRecording: []
    stopRecording: []
}>()
</script>

<template>
    <div v-if="isHost" class="recording-control">
        <button
            v-if="recordingState === RecordingState.IDLE"
            class="recording-control__button recording-control__button--start"
            @click="emit('startRecording')"
        >
            録画開始
        </button>
        <button
            v-else
            class="recording-control__button recording-control__button--stop"
            @click="emit('stopRecording')"
        >
            録画停止
        </button>
        <span
            class="recording-control__status"
            :class="{ 'recording-control__status--recording': recordingState === RecordingState.RECORDING }"
        >
            {{ recordingState === RecordingState.RECORDING ? "録画中..." : "待機中" }}
        </span>
    </div>
</template>

<style scoped lang="scss">
.recording-control {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #16213e;
    border-radius: 12px;

    &__button {
        padding: 10px 24px;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;

        &--start {
            background: #4ecca3;
            color: #1a1a2e;
        }

        &--stop {
            background: #e94560;
            color: #fff;
        }
    }

    &__status {
        font-size: 0.75rem;
        color: #666;

        &--recording {
            color: #e94560;
            animation: pulse 1.5s infinite;
        }
    }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
</style>
