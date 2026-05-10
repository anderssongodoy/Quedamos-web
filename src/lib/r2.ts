import 'server-only'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { serverEnv } from '@/lib/env'

let cachedClient: S3Client | null = null

function client() {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: 'auto',
      endpoint: serverEnv.r2S3Endpoint,
      credentials: {
        accessKeyId: serverEnv.r2AccessKeyId,
        secretAccessKey: serverEnv.r2SecretAccessKey,
      },
    })
  }
  return cachedClient
}

export async function r2Put(opts: {
  key: string
  body: Buffer | Uint8Array
  contentType: string
}) {
  await client().send(
    new PutObjectCommand({
      Bucket: serverEnv.r2BucketName,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
    }),
  )
}

export async function r2GetBuffer(key: string): Promise<{ buffer: Buffer; contentType: string }> {
  const result = await client().send(
    new GetObjectCommand({
      Bucket: serverEnv.r2BucketName,
      Key: key,
    }),
  )
  if (!result.Body) throw new Error(`R2 object empty: ${key}`)
  const bytes = await result.Body.transformToByteArray()
  return {
    buffer: Buffer.from(bytes),
    contentType: result.ContentType ?? 'application/octet-stream',
  }
}

export async function r2PresignGet(key: string, expiresInSeconds = 3600) {
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: serverEnv.r2BucketName,
      Key: key,
    }),
    { expiresIn: expiresInSeconds },
  )
}

export async function r2Delete(key: string) {
  await client().send(
    new DeleteObjectCommand({
      Bucket: serverEnv.r2BucketName,
      Key: key,
    }),
  )
}
