import type { AudioDeviceInfo } from "@/types/media"

/** 画面・マイクのキャプチャと MediaRecorder を管理するクラス */
export class MediaService {
    /** 画面キャプチャの MediaStream */
    private screenStream: MediaStream | null = null
    /** 複数アクティブなマイクストリーム (deviceId -> MediaStream) */
    private activeMicStreams: Map<string, MediaStream> = new Map()

    /** 画面キャプチャを開始します。 */
    public async startScreenCapture(): Promise<MediaStream> {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
        })
        this.screenStream = stream
        return stream
    }

    /** 利用可能なオーディオ入力デバイス一覧を取得します。 */
    public async getAudioInputDevices(): Promise<AudioDeviceInfo[]> {
        const devices = await navigator.mediaDevices.enumerateDevices()
        return devices
            .filter((d) => d.kind === "audioinput")
            .map((d) => ({ deviceId: d.deviceId, label: d.label || "マイク" }))
    }

    /** マイクキャプチャを開始します。 */
    public async startMicCapture(deviceId?: string): Promise<MediaStream> {
        const constraints: MediaStreamConstraints = {
            audio: deviceId
                ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true }
                : { echoCancellation: true, noiseSuppression: true },
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        const key = deviceId ?? "default"
        this.activeMicStreams.set(key, stream)
        return stream
    }

    /** 特定のマイク、または全マイクのキャプチャを停止します。 */
    public stopMicCapture(deviceId?: string): void {
        if (deviceId) {
            const stream = this.activeMicStreams.get(deviceId)
            if (stream) {
                for (const track of stream.getTracks()) {
                    track.stop()
                }
                this.activeMicStreams.delete(deviceId)
            }
        } else {
            for (const stream of this.activeMicStreams.values()) {
                for (const track of stream.getTracks()) {
                    track.stop()
                }
            }
            this.activeMicStreams.clear()
        }
    }

    /** アクティブなマイクストリームのマップを取得します。 */
    public getMicStreams(): Map<string, MediaStream> {
        return this.activeMicStreams
    }

    /** 画面キャプチャを停止します。 */
    public stopScreenCapture(): void {
        if (this.screenStream) {
            for (const track of this.screenStream.getTracks()) {
                track.stop()
            }
            this.screenStream = null
        }
    }

    /** MediaRecorder インスタンスを生成します。 */
    public createRecorder(stream: MediaStream, mimeType?: string): MediaRecorder {
        const options: MediaRecorderOptions = {}
        if (mimeType && MediaRecorder.isTypeSupported(mimeType)) {
            options.mimeType = mimeType
        }
        return new MediaRecorder(stream, options)
    }

    /** 録画を開始します。 */
    public startRecording(recorder: MediaRecorder): void {
        recorder.start()
    }

    /** 録画を停止し、Blob を取得します。 */
    public stopRecording(recorder: MediaRecorder): Promise<Blob> {
        return new Promise((resolve) => {
            recorder.addEventListener("dataavailable", (event: BlobEvent) => {
                resolve(event.data)
            }, { once: true })
            recorder.stop()
        })
    }

    /** 現在の画面ストリームを取得します。 */
    public getScreenStream(): MediaStream | null {
        return this.screenStream
    }
}
