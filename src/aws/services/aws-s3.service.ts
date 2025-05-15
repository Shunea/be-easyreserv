import * as dotenv from 'dotenv';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ERROR_MESSAGES, FILE_MIMES } from '@src/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

@Injectable()
export class AwsS3Service {
  private s3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      },
    });
  }

  async uploadFileToS3(
    file: Express.Multer.File,
    folderName: string,
  ): Promise<string> {
    const { buffer, mimetype } = file;

    if (!FILE_MIMES[file.mimetype]) {
      throw new HttpException(
        ERROR_MESSAGES.unsupportedFileFormat,
        HttpStatus.BAD_REQUEST,
      );
    }

    const isPdf = FILE_MIMES[mimetype].toLowerCase() === 'pdf';
    const fileKey = `${uuidv4()}.${FILE_MIMES[mimetype]}`;
    const folder = folderName ?? (isPdf ? 'documents' : 'images');

    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: `${folder}/${fileKey}`,
      Body: buffer,
    };

    try {
      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      return fileKey;
    } catch (error) {
      throw new HttpException(
        ERROR_MESSAGES.failedToUploadFile,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getFileFromS3(key: string, folderName = 'images'): Promise<string> {
    const fileExtension = key.split('.').pop()?.toLowerCase();

    if (fileExtension !== 'pdf') {
      return `${process.env.AWS_STATIC_URL}/${folderName}/${key}`;
    }

    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: `documents/${key}`,
    };

    try {
      const command = new GetObjectCommand(params);
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 60,
      });

      return signedUrl;
    } catch (error) {
      throw new HttpException(
        ERROR_MESSAGES.failedToRetrieveTheFile,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
