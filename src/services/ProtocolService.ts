import { MessageType } from "@/types/protocol"
import type {
    ProtocolMessage,
    RecordStartMessage,
    RecordStopMessage,
    ParticipantInfoMessage,
} from "@/types/protocol"

/** DataChannel 上のプロトコルメッセージのシリアライズ・デシリアライズを行うクラス */
export class ProtocolService {
    /** プロトコルメッセージをシリアライズします。 */
    public serialize(message: ProtocolMessage): string {
        return JSON.stringify(message)
    }

    /** 受信データをプロトコルメッセージにデシリアライズします。 */
    public deserialize(data: unknown): ProtocolMessage {
        if (typeof data === "string") {
            data = JSON.parse(data)
        }

        if (typeof data !== "object" || data === null) {
            throw new Error("Invalid message data")
        }

        const message = data as Record<string, unknown>

        if (typeof message.type !== "string") {
            throw new Error("Message type is missing or invalid")
        }

        const validTypes = Object.values(MessageType) as string[]
        if (!validTypes.includes(message.type)) {
            throw new Error(`Unknown message type: ${message.type}`)
        }

        return message as unknown as ProtocolMessage
    }

    /** 録画開始メッセージを生成します。 */
    public createRecordStartMessage(senderId: string): RecordStartMessage {
        return {
            type: MessageType.RECORD_START,
            timestamp: Date.now(),
            senderId,
            syncTimestamp: performance.now(),
        }
    }

    /** 録画停止メッセージを生成します。 */
    public createRecordStopMessage(senderId: string): RecordStopMessage {
        return {
            type: MessageType.RECORD_STOP,
            timestamp: Date.now(),
            senderId,
        }
    }

    /** 参加者情報メッセージを生成します。 */
    public createParticipantInfoMessage(
        senderId: string,
        displayName: string,
    ): ParticipantInfoMessage {
        return {
            type: MessageType.PARTICIPANT_INFO,
            timestamp: Date.now(),
            senderId,
            displayName,
        }
    }
}
