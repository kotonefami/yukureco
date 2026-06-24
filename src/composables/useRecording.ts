import { ref, readonly } from 'vue'
import { RecordingState } from '@/types/media'
import { ProtocolService } from '@/services/ProtocolService'
import { MediaService } from '@/services/MediaService'

/** モジュールレベル（シングルトン）の状態 */
const recordingState = ref<RecordingState>(RecordingState.IDLE)
const recordedFiles = ref<Array<{ blob: Blob; type: 'screen' | 'mic'; deviceId: string }>>([])
const error = ref<string | null>(null)
let screenRecorder: MediaRecorder | null = null
const micRecorders: Map<string, MediaRecorder> = new Map()
let screenChunks: Blob[] = []
const micChunks: Map<string, Blob[]> = new Map()
const protocolService = new ProtocolService()
const mediaService = new MediaService()

/** 録画命令の受信・MediaRecorder 制御を管理するコンポーザブル */
export function useRecording() {
  /**
   * DataChannel から受信した録画開始メッセージを処理します。
   * 画面ストリームが利用可能な場合は実際の録画も開始します。
   * @param data 受信データ
   * @param screenStream 画面ストリーム（省略時は状態変更のみ）
   * @param micStreams マイクストリームのマップ（省略時は空）
   */
  function handleRecordStart(
    data: unknown,
    screenStream?: MediaStream,
    micStreams?: Map<string, { stream: MediaStream; label: string }>,
  ): void {
    try {
      const message = protocolService.deserialize(data)
      if (message.type === 'record-start') {
        recordingState.value = RecordingState.RECORDING
        if (screenStream) {
          const micMap = micStreams ?? new Map<string, { stream: MediaStream; label: string }>()
          startRecording(screenStream, micMap)
        }
      }
    } catch {
      // 無視
    }
  }

  /**
   * DataChannel から受信した録画停止メッセージを処理します。
   * peerId が指定されている場合は実際の録画も停止します。
   * @param data 受信データ
   * @param peerId 自分の Peer ID（省略時は状態変更のみ）
   */
  function handleRecordStop(data: unknown, peerId?: string): void {
    try {
      const message = protocolService.deserialize(data)
      if (message.type === 'record-stop') {
        recordingState.value = RecordingState.STOPPED
        if (peerId) {
          stopRecording(peerId)
        }
      }
    } catch {
      // 無視
    }
  }

  /** Blob をファイルとしてダウンロードします。 */
  function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /** 録画を開始します。 */
  function startRecording(
    screenStream: MediaStream,
    micStreams: Map<string, { stream: MediaStream; label: string }>,
  ): { screenRecorder: MediaRecorder; micRecorders: Map<string, MediaRecorder> } {
    recordedFiles.value = []
    screenChunks = []
    micChunks.clear()
    micRecorders.clear()

    screenRecorder = mediaService.createRecorder(screenStream)
    screenRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
      if (event.data.size > 0) {
        screenChunks.push(event.data)
      }
    })
    mediaService.startRecording(screenRecorder)

    for (const [deviceId, info] of micStreams) {
      const recorder = mediaService.createRecorder(info.stream)
      const chunks: Blob[] = []
      micRecorders.set(deviceId, recorder)
      micChunks.set(deviceId, chunks)
      recorder.addEventListener('dataavailable', (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      })
      mediaService.startRecording(recorder)
    }

    return { screenRecorder, micRecorders: new Map(micRecorders) }
  }

  /** 録画を停止し、ファイルをダウンロードします。 */
  async function stopRecording(peerId: string): Promise<void> {
    const stopPromises: Promise<void>[] = []

    if (screenRecorder && screenRecorder.state === 'recording') {
      stopPromises.push(
        new Promise((resolve) => {
          screenRecorder!.addEventListener('stop', () => resolve(), { once: true })
          screenRecorder!.stop()
        }),
      )
    }

    for (const recorder of micRecorders.values()) {
      if (recorder.state === 'recording') {
        stopPromises.push(
          new Promise((resolve) => {
            recorder.addEventListener('stop', () => resolve(), { once: true })
            recorder.stop()
          }),
        )
      }
    }

    await Promise.all(stopPromises)

    const timestamp = Date.now()

    if (screenChunks.length > 0) {
      const blob = new Blob(screenChunks, { type: 'video/webm' })
      const filename = `screen-${peerId}-${timestamp}.webm`
      recordedFiles.value = [...recordedFiles.value, { blob, type: 'screen', deviceId: '' }]
      downloadBlob(blob, filename)
    }

    for (const [deviceId, chunks] of micChunks) {
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const filename = `mic-${deviceId}-${timestamp}.webm`
        recordedFiles.value = [...recordedFiles.value, { blob, type: 'mic', deviceId }]
        downloadBlob(blob, filename)
      }
    }

    screenRecorder = null
    micRecorders.clear()
    screenChunks = []
    micChunks.clear()
  }

  /** 状態をリセットします。 */
  function reset(): void {
    screenRecorder = null
    micRecorders.clear()
    screenChunks = []
    micChunks.clear()
  }

  /** 録画状態を設定します。 */
  function setRecordingState(state: RecordingState): void {
    recordingState.value = state
  }

  return {
    recordingState: readonly(recordingState),
    recordedFiles: readonly(recordedFiles),
    error: readonly(error),
    handleRecordStart,
    handleRecordStop,
    startRecording,
    stopRecording,
    reset,
    setRecordingState,
  }
}
