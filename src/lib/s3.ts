import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '@/config/env.js';
import { UserInputError } from 'apollo-server-errors';
import crypto from 'crypto';

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

const BUCKET_NAME = config.aws.s3Name;

export const getS3PresignedUrl = async (
  fileType: string,
  fileSize: number,
  fileSource: string = 'items'
) => {
  if (fileSize > 10 * 1024 * 1024) {
    // 10 MB limit
    throw new UserInputError('File size exceeds the 10MB limit.');
  }

  if (!fileType.startsWith('image/')) {
    throw new UserInputError('Invalid file type. Only images are allowed.');
  }

  // Use crypto for a truly unique file name
  const uniqueFileName = crypto.randomBytes(16).toString('hex');
  const objectKey = `images/${fileSource}/${uniqueFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
    ContentType: fileType,
    ContentLength: fileSize,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

  const publicUrl = `https://${BUCKET_NAME}.s3.${config.aws.s3Region}.amazonaws.com/${objectKey}`;

  return { uploadUrl, publicUrl };
};
