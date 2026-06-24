<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';

defineProps<{
    /** 秒を表示するかどうか */
    showSeconds?: boolean
}>()

const hours = ref('00')
const minutes = ref('00')
const seconds = ref('00')
const animationKey = ref(0)

function updateTime() {
    const now = new Date()
    hours.value = String(now.getHours()).padStart(2, '0')
    minutes.value = String(now.getMinutes()).padStart(2, '0')
    seconds.value = String(now.getSeconds()).padStart(2, '0')

    animationKey.value++;
}

onMounted(() => {
    updateTime()

    const interval = setInterval(updateTime, 1000)
    onUnmounted(() => clearInterval(interval))
})
</script>

<template>
    <span>
        <span>{{ hours }}</span>
        <span :class="$style.blink" :key="animationKey">:</span>
        <span>{{ minutes }}</span>
        <template v-if="showSeconds">
            <span :class="$style.blink" :key="animationKey">:</span>
            <span>{{ seconds }}</span>
        </template>
    </span>
</template>

<style lang="scss" module>
.blink {
    animation: blink 1s forwards;
}

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
</style>
