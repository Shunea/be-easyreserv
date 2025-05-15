import * as dotenv from 'dotenv';
import * as qrcode from 'qrcode';
import * as moment from 'moment-timezone';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { LessThan, Repository } from 'typeorm';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QRCode } from '../entities/qrCode.entity';
import { QRCodeStatus } from '../enum/qrCode_status.enum';
import { ScanQrCodeDto } from '../dto/scanQrCode.dto';
import { Schedule } from '@src/user/entities/schedule.entity';
import { plainToClass } from 'class-transformer';
import { StaffStatus } from '@src/user/enums/staff.status.enum';
import { User } from '@src/user/entities/user.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';

dotenv.config();

const DEVMODE = true;

enum ScheduleStatus {
  PENDING = 0,
  CHECKED_IN = 1,
  CHECKED_OUT = 2
}

enum QRCodeErrorCodes {
  LOCATION_VALIDATION_FAILED = 'QR001',
  ALREADY_CHECKED_IN = 'QR002',
  ALREADY_CHECKED_OUT = 'QR003',
  NO_ACTIVE_SCHEDULE = 'QR004',
  SCHEDULE_UPDATE_FAILED = 'QR005',
  INVALID_DATE_FORMAT = 'QR006',
  QR_GENERATION_FAILED = 'QR007',
  RESTAURANT_NOT_CONFIGURED = 'QR008'
}

@Injectable()
export class QRCodeService {
  private alias = 'qr_code';
  private readonly logger = new Logger(QRCodeService.name);

  constructor(
    @InjectRepository(QRCode)
    private qrCodeRepository: Repository<QRCode>,

    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
  ) {}

  // Helper method for dev logging
  private devLog(message: string, data?: any) {
    DEVMODE && console.log(message, data)
  }

  async generateQrCode(user: AuthUser, response: any): Promise<QRCode> {
    try {
      const date = new Date();
      const data = `${user.restaurantId}-${date}`;
      const qrCodeDataURL = await qrcode.toDataURL(data);

      const dataUrl = qrCodeDataURL.split(',')[1];

      return response.status(200).json(dataUrl);
    } catch (err) {
      throw new HttpException({
        code: QRCodeErrorCodes.QR_GENERATION_FAILED,
        message: 'Failed to generate QR code',
        details: err.message
      }, HttpStatus.BAD_REQUEST);
    }
  }

  async scanQRCode(user: AuthUser, scanQRCode: ScanQrCodeDto): Promise<any> {
    this.devLog('[scanQRCode] Starting scan with raw date:', scanQRCode.date);

    try {
      // Validate location
      const distance = await this.getDistance(
        scanQRCode.latitude,
        scanQRCode.longitude,
        scanQRCode.restaurantId
      );

      const isWithinRange = distance <= 0.15; // 150 meters in kilometers

      if (!isWithinRange) {
        throw new HttpException({
          code: QRCodeErrorCodes.LOCATION_VALIDATION_FAILED,
          message: 'Location validation failed',
          details: `User is not within allowed distance (150m) from restaurant, your distance: ${(distance*1000).toFixed(2)}m`
        }, HttpStatus.BAD_REQUEST);
      }

      // Convert the date to UTC
      const currentDate = DEVMODE && scanQRCode.date
        ? moment.tz(scanQRCode.date, 'YYYY-MM-DD HH:mm:ss', 'UTC').toDate()
        : moment().utc().toDate();
      
      this.devLog('[scanQRCode] After date parsing to UTC:', { 
        rawInput: scanQRCode.date,
        parsedDate: currentDate,
        isoString: currentDate.toISOString(),
        localString: currentDate.toString()
      });

      const qrCode = plainToClass(QRCode, {
        ...scanQRCode,
        date: currentDate
      });
      
      this.devLog('[scanQRCode] After plainToClass:', { 
        qrCodeDate: qrCode.date,
        isoString: qrCode.date.toISOString(),
        localString: qrCode.date.toString()
      });

      // Get the user who's checking in/out with full relations
      const staffUser = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.currentSchedule', 'currentSchedule')
        .where('user.id = :userId', { userId: qrCode.userId })
        .getOne();

      if (!staffUser) {
        throw new HttpException({
          code: 'QR999',
          message: 'Staff user not found',
          details: `No user found with ID: ${qrCode.userId}`
        }, HttpStatus.NOT_FOUND);
      }

      this.devLog('[scanQRCode] Found staff user:', { 
        userId: staffUser?.id, 
        currentScheduleId: staffUser?.currentScheduleId,
        currentSchedule: staffUser?.currentSchedule
      });

      let result;

      if (qrCode.status === QRCodeStatus.CHECKIN) {
        this.devLog('[scanQRCode] Starting check-in process');
        
        result = await this.handleCheckIn(staffUser, qrCode, scanQRCode, currentDate);
      } 
      else if (qrCode.status === QRCodeStatus.CHECKOUT) {
        this.devLog('[scanQRCode] Starting check-out process');
        
        result = await this.handleCheckOut(staffUser, qrCode, scanQRCode, currentDate);
      }

      if (!result) {
        throw new HttpException({
          code: 'QR999',
          message: 'Invalid QR code status',
          details: `Status must be either CHECKIN or CHECKOUT, received: ${qrCode.status}`
        }, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      this.logger.error('[scanQRCode] Error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({
        code: 'QR999',
        message: 'Failed to process QR code scan',
        details: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async handleCheckIn(
    staffUser: User,
    qrCode: QRCode,
    scanQRCode: ScanQrCodeDto,
    currentDate: Date
  ): Promise<any> {
    // Check if user is already working somewhere
    if (staffUser.currentScheduleId) {
      throw new HttpException({
        code: QRCodeErrorCodes.ALREADY_CHECKED_IN,
        message: 'User already checked in',
        details: `User is already checked in to schedule: ${staffUser.currentScheduleId}`
      }, HttpStatus.BAD_REQUEST);
    }

    let schedule = await this.findSchedule(qrCode.userId, currentDate);
    this.devLog('[handleCheckIn] Found existing schedule:', schedule);

    if (!schedule) {
      this.devLog('[handleCheckIn] No existing schedule found, creating new one');
      schedule = this.scheduleRepository.create({
        userId: staffUser.id,
        date: currentDate,
        workHours: 0,
        status: StaffStatus.WORKING,
        checkStatus: ScheduleStatus.PENDING
      });
      this.devLog('[handleCheckIn] Created new schedule object:', schedule);
    }
    else if (schedule.checkStatus === ScheduleStatus.CHECKED_OUT) {
      this.devLog('[handleCheckIn] Found a checked-out schedule, creating a new one');
      // Create a new schedule instead of throwing an error
      schedule = this.scheduleRepository.create({
        userId: staffUser.id,
        date: currentDate,
        workHours: 0,
        status: StaffStatus.WORKING,
        checkStatus: ScheduleStatus.PENDING
      });
      this.devLog('[handleCheckIn] Created new schedule object after finding checked-out schedule:', schedule);
    }

    try {
      // Update schedule with check-in details
      schedule.checkinTime = moment(qrCode.date).toDate();
      schedule.checkStatus = ScheduleStatus.CHECKED_IN;
      
      this.devLog('[handleCheckIn] Updated schedule with check-in details:', {
        scheduleId: schedule.id,
        checkinTime: schedule.checkinTime,
        checkStatus: schedule.checkStatus
      });

      // Save the schedule first
      const savedSchedule = await this.scheduleRepository.save(schedule);
      this.devLog('[handleCheckIn] Saved schedule:', savedSchedule);

      // Update the staff user with the current schedule
      staffUser.currentScheduleId = savedSchedule.id;
      const updatedUser = await this.userRepository.save(staffUser);
      this.devLog('[handleCheckIn] Updated user with current schedule:', {
        userId: updatedUser.id,
        currentScheduleId: updatedUser.currentScheduleId
      });

      // Create and save QR code log
      const qrCodeLog = this.qrCodeRepository.create({
        userId: staffUser.id,
        restaurantId: scanQRCode.restaurantId,
        status: scanQRCode.status,
        date: DEVMODE ? qrCode.date : currentDate,
        phoneNumber: scanQRCode.phoneNumber,
        longitude: scanQRCode.longitude.toString(),
        latitude: scanQRCode.latitude.toString(),
        scheduleId: savedSchedule.id
      });

      const savedQrLog = await this.qrCodeRepository.save(qrCodeLog);
      this.devLog('[handleCheckIn] Saved QR code log:', savedQrLog);

      this.devLog('[handleCheckIn] Check-in process completed successfully:', {
        scheduleId: savedSchedule.id,
        userId: updatedUser.id,
        currentScheduleId: updatedUser.currentScheduleId
      });

      return {
        qrCodeLog: savedQrLog,
        schedule: savedSchedule,
        currentScheduleId: updatedUser.currentScheduleId
      };
    } catch (error) {
      this.logger.error('[handleCheckIn] Error during check-in:', error);
      throw new HttpException({
        code: QRCodeErrorCodes.SCHEDULE_UPDATE_FAILED,
        message: 'Failed to create or update schedule during check-in',
        details: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async handleCheckOut(
    staffUser: User,
    qrCode: QRCode,
    scanQRCode: ScanQrCodeDto,
    currentDate: Date
  ): Promise<any> {
    if (!staffUser.currentScheduleId) {
      throw new HttpException({
        code: QRCodeErrorCodes.NO_ACTIVE_SCHEDULE,
        message: 'No active schedule found',
        details: 'User must be checked in to a schedule before checking out'
      }, HttpStatus.BAD_REQUEST);
    }

    let schedule = await this.scheduleRepository.findOne({
      where: { id: staffUser.currentScheduleId }
    });

    if (!schedule) {
      throw new HttpException({
        code: QRCodeErrorCodes.NO_ACTIVE_SCHEDULE,
        message: 'Schedule not found',
        details: `No schedule found with ID: ${staffUser.currentScheduleId}`
      }, HttpStatus.NOT_FOUND);
    }

    if (schedule.checkStatus === ScheduleStatus.CHECKED_OUT) {
      throw new HttpException({
        code: QRCodeErrorCodes.ALREADY_CHECKED_OUT,
        message: 'Schedule already checked out',
        details: 'This schedule has already been checked out'
      }, HttpStatus.BAD_REQUEST);
    }

    try {
      // Ensure both dates are Date objects
      schedule.checkoutTime = new Date(qrCode.date);
      const checkinTime = new Date(schedule.checkinTime);
      
      this.devLog('[handleCheckOut] Processing checkout with dates:', {
        checkinTime,
        checkoutTime: schedule.checkoutTime
      });

      schedule.checkStatus = ScheduleStatus.CHECKED_OUT;
      
      // Get updated schedule with worked hours calculated
      const updatedSchedule = await this.updateWorkedHours(
        schedule,
        checkinTime,
        schedule.checkoutTime
      );

      // First clear user's current schedule using query builder to ensure proper update
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ currentScheduleId: null })
        .where('id = :userId', { userId: staffUser.id })
        .execute();

      // Reload user to get updated state
      const updatedUser = await this.userRepository.findOne({
        where: { id: staffUser.id }
      });

      this.devLog('[handleCheckOut] Cleared user current schedule:', {
        userId: updatedUser.id,
        currentScheduleId: updatedUser.currentScheduleId
      });

      // Then save the updated schedule
      this.devLog('[handleCheckOut] Saving final schedule:', updatedSchedule);
      const savedSchedule = await this.scheduleRepository.save(updatedSchedule);

      // Create QR code log
      const qrCodeLog = this.qrCodeRepository.create({
        userId: staffUser.id,
        restaurantId: scanQRCode.restaurantId,
        status: scanQRCode.status,
        date: DEVMODE ? qrCode.date : currentDate,
        phoneNumber: scanQRCode.phoneNumber,
        longitude: scanQRCode.longitude.toString(),
        latitude: scanQRCode.latitude.toString(),
        scheduleId: savedSchedule.id
      });

      const savedQrLog = await this.qrCodeRepository.save(qrCodeLog);

      this.devLog('[handleCheckOut] Checkout completed successfully:', {
        scheduleId: savedSchedule.id,
        userId: updatedUser.id,
        currentScheduleId: updatedUser.currentScheduleId,
        checkStatus: savedSchedule.checkStatus,
        workedHours: savedSchedule.workedHours
      });

      return {
        qrCodeLog: savedQrLog,
        schedule: savedSchedule,
        currentScheduleId: updatedUser.currentScheduleId
      };
    } catch (error) {
      this.logger.error('[handleCheckOut] Error during checkout:', error);
      throw new HttpException({
        code: QRCodeErrorCodes.SCHEDULE_UPDATE_FAILED,
        message: 'Failed to save schedule updates during checkout',
        details: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateWorkedHours(
    schedule: Schedule,
    checkInDate: Date,
    checkOutDate: Date,
  ): Promise<Schedule> {
    this.devLog('[updateWorkedHours] Input dates:', { 
      checkInDate,
      checkOutDate
    });

    try {
      if (!(checkInDate instanceof Date) || !(checkOutDate instanceof Date)) {
        throw new HttpException({
          code: QRCodeErrorCodes.INVALID_DATE_FORMAT,
          message: 'Invalid date format',
          details: 'Both check-in and check-out dates must be valid Date objects'
        }, HttpStatus.BAD_REQUEST);
      }

      // Handle overnight shifts by adding 24 hours if checkout is before checkin
      let adjustedCheckOutDate = new Date(checkOutDate);
      if (adjustedCheckOutDate < checkInDate) {
        this.devLog('[updateWorkedHours] Detected overnight shift, adjusting checkout date');
        adjustedCheckOutDate.setDate(adjustedCheckOutDate.getDate() + 1);
      }

      const workedHours =
        (adjustedCheckOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
      
      this.devLog('[updateWorkedHours] Raw worked hours:', { 
        workedHours,
        plannedHours: schedule.workHours 
      });

      const MAX_ALLOWED_HOURS = 16;

      // Check if worked hours exceed maximum allowed
      if (workedHours > MAX_ALLOWED_HOURS) {
        this.devLog('[updateWorkedHours] Hours exceed maximum allowed:', {
          workedHours,
          maxAllowed: MAX_ALLOWED_HOURS
        });
        
        schedule.workedHours = 6;
        schedule.overWorkHours = 0;
        schedule.deletionNotice = `Working hours (${workedHours.toFixed(2)}h) exceeded maximum allowed (${MAX_ALLOWED_HOURS}h). Hours have been reset to 1.`;
        
        return schedule;
      }

      // For unplanned schedules (workHours = 0), all hours go to workedHours
      if (parseFloat(schedule.workHours.toString()) == 0) {
        this.devLog('[updateWorkedHours] Unplanned schedule detected');
        schedule.workedHours = workedHours;
        schedule.overWorkHours = 0;
      } else {
        this.devLog('[updateWorkedHours] Planned schedule detected');
        schedule.workedHours = Math.min(workedHours, schedule.workHours);
        schedule.overWorkHours = Math.max(0, workedHours - schedule.workHours);
      }
      
      this.devLog('[updateWorkedHours] Hours calculated:', { 
        workedHours: schedule.workedHours,
        overWorkHours: schedule.overWorkHours 
      });
      
      return schedule;
    } catch (error) {
      this.logger.error('[updateWorkedHours] Error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({
        code: QRCodeErrorCodes.SCHEDULE_UPDATE_FAILED,
        message: 'Failed to calculate worked hours',
        details: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findLastQr(qrCode: QRCode, scheduleId: string) {
    const lastQR = await this.qrCodeRepository.findOne({
      where: {
        userId: qrCode.userId,
        restaurantId: qrCode.restaurantId,
        scheduleId: scheduleId,
        date: LessThan(qrCode.date),
        deletedAt: null,
      },
      order: {
        date: 'DESC',
      },
    });

    return lastQR;
  }

  async findSchedule(userId: string, date: Date) {
    const schedules = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.user_id = :userId', { userId })
      .andWhere('schedule.deleted_at IS NULL')
      .getMany();

    for (const schedule of schedules) {
      const scheduleDate = moment(schedule.date);
      const scheduleStartTime = scheduleDate.clone().startOf('day');
      const scheduleEndTime = scheduleDate.clone().endOf('day');

      if (moment(date).isBetween(scheduleStartTime, scheduleEndTime, null, '[]')) {
        this.devLog('[findSchedule] Found schedule:', { 
          scheduleId: schedule.id, 
          checkStatus: schedule.checkStatus 
        });
        return schedule;
      }
    }

    this.devLog('[findSchedule] No schedule found for date:', date);
    return null;
  }

  private async getDistance(userLat: number, userLong: number, restaurantId: string): Promise<number> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId }
    });
    this.devLog('[validateLocation] Found restaurant:', {
      restaurant,
      restaurantId,
      id: restaurant?.id,
      latitude: restaurant?.latitude,
      longitude: restaurant?.longitude
    });
    if (!restaurant?.latitude || !restaurant?.longitude) {
      throw new HttpException({
        code: QRCodeErrorCodes.RESTAURANT_NOT_CONFIGURED,
        message: 'Restaurant location not configured',
        details: `Restaurant ${restaurantId} does not have latitude or longitude configured`
      }, HttpStatus.BAD_REQUEST);
    }

    const distance = this.calculateDistance(
      userLat,
      userLong,
      restaurant.latitude,
      restaurant.longitude
    );

    return distance; // 150 meters in kilometers
    
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}
