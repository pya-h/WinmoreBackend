import { Injectable, Logger } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import Web3, { DecodedParams } from 'web3';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChainHistory } from './type/chain-history.type';
import { Contract, TokensEnum } from '@prisma/client';
import { Web3BlockType } from './type/block-transaction.type';
import { Web3TrxReceiptType } from './type/trx-receipt.type';

@Injectable()
export class BlockAnalyzerService {
  private readonly logger = new Logger(BlockAnalyzerService.name); // TODO: Test this logger
  private chainHistory: Record<number, ChainHistory> = {};
  private tokenContracts: Contract[] = [];

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

    this.tokenContracts = await this.walletService.findContracts(true);
  }

  async processTransactionsReceiptLogs(
    provider: Web3,
    receipt: Web3TrxReceiptType,
    contract: Contract,
  ) {
    const contractAddr = contract.address.toLowerCase();
    for (const log of receipt.logs) {
      if (log.address?.toLowerCase() === contractAddr) {
        const decodedLog: DecodedParams = provider.eth.abi.decodeLog(
          [
            {
              type: 'address',
              name: 'from',
              indexed: true,
            },
            {
              type: 'address',
              name: 'to',
              indexed: true,
            },
            {
              type: 'uint256',
              name: 'value',
            },
          ],
          log.data,
          log.topics,
        );

        await this.walletService.deposit({
          from: decodedLog.from.toString(),
          token: contract.identifier as TokensEnum,
          amount: +provider.utils.fromWei(+decodedLog.value, 'mwei'), // FIXME: Check conversion goes ok
        });
      }
    }
  }

  //TODO: [maybe] It can be more precise, if first check there is such trx [by hash, number or what?] in db or not.
  async processBlockTransactions(provider: Web3, blockNumber: bigint) {
    const block = await provider.eth.getBlock(blockNumber, true);
    const depositTasks: Promise<unknown>[] = [];
    const businessWallet =
      this.walletService.businessWallet?.address.toLowerCase();

    for (const trx of (block as Web3BlockType).transactions) {
      this.logger.debug('New Transaction fetch: ', trx); // TODO: Remove this later
      if (trx.to?.toLowerCase() !== businessWallet) continue;
      const receipt = await provider.eth.getTransactionReceipt(trx['hash']);
      for (const contract of this.tokenContracts)
        depositTasks.push(
          this.processTransactionsReceiptLogs(provider, receipt, contract),
        );
    }

    await Promise.all(depositTasks);
  }

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
