import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CompleteRegistrationDto {
  @ApiProperty({ description: 'User email' })
  @IsNotEmpty({ message: 'Please provide your email.' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'The displaying name of the user' })
  @IsOptional()
  @IsString({ message: 'Your name must be a string.' })
  name: string;
}
