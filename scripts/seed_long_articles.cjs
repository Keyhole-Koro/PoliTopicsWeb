#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("node:fs");
const path = require("node:path");
const {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
} = require("@aws-sdk/client-dynamodb");
const {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} = require("@aws-sdk/client-s3");
const {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const DEFAULTS = {
  tableName: "politopics-local",
  region: "ap-northeast-3",
  endpoint: "http://localstack:4566",
  s3Endpoint: undefined,
  bucketName: "politopics-articles-local",
  accessKeyId: "test",
  secretAccessKey: "test",
  articlesPath: path.resolve(__dirname, "../shared/mock/articles.json"),
  copies: 1,
  extraDialogs: 8,
  payloadPrefix: "",
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
  const copies = Number(cli.copies ?? DEFAULTS.copies);
  const extraDialogs = Number(cli["extra-dialogs"] ?? DEFAULTS.extraDialogs);
  const payloadPrefix = cli["payload-prefix"] ?? DEFAULTS.payloadPrefix;

  return {
    tableName: cli.table || DEFAULTS.tableName,
    bucketName: cli.bucket || DEFAULTS.bucketName,
    region: cli.region || DEFAULTS.region,
    endpoint,
    s3Endpoint,
    accessKeyId: cli["access-key"] || DEFAULTS.accessKeyId,
    secretAccessKey: cli["secret-key"] || DEFAULTS.secretAccessKey,
    articlesPath: path.resolve(cli.file || DEFAULTS.articlesPath),
    copies: Number.isNaN(copies) || copies < 1 ? DEFAULTS.copies : Math.floor(copies),
    extraDialogs: Number.isNaN(extraDialogs) || extraDialogs < 0 ? DEFAULTS.extraDialogs : Math.floor(extraDialogs),
    payloadPrefix: payloadPrefix.replace(/^\/+|\/+$/g, ""),
    skipCreateTable: Boolean(cli["skip-create-table"]),
    skipCreateBucket: Boolean(cli["skip-create-bucket"]),
  };
}

async function ensureTable(client, tableName) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return;
  } catch (error) {
    if (error?.name !== "ResourceNotFoundException") {
      throw error;
    }
  }

  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
        { AttributeName: "GSI1PK", AttributeType: "S" },
        { AttributeName: "GSI1SK", AttributeType: "S" },
        { AttributeName: "GSI2PK", AttributeType: "S" },
        { AttributeName: "GSI2SK", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "ArticleByDate",
          KeySchema: [
            { AttributeName: "GSI1PK", KeyType: "HASH" },
            { AttributeName: "GSI1SK", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
        {
          IndexName: "MonthDateIndex",
          KeySchema: [
            { AttributeName: "GSI2PK", KeyType: "HASH" },
            { AttributeName: "GSI2SK", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    }),
  );

  let status = "CREATING";
  while (status === "CREATING") {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const response = await client.send(new DescribeTableCommand({ TableName: tableName }));
    status = response.Table?.TableStatus || status;
  }
}

async function ensureBucket(s3Client, bucket, region) {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
    return;
  } catch (error) {
    const statusCode = error?.$metadata?.httpStatusCode;
    if (statusCode && statusCode !== 404) {
      throw error;
    }
  }

  await s3Client.send(
    new CreateBucketCommand({
      Bucket: bucket,
      ...(region === "us-east-1" ? {} : { CreateBucketConfiguration: { LocationConstraint: region } }),
    }),
  );
}

function loadArticles(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function normalizeSummary(summary) {
  if (!summary) {
    return { based_on_orders: [], summary: "" };
  }
  if (typeof summary === "string") {
    return { based_on_orders: [], summary };
  }
  return {
    based_on_orders: Array.isArray(summary.based_on_orders) ? summary.based_on_orders : [],
    summary: typeof summary.summary === "string" ? summary.summary : "",
  };
}

function buildLongSummary(article) {
  const base = normalizeSummary(article.summary);
  const keywordNames = (article.keywords ?? []).map((keyword) => keyword.keyword ?? keyword).filter(Boolean);
  const participantNames = (article.participants ?? [])
    .map((participant) => participant.name ?? participant)
    .filter(Boolean);

  const extra = [
    `会議名: ${article.nameOfMeeting || "不明"} / ${article.nameOfHouse || "不明"}`,
    `主な論点: ${keywordNames.slice(0, 5).join("、") || "未分類"}`,
    `登場人物: ${participantNames.slice(0, 5).join("、") || "未登録"}`,
    "結論に至るまでの背景、議事の流れ、各立場の論点を整理し、合意点と残された課題を明確化する。",
  ].filter(Boolean);

  const combined = [base.summary, ...extra].filter(Boolean).join("\n\n");
  return {
    based_on_orders: base.based_on_orders,
    summary: combined,
  };
}

function buildSoftSummary(article) {
  const base = normalizeSummary(article.soft_summary);
  const short = [
    base.summary,
    `${article.title || "議題"}の要点を短く整理し、結論と次のアクションを示す。`,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    based_on_orders: base.based_on_orders,
    summary: short,
  };
}

function buildMiddleSummaries(article) {
  if (Array.isArray(article.middle_summary) && article.middle_summary.length > 0) {
    return article.middle_summary;
  }
  const base = normalizeSummary(article.summary);
  if (!base.summary) return [];
  const chunks = base.summary.split(/\\n\\n+/).filter(Boolean);
  return chunks.slice(0, 3).map((chunk, index) => ({
    based_on_orders: base.based_on_orders.slice(index, index + 2),
    summary: chunk,
  }));
}

function buildExtraDialogs(article, extraCount) {
  const existing = Array.isArray(article.dialogs) ? article.dialogs : [];
  const maxOrder = existing.reduce((max, dialog) => Math.max(max, dialog.order ?? 0), 0);
  const speakers = (article.participants ?? [])
    .map((participant) => ({
      name: participant.name ?? participant,
      position: participant.position ?? "所属情報未設定",
    }))
    .filter((participant) => Boolean(participant.name));
  const reactions = ["賛成", "反対", "質問", "回答", "中立"];

  const extraDialogs = [];
  for (let i = 0; i < extraCount; i += 1) {
    const speaker = speakers[i % (speakers.length || 1)] || {
      name: "発言者",
      position: "所属情報未設定",
    };
    const baseLine = `${article.title || "議題"}に関する補足意見として、政策の狙いと影響を整理。`;
    extraDialogs.push({
      order: maxOrder + i + 1,
      summary: `${baseLine} 具体策や実務面の課題も提示した。`,
      soft_language: `${baseLine} 実行上のポイントも共有。`,
      reaction: reactions[i % reactions.length],
      speaker: speaker.name,
      position: speaker.position,
    });
  }

  return existing.concat(extraDialogs);
}

function buildTerms(article) {
  if (Array.isArray(article.terms) && article.terms.length > 0) {
    return article.terms;
  }
  const keywordNames = (article.keywords ?? []).map((keyword) => keyword.keyword ?? keyword).filter(Boolean);
  return keywordNames.slice(0, 6).map((keyword) => ({
    term: keyword,
    definition: `${keyword}に関する概要と政策上の位置づけを説明。`,
  }));
}

function buildPayload(article, extraDialogs) {
  return {
    summary: buildLongSummary(article),
    soft_summary: buildSoftSummary(article),
    middle_summary: buildMiddleSummaries(article),
    dialogs: buildExtraDialogs(article, extraDialogs),
  };
}

function buildPayloadKey(articleId, prefix) {
  const key = `${articleId}/payload.json`;
  return prefix ? `${prefix}/${key}` : key;
}

function buildPayloadUrl({ bucket, key, endpoint, region }) {
  if (endpoint) {
    const normalized = endpoint.replace(/\/$/, "");
    return `${normalized}/${bucket}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function buildArticleItem(article, payloadKey, payloadUrl) {
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
    terms: buildTerms(article),
    payload_key: payloadKey,
    payload_url: payloadUrl,
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
    const keywordValue = (keyword.keyword ?? keyword).toLowerCase();
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

function cloneArticle(article, copyIndex) {
  if (copyIndex === 0) {
    return { ...article };
  }
  const id = `${article.id}-x${copyIndex + 1}`;
  const title = `${article.title}（補足${copyIndex + 1}）`;
  return {
    ...article,
    id,
    title,
    date: article.date,
    month: article.month,
  };
}

async function uploadPayload(s3Client, bucketName, key, payload) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(payload),
      ContentType: "application/json",
    }),
  );
}

async function putItems(docClient, tableName, articles, s3Client, bucketName, payloadUrlOptions, extraDialogs) {
  let count = 0;
  for (const article of articles) {
    const payloadKey = buildPayloadKey(article.id, payloadUrlOptions.prefix);
    const payloadUrl = buildPayloadUrl({ ...payloadUrlOptions, key: payloadKey });
    const payload = buildPayload(article, extraDialogs);

    await uploadPayload(s3Client, bucketName, payloadKey, payload);
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: buildArticleItem(article, payloadKey, payloadUrl),
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

  if (!config.skipCreateTable) {
    await ensureTable(client, config.tableName);
  }
  if (!config.skipCreateBucket) {
    await ensureBucket(s3Client, config.bucketName, config.region);
  }

  await deleteAllItems(docClient, config.tableName);

  const baseArticles = loadArticles(config.articlesPath);
  const expandedArticles = [];
  for (const article of baseArticles) {
    for (let i = 0; i < config.copies; i += 1) {
      expandedArticles.push(cloneArticle(article, i));
    }
  }

  const total = await putItems(
    docClient,
    config.tableName,
    expandedArticles,
    s3Client,
    config.bucketName,
    {
      bucket: config.bucketName,
      endpoint: config.s3Endpoint,
      region: config.region,
      prefix: config.payloadPrefix,
    },
    config.extraDialogs,
  );

  console.log(`Uploaded ${total} articles (x${config.copies}) into ${config.tableName}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
