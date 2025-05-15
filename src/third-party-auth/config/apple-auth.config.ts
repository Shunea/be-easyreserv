import { AppleConfig } from './auth-config.interfaces';

export const appleAuthConfigSchema: AppleConfig = {
  apple: {
    clientID: process.env.APPLE_CLIENT_ID,
  },
};
