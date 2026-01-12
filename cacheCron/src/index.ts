import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import type { Handler } from "aws-lambda"
import { DISCORD_COLORS, sendNotification, type DiscordField } from "@keyhole-koro/politopics-notification"
import { loadConfig } from "./config"

type HeadlinesResponse = {
  items: unknown[]
  limit: number
  start: number
  end: number
  hasMore: boolean
}

const config = loadConfig()

const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  forcePathStyle: config.s3.forcePathStyle,
  credentials: config.s3.credentials,
})

export const handler: Handler = async () => {
  const startedAt = Date.now()
  const url = new URL(config.api.path, config.api.url)
  url.searchParams.set("limit", String(config.api.limit))

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.api.requestTimeoutMs)

  try {
    console.log(`[headlines-cron] fetching ${url.toString()}`)
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      throw new Error(`Headlines request failed: ${response.status} ${response.statusText}`)
    }

    const payload = (await response.json()) as HeadlinesResponse
    const fetchedAt = new Date().toISOString()

    const body = JSON.stringify(
      {
        fetchedAt,
        source: url.toString(),
        items: payload.items,
        limit: payload.limit,
        start: payload.start,
        end: payload.end,
        hasMore: payload.hasMore,
      },
      null,
      0,
    )

    await s3.send(
      new PutObjectCommand({
        Bucket: config.bucket.name,
        Key: config.bucket.key,
        Body: body,
        ContentType: "application/json",
        CacheControl: config.bucket.cacheControl || "public, max-age=300",
      }),
    )

    const durationMs = Date.now() - startedAt
    console.log(
      `[headlines-cron] uploaded to s3://${config.bucket.name}/${config.bucket.key} (${payload.items.length} items) in ${durationMs}ms`,
    )
    await notifySuccess(payload.items.length, durationMs, fetchedAt)

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        count: payload.items.length,
        bucket: config.bucket.name,
        key: config.bucket.key,
        durationMs,
        fetchedAt,
      }),
    }
  } catch (error) {
    console.error("[headlines-cron] failed", error)
    await notifyError(error)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
    }
  } finally {
    clearTimeout(timeout)
  }
}

function baseFields(): DiscordField[] {
  return [
    { name: "Bucket", value: config.bucket.name, inline: true },
    { name: "Key", value: config.bucket.key, inline: true },
    { name: "Source", value: `${config.api.url}${config.api.path}`, inline: false },
  ]
}

async function notifySuccess(count: number, durationMs: number, fetchedAt: string) {
  if (!config.notifications.batchWebhook) return
  const fields: DiscordField[] = [
    ...baseFields(),
    { name: "Count", value: String(count), inline: true },
    { name: "Duration", value: `${durationMs} ms`, inline: true },
    { name: "FetchedAt", value: fetchedAt, inline: false },
  ]
  await sendNotification({
    environment: config.environment,
    webhook: config.notifications.batchWebhook,
    fallbackWebhook: config.notifications.errorWebhook,
    title: "Headlines snapshot updated",
    content: ":white_check_mark: Headlines JSON uploaded",
    color: DISCORD_COLORS.success,
    fields,
    label: "cache-cron-success",
  })
}

async function notifyError(error: unknown) {
  if (!config.notifications.errorWebhook && !config.notifications.batchWebhook) return
  const fields: DiscordField[] = baseFields()
  fields.push({ name: "Error", value: formatError(error) })

  await sendNotification({
    environment: config.environment,
    webhook: config.notifications.errorWebhook || config.notifications.batchWebhook,
    title: "Headlines snapshot failed",
    content: ":rotating_light: Headlines cron failed",
    color: DISCORD_COLORS.error,
    fields,
    label: "cache-cron-error",
  })
}

function formatError(error: unknown): string {
  if (!error) return "Unknown error"
  if (error instanceof Error) {
    const base = `${error.name}: ${error.message}`
    return error.stack ? `${base}\n${error.stack}`.slice(0, 900) : base.slice(0, 900)
  }
  return String(error).slice(0, 900)
}
