import { BlockStatus, TokensEnum } from '@prisma/client';

export type BlockType = {
  number: bigint;
  hash: string;
  chainId: number;
  status: BlockStatus;
};

export type BlockchainLogType = {
  walletAddress: string;
  token: TokensEnum;
  amount: number;
  hash?: string;
  index?: bigint;
  block: BlockType;
};
