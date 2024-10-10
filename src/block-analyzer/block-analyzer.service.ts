import { Injectable, Logger } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import Web3 from 'web3';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChainHistory } from './type/chain-history.type';

@Injectable()
export class BlockAnalyzerService {
  private readonly logger = new Logger(BlockAnalyzerService.name); // TODO: Test this logger
  private chainHistory: Record<number, ChainHistory> = {};

  constructor(private readonly walletService: WalletService) {
    this.init().catch((err) =>
      this.logger.error(
        'Failed to init providers: ',
        (err as Error).stack,
        err as string,
      ),
    );
  }

  async init() {
    for (const chain of await this.walletService.findChains())
      this.chainHistory[chain.id] = {
        provider: new Web3(chain.providerUrl),
        lastProcessedBlockNumber: undefined,
      };
  }

  //TODO: [maybe] It can be more precise, if first check there is such trx [by hash, number or what?] in db or not.
  async processBlockTransactions(provider: Web3, blockNumber: bigint) {
    const block = await provider.eth.getBlock(blockNumber, true);
    const depositTasks: Promise<unknown>[] = [];
    const businessWallet =
      this.walletService.businessWallet?.address.toLowerCase();

    for (const trx of block.transactions) {
      if (
        typeof trx !== 'object' ||
        trx?.['to']?.toLowerCase() !== businessWallet
      )
        continue;
    }

    await Promise.all(depositTasks);
  }

  // FIXME: Persist the lastProcessBlocks.

  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkoutLatestBlocks() {
    const processTrxTasks: Promise<void>[] = [];
    for (const chainId in this.chainHistory) {
      const { provider, lastProcessedBlockNumber } = this.chainHistory[chainId];

      const latestFinalizedBlock = await provider.eth.getBlock('finalized');
      if (
        lastProcessedBlockNumber &&
        lastProcessedBlockNumber >= latestFinalizedBlock.number
      )
        continue;

      this.chainHistory[chainId].lastProcessedBlockNumber =
        latestFinalizedBlock.number;

      for (
        let i = lastProcessedBlockNumber || latestFinalizedBlock.number;
        i <= latestFinalizedBlock.number;
        processTrxTasks.push(this.processBlockTransactions(provider, i)), i++
      );

      await Promise.all(processTrxTasks); // process all transactions at once.
    }
  }
}
