/** 音声二股分岐の結果 */
export interface SplitterResult {
    raw: MediaStream
    processed: MediaStream
}

/** Web Audio API による音声処理を管理するクラス */
export class AudioService {
    /** AudioContext インスタンス */
    private context: AudioContext | null = null

    /** AudioContext を作成します。 */
    public createContext(): AudioContext {
        this.context = new AudioContext()
        return this.context
    }

    /** AudioContext を取得します。 */
    public getContext(): AudioContext | null {
        return this.context
    }

    /** AudioContext を閉じます。 */
    public closeContext(): void {
        if (this.context) {
            this.context.close()
            this.context = null
        }
    }

    /** マイク入力を生声と加工用に二股分岐します。 */
    public createSplitter(input: MediaStream): SplitterResult {
        if (!this.context) {
            throw new Error("AudioContext が作成されていません")
        }

        const source = this.context.createMediaStreamSource(input)

        // 分岐用の出力ノード（生声用）
        const rawDestination = this.context.createMediaStreamDestination()
        // 分岐用の出力ノード（加工音声用）
        const processedDestination = this.context.createMediaStreamDestination()

        // チャンネルスプリッターで二股分岐
        const splitter = this.context.createChannelSplitter(2)
        const mergerRaw = this.context.createChannelMerger(2)
        const mergerProcessed = this.context.createChannelMerger(2)

        source.connect(splitter)
        splitter.connect(mergerRaw, 0, 0)
        splitter.connect(mergerRaw, 1, 1)
        splitter.connect(mergerProcessed, 0, 0)
        splitter.connect(mergerProcessed, 1, 1)

        mergerRaw.connect(rawDestination)
        mergerProcessed.connect(processedDestination)

        return {
            raw: rawDestination.stream,
            processed: processedDestination.stream,
        }
    }
}
