import { ref, readonly } from 'vue'
import type { Participant } from '@/types/peer'

/** 参加者一覧・ロール管理のリアクティブストアコンポーザブル */
export function useRoom() {
  const isHost = ref(false)
  const roomId = ref<string | null>(null)
  const participants = ref<Participant[]>([])
  const selfPeerId = ref<string | null>(null)

  /** ホストとしてルームを初期化します。 */
  function initAsHost(id: string, peerId: string): void {
    isHost.value = true
    roomId.value = id
    selfPeerId.value = peerId
  }

  /** 参加者としてルームを初期化します。 */
  function initAsParticipant(id: string, peerId: string): void {
    isHost.value = false
    roomId.value = id
    selfPeerId.value = peerId
  }

  /** 参加者を追加します。 */
  function addParticipant(participant: Participant): void {
    participants.value = [...participants.value, participant]
  }

  /** 参加者を削除します。 */
  function removeParticipant(peerId: string): void {
    participants.value = participants.value.filter((p) => p.peerId !== peerId)
  }

  /** 参加者一覧を置き換えます。 */
  function setParticipants(list: Participant[]): void {
    participants.value = list
  }

  /** ルーム状態をリセットします。 */
  function reset(): void {
    isHost.value = false
    roomId.value = null
    participants.value = []
    selfPeerId.value = null
  }

  return {
    isHost: readonly(isHost),
    roomId: readonly(roomId),
    participants: readonly(participants),
    selfPeerId: readonly(selfPeerId),
    initAsHost,
    initAsParticipant,
    addParticipant,
    removeParticipant,
    setParticipants,
    reset,
  }
}
