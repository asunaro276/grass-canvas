# Grass Canvas

GitHubのコントリビューショングラフ（草）を画像化してLINEに通知するシステム

## 特徴

- 🌱 GitHubの草を美しい画像で通知
- ⏰ 1日4回自動実行（カスタマイズ可能）
- 💰 完全無料（AWS/LINE無料枠内で運用可能）
- 🚀 Terraform + Lambroll で簡単デプロイ

## アーキテクチャ

```
EventBridge Scheduler (1日4回)
  ↓
Lambda関数 (Docker)
  ↓
1. GitHub APIでコントリビューションデータ取得
2. Canvasで草画像生成
3. S3に画像アップロード
4. LINE Messaging APIでPush通知
```

## 技術スタック

- **Infrastructure as Code**: Terraform
- **Lambda Deployment**: Lambroll
- **Runtime**: Node.js 20.x (Docker)
- **Language**: TypeScript

## クイックスタート

### 1. 前提条件

- Terraform >= 1.0
- Lambroll
- AWS CLI v2
- Docker
- Node.js 20.x

### 2. セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/grass-canvas.git
cd grass-canvas

# 依存関係をインストール
npm install

# Terraform変数を設定
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
vim terraform/terraform.tfvars
# github_username を設定
```

### 3. SSM Parameter Store にシークレットを保存

```bash
# SSMパラメータのセットアップ（対話形式）
make setup-ssm

# または、環境変数を使って実行
export GITHUB_TOKEN="your-github-token"  # Optional
export LINE_CHANNEL_ACCESS_TOKEN="your-line-channel-access-token"
export LINE_USER_ID="your-line-user-id"
make setup-ssm
```

### 4. インフラをデプロイ

```bash
# Terraformでインフラをプロビジョニング（ECR, S3, IAM, EventBridgeなど）
make tf-init
make tf-apply
```

### 5. Lambda関数をデプロイ

```bash
# Dockerイメージをビルド、ECRにプッシュ、Lambdaにデプロイ
make deploy-all

# または、個別に実行
make docker-build  # TypeScriptビルド + Dockerイメージビルド
make docker-push   # ECRにプッシュ
make deploy-lambda # Lambdaにデプロイ
```

詳細は [セットアップガイド](docs/SETUP.md) および [デプロイガイド](docs/DEPLOYMENT.md) を参照してください。

## 設定

### 通知スケジュール

デフォルトでは1日4回（JST）通知されます：
- 9:00
- 12:00
- 18:00
- 21:00

`terraform/terraform.tfvars` で変更可能です。

### 環境変数

Lambda関数には以下の環境変数が自動で設定されます：

| 変数名 | 説明 | ソース |
|--------|------|--------|
| `GITHUB_USERNAME` | GitHubユーザー名 | terraform.tfvars |
| `S3_BUCKET_NAME` | S3バケット名 | Terraformから自動設定 |
| `SSM_GITHUB_TOKEN_PATH` | GitHub TokenのSSMパラメータパス | デフォルト値使用 |
| `SSM_LINE_CHANNEL_ACCESS_TOKEN_PATH` | LINE TokenのSSMパラメータパス | デフォルト値使用 |
| `SSM_LINE_USER_ID_PATH` | LINE User IDのSSMパラメータパス | デフォルト値使用 |

### シークレット（SSM Parameter Storeに保存）

| シークレット | 説明 | 必須 | SSMパラメータパス |
|-------------|------|------|-------------------|
| GitHub Token | GitHub Personal Access Token | ❌ | `github-token` |
| LINE Channel Access Token | LINEチャネルアクセストークン | ✅ | `/grass-canvas/line-channel-access-token` |
| LINE User ID | LINEユーザーID | ✅ | `/grass-canvas/line-user-id` |

## コスト

すべて無料枠内で運用可能：

| サービス | 使用量（月） | 無料枠 | コスト |
|---------|------------|--------|--------|
| Lambda | 120回実行 | 100万リクエスト | $0 |
| EventBridge | 120回呼び出し | 1,400万回 | $0 |
| S3 | ~10MB | 5GB | $0 |
| LINE Messaging API | 120通 | 200通 | $0 |
| **合計** | - | - | **$0** |

## ドキュメント

- [セットアップガイド](docs/SETUP.md)
- [デプロイガイド](docs/DEPLOYMENT.md)
- [アーキテクチャ](docs/ARCHITECTURE.md)

## コマンド

```bash
# SSMパラメータのセットアップ
make setup-ssm

# TypeScriptビルド
make build

# Dockerイメージビルド（TypeScriptビルドも実行）
make docker-build

# DockerイメージをECRにプッシュ
make docker-push

# Lambda関数をデプロイ
make deploy-lambda

# フルデプロイ（ビルド→プッシュ→デプロイ）
make deploy-all

# Terraformプラン確認
make tf-plan

# Terraform適用
make tf-apply

# Terraformリソース削除
make tf-destroy

# クリーンアップ
make clean

# ヘルプ
make help
```

## トラブルシューティング

問題が発生した場合は、[デプロイガイド](docs/DEPLOYMENT.md#トラブルシューティング) を参照してください。

## ライセンス

MIT
