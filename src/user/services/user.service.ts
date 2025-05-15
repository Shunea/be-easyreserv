import * as dotenv from 'dotenv';
import generateTokenKey from '@src/common/generateTokenKey';
import prettify from '@src/common/prettify';
import randomString from '@src/common/randomString';
import sendContactEmail from '@src/common/email/sendContactEmail';
import sendSupportEmail from '@src/common/email/supportEmail';
import sendVerificationEmail from '@src/common/email/sendVerificationEmail';
import {
  ALL_CHARACTERS,
  ERROR_MESSAGES,
  SPECIAL_CHARACTERS,
} from '@src/constants';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { Brackets, In, Not, Repository } from 'typeorm';
import { ClientStatus } from '../enums/clientStatus.enum';
import { ConfirmEmailDto } from '../dto/confirmEmail.dto';
import { ConfirmEmailUpdateDto } from '../dto/confirmEmailUpdate.dto';
import { ContactEmailDto } from '../dto/contactEmail.dto';
import { CreateClientDto } from '../dto/createClient.dto';
import { CreateInitialVacation } from '@src/common/createInitialVacations';
import { CreateStaffDto } from '../dto/createStaff.dto';
import { CreateUserDto } from '../../auth/dto/createUser.dto';
import { EmailService } from '@src/common/email/form/email.form';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanHistoryService } from '@src/plan/services/planHistory.service';
import { RefreshToken } from '@src/refreshToken/entities/refreshToken.entity';
import { Reservation } from '@src/reservation/entities/reservation.entity';
import { ReservationStatus } from '@src/reservation/enums/reservationStatus.enum';
import { Review } from '@src/review/entities/review.entity';
import { Role } from '../enums/roles.enum';
import { StaffRole } from '../enums/staff.roles.enum';
import { SupportEmail } from '../dto/supportEmail.dto';
import { TokenKey } from '@src/tokenKey/entities/tokenKey.entity';
import { TokenKeyService } from '@src/tokenKey/services/tokenKey.service';
import { UpdateStaffDto } from '../dto/updateStaff.dto';
import { UpdateUserDto } from '../dto/updateUser.dto';
import { User } from '../entities/user.entity';
import { Vacation } from '../entities/vacation.entity';
import { getPaginated } from '@src/common/pagination';
import { hash } from 'bcrypt';
import { plainToClass } from 'class-transformer';
import { Schedule } from '../entities/schedule.entity';
import { ScheduleService } from './schedule.service';

const ms = require('ms');
dotenv.config();

@Injectable()
export class UserService {
  private alias = 'user';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Vacation)
    private vacationRepository: Repository<Vacation>,

    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,

    @InjectRepository(TokenKey)
    private tokenKeyRepository: Repository<TokenKey>,

    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,

    private readonly createInitialVacation: CreateInitialVacation,
    private readonly scheduleService: ScheduleService,
    private readonly emailService: EmailService,
    private readonly tokenKeyService: TokenKeyService,
    private readonly planHistoryService: PlanHistoryService,
  ) {}

  async getExistingUser(
    email?: string,
    phoneNumber?: string,
    role?: string,
  ): Promise<User> {
    try {
      let conditions = [
        'user.email = :email',
        phoneNumber && !role && 'user.phone_number = :phoneNumber',
        role && !phoneNumber && 'user.role = :role',
        phoneNumber &&
          role &&
          '(user.phone_number = :phoneNumber AND user.role = :role)',
      ]
        .filter(Boolean)
        .join(' OR ');

      conditions = phoneNumber || role ? `(${conditions})` : conditions;

      const parameters = {
        email,
        ...(phoneNumber ? { phoneNumber } : {}),
        ...(role ? { role } : {}),
      };

      const user = await this.userRepository
        .createQueryBuilder(this.alias)
        .addSelect('user.password')
        .withDeleted()
        .where(conditions)
        .setParameters(parameters)
        .getOne();

      return user;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getAll(user: AuthUser, filter: IFilter): Promise<User[]> {
    try {
      const { limit, skip, all } = filter;
      const columns = ['username', 'email'];

      const queryBuilder = this.userRepository.createQueryBuilder(this.alias);

      queryBuilder
        .where('user.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('user.deleted_at IS NULL');

      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.alias,
        'created_at',
        filter,
      );
      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);

      queryBuilder
        .groupBy('user.id')
        .addGroupBy('user.username')
        .addGroupBy('user.email')
        .addGroupBy('user.phoneNumber')
        .orderBy('user.createdAt', 'DESC');

      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const users = await queryBuilder.getMany();
      const countUsers = await queryBuilder.getCount();

      const result = getPaginated({
        data: users,
        count: countUsers,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getAllStaff(user: AuthUser, filter: IFilter): Promise<User[]> {
    try {
      const { limit, skip, all } = filter;
      const columns = ['username', 'email'];
      const currentDate = new Date().toISOString().split('T')[0];

      const queryBuilder = this.userRepository.createQueryBuilder(this.alias);

      queryBuilder
        .where('user.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('user.role NOT IN (:...roles)', {
          roles: [Role.SUPER_ADMIN, Role.USER],
        })
        .andWhere('user.deleted_at IS NULL')
        .leftJoinAndSelect(
          'user.staffSchedules',
          'staffSchedules',
          'staffSchedules.date = :currentDate AND staffSchedules.deleted_at IS NULL',
          { currentDate },
        );

      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);

      queryBuilder
        .groupBy('user.id')
        .addGroupBy('user.username')
        .addGroupBy('user.email')
        .addGroupBy('user.phone_number')
        .addGroupBy('staffSchedules.id')
        .orderBy('user.createdAt', 'DESC');

      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const staff = await queryBuilder.getMany();

      //console.log("initstaff", staff)
      let schedules = []
      try{
      schedules = await this.scheduleService.getAllSchedules(
        user,
        filter
      ).then(data => data.data);
      }

      catch(e){
        console.log("error in schedules", e.message);
      }
      for (const user of staff) {
        user['avatarUrl'] = user.avatar
          ? `${process.env.AWS_STATIC_URL}/images/${user.avatar}`
          : null;
        user['staffSchedules'] = schedules.filter(
          (schedule) => schedule.userId === user.id,
        );
      }

      //console.log("staff2", staff)
      function sumWorkHours(objects: Schedule[]) {
        let sum = 0
        if (objects){
        objects.forEach(element => {
          sum += parseFloat(element.workHours.toString())
        });
      }
        //console.log("sum",sum);
        
        return sum
      }

      const finalStaff = staff.map((user) => ({
        ...user,
        totalWorkHours: sumWorkHours(user.staffSchedules),
      }));

      const result = getPaginated({
        data: finalStaff,
        count: finalStaff.length,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getStaffById(user: AuthUser, staffId: string): Promise<User> {
    try {
      const queryBuilder = this.userRepository.createQueryBuilder(this.alias);

      queryBuilder
        .where('user.id = :staffId', { staffId })
        .andWhere('user.role != :role', { role: Role.SUPER_ADMIN })
        .andWhere('user.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('user.deleted_at IS NULL')
        .leftJoinAndSelect(
          'user.documents',
          'documents',
          'documents.deleted_at IS NULL',
        )
        .leftJoinAndSelect(
          'user.vacations',
          'vacations',
          'vacations.deleted_at IS NULL',
        );

      const staff = await queryBuilder.getOne();

      if (staff) {
        staff['avatarUrl'] = staff.avatar
          ? `${process.env.AWS_STATIC_URL}/images/${staff.avatar}`
          : null;
      }

      return staff;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getStaffWithScheduleAndVacations(user: AuthUser) {
    try {
      const today = new Date();
      const todayDate = today.getDate();
      const todayMonth = today.getMonth() + 1;
      const todayYear = today.getFullYear();

      const staff = await this.userRepository
        .createQueryBuilder(this.alias)
        .where('user.created_by = :id', { id: user.id })
        .andWhere('user.role IN (:...roles)', {
          roles: [
            StaffRole.CHEF,
            StaffRole.HOSTESS,
            StaffRole.SUPER_HOSTESS,
            StaffRole.OPERATOR,
            StaffRole.SPECIALIST,
            StaffRole.WAITER,
          ],
        })
        .andWhere('user.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('user.deleted_at IS NULL')
        .leftJoinAndSelect(
          'user.staffSchedules',
          'schedule',
          'schedule.deleted_at IS NULL',
        )
        .leftJoinAndSelect(
          'user.vacations',
          'vacation',
          'vacation.deleted_at IS NULL',
        )
        .andWhere(
          new Brackets((qb) => {
            qb.where('YEAR(schedule.date) = :year', { year: todayYear })
              .andWhere('MONTH(schedule.date) = :month', { month: todayMonth })
              .andWhere('DAY(schedule.date) = :day', { day: todayDate })
              .orWhere(
                'vacation.start_date IS NOT NULL AND vacation.end_date IS NOT NULL AND vacation.end_date >= :currentDate',
                { currentDate: today },
              );
          }),
        )
        .orderBy('vacation.start_date', 'ASC')
        .getMany();

      staff.forEach((user) => {
        user.staffSchedules = user.staffSchedules.filter((schedule) => {
          const date = new Date(schedule.date);
          return (
            date.getFullYear() === todayYear &&
            date.getMonth() + 1 === todayMonth &&
            date.getDate() === todayDate
          );
        });

        const nearestVacation = user.vacations.find(
          (vacation) => new Date(vacation.endDate) >= today,
        );
        user['vacation'] = nearestVacation || null;
        user['avatarUrl'] = user.avatar
          ? `${process.env.AWS_STATIC_URL}/images/${user.avatar}`
          : null;

        delete user.vacations;
      });

      return staff;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getById(userId: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder(this.alias)
      .where('user.id = :id', { id: userId })
      .andWhere('user.deleted_at IS NULL')
      .getOne();

    if (!user) {
      throw new HttpException(
        ERROR_MESSAGES.userNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  async getByEmail(email: string) {
    const user = await this.userRepository
      .createQueryBuilder(this.alias)
      .where('user.email = :email', { email })
      .andWhere('user.deleted_at IS NULL')
      .getOne();

    if (!user) {
      throw new HttpException(
        ERROR_MESSAGES.userNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  async markEmailAsConfirmed(email: string) {
    return await this.userRepository
      .createQueryBuilder(this.alias)
      .update(User)
      .set({ isVerified: true })
      .where('user.email = :email', { email })
      .andWhere('user.deleted_at IS NULL')
      .execute();
  }

  async create(
    createUserDto: CreateUserDto,
    waiterClientId?: string,
  ): Promise<User> {
    try {
      if (waiterClientId) {
        delete createUserDto.isSuperAdmin;

        createUserDto.password = await hash(createUserDto.password, 10);
        await this.userRepository.update(waiterClientId, createUserDto);

        return await this.userRepository.findOne({
          where: { id: waiterClientId, deletedAt: null },
        });
      } else {
        const planId = createUserDto.planId;
        delete createUserDto.planId;

        const isSuperAdmin = createUserDto.isSuperAdmin;
        delete createUserDto.isSuperAdmin;

        const newUser = this.userRepository.create({
          ...createUserDto,
          role: isSuperAdmin ? Role.SUPER_ADMIN : Role.USER,
        });
        const user = await this.userRepository.save(newUser);

        if (isSuperAdmin) {
          await this.planHistoryService.create({ planId }, user);
        }

        return user;
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  public validateRole(roleFromRequest: string): { role: Role | StaffRole; roleName: string } {
    const allowedRoles = new Set([...Object.values(Role), ...Object.values(StaffRole)].filter(
      (role) => role !== Role.USER,
    ));

    if (allowedRoles.has(roleFromRequest as any)) {
      return {
        role: roleFromRequest as Role | StaffRole,
        roleName: roleFromRequest
      };
    }

    return {
      role: StaffRole.GENERAL,
      roleName: roleFromRequest
    };
  }

  async createStaff(user: AuthUser, staffDto: CreateStaffDto): Promise<User> {
    staffDto.createdBy = user.id;
    staffDto.restaurantId = user.restaurantId;
    staffDto.placeId = user.placeId;

    // Validate role if not already validated
    if (!staffDto.roleName) {
      const { role, roleName } = this.validateRole(staffDto.role);
      staffDto.role = role;
      staffDto.roleName = roleName;
    }

    const staff = plainToClass(User, staffDto);

    try {
      const newStaff = await this.userRepository.save(staff);
      await this.createInitialVacation.createInitialVacationsForUser(newStaff);
      return newStaff;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async createClient(user: AuthUser, body: CreateClientDto): Promise<any> {
    try {
      const { username, phoneNumber, isVip } = body;
      const existingClient = await this.userRepository.findOne({
        where: { phoneNumber, role: Role.USER, deletedAt: null },
      });

      if (existingClient) {
        return {
          id: existingClient.id,
          username: existingClient.username,
          phoneNumber: existingClient.phoneNumber,
          email: existingClient.email,
          existingUser: true,
        };
      }

      const randomChars = await randomString(8, ALL_CHARACTERS);
      const randomNumber = Math.floor(Math.random() * 101);
      const randomIndex = Math.floor(Math.random() * SPECIAL_CHARACTERS.length);
      const randomSpecialChar = SPECIAL_CHARACTERS.charAt(randomIndex);
      const temporaryPassword = `${randomSpecialChar}${randomChars}${randomNumber}`;
      const temporaryEmail = `${await randomString(
        10,
        ALL_CHARACTERS,
      )}@temporary.com`;

      const client = new User();

      client.isVip = !!isVip;
      client.username = username;
      client.phoneNumber = phoneNumber;
      client.password = temporaryPassword;
      client.email = temporaryEmail.toLowerCase().trim();
      client.createdBy = user.id;
      client.role = Role.USER;

      const newClient = plainToClass(User, client);

      const createdClient = await this.userRepository.save(newClient);

      delete createdClient.password;

      return createdClient;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
    i18n: I18nContext,
    request: any,
    response: any,
  ): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, deletedAt: null },
      });

      if (!user) {
        throw new HttpException(
          ERROR_MESSAGES.userNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (updateUserDto.password) {
        updateUserDto.password = await hash(updateUserDto.password, 10);
      }

      if (updateUserDto.email) {
        const existingUser = await this.getExistingUser(updateUserDto.email);

        if (existingUser) {
          throw new HttpException(
            ERROR_MESSAGES.userEmailAlreadyExists,
            HttpStatus.NOT_FOUND,
          );
        }

        const username = updateUserDto.username
          ? updateUserDto.username
          : user.username;

        await this.verificationEmailForUserUpdate(
          updateUserDto.email,
          username,
          userId,
          i18n,
          request,
        );

        return { sended: true };
      } else {
        const { role: currentUserRole } = await this.userRepository.findOne({
          where: { id: userId, deletedAt: null },
        });
        const existingUser = await this.getExistingUser(
          updateUserDto.phoneNumber,
        );

        if (existingUser && existingUser.role !== currentUserRole) {
          throw new HttpException(
            ERROR_MESSAGES.userPhoneAlreadyExists,
            HttpStatus.NOT_FOUND,
          );
        }

        await this.userRepository.update(userId, updateUserDto);

        return { ...user, ...updateUserDto };
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async updateStaff(
    staffId: string,
    updateStaffDto: UpdateStaffDto,
    i18n: I18nContext,
    request: any,
    response: any,
  ): Promise<any> {
    try {
      const staff = await this.userRepository.findOne({
        where: { id: staffId, role: Not(In([Role.SUPER_ADMIN, Role.USER])), deletedAt: null },
      });

      if (!staff) {
        throw new HttpException(
          ERROR_MESSAGES.staffNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (updateStaffDto.email) {
        const existingStaff = await this.getExistingUser(updateStaffDto.email);

        if (existingStaff) {
          throw new HttpException(
            ERROR_MESSAGES.userEmailAlreadyExists,
            HttpStatus.NOT_FOUND,
          );
        }

        const username = updateStaffDto.username
          ? updateStaffDto.username
          : staff.username;

        await this.verificationEmailForUserUpdate(
          updateStaffDto.email,
          username,
          staffId,
          i18n,
          request,
        );

        return response.status(HttpStatus.OK).json({ sended: true });
      } else {
        const { role: currentStaffRole } = await this.userRepository.findOne({
          where: { id: staffId, deletedAt: null },
        });
        const existingStaff = await this.getExistingUser(
          updateStaffDto.phoneNumber,
        );

        if (existingStaff && existingStaff.role !== currentStaffRole) {
          throw new HttpException(
            ERROR_MESSAGES.userPhoneAlreadyExists,
            HttpStatus.NOT_FOUND,
          );
        }

        // Create update object with type assertion
        const updateData = { 
          ...updateStaffDto,
          role: updateStaffDto.role as Role | StaffRole 
        };

        await this.userRepository.update(staffId, updateData);

        if (updateStaffDto.avatar) {
          staff['avatarUrl'] = updateStaffDto.avatar
            ? `${process.env.AWS_STATIC_URL}/images/${updateStaffDto.avatar}`
            : null;
        }

        return response
          .status(HttpStatus.OK)
          .json({ ...staff, ...updateStaffDto });
      }
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, error.status);
    }
  }

  async delete(userId: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, deletedAt: null },
        relations: [
          'staffSchedules',
          'purposes',
          'reservations.orders',
          'vacations',
          'documents',
          'tokenKeys',
          'refreshToken',
          'favorites',
          'planHistories',
          'qrCode',
        ],
      });

      if (!user) {
        throw new HttpException(
          ERROR_MESSAGES.userNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const tokenKeyIds = user.tokenKeys.map((tokenKey) => tokenKey.id);
      if (tokenKeyIds.length > 0) {
        await this.tokenKeyRepository
          .createQueryBuilder()
          .where('id IN (:...ids)', { ids: tokenKeyIds })
          .delete()
          .execute();
      }

      if (user.refreshToken) {
        await this.refreshTokenRepository.delete(user.refreshToken.id);
      }

      await this.userRepository.softRemove(user);

      return { deleted: true };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllClients(user: AuthUser, filter: IFilter) {
    try {
      const { limit, skip, all, sortBy, search } = filter;
      const columns = ['username', 'email', 'phone_number'];

      const qb = this.userRepository.createQueryBuilder(this.alias);

      qb.select([
        'user.id as id',
        'user.username as username',
        'user.email as email',
        'user.avatar as avatar',
        'user.phone_number as phoneNumber',
        'MAX(reservations.date) as lastVisit',
        'CASE WHEN SUM(CASE WHEN reservations.status = :status THEN 1 ELSE 0 END) > 1 THEN :recurrentStatus ELSE :uniqueStatus END as status',
        'bonuses.type as bonusType',
        'SUM(orders.price) as ordersVolume',
        'GROUP_CONCAT(DISTINCT category.name) as categoryNames',
      ]);

      qb.setParameter('status', ReservationStatus.CLOSED);
      qb.setParameter(
        'recurrentStatus',
        `${ClientStatus.RECURRENT.charAt(
          0,
        ).toUpperCase()}${ClientStatus.RECURRENT.slice(1).toLowerCase()}`,
      );
      qb.setParameter(
        'uniqueStatus',
        `${ClientStatus.UNIQUE.charAt(
          0,
        ).toUpperCase()}${ClientStatus.UNIQUE.slice(1).toLowerCase()}`,
      );

      qb.leftJoin('user.reservations', 'reservations');
      qb.leftJoin(
        'user.bonuses',
        'bonuses',
        'bonuses.restaurant_id = :restaurantId',
        { restaurantId: user.restaurantId },
      );
      qb.leftJoin('reservations.orders', 'orders');
      qb.leftJoin('orders.product', 'product');
      qb.leftJoin('product.category', 'category');

      qb.where('user.role = :role', { role: Role.USER });
      qb.andWhere('user.deleted_at IS NULL');
      qb.andWhere('reservations.restaurant_id = :restaurantId', {
        restaurantId: user.restaurantId,
      });
      qb.andWhere('reservations.status = :status', {
        status: ReservationStatus.CLOSED,
      });

      FilterUtils.applyRangeFilter(qb, 'reservations', 'date', filter);
      FilterUtils.applyFilters(qb, this.alias, filter);

      if (search) {
        qb.andWhere(
          '(user.username LIKE :value OR ' +
            'user.email LIKE :value OR ' +
            'user.phone_number LIKE :value OR ' +
            'orders.price LIKE :value OR ' +
            'reservations.date LIKE :value OR ' +
            'reservations.status LIKE :value)',
          { value: `%${filter.search.toString()}%` },
        );
      }

      qb.groupBy('user.id, bonuses.type');

      if (sortBy) {
        const [column] = Object.entries(sortBy)[0];

        if (columns.includes(column)) {
          FilterUtils.applySorting(qb, this.alias, filter);
        } else {
          FilterUtils.applySorting(qb, null, filter);
        }
      } else {
        qb.orderBy('lastVisit', 'DESC');
      }

      FilterUtils.applyPagination(qb, 'getRawMany', filter);

      const [users, countUsers] = await Promise.all([
        qb.getRawMany(),
        qb.getCount(),
      ]);

      for (const user of users) {
        user.categoryNames = user.categoryNames
          ? user.categoryNames.split(',')
          : [];
        user.avatar = user.avatar
          ? `${process.env.AWS_STATIC_URL}/images/${user.avatar}`
          : null;
      }

      const result = getPaginated({
        data: users,
        count: countUsers,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getClientById(
    clientId: string,
    authUser: AuthUser,
    reviewType?: string,
  ): Promise<any> {
    try {
      const user = await this.getUserWithReservationsAndReviews(
        clientId,
        authUser,
        reviewType,
      );

      if (!user) {
        throw new HttpException(
          ERROR_MESSAGES.userNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const total = this.calculateTotalOrderPrice(user.reservations);
      const formatedReservations = this.formatReservations(user.reservations);
      const formatedReviews = this.formatReviews(user.reviews);

      const formattedUser = {
        id: user.id,
        avatar: this.getUserAvatarUrl(user),
        username: user.username,
        reservationsTotal: total,
        reservations: formatedReservations,
        reviews: formatedReviews,
      };

      return prettify(formattedUser);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async verificationEmail(
    body: any,
    userId: string,
    i18n: I18nContext,
    request: any,
    response: any,
  ) {
    try {
      const { email, username, password, temporaryPassword } = body;

      const tokenData = await generateTokenKey(
        request,
        ms(process.env.TOKEN_KEY_EXPIRATION),
      );

      const options = await sendVerificationEmail(
        {
          email,
          username,
          temporaryPassword: temporaryPassword ? password : null,
          token: tokenData.token,
        },
        i18n,
        request,
      );
      await this.emailService.sendMail(options);

      const tokenKey = new TokenKey();

      tokenKey.expireAt = tokenData.expireAt.toDate();
      tokenKey.token = tokenData.token;
      tokenKey.userId = userId;

      await this.tokenKeyService.create(tokenKey, request);

      return response.status(HttpStatus.OK).json({ sended: true });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async confirmEmail(body: ConfirmEmailDto, response: any) {
    try {
      const { tokenKey } = body;
      const tokenKeyData = await this.tokenKeyService.getByTokenKey(tokenKey);

      const currentDate = new Date();
      const tokenExpireDate = new Date(tokenKeyData.expireAt);

      if (currentDate > tokenExpireDate) {
        await this.removeCreatedStaff(tokenKeyData.userId);
        throw new HttpException(
          ERROR_MESSAGES.verificationEmailCannotBeCompleted,
          HttpStatus.BAD_REQUEST,
        );
      }

      const { email } = await this.getById(tokenKeyData.userId);

      await this.markEmailAsConfirmed(email);

      await this.tokenKeyService.deleteAllByUserId(tokenKeyData.userId);

      return response.status(HttpStatus.OK).json({ verified: true });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async confirmEmailUpdate(body: ConfirmEmailUpdateDto, response: any) {
    const { email, tokenKey } = body;
    const tokenKeyData = await this.tokenKeyService.getByTokenKey(tokenKey);

    const currentDate = new Date();
    const tokenExpireDate = new Date(tokenKeyData.expireAt);

    if (currentDate > tokenExpireDate) {
      throw new HttpException(
        ERROR_MESSAGES.verificationEmailCannotBeCompleted,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.userRepository.update(tokenKeyData.userId, { email });
    await this.tokenKeyService.deleteAllByUserId(tokenKeyData.userId);

    return { status: 'Email updated.' };
  }

  async sendSupportEmail(
    supportEmail: SupportEmail,
    user: AuthUser,
    response: any,
  ) {
    const existingUser = await this.getById(user.id);

    if (!existingUser) {
      throw new HttpException(
        ERROR_MESSAGES.userNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const subject = `${supportEmail.title} ${supportEmail.module}`;
    const text = supportEmail.message;

    const options = {
      email: process.env.SUPPORT_EMAIL,
      reply: existingUser.email,
      message: text,
      title: subject,
    };

    const emailOptions = await sendSupportEmail(options);

    await this.emailService.sendMail(emailOptions);

    return response.status(HttpStatus.OK).json({ sended: true });
  }

  async contactEmail(
    body: ContactEmailDto,
    i18n: I18nContext,
    request: any,
    response: any,
  ) {
    try {
      const options = await sendContactEmail(body, i18n, request);

      await this.emailService.sendMail(options);

      return response.status(HttpStatus.OK).json({ sended: true });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  private async removeCreatedStaff(userId: string) {
    try {
      await this.vacationRepository.delete({ userId });
      await this.delete(userId);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async verificationEmailForUserUpdate(
    email: string,
    username: string,
    userId: string,
    i18n: I18nContext,
    request: any,
  ) {
    const tokenData = await generateTokenKey(
      request,
      ms(process.env.TOKEN_KEY_EXPIRATION),
    );

    const options = await sendVerificationEmail(
      {
        email,
        username,
        temporaryPassword: null,
        token: tokenData.token,
      },
      i18n,
      request,
    );

    await this.emailService.sendMail(options);

    const tokenKey = new TokenKey();

    tokenKey.expireAt = tokenData.expireAt.toDate();
    tokenKey.token = tokenData.token;
    tokenKey.userId = userId;

    await this.tokenKeyService.create(tokenKey, request);
  }

  async getOverviewCalendar(
    user: AuthUser,
    yearAndMonth: string,
    previousDays: number,
    upcomingDays: number,
  ): Promise<User[]> {
    try {
      const { startDate, endDate } = this.getSheduleStartAndEndDate(
        yearAndMonth,
        previousDays,
        upcomingDays,
      );

      const queryBuilder = this.userRepository.createQueryBuilder(this.alias);

      queryBuilder
        .where('user.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('user.role != :role', { role: Role.SUPER_ADMIN })
        .andWhere('user.deleted_at IS NULL')
        .leftJoinAndSelect(
          'user.documents',
          'documents',
          'documents.deleted_at IS NULL',
        )
        .leftJoinAndSelect(
          'user.vacations',
          'vacations',
          'vacations.deleted_at IS NULL',
        )
        .leftJoinAndSelect(
          'user.staffSchedules',
          'staffSchedules',
          'staffSchedules.deleted_at IS NULL',
        )
        .andWhere(
          `((staffSchedules.date BETWEEN :startDate AND :endDate) OR staffSchedules.date IS NULL)`,
          {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        )
        .orderBy('staffSchedules.date', 'ASC');

      const users = await queryBuilder.getMany();

      for (const user of users) {
        user['avatarUrl'] = user.avatar
          ? `${process.env.AWS_STATIC_URL}/images/${user.avatar}`
          : null;
      }

      return users;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  private getSheduleStartAndEndDate(
    yearAndMonth: string,
    previousDays: number,
    upcomingDays: number,
  ) {
    const date = new Date(yearAndMonth);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const upcomingDaysLimited = Math.min(upcomingDays, lastDayOfMonth - day);
    const startDate = new Date(year, month - 1, day - previousDays);
    const endDate = new Date(year, month, day + upcomingDaysLimited);

    return { startDate, endDate };
  }

  private async getUserWithReservationsAndReviews(
    clientId: string,
    authUser: AuthUser,
    reviewType?: string,
  ): Promise<User | undefined> {
    const reviewTypes = ['good', 'bad'];
    const user = await this.userRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(
        'user.reservations',
        'reservations',
        'reservations.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'reservations.orders',
        'orders',
        'orders.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'reservations.reviews',
        'reviews',
        'reviews.is_client_review = true AND reviews.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'reservations.waiter',
        'waiter',
        'waiter.deleted_at IS NULL',
      )
      .where('user.id = :id', { id: clientId })
      .andWhere('user.deleted_at IS NULL')
      .andWhere('reservations.restaurant_id = :restaurantId', {
        restaurantId: authUser.restaurantId,
      })
      .andWhere('reservations.status = :status', {
        status: ReservationStatus.CLOSED,
      })
      .orderBy('reservations.date', 'DESC')
      .limit(5)
      .getOne();

    const reviewsQb = this.userRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(
        'user.reviews',
        'reviews',
        'reviews.is_client_review = true AND reviews.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'reviews.restaurant',
        'restaurant',
        'restaurant.deleted_at IS NULL',
      )
      .where('user.id = :id', { id: clientId })
      .andWhere('user.deleted_at IS NULL')
      .andWhere('reviews.restaurant_id = :restaurantId', {
        restaurantId: authUser.restaurantId,
      })
      .orderBy('reviews.created_at', 'DESC')
      .limit(5);

    if (reviewType && reviewTypes.includes(reviewType.toLowerCase())) {
      const isGoodReview = reviewType.toLowerCase() === 'good';
      const operator = isGoodReview ? '>' : '<=';

      reviewsQb
        .having(
          `AVG(
            CASE WHEN reviews.is_client_review = true THEN
              (reviews.food_rating + reviews.service_rating + reviews.price_rating + reviews.ambience_rating) / 4
            ELSE
              NULL
            END
          ) ${operator} :rating`,
          { rating: 3.5 },
        )
        .groupBy('reviews.id');
    }

    const userWithReviews = await reviewsQb.getOne();
    user.reviews = userWithReviews ? userWithReviews.reviews : [];

    return user;
  }

  private calculateTotalOrderPrice(reservations: Reservation[]): number {
    return reservations.reduce(
      (total, reservation) =>
        total +
        reservation.orders.reduce(
          (subtotal, order) => subtotal + +order.price,
          0,
        ),
      0,
    );
  }

  private formatReservations(reservations: Reservation[]): any[] {
    return reservations.map((reservation) => {
      const totalOrderPrice = reservation.orders
        .reduce((total, order) => total + +order.price, 0)
        .toFixed(2);
      const type = reservation.orders.some(
        (order) => order.reservationId === reservation.id && !order.isPreorder,
      )
        ? 'regular reservation'
        : 'preorder reservation';
      const serviceRating =
        reservation.reviews.find((review) => review.isClientReview)
          ?.serviceRating || 0;
      const waiterName = reservation.waiter?.username || null;
      const waiterAvatar = reservation.waiter?.avatar
        ? `${process.env.AWS_STATIC_URL}/images/${reservation.waiter?.avatar}`
        : null;

      return {
        id: reservation.id,
        date: reservation.date,
        guestsNumber: reservation.guestsNumber,
        price: +totalOrderPrice,
        type,
        serviceRating,
        waiterName,
        waiterAvatar,
      };
    });
  }

  private formatReviews(reviews: Review[]): any[] {
    return reviews.map((review) => {
      const {
        foodRating,
        priceRating,
        serviceRating,
        ambienceRating,
        createdAt,
        restaurant,
      } = review;

      const averageRating = (
        (foodRating + priceRating + serviceRating + ambienceRating) /
        4
      ).toFixed(2);

      const type = +averageRating <= 3.5 ? 'bad' : 'good';
      const restaurantName = restaurant?.name || null;
      const restaurantImage = restaurant?.image
        ? `${process.env.AWS_STATIC_URL}/images/${restaurant.image}`
        : null;

      return {
        id: review.id,
        message: review.message,
        rating: +averageRating,
        type,
        date: createdAt,
        restaurantName,
        restaurantImage,
      };
    });
  }

  private getUserAvatarUrl(user: User): string | null {
    return user.avatar
      ? `${process.env.AWS_STATIC_URL}/images/${user.avatar}`
      : null;
  }
}
