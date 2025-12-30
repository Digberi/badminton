// file: src/server/aws/s3.ts
import "server-only";

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { IMMUTABLE_CACHE_CONTROL } from "@/server/photos/constants";

let _client: S3Client | null = null;

function getRegion() {
  return process.env.AWS_REGION || "us-east-1";
}

function getS3Endpoint() {
  // Если задано — считаем, что это LocalStack/MinIO/etc
  const endpoint = process.env.AWS_S3_ENDPOINT?.trim();
  return endpoint ? endpoint : undefined;
}

export function getPhotosBucket() {
  const bucket = process.env.S3_PHOTOS_BUCKET;
  if (!bucket) throw new Error("S3_PHOTOS_BUCKET is not set");
  return bucket;
}

export function getPhotosCdnBaseUrl() {
  const cdn = process.env.PHOTOS_CDN_URL;
  if (!cdn) throw new Error("PHOTOS_CDN_URL is not set");
  return cdn.replace(/\/+$/g, "");
}

export function photoCdnUrl(key: string) {
  const base = getPhotosCdnBaseUrl();
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function getS3Client() {
  if (_client) return _client;

  const endpoint = getS3Endpoint();

  _client = new S3Client({
    region: getRegion(),
    endpoint,
    // LocalStack: path-style намного стабильнее (и для presigned тоже)
    forcePathStyle: !!endpoint,
  });

  return _client;
}

export async function createPresignedPutUrl(args: {
  key: string;
  contentType: string;
}) {
  const bucket = getPhotosBucket();
  const s3 = getS3Client();

  const expiresIn =
    Number(process.env.PRESIGN_EXPIRES_SECONDS || "300") || 300;

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: args.key,
    ContentType: args.contentType,
    CacheControl: IMMUTABLE_CACHE_CONTROL,
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn });

  return {
    url,
    expiresIn,
    headers: {
      "Content-Type": args.contentType,
      "Cache-Control": IMMUTABLE_CACHE_CONTROL,
    } as const,
  };
}

export async function headObject(key: string) {
  const bucket = getPhotosBucket();
  const s3 = getS3Client();

  const cmd = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await s3.send(cmd);
}

export async function deleteObject(key: string) {
  const bucket = getPhotosBucket();
  const s3 = getS3Client();

  const cmd = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await s3.send(cmd);
}