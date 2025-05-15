import { Expose, Type } from 'class-transformer';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { PaymentType } from '@src/payment/entities/payment-account.entity';

class RestaurantDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  address: string;

  @Expose()
  latitude: number;

  @Expose()
  longitude: number;
}

class UserDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  phone: string;
}

class ProductDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  price: number;
}

class OrderItemDto {
  @Expose()
  id: string;

  @Expose()
  quantity: number;

  @Expose()
  price: number;

  @Expose()
  @Type(() => ProductDto)
  product: ProductDto;
}

export class DeliveryOrderResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => RestaurantDto)
  restaurant: RestaurantDto;

  @Expose()
  @Type(() => UserDto)
  operator: UserDto;

  @Expose()
  @Type(() => UserDto)
  courier: UserDto;

  @Expose()
  client_name: string;

  @Expose()
  client_phone: string;

  @Expose()
  comments: string;

  @Expose()
  address_entrance: string;

  @Expose()
  address_staircase: string;

  @Expose()
  address_floor: string;

  @Expose()
  address_intercom: string;

  @Expose()
  payment_type: PaymentType;

  @Expose()
  total_amount: number;

  @Expose()
  courier_status: DeliveryStatus;

  @Expose()
  courier_pickup_time: Date;

  @Expose()
  estimated_delivery_time: number;

  @Expose()
  estimated_preparation_time: number;

  @Expose()
  operator_modified_at: Date;

  @Expose()
  order_date: Date;

  @Expose()
  created_at: Date;

  @Expose()
  client_latitude: number;

  @Expose()
  client_longitude: number;

  @Expose()
  courier_latitude: number;

  @Expose()
  courier_longitude: number;

  @Expose()
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
