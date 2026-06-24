<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/shared/Button.vue'
import Input from '@/components/shared/Input.vue'

export type ConnectionPhase = 'pending' | 'connecting' | 'connected' | 'error'

const props = defineProps<{
  roomId: string
  phase: ConnectionPhase
  errorMessage?: string
}>()

const emit = defineEmits<{
  connect: [displayName: string]
}>()

const displayName = ref('')
</script>

<template>
  <div class="connecting-screen">
    <template v-if="phase === 'pending'">
      <div class="connecting-screen__card">
        <h2 class="connecting-screen__title">ルームに参加</h2>
        <p class="connecting-screen__room-id">ルームID: {{ roomId }}</p>
        <Input v-model="displayName" placeholder="表示名を入力" @keyup.enter="emit('connect', displayName)" />
        <Button variant="primary" :disabled="!displayName.trim()" @click="emit('connect', displayName)">
          接続
        </Button>
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
    background: var(--color-surface);
    border-radius: 12px;
    max-width: 360px;
    width: 100%;
    text-align: center;
  }

  &__title {
    margin: 0;
    font-size: 1.25rem;
    color: var(--color-fg);
  }

  &__room-id {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-fg-muted);
  }

  &__loading {
    color: var(--color-fg-muted);
    font-size: 1rem;
  }

  &__error {
    color: var(--color-danger);
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  &__error-detail {
    color: var(--color-fg-muted);
    font-size: 0.8125rem;
    margin: 0;
  }

  &__redirect {
    color: var(--color-fg-dim);
    font-size: 0.75rem;
    margin: 0;
  }
}
</style>
