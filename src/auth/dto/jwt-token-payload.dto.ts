import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class JwtTokenPayloadDto {
  @ApiProperty({
    description: 'Id of the user as payload subject',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  sub: number;

  @ApiProperty({ description: 'Wallet address of the user', required: true })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Jwt expiry related data.' })
  @IsNumber()
  iat: number;

  @ApiProperty({ description: 'Jwt expiry related data.' })
  @IsNumber()
  exp: number;
}
