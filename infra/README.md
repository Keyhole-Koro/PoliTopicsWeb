# Infra

This directory contains supporting assets (like LocalStack init scripts) for the local development stack. The actual `docker-compose.yml` now lives in the repository root so the devcontainer can reuse the same services.

## Services

- **localstack**: Emulates AWS DynamoDB, S3, IAM, Lambda, and API Gateway. Buckets for article payloads and the SPA build are created through the init script.
- **app**: Runs the backend TypeScript service in watch mode.

## Usage

```bash
docker compose up --build
```

After the containers are running you can seed DynamoDB with the mock records:

```bash
docker compose exec app npm run seed
```

The API becomes reachable on http://localhost:4000 and LocalStack on http://localhost:4569.
