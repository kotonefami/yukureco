import { ref, readonly, onUnmounted } from "vue"
import { MediaService } from "@/services/MediaService"
import type { AudioDeviceInfo, ActiveMicInfo } from "@/types/media"

/** ローカルメディア（画面・マイク）をリアクティブに管理するコンポーザブル */
export function useMedia() {
    const service = new MediaService()

    const screenStream = ref<MediaStream | null>(null)
    const isScreenCapturing = ref(false)
    const error = ref<string | null>(null)

    const audioDevices = ref<AudioDeviceInfo[]>([])
    const activeMics = ref<Map<string, ActiveMicInfo>>(new Map())

    /** 画面キャプチャを開始します。 */
    async function startScreen(): Promise<MediaStream> {
        error.value = null
        try {
            const stream = await service.startScreenCapture()
            screenStream.value = stream
            isScreenCapturing.value = true
            return stream
        } catch (e) {
            error.value = e instanceof Error ? e.message : String(e)
            throw e
        }
    }

    /** オーディオ入力デバイス一覧を取得します。 */
    async function fetchAudioDevices(): Promise<void> {
        try {
            audioDevices.value = await service.getAudioInputDevices()
        } catch (e) {
            error.value = e instanceof Error ? e.message : String(e)
        }
    }

    /** 指定したデバイスでマイクキャプチャを開始します。 */
    async function startMic(deviceId?: string): Promise<MediaStream> {
        error.value = null
        try {
            const stream = await service.startMicCapture(deviceId)
            const key = deviceId ?? "default"
            const device = audioDevices.value.find((d) => d.deviceId === key)
            const label = device?.label ?? (deviceId ? "マイク" : "デフォルトマイク")
            activeMics.value = new Map(activeMics.value).set(key, {
                deviceId: key,
                label,
                stream,
            })
            return stream
        } catch (e) {
            error.value = e instanceof Error ? e.message : String(e)
            throw e
        }
    }

    /** 特定のマイク、または全マイクのキャプチャを停止します。 */
    function stopMic(deviceId?: string): void {
        service.stopMicCapture(deviceId)
        if (deviceId) {
            const next = new Map(activeMics.value)
            next.delete(deviceId)
            activeMics.value = next
        } else {
            activeMics.value = new Map()
        }
    }

    /** 画面キャプチャを停止します。 */
    function stopScreen(): void {
        service.stopScreenCapture()
        screenStream.value = null
        isScreenCapturing.value = false
    }

    /** MediaRecorder インスタンスを生成します。 */
    function createRecorder(stream: MediaStream, mimeType?: string): MediaRecorder {
        return service.createRecorder(stream, mimeType)
    }

    /** 録画を開始します。 */
    function startRecording(recorder: MediaRecorder): void {
        service.startRecording(recorder)
    }

    /** 録画を停止し、Blob を取得します。 */
    function stopRecording(recorder: MediaRecorder): Promise<Blob> {
        return service.stopRecording(recorder)
    }

    /** 全リソースをクリーンアップします。 */
    function cleanupAll(): void {
        stopScreen()
        stopMic()
    }

    onUnmounted(() => {
        cleanupAll()
    })

    return {
        screenStream: readonly(screenStream),
        isScreenCapturing: readonly(isScreenCapturing),
        audioDevices: readonly(audioDevices),
        activeMics: readonly(activeMics),
        error: readonly(error),
        startScreen,
        stopScreen,
        startMic,
        stopMic,
        fetchAudioDevices,
        createRecorder,
        startRecording,
        stopRecording,
        cleanupAll,
    }
}
