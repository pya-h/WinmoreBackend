import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CompleteRegistrationDto {
  @ApiProperty({ description: 'User email' })
  @IsNotEmpty({ message: 'Please provide your email.' })
  @IsEmail({}, { message: 'Email field must be a valid email address!' })
  @MaxLength(256, {
    message: 'Email address can not be longer than 256 characters!',
  })
  email: string;

  @ApiProperty({ description: 'The displaying name of the user' })
  @IsNotEmpty({ message: 'Please provide your name!' })
  @MinLength(3, { message: 'Name is too short!' })
  @MaxLength(256, { message: 'Name is too long!' })
  name: string;

  @ApiProperty({
    description: 'The referral code of the referrer user (if any).',
  })
  @IsOptional()
  @IsAlphanumeric('en-US', { message: 'Invalid referral code provided!' })
  referrerCode?: string;
}
