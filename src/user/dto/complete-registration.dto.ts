import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CompleteRegistrationDto {
  @ApiProperty({ description: 'User email' })
  @IsNotEmpty({ message: 'Please provide your email.' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'The displaying name of the user' })
  @IsNotEmpty({ message: 'Please provide your name.' })
  @IsString({ message: 'Your name must be a string.' })
  name: string;

  @ApiProperty({
    description: 'The referral code of the referrer user (if any).',
  })
  @IsOptional()
  @IsAlphanumeric('en-US', { message: 'Invalid referral code provided!' })
  referrerCode?: string;
}
