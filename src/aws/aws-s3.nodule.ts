import { AwsS3Controller } from './controllers/aws-s3.controller';
import { AwsS3Service } from './services/aws-s3.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [AwsS3Controller],
  providers: [AwsS3Service],
})
export class AwsS3Module {}
