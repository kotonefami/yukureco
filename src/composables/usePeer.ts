import { ref, readonly, onUnmounted } from 'vue'
import { PeerService } from '@/services/PeerService'
import { ProtocolService } from '@/services/ProtocolService'
import { PeerConnectionState } from '@/types/peer'
import { MessageType } from '@/types/protocol'
import type { Participant, DataMessageHandler } from '@/types/peer'
import type {
  ParticipantInfoMessage,
  ParticipantJoinMessage,
  ParticipantLeaveMessage,
} from '@/types/protocol'

/** Peer 接続をリアクティブに管理するコンポーザブル */
export function usePeer() {
  const service = new PeerService()
  const protocolService = new ProtocolService()

  const connectionState = ref<PeerConnectionState>(PeerConnectionState.DISCONNECTED)
  const selfInfo = ref<Participant | null>(null)
  const participants = ref<Participant[]>([])
  const error = ref<string | null>(null)
  const isHost = ref(false)

  const externalDataHandlers = new Set<DataMessageHandler>()
  let internalHandlerInstalled = false

  service.onConnectionStateChange((state) => {
    connectionState.value = state
  })

  service.onParticipantLeave((peerId) => {
    participants.value = participants.value.filter((p) => p.peerId !== peerId)
    if (isHost.value) {
      const leaveMsg = protocolService.createParticipantLeaveMessage(peerId)
      service.broadcast(protocolService.serialize(leaveMsg))
    }
  })

  /** 内部メッセージハンドラをインストールします。 */
  function installInternalHandler(): void {
    if (internalHandlerInstalled) return
    internalHandlerInstalled = true

    service.onDataMessage((data: unknown) => {
      let parsed: ReturnType<typeof protocolService.deserialize> | null = null
      try {
        parsed = protocolService.deserialize(data)
      } catch {
        // パース不可 → 外部ハンドラへ委譲
      }

      if (parsed) {
        switch (parsed.type) {
          case MessageType.PARTICIPANT_INFO: {
            const info = parsed as ParticipantInfoMessage
            const exists = participants.value.some(
              (p) => p.peerId === info.senderId,
            )
            if (exists) {
              participants.value = participants.value.map((p) =>
                p.peerId === info.senderId
                  ? { ...p, displayName: info.displayName }
                  : p,
              )
            } else {
              participants.value = [
                ...participants.value,
                {
                  peerId: info.senderId,
                  displayName: info.displayName,
                  joinedAt: Date.now(),
                },
              ]
            }

            // 新しい参加者を既存参加者に通知
            const joinMsg = protocolService.createParticipantJoinMessage(
              info.senderId,
              info.displayName,
            )
            service.broadcast(protocolService.serialize(joinMsg))

            // 既存の全参加者を新しい参加者に通知
            for (const p of participants.value) {
              if (p.peerId !== info.senderId) {
                const existingMsg = protocolService.createParticipantJoinMessage(
                  p.peerId,
                  p.displayName,
                )
                service.sendTo(info.senderId, protocolService.serialize(existingMsg))
              }
            }
            return
          }

          case MessageType.PARTICIPANT_JOIN: {
            const join = parsed as ParticipantJoinMessage
            if (selfInfo.value?.peerId !== join.senderId) {
              const exists = participants.value.some(
                (p) => p.peerId === join.senderId,
              )
              if (!exists) {
                participants.value = [
                  ...participants.value,
                  {
                    peerId: join.senderId,
                    displayName: join.displayName,
                    joinedAt: join.timestamp,
                  },
                ]
              }
            }
            return
          }

          case MessageType.PARTICIPANT_LEAVE: {
            const leave = parsed as ParticipantLeaveMessage
            participants.value = participants.value.filter(
              (p) => p.peerId !== leave.senderId,
            )
            return
          }
        }
      }

      // 内部で処理しなかったメッセージは外部ハンドラへ委譲
      for (const handler of externalDataHandlers) {
        handler(data)
      }
    })
  }

  /** ホストとしてルームを作成します。 */
  async function createRoom(roomId: string): Promise<void> {
    isHost.value = true
    error.value = null
    installInternalHandler()
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
    isHost.value = false
    error.value = null
    installInternalHandler()
    try {
      await service.joinPeer(hostPeerId, displayName)
      selfInfo.value = service.selfInfo

      // 自分自身を参加者リストに追加
      participants.value = selfInfo.value ? [selfInfo.value] : []

      if (selfInfo.value) {
        const infoMsg = protocolService.createParticipantInfoMessage(
          selfInfo.value.peerId,
          selfInfo.value.displayName,
        )
        service.sendTo(hostPeerId, protocolService.serialize(infoMsg))
      }

      if (selfInfo.value) {
        const syncReq = protocolService.createSyncRequestMessage(
          selfInfo.value.peerId,
        )
        service.sendTo(hostPeerId, protocolService.serialize(syncReq))
      }
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
    externalDataHandlers.clear()
    internalHandlerInstalled = false
    isHost.value = false
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
    externalDataHandlers.add(handler)
  }

  /** メッセージ受信ハンドラを削除します。 */
  function offDataMessage(handler: DataMessageHandler): void {
    externalDataHandlers.delete(handler)
  }

  /** 参加者参加ハンドラを追加します。 */
  function onParticipantJoin(handler: (participant: Participant) => void): void {
    service.onParticipantJoin(handler)
  }

  /** 参加者参加ハンドラを削除します。 */
  function offParticipantJoin(handler: (participant: Participant) => void): void {
    service.offParticipantJoin(handler)
  }

  /** 参加者退出ハンドラを追加します。 */
  function onParticipantLeave(handler: (peerId: string) => void): void {
    service.onParticipantLeave(handler)
  }

  /** 参加者退出ハンドラを削除します。 */
  function offParticipantLeave(handler: (peerId: string) => void): void {
    service.offParticipantLeave(handler)
  }

  onUnmounted(() => {
    service.disconnect()
  })

  return {
    isHost: readonly(isHost),
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
    onParticipantJoin,
    offParticipantJoin,
    onParticipantLeave,
    offParticipantLeave,
  }
}
