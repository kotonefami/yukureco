<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    disabled: false,
  },
)
</script>

<template>
  <button :class="[$style.button, $style[`button--${variant}`], $style[`button--${size}`]]" :disabled="disabled">
    <slot />
  </button>
</template>

<style lang="scss" module>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: 100ms opacity, 100ms background-color;
  border-radius: 1e9px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--sm {
    padding: 6px 12px;
    font-size: 0.75rem;
  }

  &--md {
    padding: 8px 16px;
    font-size: 0.875rem;
  }

  &--lg {
    padding: 10px 20px;
    font-size: 0.875rem;
  }

  &--primary {
    background: var(--color-danger);
    color: #fff;
    font-weight: 600;
  }

  &--secondary {
    background: var(--color-border);
    color: var(--color-fg);
  }

  &--ghost {
    background: none;
    border: 1px solid currentColor;
    color: var(--color-fg-muted);
  }

  &--danger {
    background: var(--color-danger);
    color: #fff;
    font-weight: 600;

    &:hover {
      background: var(--color-danger-hover);
    }
  }
}
</style>
