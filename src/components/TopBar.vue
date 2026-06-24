<script setup lang="ts">
import { computed } from 'vue';
import { useRecording } from '../composables/useRecording';
import { RecordingState } from '../types';
import Time from './shared/Time.vue';

defineProps<{
    roomId?: string
}>()

const { recordingState } = useRecording()
const isRecording = computed(() => recordingState.value === RecordingState.RECORDING);
</script>

<template>
    <header class="top-bar">
        <div>
            <!-- TODO: icon, settings, and others -->
        </div>
        <span class="top-bar__information">
            <Time :show-seconds="true" />
            <span>
                <span v-if="isRecording" class="top-bar__recording-indicator">REC</span>
                <span v-else>STAND BY</span>
            </span>
            <span v-if="roomId">Room ID: {{ roomId }}</span>
        </span>
        <div>
            <!-- TODO: icon, settings, and others -->
        </div>
    </header>
</template>

<style scoped lang="scss">
.top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    line-height: 1;

    &__information {
        display: flex;

        color: var(--color-fg-muted);

        span {
            display: flex;
            align-items: center;
        }

        span:not(:last-child)::after {
            content: "";
            display: block;
            width: 0.25em;
            height: 0.25em;
            background-color: currentColor;
            border-radius: 50%;
            opacity: 0.5;

            margin-inline: 1em;
        }
    }

    &__recording-indicator {
        display: flex;
        align-items: center;

        color: var(--color-danger);
        font-weight: bold;

        &::before {
            content: "";
            display: block;
            width: 1em;
            height: 1em;
            border-radius: 50%;
            background-color: currentColor;
            animation: blink 1s infinite;

            position: relative;
            top: 1.5px;

            margin-right: 0.25em;

            @keyframes blink {
                0% {
                    opacity: 1;
                }

                50% {
                    opacity: 1;
                }

                100% {
                    opacity: 0;
                }
            }
        }
    }
}
</style>
