import { ApiProperty } from '@nestjs/swagger';
import { PaginationOptionsDto } from '../../common/dtos/pagination-options.dto';
import { IsEnum, IsIn, IsNumberString, IsOptional } from 'class-validator';
import {
  TokensEnum,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '@prisma/client';
import {
  ExtraTransactionTypesEnum,
  GeneralTransactionTypes,
} from '../enums/extra-transaction-types.enum';

const supportedTransactionsTypes = [
  ...Object.values(TransactionTypeEnum),
  ...Object.values(ExtraTransactionTypesEnum),
];

export class TransactionHistoryFilterDto extends PaginationOptionsDto {
  @ApiProperty({
    description: 'Filter only games within special status.',
    required: false,
  })
  @IsOptional()
  @IsIn(supportedTransactionsTypes, {
    message:
      'Transaction type must be one of these options: ' +
      supportedTransactionsTypes.join(', '),
  })
  type?: GeneralTransactionTypes;

  @ApiProperty({
    description: 'The token which user is betting with.',
    default: TokensEnum.USDT,
    enum: TokensEnum,
    enumName: 'TokensEnum',
    required: false,
  })
  @IsOptional()
  @IsEnum(TokensEnum, {
    message: 'Supported tokens are: ' + Object.values(TokensEnum).join(', '),
  })
  token?: TokensEnum;

  @ApiProperty({
    description: 'Id of the chain bet resources are in.',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  chain?: number;

  @ApiProperty({
    description: 'The difficulty of the game.',
    enum: TransactionStatusEnum,
    enumName: 'TransactionStatusEnum',
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionStatusEnum, {
    message:
      'Available transaction status values are: ' +
      Object.values(TransactionStatusEnum).join(', '),
  })
  status?: TransactionStatusEnum;
}
