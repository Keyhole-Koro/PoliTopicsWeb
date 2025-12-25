#!/usr/bin/env node

/**
 * Upload mock PoliTopics articles into the LocalStack DynamoDB table.
 * Mirrors the TypeScript seed logic but is runnable as a standalone JS script.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULTS = {
  tableName: "politopics-local",
  region: "ap-northeast-3",
  endpoint: "http://localstack:4566",
  s3Endpoint: undefined,
  bucketName: "politopics-articles-local",
  accessKeyId: "test",
  secretAccessKey: "test",
  articlesPath: path.join(__dirname, "articles.json"),
};

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith("--")) {
      continue;
    }
    const [flag, inlineValue] = arg.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      parsed[flag] = inlineValue;
      continue;
    }
    const next = args[i + 1];
    if (next && !next.startsWith("--")) {
      parsed[flag] = next;
      i += 1;
    } else {
      parsed[flag] = true;
    }
  }

  return parsed;
}

function loadConfig(cli) {
  const endpoint = cli.endpoint || DEFAULTS.endpoint;
  const s3Endpoint = cli["s3-endpoint"] || endpoint || DEFAULTS.s3Endpoint;
  return {
    tableName: "politopics-local",
    region: "ap-northeast-3",
    endpoint,
    s3Endpoint,
    bucketName: "politopics-articles-local",
    accessKeyId: "test",
    secretAccessKey: "test",
    articlesPath: path.resolve(cli.file || DEFAULTS.articlesPath),
  };
}

function loadArticles(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function buildArticleItem(article, assetKey, assetUrl) {
  return {
    PK: `A#${article.id}`,
    SK: "META",
    type: "ARTICLE",
    title: article.title,
    description: article.description,
    date: article.date,
    month: article.month,
    categories: article.categories,
    keywords: article.keywords,
    participants: article.participants,
    imageKind: article.imageKind,
    session: article.session,
    nameOfHouse: article.nameOfHouse,
    nameOfMeeting: article.nameOfMeeting,
    terms: article.terms,
    asset_key: assetKey,
    asset_url: assetUrl,
    GSI1PK: "ARTICLE",
    GSI1SK: article.date,
    GSI2PK: `Y#${article.month.replace("-", "#M#")}`,
    GSI2SK: article.date,
  };
}

function* buildKeywordItems(article) {
  const base = {
    articleId: article.id,
    title: article.title,
    date: article.date,
    month: article.month,
    categories: article.categories,
    keywords: article.keywords,
    participants: article.participants,
    imageKind: article.imageKind,
    session: article.session,
    nameOfHouse: article.nameOfHouse,
    nameOfMeeting: article.nameOfMeeting,
  };
  const sk = buildThinIndexSk(article.date, article.id);

  for (const keyword of article.keywords ?? []) {
    const keywordValue = (keyword.keyword ?? "").toLowerCase();
    if (!keywordValue) continue;
    yield {
      PK: `KEYWORD#${keywordValue}`,
      SK: sk,
      type: "THIN_INDEX",
      kind: "KEYWORD_INDEX",
      ...base,
    };
  }
}

function buildThinIndexSk(dateStr, articleId) {
  const iso = new Date(dateStr);
  const yyyy = iso.getUTCFullYear();
  const mm = String(iso.getUTCMonth() + 1).padStart(2, "0");
  const isoTimestamp = iso.toISOString();
  return `Y#${yyyy}#M#${mm}#D#${isoTimestamp}#A#${articleId}`;
}

function buildAssetKey(articleId) {
  return `articles/${articleId}.json`;
}

function buildAssetUrl({ bucket, key, endpoint, region }) {
  if (endpoint) {
    const normalized = endpoint.replace(/\/$/, "");
    return `${normalized}/${bucket}/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function buildArticleAsset(article) {
  return {
    summary: article.summary,
    soft_language_summary: article.soft_language_summary,
    middle_summary: article.middle_summary,
    dialogs: article.dialogs,
  };
}

async function uploadPayload(s3Client, bucketName, key, asset) {
  const payload = JSON.stringify(buildArticleAsset(asset));
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: payload,
      ContentType: "application/json",
    }),
  );
}

async function putItems(docClient, tableName, articles, s3Client, bucketName, assetUrlOptions) {
  let count = 0;
  for (const article of articles) {
    const assetKey = buildAssetKey(article.id);
    await uploadPayload(s3Client, bucketName, assetKey, article);
    const assetUrl = buildAssetUrl({ ...assetUrlOptions, key: assetKey });
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: buildArticleItem(article, assetKey, assetUrl),
      }),
    );
    count += 1;
    for (const keywordItem of buildKeywordItems(article)) {
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: keywordItem,
        }),
      );
    }
  }
  return count;
}

function chunkItems(items, size) {
  const batches = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

async function deleteAllItems(docClient, tableName) {
  let deleted = 0;
  let lastKey = undefined;

  do {
    const response = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        ProjectionExpression: "PK, SK",
        ExclusiveStartKey: lastKey,
      }),
    );

    const keys = (response.Items ?? []).map((item) => ({
      DeleteRequest: {
        Key: {
          PK: item.PK,
          SK: item.SK,
        },
      },
    }));

    for (const batch of chunkItems(keys, 25)) {
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: batch,
          },
        }),
      );
      deleted += batch.length;
    }

    lastKey = response.LastEvaluatedKey;
  } while (lastKey);

  console.log(`Deleted ${deleted} items from ${tableName}.`);
}

async function main() {
  const cli = parseArgs();
  const config = loadConfig(cli);

  const client = new DynamoDBClient({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
  const s3Client = new S3Client({
    region: config.region,
    endpoint: config.s3Endpoint,
    forcePathStyle: Boolean(config.s3Endpoint),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  await deleteAllItems(docClient, config.tableName);

  const articles = loadArticles(config.articlesPath);
  const total = await putItems(docClient, config.tableName, articles, s3Client, config.bucketName, {
    bucket: config.bucketName,
    endpoint: config.s3Endpoint,
    region: config.region,
  });

  console.log(`Uploaded ${total} articles plus keyword indexes into ${config.tableName}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
