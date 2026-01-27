# Terraform インフラストラクチャ
[English Version](../README.md)

このディレクトリには、AWS 上に PoliTopics アプリケーションインフラストラクチャをデプロイするための Terraform コードが含まれています。

## 概要

この Terraform セットアップは、以下の AWS リソースを管理します:

- **Amazon S3**: フロントエンドアプリケーションのホスティングと記事ペイロードの保存用。
- **Amazon DynamoDB**: アプリケーションデータ用の NoSQL データベース。テーブル作成は条件付きです。
- **AWS Lambda**: バックエンドサーバーレス関数。
- **API Gateway**: Lambda 関数を HTTP API として公開するため。

インフラストラクチャはモジュール化されており、主要コンポーネントは `service/` ディレクトリで定義されています。

## 前提条件

- [Terraform](https://learn.hashicorp.com/tutorials/terraform/install-cli)
- 適切な認証情報で設定された [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)。

## ディレクトリ構造

- `backends/`: 異なる環境 (`local.hcl`, `stage.hcl` など) 用のバックエンド設定を含みます。
- `modules/`: (現在未使用) 再利用可能な Terraform モジュール用。
- `service/`: S3, DynamoDB, Lambda リソースを含むコアサービスモジュール。
- `tfvars/`: 各環境 (`localstack.tfvars`, `stage.tfvars`, `prod.tfvars`) 用の変数定義ファイルを含みます。
- `main.tf`: `service` モジュールを構成するルートモジュール。
- `variables.tf`: ルート変数定義。
- `provider.tf`: AWS プロバイダ設定。

## はじめに

### 1. Terraform の初期化

コマンドを実行する前に、Terraform バックエンドを初期化し、必要なプロバイダをダウンロードする必要があります。

各環境 (`localstack`, `stage`, `prod`) には独自のバックエンド設定があります。初期化時に正しいものを指定する必要があります。

**Stage 用:**

```sh
terraform init -backend-config=backends/stage.hcl
```

**Production 用:**

```sh
terraform init -backend-config=backends/prod.hcl
```

**LocalStack 用:**

```sh
terraform init -backend-config=backends/local.hcl
```

### 2. Plan と Apply

初期化後、`terraform plan` を使用して適用される変更を確認し、`terraform apply` を使用して実行できます。

ターゲットとする環境に対応する変数ファイル (`.tfvars`) を指定する必要があります。

**Stage 用:**

```sh
terraform plan -var-file=tfvars/stage.tfvars -out=tfplan
terraform apply "tfplan"
```

**Production 用:**

```sh
terraform plan -var-file=tfvars/prod.tfvars -out=tfplan
terraform apply "tfplan"
```

**LocalStack 用:**

LocalStack 環境は、ローカル AWS エミュレーターに対して動作するように設定されています。

```sh
terraform plan -var-file=tfvars/localstack.tfvars -out=tfplan
terraform apply "tfplan"
```

### 3. 出力からアプリケーション `.env` ファイルを同期

`terraform apply` が成功したら、ヘルパーを実行して Terraform 出力 (テーブル名、バケット、API URL など) をローカルバックエンドおよびフロントエンド環境ファイルにコピーします:

```sh
./sync-env.sh
```

これにより、最新の値で `backend/.env` と `frontend/.env.local` が書き込まれます。両方のファイルは自動生成されます。環境変数を手動で管理したい場合は、これらを削除してください。

### 条件付き DynamoDB 作成

DynamoDB テーブルの作成は `create_dynamodb_table` 変数によって制御されます。

- `tfvars/localstack.tfvars` では、これは `true` に設定されているため、Terraform はテーブルを作成します。
- `tfvars/stage.tfvars` と `tfvars/prod.tfvars` では、これは `false` に設定されており、Terraform は既存のテーブルを探してデータソースとして使用します。
