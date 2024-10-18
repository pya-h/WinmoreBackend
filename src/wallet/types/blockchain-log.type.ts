import { TokensEnum } from '@prisma/client';

export type BlockchainLogType = {
  walletAddress: string;
  token: TokensEnum;
  amount: number;
  chainId: number;
};
