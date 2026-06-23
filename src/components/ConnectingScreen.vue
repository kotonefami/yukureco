<script setup lang="ts">
import { ref } from "vue"

export type ConnectionPhase = "pending" | "connecting" | "connected" | "error"

const props = defineProps<{
    roomId: string
    phase: ConnectionPhase
    errorMessage?: string
}>()

const emit = defineEmits<{
    connect: [displayName: string]
}>()

const displayName = ref("")
</script>

<template>
    <div class="connecting-screen">
        <template v-if="phase === 'pending'">
            <div class="connecting-screen__card">
                <h2 class="connecting-screen__title">ルームに参加</h2>
                <p class="connecting-screen__room-id">ルームID: {{ roomId }}</p>
                <input
                    v-model="displayName"
                    class="connecting-screen__input"
                    type="text"
                    placeholder="表示名を入力"
                    @keyup.enter="emit('connect', displayName)"
                />
                <button
                    class="connecting-screen__button"
                    :disabled="!displayName.trim()"
                    @click="emit('connect', displayName)"
                >
                    接続
                </button>
            </div>
        </template>

        <template v-else-if="phase === 'connecting'">
            <div class="connecting-screen__card">
                <p class="connecting-screen__loading">接続中...</p>
            </div>
        </template>

        <template v-else-if="phase === 'error'">
            <div class="connecting-screen__card">
                <p class="connecting-screen__error">エラーが発生しました</p>
                <p class="connecting-screen__error-detail">{{ errorMessage }}</p>
                <p class="connecting-screen__redirect">トップページに移動します...</p>
            </div>
        </template>
    </div>
</template>

<style scoped lang="scss">
.connecting-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;

    &__card {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 32px;
        background: #16213e;
        border-radius: 12px;
        max-width: 360px;
        width: 100%;
        text-align: center;
    }

    &__title {
        margin: 0;
        font-size: 1.25rem;
        color: #eee;
    }

    &__room-id {
        margin: 0;
        font-size: 0.875rem;
        color: #888;
    }

    &__input {
        padding: 10px 12px;
        border: 1px solid #0f3460;
        border-radius: 8px;
        background: #1a1a2e;
        color: #eee;
        font-size: 0.875rem;

        &::placeholder {
            color: #666;
        }
    }

    &__button {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        background: #e94560;
        color: #fff;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }

    &__loading {
        color: #aaa;
        font-size: 1rem;
    }

    &__error {
        color: #e94560;
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
    }

    &__error-detail {
        color: #888;
        font-size: 0.8125rem;
        margin: 0;
    }

    &__redirect {
        color: #666;
        font-size: 0.75rem;
        margin: 0;
    }
}
</style>
