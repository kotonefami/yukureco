# yukureco

OBS不要・完全サーバーレスの複数人ゲーム実況録画システム。

## プロジェクトの目的
参加者に OBS などの配信ソフトを一切強制せず、ブラウザだけで以下を実現する、ゆっくり実況用のマルチトラック動画生成システムを構築する:
- 複数人で Discord 通話のように参加可能
- ホストが録画命令を出すと、全参加者が任意に設定したウィンドウ映像・ウィンドウ音声・マイク音声・カメラなど（つまり、Web で取得可能なすべてのメディア）を同時に録画開始
- 参加者のマイク音声は、ボイスチェンジャーで変換した音声を通話相手に送信しつつ、元の生声もローカル録音して字幕抽出に利用（将来的）

## データフローとコア機能

### 画面・ゲーム音の取得
各ブラウザの `getDisplayMedia({ video: true, audio: true })` でゲーム映像とゲーム音（システムサウンド）を取得。

### 音声の二股分岐（Web Audio API）
マイク入力を2つに分岐させる。
- ルートA（生声）: 字幕解析（Whisper）用に、そのままローカルの MediaRecorder へ送って録音。
- ルートB（ボイチェン声）: 音声処理（ピッチ変更等）を施した後、PeerJS の `peer.call()` で通話相手に送信。
  - なお、現状内部的なルートが**分岐可能な設計にしておくだけ**で、実際のボイチェン処理は後回し

### ミリ秒単位の録画同期（DataChannel）
ホストが「録画開始」を押した瞬間、PeerJS の DataChannel（`peer.connect()`）を介して全員のブラウザに一斉にシグナルを送信。
各ブラウザの JavaScript で `mediaRecorder.start()` を同時に自動実行させ、開始時刻のズレを最小化する。

### クライアント側でのローカル録画
音量調整（マルチトラック化）を可能にするため、各ブラウザで以下の2ファイルを同時にローカル保存させる。
- ファイル1: ゲーム映像 ＋ ゲーム音（.webm 等）
- ファイル2: ボイチェン前の生マイク音声（.wav 等）

### 手元での合体（FFmpeg、ここはこのアプリ外の機能であるため実装しない）
手動で回収した全員のファイルを、FFmpeg の `-c copy` コマンドで1つのマルチトラック動画（.mkv 等）に劣化なしで一瞬で結合する。
同時に、生マイク音声から Whisper で .srt ファイルを自動抽出する。

## 技術スタック

- フロントエンド: Vue 3 + TypeScript + Vite
- P2P通信: PeerJS（公式パブリックサーバーを間借りし、シグナリングサーバーは自前で立てない）
- 音声処理: Web Audio API
- 録画・録音: MediaRecorder API
- スタイル: SCSS（sass-embedded）
- 後処理・編集用: FFmpeg（ローカルPCでの結合処理）、Whisper（字幕抽出、将来的）

## ディレクトリ構成

```
src/
├── types/
│   ├── index.ts          # 型の再エクスポート
│   ├── peer.ts           # PeerJS ラッパーの型定義
│   ├── media.ts          # メディアストリーム・録画関連の型
│   └── protocol.ts       # DataChannel プロトコルメッセージの型
├── services/             # 純粋 TypeScript のビジネスロジック層（Vue 非依存）
│   ├── PeerService.ts    # PeerJS 接続・DataChannel 管理
│   ├── AudioService.ts   # Web Audio API: AudioContext, 音声分岐, 加工
│   ├── MediaService.ts   # getUserMedia / getDisplayMedia / MediaRecorder
│   └── ProtocolService.ts # DataChannel 上のプロトコルメッセージの送受信
├── composables/          # Vue コンポーザブル（Service をラップしてリアクティブに）
│   ├── usePeer.ts        # Peer 接続状態のリアクティブラッパー
│   ├── useMedia.ts       # ローカルメディア（画面・マイク・カメラ）の管理
│   ├── useAudio.ts       # 音声分岐・ボイチェンルーティング制御
│   ├── useRecording.ts   # 録画命令の受信・MediaRecorder 制御
│   └── useRoom.ts        # 参加者一覧・ロール管理（単一リアクティブストア）
├── components/
│   ├── TopBar.vue        # アプリ共通ヘッダー
│   ├── MyMediaPanel.vue  # 自分の画面・マイク状態表示
│   ├── ParticipantList.vue # 参加者一覧
│   ├── ParticipantVideo.vue # リモート参加者の音声インジケーター
│   ├── RecordingControl.vue # 録画開始/停止ボタン（ホストのみ）
│   └── RoomJoinForm.vue  # ルーム参加フォーム
├── views/
│   ├── TopPage.vue       # トップページ（ルーム作成/参加）
│   └── RoomPage.vue      # ルーム内ページ（通話＋録画）
├── router/
│   └── index.ts          # ルート定義（/ と /room/:id）
├── App.vue
└── main.ts
```

## レイヤー構造

```
UI Layer (Vue Components)
    ↓ 使用
Composable Layer (useXxx: リアクティブ + ライフサイクル管理)
    ↓ ラップ
Service Layer (PeerService, AudioService, MediaService, ProtocolService)
    ↓ 内部利用
Native APIs (PeerJS, Web Audio API, MediaRecorder API)
```

- **Service 層**: Vue に一切依存しない純粋 TypeScript クラス。テスト容易性と移植性を担保。
- **Composable 層**: Service をラップし、`ref` / `reactive` で Vue コンポーネントにリアクティブな状態を提供。`onMounted` / `onUnmounted` でリソースのライフサイクル管理。
- **Component 層**: Composable だけに依存し、Service を直接触らない。

## ルーティング

| Path | View | 説明 |
|------|------|------|
| `/` | `TopPage` | ルームID作成 or 参加フォーム |
| `/room/:id` | `RoomPage` | 通話・録画セッション |

## 各 Service の責務

### PeerService
- `createPeer(roomId: string): Promise<Peer>` — ホスト用 Peer 作成
- `joinPeer(hostId: string): Promise<{peer, conn}>` — 参加者用接続
- `getOrCreateDataChannel(conn): DataChannel` — DataChannel 確立
- `callPeer(peerId, stream): MediaConnection` — 音声発信
- `answerCall(call, stream): void` — 音声応答
- イベント: `onParticipantJoin`, `onParticipantLeave`, `onDataMessage`

### AudioService
- `createContext(): AudioContext`
- `createSplitter(input: MediaStream): { raw, processed }` — 音声二股分岐
- `applyVoiceEffect(processedNode, options?)` — ボイチェン（将来的）
- `getRawStream(): MediaStream` / `getProcessedStream(): MediaStream`

### MediaService
- `startScreenCapture(): Promise<MediaStream>` — `getDisplayMedia`
- `startMicCapture(): Promise<MediaStream>` — `getUserMedia({audio})`
- `createRecorder(stream, mimeType): MediaRecorder`
- `startRecording(recorder)` / `stopRecording(recorder): Promise<Blob>`

### ProtocolService
- DataChannel 上のメッセージシリアライズ/デシリアライズ
- メッセージ種別: `record-start`, `record-stop`, `sync-request`, `participant-info`
- ホスト/クライアントで振る舞いを出し分け

## ルームID 方式

- ホストの Peer ID: `yukureco-room-${code}`（例: `yukureco-room-A7K3`）
- 参加者へは `code` 部分のみ伝達し、内部でフル Peer ID を再構築

## 通話トポロジー

- スター型（ホスト中継）。ホストが全参加者と `peer.call()` で音声接続。
- 将来的に接続トポロジーを切り替え可能な設計。

## 音声二股分岐

```
getUserMedia({audio})
         │
         ▼
    AudioContext
         │
    createMediaStreamSource
         │
    createChannelSplitter
         ├──────────────┐
         ▼              ▼
    MediaStream    MediaStreamAudio
    (加工なし)     DestinationNode
         │              │
         ▼         BiquadFilterNode
  MediaRecorder     (将来のボイチェン)
  (生声録音用)          │
                   MediaStream
                       │
                  peer.call() で送信
```

## 録画同期プロトコル

1. ホストが DataChannel で `{type: "record-start", timestamp: performance.now()}` をブロードキャスト
2. 全クライアントが受信と同時に `mediaRecorder.start()` を実行
3. 各クライアントは以下をローカル保存:
   - `screen-{peerId}-{timestamp}.webm`（ゲーム映像＋ゲーム音）
   - `mic-{peerId}-{timestamp}.webm`（生マイク音声）
4. ホストが `{type: "record-stop"}` を送信 → 全クライアントが停止・保存

## 実装フェーズ

### Phase 1: 基盤サービス
- 型定義（peer.ts, media.ts, protocol.ts）
- PeerService: ホスト Peer 作成、参加者接続、DataChannel
- ProtocolService: メッセージ型定義と送受信

### Phase 2: メディア処理
- MediaService: 画面/マイク取得、Recorder 生成
- AudioService: AudioContext、音声二股分岐
- コンポーザブル（useAudio, useMedia）

### Phase 3: UI + ルーム制御
- ルーター設定
- TopPage（ルーム作成＋参加フォーム）
- RoomPage（参加者一覧、録画コントロール）
- useRecording（録画命令受信/MediaRecorder 制御）

### Phase 4: 音声通話

**トポロジー:** スター型（ホスト中継）。PeerJS の `peer.call()` / `peer.on("call")` を使用。

**ホスト側:**
1. 参加者が DataChannel 接続してきたタイミングで `peer.call(participantId, hostProcessedMic)` を発信
2. 参加者からの着信 `peer.on("call")` を `call.answer(hostProcessedMic)` で応答し、参加者の音声ストリームを取得
3. 参加者の音声を `<audio>` 要素で再生（ホストだけが全員の音声を聴ける）

**参加者側:**
1. ホストへの DataChannel 接続確立後、`peer.call(hostId, participantProcessedMic)` を発信
2. ホストからの着信 `peer.on("call")` を `call.answer(participantProcessedMic)` で応答し、ホストの音声ストリームを取得
3. ホストの音声を `<audio>` 要素で再生

**音声二股分岐との連携:**
- `AudioService.createSplitter(micStream)` が返す `processed` ストリームを `peer.call()` に渡す
- `raw` ストリームは従来通りローカルの `MediaRecorder` へ

**新規ファイル:**
- `composables/useAudioStream.ts` — 音声発信・着信応答・リモート音声管理のライフサイクルを担当
