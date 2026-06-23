import { ref, readonly, onUnmounted } from "vue"
import { PeerService } from "@/services/PeerService"
import { PeerConnectionState } from "@/types/peer"
import type { Participant, DataMessageHandler } from "@/types/peer"

/** Peer 接続をリアクティブに管理するコンポーザブル */
export function usePeer() {
    const service = new PeerService()

    const connectionState = ref<PeerConnectionState>(PeerConnectionState.DISCONNECTED)
    const selfInfo = ref<Participant | null>(null)
    const participants = ref<Participant[]>([])
    const error = ref<string | null>(null)

    service.onConnectionStateChange((state) => {
        connectionState.value = state
    })

    service.onParticipantJoin((participant) => {
        participants.value = [...participants.value, participant]
    })

    service.onParticipantLeave((peerId) => {
        participants.value = participants.value.filter((p) => p.peerId !== peerId)
    })

    /** ホストとしてルームを作成します。 */
    async function createRoom(roomId: string): Promise<void> {
        error.value = null
        try {
            await service.createPeer(roomId)
            selfInfo.value = service.selfInfo
            participants.value = service.getParticipants()
        } catch (e) {
            error.value = e instanceof Error ? e.message : String(e)
            throw e
        }
    }

    /** 参加者としてルームに参加します。 */
    async function joinRoom(hostPeerId: string, displayName?: string): Promise<void> {
        error.value = null
        try {
            await service.joinPeer(hostPeerId, displayName)
            selfInfo.value = service.selfInfo
        } catch (e) {
            error.value = e instanceof Error ? e.message : String(e)
            throw e
        }
    }

    /** ルームから退出します。 */
    function leaveRoom(): void {
        service.disconnect()
        connectionState.value = PeerConnectionState.DISCONNECTED
        selfInfo.value = null
        participants.value = []
        error.value = null
    }

    /** 全参加者にメッセージを送信します。 */
    function broadcast(data: unknown): void {
        service.broadcast(data)
    }

    /** 特定の参加者にメッセージを送信します。 */
    function sendTo(peerId: string, data: unknown): void {
        service.sendTo(peerId, data)
    }

    /** メッセージ受信ハンドラを追加します。 */
    function onDataMessage(handler: DataMessageHandler): void {
        service.onDataMessage(handler)
    }

    /** メッセージ受信ハンドラを削除します。 */
    function offDataMessage(handler: DataMessageHandler): void {
        service.offDataMessage(handler)
    }

    onUnmounted(() => {
        service.disconnect()
    })

    return {
        connectionState: readonly(connectionState),
        selfInfo: readonly(selfInfo),
        participants: readonly(participants),
        error: readonly(error),
        createRoom,
        joinRoom,
        leaveRoom,
        broadcast,
        sendTo,
        onDataMessage,
        offDataMessage,
    }
}
