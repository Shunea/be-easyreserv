import { ERROR_MESSAGES } from '@src/constants';
import { EntityManager } from 'typeorm';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '@src/user/entities/user.entity';
import { Vacation } from '@src/user/entities/vacation.entity';
import { VacationType } from '@src/user/enums/vacation-type.enum';

@Injectable()
export class CreateInitialVacation {
  constructor(private readonly entityManager: EntityManager) {}

  async createInitialVacationsForUser(user: User) {
    try {
      const vacationTypes = Object.values(VacationType);

      for (const vacationType of vacationTypes) {
        const newVacation = new Vacation();
        newVacation.user = user;

        switch (vacationType) {
          case VacationType.SIMPLE_VACATION:
            newVacation.availableDays = 28;
            break;
          case VacationType.SICK_VACATION:
            newVacation.availableDays = 90;
            break;
          case VacationType.SPECIAL_VACATION:
            newVacation.availableDays = 15;
            break;
          default:
            newVacation.availableDays = 0;
        }

        newVacation.vacationType = vacationType;
        newVacation.requestedDays = 0;

        try {
          await this.entityManager.save(Vacation, newVacation);
        } catch (error) {
          throw new HttpException(
            `${ERROR_MESSAGES.vacationNotSaved}: ${error.message}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    } catch (error) {
      throw new HttpException(
        `${ERROR_MESSAGES.vacationNotCreated}: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
