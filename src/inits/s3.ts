// console.log("At the beginning of init/s3")

import { S3Client } from "@aws-sdk/client-s3";
import { env } from '../env'

export const s3ClientInstance = new S3Client({region: env.AWS_REGION})