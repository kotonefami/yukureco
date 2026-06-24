/** DataChannel プロトコルメッセージの型定義 */

/** プロトコルメッセージの種別 */
export enum MessageType {
  RECORD_START = 'record-start',
  RECORD_STOP = 'record-stop',
  SYNC_REQUEST = 'sync-request',
  PARTICIPANT_INFO = 'participant-info',
  PARTICIPANT_JOIN = 'participant-join',
  PARTICIPANT_LEAVE = 'participant-leave',
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

/** プロトコルメッセージのユニオン型 */
export type ProtocolMessage = RecordStartMessage | RecordStopMessage | ParticipantInfoMessage
