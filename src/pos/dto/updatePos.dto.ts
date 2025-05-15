import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import { PosType } from '@src/pos/enums/pos-type.enum';

export class UpdatePosDto {
    @ApiPropertyOptional({ description: 'Title of the POS device' })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiPropertyOptional({
        description: 'Type of the POS device',
        enum: PosType,
        default: PosType.MOBILE,
    })
    @IsOptional()
    @IsNotEmpty()
    @IsEnum(PosType)
    posType: PosType;

    @ApiPropertyOptional({ description: 'Device status', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Installation date of the POS device' })
    @IsOptional()
    @IsNotEmpty()
    @IsDateString()
    installationDate: string;

    @ApiPropertyOptional({ description: 'Serial number of the POS device' })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    serialNumber: string;

    @ApiPropertyOptional({ description: 'Provider of the POS device' })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    provider: string;

    @ApiPropertyOptional({ description: 'Version of the POS device' })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    version: string;

    @ApiPropertyOptional({ description: 'Last maintenance date of the POS device' })
    @IsOptional()
    @IsNotEmpty()
    @IsDateString()
    lastMaintenanceDate: string;

    @ApiPropertyOptional({ description: 'Additional observations or notes' })
    @IsOptional()
    @IsString()
    observations?: string;

    @ApiPropertyOptional({ description: 'Restaurant associated with the POS device' })
    @IsOptional()
    @IsString()
    restaurantId?: string;

    @ApiPropertyOptional({ description: 'User associated with the POS device' })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    user: string;
}
