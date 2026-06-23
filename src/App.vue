<script setup lang="ts">
import { RouterView } from "vue-router"
</script>

<template>
    <RouterView />
</template>

<style lang="scss">
*,
*::before,
*::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html,
body {
    height: 100%;
    background: #0f0f23;
    color: #eee;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

#app {
    min-height: 100vh;
}
</style>
