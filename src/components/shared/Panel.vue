<script setup lang="ts"></script>

<template>
  <div class="panel">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.panel {
  padding: 16px;
  background: var(--color-panel);
  border-radius: 12px;
}
</style>
