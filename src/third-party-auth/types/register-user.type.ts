import { AuthPlatform } from '../enums/auth-platform.enum';

export type RegisterUserType = {
  authPlatform: AuthPlatform;
  username: string;
  email: string;
  password: string;
};
