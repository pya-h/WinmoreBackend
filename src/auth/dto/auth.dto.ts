import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { WalletAddressDto } from './wallet-address.dto';

export class AuthenticationDto extends WalletAddressDto {
  @ApiProperty({ description: 'Actual message to be signed.' })
  @IsNotEmpty()
  @IsString({ message: 'Actual message must be a valid string.' })
  message: string;

  @ApiProperty({ description: 'Signed message.' })
  @IsNotEmpty()
  @IsString({ message: 'Signed message must be a valid string.' })
  signature: string;
}
