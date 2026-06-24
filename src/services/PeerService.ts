import { Peer, type DataConnection, type MediaConnection } from 'peerjs'
import type { Participant, DataMessageHandler } from '@/types/peer'
import { PeerConnectionState } from '@/types/peer'

export class PeerService {
  /** PeerJS の Peer インスタンス */
  private peer: Peer | null = null
  /** 接続済みの DataConnection マップ */
  private connections: Map<string, DataConnection> = new Map()
  /** 接続済みの MediaConnection マップ */
  private mediaConnections: Map<string, MediaConnection> = new Map()
  /** 自分自身の参加者情報 */
  private selfParticipant: Participant | null = null
  /** DataChannel メッセージ受信ハンドラの集合 */
  private dataMessageHandlers: Set<DataMessageHandler> = new Set()
  /** 参加者参加ハンドラの集合 */
  private participantJoinHandlers: Set<(participant: Participant) => void> = new Set()
  /** 参加者退出ハンドラの集合 */
  private participantLeaveHandlers: Set<(peerId: string) => void> = new Set()
  /** 接続状態変更ハンドラの集合 */
  private connectionStateHandlers: Set<(state: PeerConnectionState) => void> = new Set()
  /** 現在の接続状態 */
  private _connectionState: PeerConnectionState = PeerConnectionState.DISCONNECTED

  /** 現在の接続状態を取得します。 */
  public get connectionState(): PeerConnectionState {
    return this._connectionState
  }

  /** 自分自身の参加者情報を取得します。 */
  public get selfInfo(): Participant | null {
    return this.selfParticipant
  }

  /** 参加者一覧を取得します。 */
  public getParticipants(): Participant[] {
    const participants: Participant[] = []
    if (this.selfParticipant) {
      participants.push(this.selfParticipant)
    }
    return participants
  }

  /**
   * 接続状態を更新し、変更ハンドラを呼び出します。
   * @param state 新しい接続状態
   */
  private setConnectionState(state: PeerConnectionState): void {
    this._connectionState = state
    for (const handler of this.connectionStateHandlers) {
      handler(state)
    }
  }

  /**
   * DataConnection のメッセージ受信ハンドラを設定します。
   * @param connection 対象の DataConnection
   */
  private setupDataChannel(connection: DataConnection): void {
    connection.on('data', (data: unknown) => {
      for (const handler of this.dataMessageHandlers) {
        handler(data)
      }
    })
  }

  /**
   * ホストとして Peer を作成します。
   * @param roomId ルーム ID
   * @returns 作成された Peer インスタンス
   */
  public async createPeer(roomId: string): Promise<Peer> {
    this.setConnectionState(PeerConnectionState.CONNECTING)

    const peer = new Peer(`yukureco-room-${roomId}`)

    peer.on('open', (id: string) => {
      this.selfParticipant = {
        peerId: id,
        displayName: 'Host',
        joinedAt: Date.now(),
      }
      this.setConnectionState(PeerConnectionState.CONNECTED)
    })

    peer.on('connection', (connection: DataConnection) => {
      this.connections.set(connection.peer, connection)
      this.setupDataChannel(connection)

      const participant: Participant = {
        peerId: connection.peer,
        displayName: 'Guest',
        joinedAt: Date.now(),
      }
      for (const handler of this.participantJoinHandlers) {
        handler(participant)
      }

      connection.on('close', () => {
        this.connections.delete(connection.peer)
        for (const handler of this.participantLeaveHandlers) {
          handler(connection.peer)
        }
      })
    })

    peer.on('call', (call: MediaConnection) => {
      this.mediaConnections.set(call.peer, call)
    })

    peer.on('error', () => {
      this.setConnectionState(PeerConnectionState.ERROR)
    })

    peer.on('disconnected', () => {
      this.setConnectionState(PeerConnectionState.DISCONNECTED)
    })

    this.peer = peer
    return peer
  }

  /**
   * 参加者としてホストに接続します。
   * @param hostPeerId ホストの Peer ID
   * @param displayName 表示名
   * @returns Peer インスタンスと DataConnection
   */
  public async joinPeer(
    hostPeerId: string,
    displayName: string = 'Guest',
  ): Promise<{ peer: Peer; conn: DataConnection }> {
    this.setConnectionState(PeerConnectionState.CONNECTING)

    const peer = new Peer()

    return new Promise((resolve, reject) => {
      peer.on('open', (id: string) => {
        const conn = peer.connect(hostPeerId, { reliable: true })

        conn.on('open', () => {
          this.connections.set(conn.peer, conn)
          this.setupDataChannel(conn)

          this.selfParticipant = {
            peerId: id,
            displayName,
            joinedAt: Date.now(),
          }

          this.setConnectionState(PeerConnectionState.CONNECTED)
          resolve({ peer, conn })
        })

        conn.on('error', (err) => {
          this.setConnectionState(PeerConnectionState.ERROR)
          reject(err)
        })
      })

      peer.on('error', (err) => {
        this.setConnectionState(PeerConnectionState.ERROR)
        reject(err)
      })
    })
  }

  /** 切断します。 */
  public disconnect(): void {
    for (const connection of this.connections.values()) {
      connection.close()
    }
    this.connections.clear()

    for (const mediaConnection of this.mediaConnections.values()) {
      mediaConnection.close()
    }
    this.mediaConnections.clear()

    if (this.peer) {
      this.peer.destroy()
      this.peer = null
    }

    this.selfParticipant = null
    this.dataMessageHandlers.clear()
    this.participantJoinHandlers.clear()
    this.participantLeaveHandlers.clear()
    this.connectionStateHandlers.clear()

    this.setConnectionState(PeerConnectionState.DISCONNECTED)
  }

  /**
   * 全参加者に DataChannel メッセージを送信します。
   * @param data 送信するデータ
   */
  public broadcast(data: unknown): void {
    for (const connection of this.connections.values()) {
      connection.send(data)
    }
  }

  /**
   * 特定の参加者に DataChannel メッセージを送信します。
   * @param peerId 送信先の Peer ID
   * @param data 送信するデータ
   */
  public sendTo(peerId: string, data: unknown): void {
    const connection = this.connections.get(peerId)
    if (connection) {
      connection.send(data)
    }
  }

  /**
   * 音声を発信します。
   * @param peerId 接続先の Peer ID
   * @param stream 送信する MediaStream
   * @returns 作成された MediaConnection
   */
  public callPeer(peerId: string, stream: MediaStream): MediaConnection {
    const call = this.peer!.call(peerId, stream)
    this.mediaConnections.set(call.peer, call)
    return call
  }

  /**
   * 音声に応答します。
   * @param call 応答する MediaConnection
   * @param stream 送信する MediaStream
   */
  public answerCall(call: MediaConnection, stream: MediaStream): void {
    call.answer(stream)
  }

  /**
   * メッセージ受信ハンドラを追加します。
   * @param handler 追加するハンドラ
   */
  public onDataMessage(handler: DataMessageHandler): void {
    this.dataMessageHandlers.add(handler)
  }

  /**
   * メッセージ受信ハンドラを削除します。
   * @param handler 削除するハンドラ
   */
  public offDataMessage(handler: DataMessageHandler): void {
    this.dataMessageHandlers.delete(handler)
  }

  /**
   * 参加者参加ハンドラを追加します。
   * @param handler 追加するハンドラ
   */
  public onParticipantJoin(handler: (participant: Participant) => void): void {
    this.participantJoinHandlers.add(handler)
  }

  /**
   * 参加者参加ハンドラを削除します。
   * @param handler 削除するハンドラ
   */
  public offParticipantJoin(handler: (participant: Participant) => void): void {
    this.participantJoinHandlers.delete(handler)
  }

  /**
   * 参加者退出ハンドラを追加します。
   * @param handler 追加するハンドラ
   */
  public onParticipantLeave(handler: (peerId: string) => void): void {
    this.participantLeaveHandlers.add(handler)
  }

  /**
   * 参加者退出ハンドラを削除します。
   * @param handler 削除するハンドラ
   */
  public offParticipantLeave(handler: (peerId: string) => void): void {
    this.participantLeaveHandlers.delete(handler)
  }

  /**
   * 接続状態変更ハンドラを追加します。
   * @param handler 追加するハンドラ
   */
  public onConnectionStateChange(handler: (state: PeerConnectionState) => void): void {
    this.connectionStateHandlers.add(handler)
  }
}
