/** DataChannel プロトコルメッセージの型定義 */

/** プロトコルメッセージの種別 */
export enum MessageType {
  RECORD_START = 'record-start',
  RECORD_STOP = 'record-stop',
  SYNC_REQUEST = 'sync-request',
  PARTICIPANT_INFO = 'participant-info',
  PARTICIPANT_JOIN = 'participant-join',
  PARTICIPANT_LEAVE = 'participant-leave',
  SYNC_RESPONSE = 'sync-response',
}

/** 基本メッセージ */
export interface BaseMessage {
  type: MessageType
  timestamp: number
  senderId: string
}

/** 録画開始メッセージ */
export interface RecordStartMessage extends BaseMessage {
  type: MessageType.RECORD_START
  /** 録画開始の基準タイムスタンプ（performance.now()） */
  syncTimestamp: number
}

/** 録画停止メッセージ */
export interface RecordStopMessage extends BaseMessage {
  type: MessageType.RECORD_STOP
}

/** 参加者情報メッセージ */
export interface ParticipantInfoMessage extends BaseMessage {
  type: MessageType.PARTICIPANT_INFO
  displayName: string
}

/** 参加者参加通知メッセージ（ホスト→全員） */
export interface ParticipantJoinMessage extends BaseMessage {
  type: MessageType.PARTICIPANT_JOIN
  /** 参加者の表示名 */
  displayName: string
}

/** 参加者退出通知メッセージ（ホスト→全員） */
export interface ParticipantLeaveMessage extends BaseMessage {
  type: MessageType.PARTICIPANT_LEAVE
}

/** 状態同期要求メッセージ（参加者→ホスト） */
export interface SyncRequestMessage extends BaseMessage {
  type: MessageType.SYNC_REQUEST
}

/** 状態同期応答メッセージ（ホスト→参加者） */
export interface SyncResponseMessage extends BaseMessage {
  type: MessageType.SYNC_RESPONSE
  /** 現在の録画状態 */
  recordingState: 'idle' | 'recording' | 'stopped'
}

/** プロトコルメッセージのユニオン型 */
export type ProtocolMessage =
  | RecordStartMessage
  | RecordStopMessage
  | ParticipantInfoMessage
  | ParticipantJoinMessage
  | ParticipantLeaveMessage
  | SyncRequestMessage
  | SyncResponseMessage
