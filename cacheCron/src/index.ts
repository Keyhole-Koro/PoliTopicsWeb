import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
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
  let durationMs = 0 // Declare durationMs here

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



    durationMs = Date.now() - startedAt


    await notifySuccess(payload.items.length, durationMs, fetchedAt)

    // --- HTML Injection Logic ---
    if (config.bucket.indexHtmlKey) {
      try {
        // 1. Download index.html
        console.log(`[headlines-cron] Downloading ${config.bucket.indexHtmlKey} from S3...`)
        const getHtmlCommand = new GetObjectCommand({
          Bucket: config.bucket.name,
          Key: config.bucket.indexHtmlKey,
        })
        const { Body: htmlBodyStream } = await s3.send(getHtmlCommand)

        if (htmlBodyStream) {
          let htmlContent = await streamToString(htmlBodyStream)
          console.log(`[headlines-cron] Downloaded ${config.bucket.indexHtmlKey} content length: ${htmlContent.length}. First 200 chars: ${htmlContent.substring(0, 200)}...`)

          // 2. Inject JSON data
          // The placeholder in frontend/app/layout.tsx is dangerouslySetInnerHTML={{ __html: '"__HEADLINES_CACHE__"' }}
          // which means the actual HTML content will be "__HEADLINES_CACHE__" surrounded by JSON string quotes.
          const placeholder = `"${'__HEADLINES_CACHE__'}"` // This is the exact string to match in the HTML
          const escapedJson = JSON.stringify(
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
          ).replace(/<\/script>/g, "<\\/script>") // Escape </script> to prevent HTML parsing issues
          console.log(`[headlines-cron] Generated escaped JSON (first 200 chars): ${escapedJson.substring(0, 200)}...`)

          if (htmlContent.includes(placeholder)) {
            htmlContent = htmlContent.replace(placeholder, escapedJson)
            console.log(`[headlines-cron] new json content: ${escapedJson}.`)
            console.log(`[headlines-cron] Injected headlines JSON into ${config.bucket.indexHtmlKey}.`)
            console.log(`[headlines-cron] Modified HTML (first 200 chars): ${htmlContent.substring(0, 200)}...`)

            // 3. Upload modified index.html
            await s3.send(
              new PutObjectCommand({
                Bucket: config.bucket.name,
                Key: config.bucket.indexHtmlKey,
                Body: htmlContent,
                ContentType: "text/html",
                CacheControl: "no-cache, no-store, must-revalidate, max-age=0", // Ensure fresh HTML
              }),
            )
            console.log(`[headlines-cron] Uploaded modified ${config.bucket.indexHtmlKey} to S3.`)
          } else {
            console.log(`[headlines-cron] Placeholder "${placeholder}" not found in ${config.bucket.indexHtmlKey}. HTML injection skipped.`)
            // Also log a snippet of HTML around where it should be, to debug missing placeholder
            const placeholderIndex = htmlContent.indexOf('<script id="headlines-cache"')
            if (placeholderIndex !== -1) {
              const snippetStart = Math.max(0, placeholderIndex - 50)
              const snippetEnd = Math.min(htmlContent.length, placeholderIndex + 100)
              console.log(`[headlines-cron] HTML snippet around script tag: ...${htmlContent.substring(snippetStart, snippetEnd)}...`)
            }
          }
        } else {
          console.log(`[headlines-cron] No body received for ${config.bucket.indexHtmlKey}. HTML injection skipped.`)
        }
      } catch (htmlErr: any) {
        console.error(`[headlines-cron] Error during HTML injection:`, htmlErr)
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        count: payload.items.length,
        bucket: config.bucket.name,

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

async function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = []
    stream.on("data", (chunk: any) => chunks.push(chunk))
    stream.on("error", reject)
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")))
  })
}
