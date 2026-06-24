<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePeer } from '@/composables/usePeer'
import { useMedia } from '@/composables/useMedia'
import { useRecording } from '@/composables/useRecording'
import { ProtocolService } from '@/services/ProtocolService'
import TopBar from '@/components/TopBar.vue'
import BottomControls from '@/components/BottomControls.vue'
import MyMediaPanel from '@/components/MyMediaPanel.vue'
import ParticipantList from '@/components/ParticipantList.vue'
import ConnectingScreen from '@/components/ConnectingScreen.vue'
import type { ConnectionPhase } from '@/components/ConnectingScreen.vue'
import { RecordingState } from '@/types/media'
import type { Participant } from '@/types/peer'

const route = useRoute()
const router = useRouter()
const protocolService = new ProtocolService()

const {
    isHost,
    selfInfo,
    participants: peerParticipants,
    leaveRoom,
    broadcast,
    createRoom,
    joinRoom,
    sendTo,
    onDataMessage,
    offDataMessage,
    onParticipantJoin,
    offParticipantJoin,
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
    setRecordingState,
    handleRecordStart,
    handleRecordStop,
} = useRecording()

const roomIdString = route.params.id as string
const isHostRole = route.query.role === 'host' // TODO: この判別方法は問題がある
const connectionPhase = ref<ConnectionPhase>(route.query.role ? 'connecting' : 'pending')
const errorMessage = ref('')

const cleanupHandlers: (() => void)[] = []
onUnmounted(() => {
    for (const cleanup of cleanupHandlers) {
        cleanup()
    }
})

onMounted(async () => {
    if (isHostRole) {
        try {
            await createRoom(roomIdString)
            connectionPhase.value = 'connected'
        } catch (e) {
            connectionPhase.value = 'error'
            errorMessage.value = e instanceof Error ? e.message : String(e)
            setTimeout(() => router.push('/'), 5000)
        }
    } else if (route.query.role === 'participant') {
        const name = route.query.name as string
        try {
            await joinRoom(`yukureco-room-${roomIdString}`, name)
            connectionPhase.value = 'connected'
        } catch (e) {
            connectionPhase.value = 'error'
            errorMessage.value = e instanceof Error ? e.message : String(e)
            setTimeout(() => router.push('/'), 5000)
        }
    }

    // 全参加者共通: DataChannel メッセージのルーティング
    if (connectionPhase.value === 'connected') {
        setupMessageHandlers()
    }
})

let messageHandlersSetup = false

/** アクティブなマイクの Map を構築します。 */
function buildMicMap(): Map<string, { stream: MediaStream; label: string }> {
    const micMap = new Map<string, { stream: MediaStream; label: string }>()
    for (const [deviceId, info] of activeMics.value) {
        micMap.set(deviceId, { stream: info.stream as MediaStream, label: info.label })
    }
    return micMap
}

/** DataChannel メッセージハンドラと参加者ハンドラをセットアップします。 */
function setupMessageHandlers(): void {
    if (messageHandlersSetup) return
    messageHandlersSetup = true
    const dataHandler = (data: unknown) => {
        // SYNC_REQUEST: ホストのみ現在の録画状態を返信
        try {
            const message = protocolService.deserialize(data)
            if (message.type === 'sync-request' && isHost.value) {
                if (recordingState.value === RecordingState.RECORDING) {
                    const msg = protocolService.createRecordStartMessage(
                        selfInfo.value?.peerId ?? 'unknown',
                    )
                    sendTo(message.senderId, protocolService.serialize(msg))
                } else {
                    const msg = protocolService.createSyncResponseMessage(
                        selfInfo.value?.peerId ?? 'unknown',
                        recordingState.value === RecordingState.IDLE ? 'idle' : 'stopped',
                    )
                    sendTo(message.senderId, protocolService.serialize(msg))
                }
                return
            }
        } catch {
            // 無視（パースできないメッセージは後続のハンドラに任せる）
        }

        // 録画開始/停止の処理（ストリームを渡す）
        const micMap = buildMicMap()
        handleRecordStart(data, screenStream.value ?? undefined, micMap)
        handleRecordStop(data, selfInfo.value?.peerId)
    }
    onDataMessage(dataHandler)

    // ホストのみ: 新規参加者に録画状態を通知
    let joinHandler: ((participant: Participant) => void) | undefined
    if (isHost.value) {
        joinHandler = (participant: Participant) => {
            if (recordingState.value === RecordingState.RECORDING) {
                const message = protocolService.createRecordStartMessage(
                    selfInfo.value?.peerId ?? 'unknown',
                )
                sendTo(participant.peerId, protocolService.serialize(message))
            }
        }
        onParticipantJoin(joinHandler)
    }

    cleanupHandlers.push(() => {
        offDataMessage(dataHandler)
        if (joinHandler) {
            offParticipantJoin(joinHandler)
        }
    })
}

async function handleConnect(displayName: string): Promise<void> {
    connectionPhase.value = 'connecting'
    try {
        await joinRoom(`yukureco-room-${roomIdString}`, displayName)
        connectionPhase.value = 'connected'
        setupMessageHandlers()
    } catch (e) {
        connectionPhase.value = 'error'
        errorMessage.value = e instanceof Error ? e.message : String(e)
        setTimeout(() => router.push('/'), 5000)
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
    const message = protocolService.createRecordStartMessage(selfInfo.value?.peerId ?? 'unknown')
    broadcast(protocolService.serialize(message))

    // ルームの録画状態を常に設定（画面共有の有無にかかわらず）
    setRecordingState(RecordingState.RECORDING)

    // 自分が画面を共有している場合のみローカル録画を開始
    if (screenStream.value) {
        const micMap = buildMicMap()
        startLocalRecording(screenStream.value, micMap)
    }
}

async function handleStopRecording(): Promise<void> {
    const message = protocolService.createRecordStopMessage(selfInfo.value?.peerId ?? 'unknown')
    broadcast(protocolService.serialize(message))

    // ルームの録画状態を停止
    setRecordingState(RecordingState.STOPPED)

    // ローカル録画も停止（実際に録画していなければ何もしない）
    await stopLocalRecording(selfInfo.value?.peerId ?? 'unknown')
}
</script>

<template>
    <ConnectingScreen v-if="connectionPhase !== 'connected'" :room-id="roomIdString" :phase="connectionPhase"
        :error-message="errorMessage" @connect="handleConnect" />
    <div v-else class="room-page">
        <TopBar :room-id="roomIdString" />

        <div class="room-page__body">
            <div class="room-page__placeholder"></div>
            <aside class="room-page__sidebar">
                <MyMediaPanel :is-screen-capturing="isScreenCapturing" :active-mics="activeMics"
                    :audio-devices="audioDevices" @start-screen="startScreen" @stop-screen="stopScreen"
                    @add-mic="handleAddMic" @remove-mic="handleRemoveMic" />
                <ParticipantList :participants="peerParticipants" />
            </aside>
        </div>

        <BottomControls :is-host="isHost" :room-id="roomIdString" @start-recording="handleStartRecording"
            @stop-recording="handleStopRecording" />
    </div>
</template>

<style scoped lang="scss">
.room-page {
    display: flex;
    flex-direction: column;
    gap: 1em;

    padding: 1em;

    min-height: 100vh;

    &__body {
        display: flex;
        flex: 1;
        gap: 16px;
    }

    &__placeholder {
        flex: 1;
    }

    &__sidebar {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 280px;
        flex-shrink: 0;
    }
}
</style>
