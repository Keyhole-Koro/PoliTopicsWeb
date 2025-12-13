import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceInUseException,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb"
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
  type BucketLocationConstraint,
} from "@aws-sdk/client-s3"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { articles } from "@shared/article-data"

const tableName = process.env.POLITOPICS_TABLE ?? "politopics-localstack"
const articlePayloadBucket = process.env.POLITOPICS_ARTICLE_BUCKET ?? "politopics-articles-local"
const region = process.env.AWS_REGION ?? "ap-northeast-3"
const endpoint = process.env.LOCALSTACK_URL ?? "http://localstack:4569"
const forcePathStyle = Boolean(process.env.LOCALSTACK_URL ?? undefined)

async function main() {
  const client = new DynamoDBClient({
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
    },
  })

  const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  })
  const s3Client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
    },
  })

  await ensureTable(client)
  await ensureBucket(s3Client)

  for (const article of articles) {
    const payloadKey = buildPayloadKey(article.id)
    await uploadPayload(s3Client, payloadKey, article)

    const payloadUrl = buildPayloadUrl(payloadKey)
    const articleItem = {
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
      payload_key: payloadKey,
      payload_url: payloadUrl,
      GSI1PK: "ARTICLE",
      GSI1SK: article.date,
      GSI2PK: `Y#${article.month.replace("-", "#M#")}`,
      GSI2SK: article.date,
    }

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: articleItem,
      }),
    )

    const sk = buildThinIndexSk(article.date, article.id)

    for (const keyword of article.keywords) {
      const keywordValue = keyword.keyword.toLowerCase()
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            PK: `KEYWORD#${keywordValue}`,
            SK: sk,
            type: "THIN_INDEX",
            kind: "KEYWORD_INDEX",
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
          },
        }),
      )
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Loaded ${articles.length} mock articles into ${tableName}`)
}

async function ensureTable(client: DynamoDBClient) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }))
    return
  } catch (error) {
    if (!(error instanceof ResourceNotFoundException)) {
      throw error
    }
  }

  try {
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
    )
    // eslint-disable-next-line no-console
    console.log(`Created DynamoDB table ${tableName}`)
  } catch (error) {
    if (!(error instanceof ResourceInUseException)) {
      throw error
    }
  }
}

async function ensureBucket(s3Client: S3Client) {
  try {
    await s3Client.send(
      new HeadBucketCommand({
        Bucket: articlePayloadBucket,
      }),
    )
    return
  } catch (error) {
    const statusCode = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    if (statusCode && statusCode !== 404) {
      throw error
    }
  }

  // eslint-disable-next-line no-console
  console.info("Creating article payload bucket", articlePayloadBucket)

  await s3Client.send(
    new CreateBucketCommand({
      Bucket: articlePayloadBucket,
      ...{
          CreateBucketConfiguration: { LocationConstraint: region as BucketLocationConstraint },
        }
      ,
    }),
  )
}

async function uploadPayload(s3Client: S3Client, payloadKey: string, article: (typeof articles)[number]) {
  const body = JSON.stringify({
    summary: article.summary,
    soft_summary: article.soft_summary,
    middle_summary: article.middle_summary,
    dialogs: article.dialogs,
  })

  await s3Client.send(
    new PutObjectCommand({
      Bucket: articlePayloadBucket,
      Key: payloadKey,
      Body: body,
      ContentType: "application/json",
    }),
  )
}

function buildPayloadKey(id: string): string {
  return `articles/${id}.json`
}

function buildPayloadUrl(payloadKey: string): string {
  if (endpoint) {
    const base = endpoint.replace(/\/$/, "")
    return `${base}/${articlePayloadBucket}/${payloadKey}`
  }

  return `https://${articlePayloadBucket}.s3.${region}.amazonaws.com/${payloadKey}`
}

function buildThinIndexSk(date: string, id: string): string {
  const iso = new Date(date)
  const yyyy = iso.getUTCFullYear()
  const mm = `${iso.getUTCMonth() + 1}`.padStart(2, "0")
  const isoTimestamp = iso.toISOString()
  return `Y#${yyyy}#M#${mm}#D#${isoTimestamp}#A#${id}`
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
