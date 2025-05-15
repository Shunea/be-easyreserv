import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { AppDataSource } from 'ormconfig';
import { AuthMiddleware } from './middlewares/Authentication';
import { AuthModule } from './auth/auth.module';
import { AwsS3Module } from './aws/aws-s3.nodule';
import { CategoryModule } from './category/category.module';
import { ConfigModule } from '@nestjs/config';
import { CronjobsModule } from './cronjobs/cronjobs.module';
import { DeviceDetection } from './middlewares/DeviceDetection';
import { DocumentModule } from './document/document.module';
import { FavoriteModule } from './favorite/favorite.module';
import { IngredientModule } from './ingredient/ingredient.module';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { BonusModule } from './bonus/bonus.module';
import { BullModule } from '@nestjs/bull';
import { CommunicationModule } from './comunication/communication.module';
import { Environments } from './constants';
import { NotificationModule } from './notification/notification.module';
import { PaymentModule } from './payment/payment.module';
import { PlaceModule } from './place/place.module';
import { PlanInsertionService } from './scripts/insert-plans';
import { PlanModule } from './plan/plan.module';
import { PrintModule } from './print/print.module';
import { ProductModule } from './product/product.module';
import { PublicRoute } from './middlewares/PublicRoute';
import { QRModule } from './qrCode/qr.module';
import { QueryParser } from './middlewares/QueryParser';
import { QueuesModule } from './queues/queues.module';
import { RefreshTokenModule } from './refreshToken/refreshToken.module';
import { ReservationModule } from './reservation/reservation.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { ReviewModule } from './review/review.module';
import { SpaceItemsModule } from './space-items/space-items.module';
import { StatisticsModule } from './statistics/statistics.module';
import { StockModule } from './stock/stock.module';
import { SuplierModule } from './suplier/suplier.module';
import { TableModule } from './table/table.module';
import { TelegramConnectionModule } from './telegram-connectionn/telegram.module';
import { ThirdPartyAppAuth } from './third-party-auth/third-party.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { TransportModule } from './transport/transport.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { PlacementModule } from '@src/placement/placement.module';
import { InvoiceModule } from './invoice/invoice.module';
import { DeliveryModule } from './delivery/delivery.module';
import { PosModule } from "@src/pos/pos.module";
import { SemifinishedProductsModule } from '@src/semifinished-products/semifinished-products.module';

dotenv.config();

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        ACCESS_TOKEN_SECRET_KEY: Joi.string().required(),
        ACCESS_TOKEN_EXPIRATION: Joi.string().required(),
        REFRESH_TOKEN_SECRET_KEY: Joi.string().required(),
        REFRESH_TOKEN_EXPIRATION: Joi.string().required(),
      }),
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: false,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        redis: {
          host: process.env.REDIS_HOST,
          port: +process.env.REDIS_PORT,
          ...(process.env.NODE_ENV !== Environments.development && {
            username: process.env.REDIS_USERNAME,
          }),
          ...(process.env.NODE_ENV !== Environments.development && {
            password: process.env.REDIS_PASSWORD,
          }),
        },
      }),
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    AuthModule,
    AwsS3Module,
    BonusModule,
    CategoryModule,
    CommunicationModule,
    CronjobsModule,
    DeliveryModule,
    DocumentModule,
    FavoriteModule,
    IngredientModule,
    NotificationModule,
    PaymentModule,
    PlaceModule,
    PlacementModule,
    PlanModule,
    PrintModule,
    ProductModule,
    QRModule,
    QueuesModule,
    RefreshTokenModule,
    ReservationModule,
    RestaurantModule,
    ReviewModule,
    SemifinishedProductsModule,
    SpaceItemsModule,
    StatisticsModule,
    StockModule,
    SuplierModule,
    TableModule,
    TelegramConnectionModule,
    ThirdPartyAppAuth,
    TransportModule,
    UserModule,
    InvoiceModule,
    PosModule,
    SemifinishedProductsModule
  ],
  controllers: [],
  providers: [PlanInsertionService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(QueryParser)
      .forRoutes({ path: '/**', method: RequestMethod.ALL });
    consumer
      .apply(DeviceDetection)
      .forRoutes({ path: '/**', method: RequestMethod.ALL });
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: '/auth/register', method: RequestMethod.POST },
        { path: '/auth/login', method: RequestMethod.POST },
        { path: '/auth/reset-password', method: RequestMethod.POST },
        { path: '/auth/update-password', method: RequestMethod.POST },
        { path: '/auth/resend-verification-email', method: RequestMethod.POST },
        { path: '/user/confirm', method: RequestMethod.POST },
        { path: '/user/contact', method: RequestMethod.POST },
        { path: '/auth/refresh-token', method: RequestMethod.POST },
        { path: '/plan', method: RequestMethod.GET },
        { path: '/token-key/check/:tokenKey', method: RequestMethod.GET },
        { path: '/google/mobile-oauth', method: RequestMethod.POST },
        { path: '/apple/mobile-oauth', method: RequestMethod.POST },
        { path: '/restaurant', method: RequestMethod.GET },
        { path: '/restaurant/:field', method: RequestMethod.GET },
        {
          path: '/restaurant/image-gallery/:restaurantId',
          method: RequestMethod.GET,
        },
        {
          path: '/product/restaurant/:restaurantId',
          method: RequestMethod.GET,
        },
        { path: '/review/restaurant/:restaurantId', method: RequestMethod.GET },
        {
          path: '/review/category/restaurant/:restaurantId',
          method: RequestMethod.GET,
        },
        { path: '/delivery/track/:id', method: RequestMethod.GET },
        {
          path: '/delivery/restaurant/:restaurantId/status',
          method: RequestMethod.GET,
        },
      )
      .forRoutes({ path: '/**', method: RequestMethod.ALL });
    consumer
      .apply(PublicRoute)
      .exclude({ path: '/**', method: RequestMethod.ALL })
      .forRoutes(
        { path: '/restaurant', method: RequestMethod.GET },
        { path: '/restaurant/:field', method: RequestMethod.GET },
        {
          path: '/restaurant/image-gallery/:restaurantId',
          method: RequestMethod.GET,
        },
        {
          path: '/product/restaurant/:restaurantId',
          method: RequestMethod.GET,
        },
        { path: '/review/restaurant/:restaurantId', method: RequestMethod.GET },
        {
          path: '/review/category/restaurant/:restaurantId',
          method: RequestMethod.GET,
        },
        {
          path: '/delivery/track/:id',
          method: RequestMethod.GET,
        },
        {
          path: '/delivery/restaurant/:restaurantId/status',
          method: RequestMethod.GET,
        },
      );
  }
}
