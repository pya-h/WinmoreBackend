import { ApiProperty } from '@nestjs/swagger';
import { PaginationOptionsDto } from '../../common/dtos/pagination-options.dto';
import { IsIn, IsOptional } from 'class-validator';
import { TransactionTypeEnum } from '@prisma/client';
import {
  ExtraTransactionTypesEnum,
  GeneralTransactionTypes,
} from '../types/extra-transaction-types.enum';

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
}
