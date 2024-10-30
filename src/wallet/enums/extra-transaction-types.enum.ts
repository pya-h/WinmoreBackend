import { TransactionTypeEnum } from '@prisma/client';

export enum ExtraTransactionTypesEnum {
  ALL = 'ALL',
  BLOCKCHAIN = 'BLOCKCHAIN',
}

export type GeneralTransactionTypes =
  | TransactionTypeEnum
  | ExtraTransactionTypesEnum;
