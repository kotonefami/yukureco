import { ref, readonly, onUnmounted } from 'vue'
import { AudioService } from '@/services/AudioService'

/** 音声分岐・ボイチェンルーティングをリアクティブに管理するコンポーザブル */
export function useAudio() {
  const service = new AudioService()

  const isInitialized = ref(false)
  const error = ref<string | null>(null)

  /** AudioContext を初期化します。 */
  function initAudio(): AudioContext {
    error.value = null
    try {
      const ctx = service.createContext()
      isInitialized.value = true
      return ctx
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    }
  }

  /** 音声二股分岐を作成します。 */
  function createSplitter(input: MediaStream) {
    error.value = null
    try {
      return service.createSplitter(input)
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    }
  }

  /** AudioContext をクリーンアップします。 */
  function cleanup(): void {
    service.closeContext()
    isInitialized.value = false
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    isInitialized: readonly(isInitialized),
    error: readonly(error),
    initAudio,
    createSplitter,
    cleanup,
  }
}
