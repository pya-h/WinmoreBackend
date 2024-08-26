import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'User email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'The displaying name of the user' })
  @IsOptional()
  @IsString({ message: 'Your name must be a string.' })
  name?: string;
}
