import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { QRCode } from '@src/qrCode/entities/qrCode.entity';
import { Repository } from 'typeorm';

@Injectable()
export class QRCodeCronjobService {
  private alias = 'qr_code';
  constructor(
    @InjectRepository(QRCode)
    private qrRepository: Repository<QRCode>,
  ) {}

  @Cron('0 0 * * *')
  async deleteScanedQRCode() {
    const date24HoursAgo = new Date();
    date24HoursAgo.setHours(date24HoursAgo.getHours() - 24);

    await this.qrRepository
      .createQueryBuilder(this.alias)
      .softDelete()
      .where('qr_code.date <= :date24HoursAgo', { date24HoursAgo })
      .andWhere('qr_code.deleted_at IS NULL')
      .execute();
  }
}
