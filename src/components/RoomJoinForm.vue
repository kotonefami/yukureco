<script setup lang="ts">
import { ref } from "vue"

const emit = defineEmits<{
    create: [roomId: string]
    join: [roomId: string, displayName: string]
}>()

defineProps<{
    disabled?: boolean
}>()

const mode = ref<"create" | "join">("create")
const roomIdInput = ref("")
const displayNameInput = ref("")

function generateRoomId(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let result = ""
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

function handleCreate(): void {
    const id = generateRoomId()
    emit("create", id)
}

function handleJoin(): void {
    if (roomIdInput.value.trim() && displayNameInput.value.trim()) {
        emit("join", roomIdInput.value.trim(), displayNameInput.value.trim())
    }
}
</script>

<template>
    <div class="room-join-form">
        <div class="room-join-form__tabs">
            <button
                class="room-join-form__tab"
                :class="{ 'room-join-form__tab--active': mode === 'create' }"
                @click="mode = 'create'"
            >
                ルームを作成
            </button>
            <button
                class="room-join-form__tab"
                :class="{ 'room-join-form__tab--active': mode === 'join' }"
                @click="mode = 'join'"
            >
                ルームに参加
            </button>
        </div>

        <div v-if="mode === 'create'" class="room-join-form__create">
<button class="room-join-form__button" :disabled="disabled" @click="handleCreate">
    ルームを作成
</button>
        </div>

        <div v-else class="room-join-form__join">
            <input
                v-model="displayNameInput"
                class="room-join-form__input"
                type="text"
                placeholder="表示名"
            />
            <input
                v-model="roomIdInput"
                class="room-join-form__input"
                type="text"
                placeholder="ルームID"
            />
            <button
                class="room-join-form__button"
                :disabled="disabled || !roomIdInput.trim() || !displayNameInput.trim()"
                @click="handleJoin"
            >
                参加
            </button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.room-join-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;
    background: #16213e;
    border-radius: 12px;
    max-width: 400px;
    margin: 0 auto;

    &__tabs {
        display: flex;
        gap: 8px;
    }

    &__tab {
        flex: 1;
        padding: 8px 16px;
        border: 1px solid #0f3460;
        background: transparent;
        color: #aaa;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.875rem;

        &--active {
            background: #0f3460;
            color: #eee;
            border-color: #e94560;
        }
    }

    &__create,
    &__join {
        display: flex;
        flex-direction: column;
        gap: 12px;
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
}
</style>
