import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class VerificationCodeDto {
  @ApiProperty({ description: 'User email' })
  @IsNotEmpty({ message: 'Please provide your email.' })
  @IsEmail()
  email: string;
}
