import { BlockStatus, Contract } from '@prisma/client';
import Web3 from 'web3';

export type ChainHistory = {
  provider: Web3;
  lastProcessedBlockNumber: bigint | undefined;
  chainId: number;
  blockProcessRange: bigint;
  contracts: Contract[];
  acceptedBlockStatus: BlockStatus;
};
