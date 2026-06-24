<script setup lang="ts">
import type { AudioDeviceInfo, ActiveMicInfo } from '@/types/media'
import { ref } from 'vue'
import Panel from '@/components/shared/Panel.vue'
import Button from '@/components/shared/Button.vue'

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

const selectedDeviceId = ref('')
</script>

<template>
  <Panel>
    <div class="my-media-panel">
      <div class="my-media-panel__item">
        <span class="my-media-panel__label">画面</span>
        <span class="my-media-panel__name">
          {{ isScreenCapturing ? '共有中' : '未共有' }}
        </span>
        <Button
          v-if="!isScreenCapturing"
          size="sm"
          variant="secondary"
          @click="emit('startScreen')"
        >
          共有開始
        </Button>
        <Button v-else size="sm" variant="danger" @click="emit('stopScreen')"> 共有停止 </Button>
      </div>

      <div class="my-media-panel__section">
        <span class="my-media-panel__label">マイク</span>
        <div class="my-media-panel__mic-add">
          <select v-model="selectedDeviceId" class="my-media-panel__select">
            <option value="">デフォルト</option>
            <option v-for="device in audioDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label }}
            </option>
          </select>
          <Button size="sm" variant="secondary" @click="emit('addMic', selectedDeviceId)">
            追加
          </Button>
        </div>
        <div class="my-media-panel__mic-list">
          <div
            v-for="[deviceId, info] of activeMics"
            :key="deviceId"
            class="my-media-panel__mic-item"
          >
            <span class="my-media-panel__mic-label">{{ info.label }}</span>
            <Button size="sm" variant="danger" @click="emit('removeMic', deviceId)"> 停止 </Button>
          </div>
          <p v-if="activeMics.size === 0" class="my-media-panel__mic-empty">マイク未接続</p>
        </div>
      </div>
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.my-media-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;

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
    color: var(--color-fg);
    min-width: 40px;
    font-size: 0.8125rem;
  }

  &__name {
    font-size: 0.75rem;
    color: var(--color-fg-muted);
    flex: 1;
  }

  &__mic-add {
    display: flex;
    gap: 8px;
  }

  &__select {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-surface-alt);
    color: var(--color-fg);
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
    background: var(--color-surface-alt);
    border-radius: 6px;
  }

  &__mic-label {
    font-size: 0.75rem;
    color: var(--color-success);
  }

  &__mic-empty {
    font-size: 0.75rem;
    color: var(--color-fg-dim);
    margin: 0;
  }
}
</style>
