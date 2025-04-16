import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'User email' })
  @IsOptional()
  @IsEmail({}, { message: 'Email field must be a valid email address!' })
  @MaxLength(256, {
    message: 'Email address can not be longer than 256 characters!',
  })
  email?: string;

  @ApiProperty({ description: 'The displaying name of the user' })
  @IsOptional()
  @MinLength(3, { message: 'Name is too short!' })
  @MaxLength(256, { message: 'Name is too long!' })
  name?: string;

  @ApiProperty({ description: 'The displayable avatar url of the user.' })
  @IsOptional()
  @IsUrl()
  avatar?: string;
}
