import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda"
import awsLambdaFastify from "@fastify/aws-lambda"
import type { FastifyInstance } from "fastify"
import { createApp } from "./http/app"

let fastifyInstance: FastifyInstance | null = null
let lambdaProxy: ReturnType<typeof awsLambdaFastify> | null = null

async function getFastifyProxy() {
  if (lambdaProxy) {
    return lambdaProxy
  }

  if (!fastifyInstance) {
    fastifyInstance = await createApp()
  }

  if (!lambdaProxy) {
    lambdaProxy = awsLambdaFastify(fastifyInstance)
  }

  await fastifyInstance.ready()
  return lambdaProxy
}

export async function handler(
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResultV2> {
  const proxy = await getFastifyProxy()
  const rawPath = typeof event.rawPath === "string" ? event.rawPath : "/"
  // Remove stage prefix from rawPath (e.g., "/prod", "/stage")
  const stageName = event.requestContext?.stage
  const strippedRawPath = stageName 
    ? (rawPath.replace(new RegExp(`^/${stageName}(?=/|$)`), "") || "/")
    : rawPath
  const normalizedEvent = rawPath === strippedRawPath ? event : { ...event, rawPath: strippedRawPath }
  
  return new Promise<APIGatewayProxyResultV2>((resolve, reject) => {
    proxy(normalizedEvent, context, (error, result) => {
      if (error) {
        reject(error)
        return
      }
      resolve((result as APIGatewayProxyResultV2) ?? { statusCode: 200, body: "" })
    })
  })
}