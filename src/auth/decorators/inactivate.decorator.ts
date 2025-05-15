import { SetMetadata } from '@nestjs/common';

export const Inactivate = (active: boolean) => SetMetadata('active', active);
