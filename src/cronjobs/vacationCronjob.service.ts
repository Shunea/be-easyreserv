import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Vacation } from '@src/user/entities/vacation.entity';
import { VacationStatus } from '@src/user/enums/vacation_status.enum';

@Injectable()
export class VacationCronjobService {
  constructor(
    @InjectRepository(Vacation)
    private vacationRepository: Repository<Vacation>,
  ) {}

  @Cron('0 0 * * * *')
  async updateVacationToInProgress() {
    const currentDate = new Date();

    const vacations = await this.vacationRepository.find({
      where: {
        vacationStatus: VacationStatus.APPROVED,
        startDate: LessThanOrEqual(currentDate),
        deletedAt: null,
      },
    });

    if (vacations.length > 0) {
      await Promise.all(
        vacations.map(async (vacation) => {
          if (currentDate < vacation.startDate) {
            vacation.vacationStatus = VacationStatus.PENDING;
          } else if (currentDate > vacation.endDate) {
            vacation.vacationStatus = VacationStatus.ENDED;
          } else {
            vacation.vacationStatus = VacationStatus.IN_PROGRESS;
          }
          await this.vacationRepository.save(vacation);
        }),
      );
    }
  }
}
