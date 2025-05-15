import { SetMetadata } from '@nestjs/common';

export const Plans = (...plans: string[]) => SetMetadata('plans', plans);
