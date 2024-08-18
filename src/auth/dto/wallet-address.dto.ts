import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress } from 'class-validator';

export class WalletAddressDto {
  @ApiProperty({
    description: 'The wallet address of the user requesting the nonce.',
  })
  @IsEthereumAddress({
    message: 'This must be a valid ethereum wallet address.',
  })
  address: string;
}
