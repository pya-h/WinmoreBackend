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
        lastProcessedBlockNumber: chain.lastProcessedBlock,
        chainId: chain.id,
      };

    this.tokenContracts = await this.walletService.findContracts(true);
  }

  async isProviderConnected(provider: Web3): Promise<boolean> {
    try {
      return await provider.eth.net.isListening();
    } catch (err) {
      this.logger.error('Provider connection error: ', err);
      return false;
    }
  }

  async reconnectProvider(chainId: number) {
    try {
      const chain = await this.walletService.getChainById(chainId);

      this.chainHistory[chainId].provider = new Web3(chain.providerUrl);

      this.logger.log(`Reconnected to provider for chain#${chainId}`);
      return true;
    } catch (error) {
      this.logger.error(`Chain#${chainId} Reconnection failed:`, error);
    }
    return false;
  }

  async processLogsInRange(
    { provider, chainId }: ChainHistory,
    fromBlock: bigint,
    toBlock: bigint,
    contract: Contract,
  ) {
    const contractAddr = contract.address.toLowerCase();
    const logs = (await provider.eth.getPastLogs({
      fromBlock: provider.utils.toHex(fromBlock),
      toBlock: provider.utils.toHex(toBlock),
      address: contractAddr,
      topics: [
        provider.eth.abi.encodeEventSignature(
          'Transfer(address,address,uint256)',
        ), // Event signature for ERC20 Transfer
        null,
        provider.eth.abi.encodeParameter(
          'address',
          this.walletService.businessWallet.address,
        ), // Filter logs for 'to' address
      ],
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

      this.logger.debug(decodedLog);
      if (
        decodedLog.to.toString() === this.walletService.businessWallet.address // double check address
      ) {
        await this.walletService.deposit({
          walletAddress: decodedLog.from.toString(),
          token: contract.identifier as TokensEnum,
          amount: +provider.utils.fromWei(decodedLog.value.toString(), 'mwei'), // TODO: Ensure conversion is correct
          chainId,
        });
      }
    }
  }

  endBlock = (a: bigint, b: bigint) => (a <= b ? a : b);

  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkoutLatestBlocks() {
    const processLogTasks: Promise<void>[] = [];

    for (const chainId in this.chainHistory) {
      const { lastProcessedBlockNumber, provider } = this.chainHistory[chainId];

      if (
        !(await this.isProviderConnected(provider)) &&
        !(await this.reconnectProvider(+chainId))
      ) {
        continue;
      }

      const latestFinalizedBlock = await provider.eth.getBlock('finalized');

      if (
        lastProcessedBlockNumber &&
        lastProcessedBlockNumber >= latestFinalizedBlock.number
      )
        continue;

      this.logger.debug(
        `Processing chain#${chainId} blocks: #${lastProcessedBlockNumber} to ${latestFinalizedBlock.number}`,
      );

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
                this.chainHistory[chainId],
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
      await this.walletService.syncChainsLastProcessedBlock(
        this.chainHistory[chainId],
      );
    }
  }
}
