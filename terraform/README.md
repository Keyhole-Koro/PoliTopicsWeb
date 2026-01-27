# Terraform Infrastructure
[日本語版](./jp/README.md)

This directory contains the Terraform code for deploying the PoliTopics application infrastructure on AWS.

## Overview

This Terraform setup manages the following AWS resources:

- **Amazon S3**: For hosting the frontend application and storing article payloads.
- **Amazon DynamoDB**: A NoSQL database for application data. The table creation is conditional.
- **AWS Lambda**: The backend serverless function.
- **API Gateway**: To expose the Lambda function as an HTTP API.

The infrastructure is modularized, with the main components defined in the `service/` directory.

## Prerequisites

- [Terraform](https://learn.hashicorp.com/tutorials/terraform/install-cli)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) configured with appropriate credentials.

## Directory Structure

- `backends/`: Contains backend configurations for different environments (e.g., `local.hcl`, `stage.hcl`).
- `modules/`: (Currently unused) Intended for reusable Terraform modules.
- `service/`: The core service module containing S3, DynamoDB, and Lambda resources.
- `tfvars/`: Contains variable definition files for each environment (`localstack.tfvars`, `stage.tfvars`, `prod.tfvars`).
- `main.tf`: The root module that composes the `service` module.
- `variables.tf`: Root variable definitions.
- `provider.tf`: AWS provider configuration.

## Getting Started

### 1. Initialize Terraform

Before running any commands, you need to initialize the Terraform backend and download the necessary providers.

Each environment (`localstack`, `stage`, `prod`) has its own backend configuration. You must specify the correct one during initialization.

**For Stage:**

```sh
terraform init -backend-config=backends/stage.hcl
```

**For Production:**

```sh
terraform init -backend-config=backends/prod.hcl
```

**For LocalStack:**

```sh
terraform init -backend-config=backends/local.hcl
```

### 2. Plan and Apply

After initialization, you can use `terraform plan` to see the changes that will be applied, and `terraform apply` to execute them.

You must specify the variable file (`.tfvars`) corresponding to the environment you are targeting.

**For Stage:**

```sh
terraform plan -var-file=tfvars/stage.tfvars -out=tfplan
terraform apply "tfplan"
```

**For Production:**

```sh
terraform plan -var-file=tfvars/prod.tfvars -out=tfplan
terraform apply "tfplan"
```

**For LocalStack:**

The LocalStack environment is configured to work against a local AWS emulator.

```sh
terraform plan -var-file=tfvars/localstack.tfvars -out=tfplan
terraform apply "tfplan"
```

### 3. Sync application `.env` files from outputs

After `terraform apply` succeeds, run the helper to copy the Terraform outputs (table names, buckets, API URL, etc.) into the local backend and frontend environment files:

```sh
./sync-env.sh
```

This writes `backend/.env` and `frontend/.env.local` with the latest values. Both files are auto-generated; delete them if you ever want to manage the environment variables manually.

### Conditional DynamoDB Creation

The DynamoDB table creation is controlled by the `create_dynamodb_table` variable.

- In `tfvars/localstack.tfvars`, this is set to `true`, so Terraform will create the table.
- In `tfvars/stage.tfvars` and `tfvars/prod.tfvars`, this is set to `false`, meaning Terraform will look for a pre-existing table and use it as a data source.
