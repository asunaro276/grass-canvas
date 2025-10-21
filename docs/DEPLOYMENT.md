# デプロイガイド

このドキュメントでは、Terraform と Lambroll を使用したデプロイ手順を説明します。

## 前提条件

以下のツールがインストールされていることを確認してください：

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [Lambroll](https://github.com/fujiwara/lambroll)
- [AWS CLI](https://aws.amazon.com/cli/) v2
- [Docker](https://www.docker.com/)
- [Make](https://www.gnu.org/software/make/)
- Node.js 20.x

### インストール方法

```bash
# Terraform
brew install terraform

# Lambroll
brew install lambroll

# AWS CLI
brew install awscli

# Docker
brew install --cask docker
```

## セットアップ

### 1. 環境変数の設定

```bash
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集
vim .env
```

必要な環境変数：
- `GITHUB_USERNAME`: GitHubユーザー名
- `GITHUB_TOKEN`: GitHub Personal Access Token（オプション）
- `LINE_CHANNEL_ACCESS_TOKEN`: LINE Messaging APIのチャネルアクセストークン
- `LINE_USER_ID`: LINEユーザーID

### 2. Terraform変数の設定

```bash
# terraform.tfvars.exampleをコピー
cp terraform/terraform.tfvars.example terraform/terraform.tfvars

# terraform.tfvarsファイルを編集
vim terraform/terraform.tfvars
```

### 3. 依存関係のインストール

```bash
npm install
```

## デプロイ手順

### 初回デプロイ

#### Step 1: Terraformでインフラをプロビジョニング

```bash
# Terraform初期化
make tf-init

# プランの確認
make tf-plan

# インフラをデプロイ
make tf-apply
```

これにより以下のリソースが作成されます：
- S3バケット（画像保存用）
- ECRリポジトリ（Dockerイメージ保存用）
- Lambda関数（プレースホルダー）
- IAMロール
- EventBridge Rules（1日4回のスケジュール）

#### Step 2: Lambdaのビルドとデプロイ

```bash
# フルデプロイ（ビルド + プッシュ + デプロイ）
make deploy
```

内部的には以下の処理が実行されます：
1. TypeScriptのビルド（`npm run build`）
2. Dockerイメージのビルド
3. ECRへのログイン
4. Dockerイメージのタグ付け
5. ECRへのプッシュ
6. Lambrollでのデプロイ

### 更新デプロイ

コードを変更した場合：

```bash
# Lambdaのみ再デプロイ
make deploy
```

インフラを変更した場合：

```bash
# Terraformで変更を適用
make tf-plan
make tf-apply

# 必要に応じてLambdaも再デプロイ
make deploy
```

## 個別コマンド

### TypeScriptのビルド

```bash
make build
# または
npm run build
```

### Dockerイメージのビルド

```bash
make docker-build
```

### ECRへのプッシュ

```bash
make docker-push
```

### Lambrollのみでデプロイ

```bash
make lambroll-deploy
```

### Terraformコマンド

```bash
# 初期化
make tf-init

# プラン確認
make tf-plan

# 適用
make tf-apply

# 削除
make tf-destroy
```

## 動作確認

### Lambda関数の手動実行

```bash
# AWS CLIで実行
aws lambda invoke \
  --function-name grass-canvas-notifier \
  --payload '{}' \
  response.json

# 結果を確認
cat response.json
```

### CloudWatch Logsの確認

```bash
# ログをリアルタイムで表示
aws logs tail /aws/lambda/grass-canvas-notifier --follow
```

## トラブルシューティング

### Terraform関連

#### 問題: State lockエラー

```bash
# Stateのロックを強制解除
cd terraform
terraform force-unlock <LOCK_ID>
```

#### 問題: リソースが既に存在する

```bash
# 既存リソースをインポート
cd terraform
terraform import aws_s3_bucket.grass_images grass-canvas-123456789012
```

### Docker関連

#### 問題: ECRへのプッシュが失敗する

```bash
# ECRに再ログイン
make ecr-login

# 再度プッシュ
make docker-push
```

#### 問題: Dockerイメージのビルドが失敗する

```bash
# キャッシュをクリアして再ビルド
docker build --no-cache -t grass-canvas:latest .
```

### Lambroll関連

#### 問題: デプロイが失敗する

```bash
# Lambrollの詳細ログを表示
lambroll deploy --image-uri <ECR_URL>:latest --debug
```

#### 問題: 環境変数が反映されない

```bash
# .envファイルを確認
cat .env

# Terraform outputsを確認
cd terraform && terraform output
```

## CI/CDへの統合

### GitHub Actions の例

```yaml
name: Deploy Grass Canvas

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1

      - name: Install dependencies
        run: npm ci

      - name: Terraform Apply
        run: make tf-apply
        env:
          TF_VAR_github_username: ${{ secrets.GITHUB_USERNAME }}
          TF_VAR_github_token: ${{ secrets.GITHUB_TOKEN }}
          TF_VAR_line_channel_access_token: ${{ secrets.LINE_CHANNEL_ACCESS_TOKEN }}
          TF_VAR_line_user_id: ${{ secrets.LINE_USER_ID }}

      - name: Deploy Lambda
        run: make deploy
```

## アンインストール

すべてのリソースを削除する場合：

```bash
# Terraformでリソースを削除
make tf-destroy
```

注意: S3バケット内のオブジェクトは自動的に削除されます（`force_destroy = true`設定のため）

## コスト管理

### 無料枠の確認

```bash
# Lambda実行回数の確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=grass-canvas-notifier \
  --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum
```

### コスト最適化

1. **実行頻度を減らす**: `terraform/terraform.tfvars`で`schedule_times`を調整
2. **Lambdaメモリを最適化**: `lambda_memory_size`を調整（最小: 128MB）
3. **画像の保持期間を短縮**: `terraform/s3.tf`のライフサイクルルールを調整

## 参考リンク

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Lambroll Documentation](https://github.com/fujiwara/lambroll)
- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
