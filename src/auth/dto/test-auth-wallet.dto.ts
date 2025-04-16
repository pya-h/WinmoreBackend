import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, IsEthereumAddress, IsOptional } from 'class-validator';

export class TestAuthWalletAddressDto {
  @ApiProperty({
    description: 'The wallet address of the user requesting the nonce.',
  })
  @IsEthereumAddress({
    message: 'This must be a valid ethereum wallet address.',
  })
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'The referral code of the referrer user (if any).',
  })
  @IsOptional()
  @IsAlphanumeric(null, { message: 'Invalid referral code provided!' })
  referrerCode?: string;
}
