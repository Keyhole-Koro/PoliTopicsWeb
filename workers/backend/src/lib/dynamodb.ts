import { AwsClient } from "aws4fetch";
import type { Env } from "../types/env";

/**
 * DynamoDB AttributeValue types
 */
export type AttributeValue =
  | { S: string }
  | { N: string }
  | { B: string }
  | { BOOL: boolean }
  | { NULL: true }
  | { L: AttributeValue[] }
  | { M: Record<string, AttributeValue> }
  | { SS: string[] }
  | { NS: string[] }
  | { BS: string[] };

/**
 * Marshal helpers for creating DynamoDB AttributeValues
 */
export const M = {
  S: (value: string): AttributeValue => ({ S: value }),
  N: (value: number | string): AttributeValue => ({ N: String(value) }),
  B: (value: string): AttributeValue => ({ B: value }),
  BOOL: (value: boolean): AttributeValue => ({ BOOL: value }),
  NULL: (): AttributeValue => ({ NULL: true }),
  L: (values: AttributeValue[]): AttributeValue => ({ L: values }),
  MAP: (obj: Record<string, AttributeValue>): AttributeValue => ({ M: obj }),
  SS: (values: string[]): AttributeValue => ({ SS: values }),
  NS: (values: (number | string)[]): AttributeValue => ({ NS: values.map(String) }),
};

/**
 * Unmarshall a DynamoDB item to a plain JavaScript object
 */
export function unmarshall(item: Record<string, AttributeValue>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    result[key] = unmarshallValue(value);
  }
  return result;
}

function unmarshallValue(value: AttributeValue): unknown {
  if ("S" in value) return value.S;
  if ("N" in value) return Number(value.N);
  if ("B" in value) return value.B;
  if ("BOOL" in value) return value.BOOL;
  if ("NULL" in value) return null;
  if ("L" in value) return value.L.map(unmarshallValue);
  if ("M" in value) return unmarshall(value.M);
  if ("SS" in value) return value.SS;
  if ("NS" in value) return value.NS.map(Number);
  if ("BS" in value) return value.BS;
  return value;
}

/**
 * Marshall a plain JavaScript object to DynamoDB AttributeValues
 */
export function marshall(obj: Record<string, unknown>): Record<string, AttributeValue> {
  const result: Record<string, AttributeValue> = {};
  for (const [key, value] of Object.entries(obj)) {
    const marshalled = marshallValue(value);
    if (marshalled !== undefined) {
      result[key] = marshalled;
    }
  }
  return result;
}

function marshallValue(value: unknown): AttributeValue | undefined {
  if (value === null) return { NULL: true };
  if (value === undefined) return undefined;

  switch (typeof value) {
    case "string":
      return { S: value };
    case "number":
      return { N: String(value) };
    case "boolean":
      return { BOOL: value };
    case "object":
      if (Array.isArray(value)) {
        return { L: value.map(marshallValue).filter((v): v is AttributeValue => v !== undefined) };
      }
      return { M: marshall(value as Record<string, unknown>) };
    default:
      return undefined;
  }
}

export type DynamoDBClientOptions = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export type QueryParams = {
  TableName: string;
  IndexName?: string;
  KeyConditionExpression: string;
  ExpressionAttributeValues: Record<string, AttributeValue>;
  ExpressionAttributeNames?: Record<string, string>;
  FilterExpression?: string;
  Limit?: number;
  ScanIndexForward?: boolean;
  ExclusiveStartKey?: Record<string, AttributeValue>;
};

export type GetItemParams = {
  TableName: string;
  Key: Record<string, AttributeValue>;
};

export type QueryResponse = {
  Items?: Record<string, AttributeValue>[];
  Count?: number;
  ScannedCount?: number;
  LastEvaluatedKey?: Record<string, AttributeValue>;
};

export type GetItemResponse = {
  Item?: Record<string, AttributeValue>;
};

/**
 * DynamoDB client for Cloudflare Workers using aws4fetch
 */
export class DynamoDBClient {
  private aws: AwsClient;
  private endpoint: string;

  constructor(options: DynamoDBClientOptions) {
    this.aws = new AwsClient({
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
      region: options.region,
      service: "dynamodb",
    });
    this.endpoint = `https://dynamodb.${options.region}.amazonaws.com`;
  }

  private async send<T>(target: string, body: object): Promise<T> {
    const response = await this.aws.fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.0",
        "X-Amz-Target": `DynamoDB_20120810.${target}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DynamoDB ${target} failed (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  async query(params: QueryParams): Promise<QueryResponse> {
    return this.send<QueryResponse>("Query", params);
  }

  async getItem(params: GetItemParams): Promise<GetItemResponse> {
    return this.send<GetItemResponse>("GetItem", params);
  }
}

/**
 * Create a DynamoDB client from the environment
 */
export function createDynamoDBClient(env: Env): DynamoDBClient {
  return new DynamoDBClient({
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  });
}
