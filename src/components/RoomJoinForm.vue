<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/shared/Button.vue'
import Input from '@/components/shared/Input.vue'

const emit = defineEmits<{
  create: [roomId: string]
  join: [roomId: string, displayName: string]
}>()

defineProps<{
  disabled?: boolean
}>()

const mode = ref<'create' | 'join'>('create')
const roomIdInput = ref('')
const displayNameInput = ref('')

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function handleCreate(): void {
  const id = generateRoomId()
  emit('create', id)
}

function handleJoin(): void {
  if (roomIdInput.value.trim() && displayNameInput.value.trim()) {
    emit('join', roomIdInput.value.trim(), displayNameInput.value.trim())
  }
}
</script>

<template>
  <div class="room-join-form">
    <div class="room-join-form__tabs">
      <button class="room-join-form__tab" :class="{ 'room-join-form__tab--active': mode === 'create' }"
        @click="mode = 'create'">
        ルームを作成
      </button>
      <button class="room-join-form__tab" :class="{ 'room-join-form__tab--active': mode === 'join' }"
        @click="mode = 'join'">
        ルームに参加
      </button>
    </div>

    <div v-if="mode === 'create'" class="room-join-form__create">
      <Button variant="primary" :disabled="disabled" @click="handleCreate"> ルームを作成 </Button>
    </div>

    <div v-else class="room-join-form__join">
      <Input v-model="displayNameInput" placeholder="表示名" />
      <Input v-model="roomIdInput" placeholder="ルームID" />
      <Button variant="primary" :disabled="disabled || !roomIdInput.trim() || !displayNameInput.trim()"
        @click="handleJoin">
        参加
      </Button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.room-join-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--color-surface);
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
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-fg-muted);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;

    &--active {
      background: var(--color-border);
      color: var(--color-fg);
      border-color: var(--color-danger);
    }
  }

  &__create,
  &__join {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
