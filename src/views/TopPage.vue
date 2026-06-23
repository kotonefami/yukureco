<script setup lang="ts">
import { useRouter } from "vue-router"
import RoomJoinForm from "@/components/RoomJoinForm.vue"

const router = useRouter()

function handleCreate(roomId: string): void {
    router.push({ path: `/room/${roomId}`, query: { role: "host" } })
}

function handleJoin(roomId: string, displayName: string): void {
    router.push({ path: `/room/${roomId}`, query: { role: "participant", name: displayName } })
}
</script>

<template>
    <div class="top-page">
        <div class="top-page__hero">
            <h1 class="top-page__title">ゆくレコ</h1>
            <p class="top-page__subtitle">OBS不要・完全サーバーレスの<br>複数人ゲーム実況録画システム</p>
        </div>
        <div class="top-page__form">
            <RoomJoinForm
                @create="handleCreate"
                @join="handleJoin"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
.top-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
    gap: 48px;

    &__hero {
        text-align: center;
    }

    &__title {
        margin: 0;
        font-size: 3rem;
        font-weight: 800;
        color: #eee;
    }

    &__subtitle {
        margin: 12px 0 0;
        color: #888;
        font-size: 1rem;
        line-height: 1.6;
    }

    &__form {
        width: 100%;
        max-width: 420px;
    }
}
</style>
