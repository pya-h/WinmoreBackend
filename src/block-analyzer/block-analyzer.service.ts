import { Injectable, Logger } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import Web3, { DecodedParams } from 'web3';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChainHistory } from './type/chain-history.type';
import { Contract, TokensEnum } from '@prisma/client';
import { Web3TrxLogType } from './type/trx-receipt.type';

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
  async processLogsInRange(
    provider: Web3,
    fromBlock: bigint,
    toBlock: bigint,
    contract: Contract,
  ) {
    const contractAddr = contract.address.toLowerCase();
    const logs = (await provider.eth.getPastLogs({
      fromBlock: provider.utils.toHex(fromBlock),
      toBlock: provider.utils.toHex(toBlock),
      address: contractAddr,
    })) as Web3TrxLogType[];

    for (const log of logs) {
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
        amount: +provider.utils.fromWei(+decodedLog.value, 'mwei'), // TODO: Ensure conversion is correct
      });
    }
  }

  endBlock = (a: bigint, b: bigint) => (a <= b ? a : b);

  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkoutLatestBlocks() {
    const processLogTasks: Promise<void>[] = [];

    for (const chainId in this.chainHistory) {
      const { provider, lastProcessedBlockNumber } = this.chainHistory[chainId];
      const latestFinalizedBlock = await provider.eth.getBlock('finalized');

      if (
        lastProcessedBlockNumber &&
        lastProcessedBlockNumber >= latestFinalizedBlock.number
      )
        continue;

      let i: bigint;
      try {
        for (
          i =
            lastProcessedBlockNumber != null
              ? lastProcessedBlockNumber + 1n
              : latestFinalizedBlock.number;
          i <= latestFinalizedBlock.number;
          i += 5n
        ) {
          for (const contract of this.tokenContracts) {
            processLogTasks.push(
              this.processLogsInRange(
                provider,
                i,
                this.endBlock(i + 4n, latestFinalizedBlock.number),
                contract,
              ),
            );
          }
        }

        await Promise.all(processLogTasks); // Process logs for all contracts in parallel
        this.chainHistory[chainId].lastProcessedBlockNumber =
          latestFinalizedBlock.number;
      } catch (ex) {
        this.logger.error(
          `Something crashed while processing range with the start block as block#${i}; next time the process will continue from crashed block.`,
          (ex as Error).stack,
        );
        this.chainHistory[chainId].lastProcessedBlockNumber = i - 1n;
      }
    }
  }
}
