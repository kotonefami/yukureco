/** PeerJS ラッパーの型定義 */

/** Peer 接続状態 */
export enum PeerConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/** 参加者情報 */
export interface Participant {
  peerId: string
  displayName: string
  joinedAt: number
}

/** DataChannel メッセージ受信ハンドラ */
export type DataMessageHandler = (data: unknown) => void
