import { AwsClient } from "aws4fetch";
import type { Env } from "../types/env";
import { resolveAwsEndpoints } from "../config";

export type S3ClientOptions = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  forcePathStyle?: boolean;
};

/**
 * S3 client for Cloudflare Workers using aws4fetch
 */
export class S3Client {
  private aws: AwsClient;
  private region: string;
  private endpoint?: string;
  private forcePathStyle: boolean;

  constructor(options: S3ClientOptions) {
    this.aws = new AwsClient({
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
      region: options.region,
      service: "s3",
    });
    this.region = options.region;
    this.endpoint = options.endpoint;
    this.forcePathStyle = Boolean(options.forcePathStyle);
  }

  private getEndpoint(bucket: string): string {
    if (this.endpoint) {
      const base = this.endpoint.replace(/\/$/, "");
      if (this.forcePathStyle) {
        return `${base}/${bucket}`;
      }
      return `${base}/${bucket}`;
    }
    return `https://${bucket}.s3.${this.region}.amazonaws.com`;
  }

  /**
   * Get an object from S3
   */
  async getObject(bucket: string, key: string): Promise<Response> {
    const url = `${this.getEndpoint(bucket)}/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
    const response = await this.aws.fetch(url, { method: "GET" });
    return response;
  }

  /**
   * Get an object as text from S3
   */
  async getObjectText(bucket: string, key: string): Promise<string | null> {
    const response = await this.getObject(bucket, key);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`S3 GetObject failed (${response.status}): ${await response.text()}`);
    }
    return response.text();
  }

  /**
   * Get an object as JSON from S3
   */
  async getObjectJson<T>(bucket: string, key: string): Promise<T | null> {
    const text = await this.getObjectText(bucket, key);
    if (text === null) return null;
    return JSON.parse(text) as T;
  }
}

/**
 * Create an S3 client from the environment
 */
export function createS3Client(env: Env): S3Client {
  const { s3Endpoint, s3ForcePathStyle } = resolveAwsEndpoints(env);
  return new S3Client({
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    endpoint: s3Endpoint,
    forcePathStyle: s3ForcePathStyle,
  });
}
