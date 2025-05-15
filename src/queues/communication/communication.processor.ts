import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';

import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobEntity } from '@src/notification/entities/job.entity';
import { NotificationService } from '@src/notification/services/notification.service';
import { COMMUNICATION_QUEUE, SCHEDULE_NOTIFICATION } from '../constants';

@Processor(COMMUNICATION_QUEUE)
export class CommunicationProcessor {
  private readonly logger = new Logger(CommunicationProcessor.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>,
  ) {}

  @OnQueueActive()
  public onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  public async onComplete(job: Job) {
    this.logger.log(`Completed job ${job.id} of type ${job.name}`);

    try {
      const jobToDelete = await this.jobRepository.findOne({
        where: { jobId: job.id.toString(), deletedAt: null },
      });

      await this.jobRepository.softDelete(jobToDelete.id);
    } catch (err) {
      this.logger.log(err);
    }
  }

  @OnQueueFailed()
  public onError(job: Job<any>, error: any) {
    this.logger.log(
      `Failed job ${job.id} of type ${job.name}: ${error.message}`,
      error.stack,
    );
  }

  @Process(SCHEDULE_NOTIFICATION)
  async scheduleNotification(
    job: Job<{ userId: string; title: string; body: any }>,
  ) {
    this.logger.log(
      `Notification scheduled for user ${job.data.userId}, with title ${job.data.title}`,
    );

    try {
      return this.notificationService.sendNotification(
        job.data.userId,
        job.data.title,
        job.data.body,
      );
    } catch (error) {
      this.logger.log(
        `Failed to schedule notification for user ${job.data.userId}, with title ${job.data.title}`,
      );
    }
  }
}
