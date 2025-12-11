import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceInUseException,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { articles } from "@shared/article-data"

const tableName = process.env.POLITOPICS_TABLE ?? "politopics-stage"
const region = process.env.AWS_REGION ?? "ap-northeast-3"
const endpoint = process.env.LOCALSTACK_URL ?? "http://localstack:4569"

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

  await ensureTable(client)

  for (const article of articles) {
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
      summary: article.summary,
      soft_summary: article.soft_summary,
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
