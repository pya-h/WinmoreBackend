import Web3 from 'web3';

export type ChainHistory = {
  provider: Web3;
  lastProcessedBlockNumber: bigint | undefined;
  chainId: number;
};
