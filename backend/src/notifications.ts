import { appConfig } from "./config"
import { DISCORD_COLORS, sendNotification, type DiscordField } from "@common/index"

type RequestContext = {
  requestId: string
  method: string
  path: string
  statusCode: number
  durationMs?: number
  userAgent?: string
}

function baseFields(ctx: Partial<RequestContext>): DiscordField[] {
  const fields: DiscordField[] = [{ name: "Environment", value: appConfig.environment, inline: true }]
  if (ctx.requestId) fields.push({ name: "Request ID", value: ctx.requestId, inline: true })
  if (ctx.durationMs !== undefined) {
    fields.push({ name: "Duration", value: `${ctx.durationMs} ms`, inline: true })
  }
  fields.push({ name: "Method", value: ctx.method ?? "unknown", inline: true })
  fields.push({ name: "Path", value: ctx.path ?? "unknown", inline: true })
  fields.push({ name: "Status", value: String(ctx.statusCode ?? "unknown"), inline: true })
  if (ctx.userAgent) fields.push({ name: "User-Agent", value: ctx.userAgent.slice(0, 180) })
  return fields
}

function formatError(error: unknown): string {
  if (!error) return "Unknown error"
  if (error instanceof Error) {
    const base = `${error.name}: ${error.message}`
    return error.stack ? `${base}\n${error.stack}`.slice(0, 900) : base.slice(0, 900)
  }
  return String(error).slice(0, 900)
}

export async function notifyServerError(ctx: RequestContext & { error: unknown }) {
  const fields = baseFields(ctx)
  fields.push({ name: "Error", value: formatError(ctx.error) })

  await sendNotification({
    environment: appConfig.environment,
    webhook: appConfig.notifications.errorWebhook,
    title: "Unhandled server error",
    content: ":rotating_light: Backend error",
    color: DISCORD_COLORS.error,
    fields,
    label: "backend-error",
  })
}

export async function notifyAccessLog(ctx: RequestContext) {
  const fields = baseFields(ctx)

  await sendNotification({
    environment: appConfig.environment,
    webhook: appConfig.notifications.accessWebhook,
    fallbackWebhook: appConfig.notifications.warnWebhook ?? appConfig.notifications.errorWebhook,
    title: "4xx/5xx access log",
    content: ":clipboard: Access anomaly",
    color: ctx.statusCode >= 500 ? DISCORD_COLORS.error : DISCORD_COLORS.access,
    fields,
    label: "backend-access-log",
  })
}
