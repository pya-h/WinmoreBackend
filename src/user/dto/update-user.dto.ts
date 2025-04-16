import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'User email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'The displaying name of the user' })
  @IsOptional()
  @IsString({ message: 'Your name must be a string.' })
  name?: string;

  @ApiProperty({ description: 'The displayable avatar url of the user.' })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({
    description: 'The referral code of the referrer user (if any).',
  })
  @IsOptional()
  @IsAlphanumeric(null, { message: 'Invalid referral code provided!' })
  referrerCode?: string;
}
