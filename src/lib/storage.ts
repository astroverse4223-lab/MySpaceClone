import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;
// The public base URL for the bucket (the r2.dev URL, or your custom domain).
const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey && bucket && publicUrl,
);

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }
  return client;
}

/** Uploads bytes to R2 and returns the public URL the object is served from. */
export async function uploadToR2(opts: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  if (!isR2Configured) {
    throw new Error("R2 storage is not configured");
  }

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
    }),
  );

  return `${publicUrl}/${opts.key}`;
}
