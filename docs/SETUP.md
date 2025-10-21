# セットアップガイド

## 前提条件

- Node.js 20.x以上
- AWS CLI設定済み
- AWS CDKインストール済み (`npm install -g aws-cdk`)

## 1. GitHubトークンの取得

1. GitHubにログイン
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. "Generate new token" をクリック
4. スコープで `read:user` にチェック
5. トークンをコピーして保存

## 2. LINE Messaging APIの設定

### チャネルの作成

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. プロバイダーを作成（既存のものでもOK）
3. 「Messaging API」チャネルを作成
4. チャネル名、説明などを入力

### アクセストークンの取得

1. 作成したチャネルの「Messaging API」タブを開く
2. 「チャネルアクセストークン（長期）」を発行
3. トークンをコピーして保存

### ユーザーIDの取得

1. チャネルの「Messaging API」タブを開く
2. 「あなたのユーザーID」をコピー
3. QRコードをスキャンしてLINE公式アカウントを友だち追加

### Webhookの設定（オプション）

- 今回はPush通知のみなので、Webhookの設定は不要です
- 「応答メッセージ」と「あいさつメッセージ」はOFFにすることを推奨

## 3. 環境変数の設定

```bash
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集
# GITHUB_USERNAME: あなたのGitHubユーザー名
# GITHUB_TOKEN: 手順1で取得したトークン
# LINE_CHANNEL_ACCESS_TOKEN: 手順2で取得したアクセストークン
# LINE_USER_ID: 手順2で取得したユーザーID
```

## 4. 依存関係のインストール

```bash
npm install
```

## 5. ビルド

```bash
npm run build
```

## 6. AWSへのデプロイ

### 初回のみ: CDKのブートストラップ

```bash
cdk bootstrap
```

### デプロイ

```bash
# .envファイルを読み込んでデプロイ
export $(cat .env | xargs) && cdk deploy
```

デプロイが完了すると、以下のリソースが作成されます：

- Lambda関数: `grass-canvas-notifier`
- S3バケット: `grass-canvas-{アカウントID}`
- EventBridge Rules: 1日4回の実行スケジュール
  - 朝9時 (JST)
  - 昼12時 (JST)
  - 夕方18時 (JST)
  - 夜21時 (JST)

## 7. 動作確認

### 手動実行

```bash
# Lambda関数を手動実行
aws lambda invoke \
  --function-name grass-canvas-notifier \
  --payload '{}' \
  response.json

# 結果を確認
cat response.json
```

### CloudWatch Logsで確認

```bash
# ログを確認
aws logs tail /aws/lambda/grass-canvas-notifier --follow
```

## トラブルシューティング

### Canvas関連のエラー

Lambda環境でcanvasを使用する場合、ネイティブモジュールのビルドが必要です。
CDKの設定で自動的に処理されますが、エラーが出る場合は以下を確認：

1. Lambda Layerとして含まれているか
2. Node.js 20.xを使用しているか

### LINE通知が届かない

1. LINE_USER_IDが正しいか確認
2. LINE_CHANNEL_ACCESS_TOKENが正しいか確認
3. LINE公式アカウントを友だち追加しているか確認
4. CloudWatch Logsでエラーメッセージを確認

### S3の画像にアクセスできない

1. バケットのパブリックアクセスが有効か確認
2. CORSの設定が正しいか確認

## コスト管理

すべて無料枠内で運用可能ですが、念のため：

- [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/home)で月次コストを確認
- [CloudWatch メトリクス](https://console.aws.amazon.com/cloudwatch/)でLambda実行回数を確認

## アンインストール

```bash
# スタックを削除
cdk destroy

# 確認プロンプトで 'y' を入力
```

これで、Lambda関数、S3バケット、EventBridge Rulesがすべて削除されます。
