import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsOptional } from 'class-validator';

export class TestAuthWalletAddressDto {
  @ApiProperty({
    description: 'The wallet address of the user requesting the nonce.',
  })
  @IsEthereumAddress({
    message: 'This must be a valid ethereum wallet address.',
  })
  @IsOptional()
  address?: string;
}
