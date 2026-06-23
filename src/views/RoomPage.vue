<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { usePeer } from "@/composables/usePeer"
import { useMedia } from "@/composables/useMedia"
import { useRecording } from "@/composables/useRecording"
import { ProtocolService } from "@/services/ProtocolService"
import TopBar from "@/components/TopBar.vue"
import MyMediaPanel from "@/components/MyMediaPanel.vue"
import ParticipantList from "@/components/ParticipantList.vue"
import RecordingControl from "@/components/RecordingControl.vue"
import ConnectingScreen from "@/components/ConnectingScreen.vue"
import type { ConnectionPhase } from "@/components/ConnectingScreen.vue"

const route = useRoute()
const router = useRouter()
const protocolService = new ProtocolService()

const {
    selfInfo,
    participants: peerParticipants,
    leaveRoom,
    broadcast,
    createRoom,
    joinRoom,
} = usePeer()

const {
    isScreenCapturing,
    startScreen,
    stopScreen,
    screenStream,
    activeMics,
    audioDevices,
    fetchAudioDevices,
    startMic,
    stopMic,
} = useMedia()

const {
    recordingState,
    startRecording: startLocalRecording,
    stopRecording: stopLocalRecording,
    reset: resetRecording,
} = useRecording()

const roomIdString = route.params.id as string
const isHostRole = route.query.role === "host"
const connectionPhase = ref<ConnectionPhase>(
    route.query.role ? "connecting" : "pending",
)
const errorMessage = ref("")

onMounted(async () => {
    if (isHostRole) {
        try {
            await createRoom(roomIdString)
            connectionPhase.value = "connected"
        } catch (e) {
            connectionPhase.value = "error"
            errorMessage.value = e instanceof Error ? e.message : String(e)
            setTimeout(() => router.push("/"), 5000)
        }
    } else if (route.query.role === "participant") {
        const name = route.query.name as string
        try {
            await joinRoom(`yukureco-room-${roomIdString}`, name)
            connectionPhase.value = "connected"
        } catch (e) {
            connectionPhase.value = "error"
            errorMessage.value = e instanceof Error ? e.message : String(e)
            setTimeout(() => router.push("/"), 5000)
        }
    }
})

async function handleConnect(displayName: string): Promise<void> {
    connectionPhase.value = "connecting"
    try {
        await joinRoom(`yukureco-room-${roomIdString}`, displayName)
        connectionPhase.value = "connected"
    } catch (e) {
        connectionPhase.value = "error"
        errorMessage.value = e instanceof Error ? e.message : String(e)
        setTimeout(() => router.push("/"), 5000)
    }
}

async function handleAddMic(deviceId: string): Promise<void> {
    await fetchAudioDevices()
    await startMic(deviceId || undefined)
}

function handleRemoveMic(deviceId: string): void {
    stopMic(deviceId)
}

function handleStartRecording(): void {
    const message = protocolService.createRecordStartMessage(
        selfInfo.value?.peerId ?? "unknown",
    )
    broadcast(protocolService.serialize(message))

    if (screenStream.value) {
        const micMap = new Map<string, { stream: MediaStream; label: string }>()
        for (const [deviceId, info] of activeMics.value) {
            micMap.set(deviceId, { stream: info.stream, label: info.label })
        }
        startLocalRecording(screenStream.value, micMap)
    }
}

async function handleStopRecording(): Promise<void> {
    const message = protocolService.createRecordStopMessage(
        selfInfo.value?.peerId ?? "unknown",
    )
    broadcast(protocolService.serialize(message))
    await stopLocalRecording(selfInfo.value?.peerId ?? "unknown")
}

function handleLeaveRoom(): void {
    stopScreen()
    for (const [deviceId] of activeMics.value) {
        stopMic(deviceId)
    }
    leaveRoom()
    resetRecording()
    router.push("/")
}
</script>

<template>
    <ConnectingScreen
        v-if="connectionPhase !== 'connected'"
        :room-id="roomIdString"
        :phase="connectionPhase"
        :error-message="errorMessage"
        @connect="handleConnect"
    />
    <div v-else class="room-page">
        <TopBar :room-id="roomIdString" />

        <div class="room-page__body">
            <aside class="room-page__sidebar">
                <MyMediaPanel
                    :is-screen-capturing="isScreenCapturing"
                    :active-mics="activeMics"
                    :audio-devices="audioDevices"
                    @start-screen="startScreen"
                    @stop-screen="stopScreen"
                    @add-mic="handleAddMic"
                    @remove-mic="handleRemoveMic"
                />
                <ParticipantList :participants="peerParticipants" />
            </aside>

            <main class="room-page__main">
                <RecordingControl
                    :recording-state="recordingState"
                    :is-host="isHostRole"
                    @start-recording="handleStartRecording"
                    @stop-recording="handleStopRecording"
                />

                <button class="room-page__leave" @click="handleLeaveRoom">
                    退出する
                </button>
            </main>
        </div>
    </div>
</template>

<style scoped lang="scss">
.room-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;

    &__body {
        display: flex;
        flex: 1;
        gap: 16px;
        padding: 16px;
    }

    &__sidebar {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 280px;
        flex-shrink: 0;
    }

    &__main {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
    }

    &__leave {
        padding: 8px 16px;
        border: 1px solid #e94560;
        background: transparent;
        color: #e94560;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.8125rem;

        &:hover {
            background: #e94560;
            color: #fff;
        }
    }
}
</style>
