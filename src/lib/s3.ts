import { S3Client } from '@aws-sdk/client-s3';
import config from '@/config/env.js';

declare global {
  var s3: S3Client | undefined;
}

export const s3 =
  global.s3 ??
  new S3Client({
    region: config.aws.s3Region,
    credentials: {
      accessKeyId: config.aws.accessKey,
      secretAccessKey: config.aws.secretAccesskey,
    },
  });

if (config.env === 'development') {
  global.s3 = s3;
}
