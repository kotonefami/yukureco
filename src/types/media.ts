/** メディアストリーム・録画関連の型定義 */

/** 録画状態 */
export enum RecordingState {
    IDLE = "idle",
    RECORDING = "recording",
    PAUSED = "paused",
    STOPPED = "stoped",
}

/** 録画ファイル情報 */
export interface RecordedFile {
    blob: Blob
    timestamp: number
    peerId: string
    deviceId: string
    type: "screen" | "mic"
}

/** メディアストリームの種類 */
export interface MediaStreams {
    screenStream: MediaStream | null
    micStream: MediaStream | null
    cameraStream: MediaStream | null
}

/** オーディオ入力デバイス情報 */
export interface AudioDeviceInfo {
    deviceId: string
    label: string
}

/** アクティブなマイク入力 */
export interface ActiveMicInfo {
    deviceId: string
    label: string
    stream: MediaStream
}
