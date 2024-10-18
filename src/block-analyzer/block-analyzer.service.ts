import { Injectable, Logger } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import Web3, { DecodedParams } from 'web3';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChainHistory } from './type/chain-history.type';
import { Contract } from '@prisma/client';
import { Web3TrxLogType } from './type/trx-receipt.type';

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
    for (const chain of await this.walletService.findChains(true)) {
      this.chainHistory[chain.id] = {
        provider: new Web3(chain.providerUrl),
        lastProcessedBlockNumber: chain.lastProcessedBlock,
        chainId: chain.id,
        blockProcessRange: BigInt(chain.blockProcessRange),
        contracts: chain['contracts'],
      };

      for (const contract of this.chainHistory[chain.id].contracts) {
        try {
          if (contract.decimals == null) {
            contract.decimals = Number(
              await this.getContractDecimals(
                this.chainHistory[chain.id].provider,
                contract.address,
              ),
            );
            console.log(contract.decimals);
            await this.walletService.saveContract(contract);
          }
        } catch (ex) {
          this.logger.error(
            `Error loading chain#${chain.id} contract#${contract.token} data`,
            ex,
          );
        }
      }
    }
  }

  async getContractDecimals(provider: Web3, contractAddress: string) {
    const contract = new provider.eth.Contract(
      [
        {
          constant: true,
          inputs: [],
          name: 'decimals',
          outputs: [{ name: '', type: 'uint8' }],
          type: 'function',
        },
      ],
      contractAddress,
    );
    return BigInt(await contract.methods.decimals().call());
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
      this.chainHistory[chainId].blockProcessRange = BigInt(
        chain.blockProcessRange,
      );
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
    const businessWallet =
      this.walletService.businessWallet.address.toLowerCase();
    const logs = (await provider.eth.getPastLogs({
      fromBlock: provider.utils.toHex(fromBlock),
      toBlock: provider.utils.toHex(toBlock),
      address: contract.address, // TODO: Check if .toLowerCase() is required or not?
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
      if (log.removed) continue;

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
        decodedLog.to.toString().toLowerCase() === businessWallet // double check address
      ) {
        await this.walletService.deposit({
          walletAddress: decodedLog.from.toString(),
          token: contract.token,
          amount: Number(decodedLog.value) / 10 ** contract.decimals, // TODO: Ensure conversion is correct
          chainId,
        });
      }
    }
  }

  endBlock = (a: bigint, b: bigint) => (a <= b ? a : b);

  // @Cron(CronExpression.EVERY_10_SECONDS)
  async checkoutLatestBlocks() {
    const processLogTasks: Promise<void>[] = [];

    for (const chainId in this.chainHistory) {
      try {
        if (
          !(await this.isProviderConnected(
            this.chainHistory[chainId].provider,
          )) &&
          !(await this.reconnectProvider(+chainId))
        ) {
          continue;
        }

        const {
          lastProcessedBlockNumber,
          provider,
          blockProcessRange,
          contracts,
        } = this.chainHistory[chainId];

        const latestFinalizedBlock = await provider.eth.getBlock('finalized');

        if (
          lastProcessedBlockNumber &&
          lastProcessedBlockNumber >= latestFinalizedBlock.number
        )
          continue;

        this.logger.debug(
          `Processing chain#${chainId} blocks: #${lastProcessedBlockNumber ? lastProcessedBlockNumber + 1n : latestFinalizedBlock.number} to ${latestFinalizedBlock.number}`,
        );

        let i: bigint;
        try {
          for (
            i =
              lastProcessedBlockNumber != null
                ? lastProcessedBlockNumber + 1n
                : latestFinalizedBlock.number;
            i <= latestFinalizedBlock.number;
            i += blockProcessRange
          ) {
            for (const contract of contracts) {
              processLogTasks.push(
                this.processLogsInRange(
                  this.chainHistory[chainId],
                  i,
                  this.endBlock(
                    i + blockProcessRange - 1n,
                    latestFinalizedBlock.number,
                  ),
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
      } catch (ex) {
        this.logger.error(`failed trying to process chain#${chainId}`, ex);
      }
    }
  }
}
