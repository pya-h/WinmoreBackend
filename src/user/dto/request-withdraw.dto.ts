import { ApiProperty } from '@nestjs/swagger';
import { TokensEnum } from '@prisma/client';
import { IsEnum, IsInt, IsNumber, IsPositive } from 'class-validator';

export class RequestWithdrawalDto {
  @ApiProperty({ description: 'The chain user wants to withdraw on' })
  @IsInt()
  @IsPositive()
  chain: number;

  @ApiProperty({
    description: 'The token which user wants to withdraw',
    enum: TokensEnum,
    enumName: 'TokensEnum',
    required: true,
  })
  @IsEnum(TokensEnum, {
    message:
      'Available token values are: ' + Object.values(TokensEnum).join(', '),
  })
  token: TokensEnum;

  @ApiProperty({ description: 'Amount user wants' })
  @IsNumber()
  @IsPositive()
  amount: number;
}
