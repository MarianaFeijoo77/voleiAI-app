import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET!

export async function iniciarMultipartUpload(chave: string, tipoConteudo: string) {
  const cmd = new CreateMultipartUploadCommand({
    Bucket: BUCKET,
    Key: chave,
    ContentType: tipoConteudo,
  })
  return r2.send(cmd)
}

export async function uploadParte(
  chave: string,
  uploadId: string,
  numeroParte: number,
  body: Buffer
) {
  const cmd = new UploadPartCommand({
    Bucket: BUCKET,
    Key: chave,
    UploadId: uploadId,
    PartNumber: numeroParte,
    Body: body,
  })
  return r2.send(cmd)
}

export async function concluirMultipartUpload(
  chave: string,
  uploadId: string,
  partes: Array<{ PartNumber: number; ETag: string }>
) {
  const cmd = new CompleteMultipartUploadCommand({
    Bucket: BUCKET,
    Key: chave,
    UploadId: uploadId,
    MultipartUpload: { Parts: partes },
  })
  return r2.send(cmd)
}

export async function cancelarMultipartUpload(chave: string, uploadId: string) {
  const cmd = new AbortMultipartUploadCommand({
    Bucket: BUCKET,
    Key: chave,
    UploadId: uploadId,
  })
  return r2.send(cmd)
}

export async function deletarObjeto(chave: string) {
  const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: chave })
  return r2.send(cmd)
}

export async function gerarUrlAssinada(chave: string, expiresInSeconds = 3600) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: chave })
  return getSignedUrl(r2, cmd, { expiresIn: expiresInSeconds })
}
