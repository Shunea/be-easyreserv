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

export class CreatePosDto {
    @ApiProperty({ description: 'Title of the POS device' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({
        description: 'Type of the POS device',
        enum: PosType,
        default: PosType.MOBILE,
    })
    @IsNotEmpty()
    @IsEnum(PosType)
    posType: PosType;

    @ApiPropertyOptional({ description: 'Device status', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ description: 'Installation date of the POS device' })
    @IsNotEmpty()
    @IsDateString()
    installationDate: string;

    @ApiProperty({ description: 'Serial number of the POS device' })
    @IsNotEmpty()
    @IsString()
    serialNumber: string;

    @ApiProperty({ description: 'Provider of the POS device' })
    @IsNotEmpty()
    @IsString()
    provider: string;

    @ApiProperty({ description: 'Version of the POS device' })
    @IsNotEmpty()
    @IsString()
    version: string;

    @ApiProperty({ description: 'Last maintenance date of the POS device' })
    @IsNotEmpty()
    @IsDateString()
    lastMaintenanceDate: string;

    @ApiPropertyOptional({ description: 'Additional observations or notes' })
    @IsOptional()
    @IsString()
    observations?: string;

    @ApiProperty({ description: 'User associated with the POS device' })
    @IsNotEmpty()
    @IsString()
    user: string;
}
