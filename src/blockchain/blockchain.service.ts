import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import Web3, { DecodedParams } from 'web3';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChainHistory } from './types/chain-history.type';
import {
  BlockchainLog,
  BlockStatus,
  Contract,
  TokensEnum,
  Transaction,
  Wallet,
} from '@prisma/client';
import { Web3TrxLogType } from './types/trx-receipt.type';
import {
  BlockchainLogType,
  BlockType,
  InitialWithdrawLog,
} from './types/blockchain-log.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private chainHistory: Record<number, ChainHistory> = {};

  constructor(
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService,
  ) {
    this.init().catch((ex) =>
      this.logger.error('General Failure loading chains: ', ex),
    );
  }

  async init() {
    for (const chain of await this.walletService.findChains(true)) {
      try {
        this.chainHistory[chain.id] = {
          provider: new Web3(chain.providerUrl),
          lastProcessedBlockNumber: chain.lastProcessedBlock,
          chainId: chain.id,
          blockProcessRange: BigInt(chain.blockProcessRange),
          acceptedBlockStatus: chain.acceptedBlockStatus,
          contracts: chain.contracts,
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
              await this.walletService.saveContract(contract);
            }
            this.logger.debug(
              `Successfully setup chain#${chain.id} contract#${contract.token}`,
            );
          } catch (ex) {
            this.logger.error(
              `Error loading TokenContract#${contract.token} data on chain#${chain.id}:`,
              ex,
            );
          }
        }
      } catch (ex) {
        this.logger.error(
          `Chain#${chain.id}:${chain.name} General Failure setting up providers: `,
          ex,
        );
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

  async getNextNonce(chainId: number) {
    const { provider } = this.chainHistory[chainId];

    let nonce: bigint;

    for (
      nonce = await provider.eth.getTransactionCount(
        this.walletService.businessWallet.address.toLowerCase(),
      );
      await this.isNonceUsed(chainId, nonce);
      nonce += 1n
    );
    return nonce;
  }

  async isNonceUsed(chainId: number, nonce: bigint) {
    return Boolean(
      await this.prisma.blockchainLog.findFirst({
        where: { chainId, trxNonce: nonce },
      }),
    );
  }

  async withdraw(
    targetWallet: Wallet,
    chainId: number,
    token: TokensEnum,
    amount: number,
  ) {
    const transaction = await this.walletService.withdraw(
      targetWallet,
      chainId,
      token,
      amount,
    );

    if (!transaction) {
      throw new ForbiddenException('Transaction creation failed.');
      // TODO: Complete this section (whole transaction section i mean.)
    }
    try {
      const { provider, contracts } = this.chainHistory[chainId];

      const tokenABI = [
        {
          constant: false,
          inputs: [
            { name: '_to', type: 'address' },
            { name: '_value', type: 'uint256' },
          ],
          name: 'transfer',
          outputs: [{ name: '', type: 'bool' }],
          type: 'function',
        },
      ];
      const tokenContractInstance = contracts.find(
        (ctx) => ctx.token === token,
      );

      const nonce = await this.getNextNonce(chainId);

      const tokenContract = new provider.eth.Contract(
        tokenABI,
        tokenContractInstance.address,
      );

      const amountInWei = amount * 10 ** tokenContractInstance.decimals; // TODO: Checkout? provider.utils.toWei(amount.toString(), 'ether'); // Adjust based on token decimals if needed

      const gasPrice = await provider.eth.getGasPrice();
      const { address: businessWalletAddress } =
        this.walletService.businessWallet;
      const gasLimit = await tokenContract.methods
        .transfer(targetWallet.address, amountInWei)
        .estimateGas({ from: businessWalletAddress });

      const initialData = {
        from: businessWalletAddress,
        to: tokenContractInstance.address,
        gas: gasLimit,
        gasPrice,
        nonce,
        data: tokenContract.methods
          .transfer(targetWallet.address, amountInWei)
          .encodeABI(),
      };

      const signedTrx = await provider.eth.accounts.signTransaction(
        initialData,
        this.walletService.businessWallet.private,
      );
      const blockchainWithdrawLog = await this.createInitialWithdrawLog(
        initialData as InitialWithdrawLog,
        transaction,
      );

      let finalLog: BlockchainLogType;
      provider.eth
        .sendSignedTransaction(signedTrx.rawTransaction)
        .then(async (receipt) => {
          finalLog = {
            walletAddress: targetWallet.address,
            token,
            amount,
            block: {
              number: BigInt(receipt.blockNumber),
              hash: receipt.blockHash.toString(),
              chainId,
              status: BlockStatus.latest, // This will then add the block to uncertain blocks, and the check block listener will check it until finalization; o.w. returns user balance.
            },
            hash: receipt.transactionHash.toString(),
            index: BigInt(receipt.transactionIndex),
            gasUsed: BigInt(receipt.gasUsed),
          };

          if (!receipt.status)
            throw new Error(
              'Transaction status was successful:' + JSON.stringify(receipt),
            );

          await Promise.all([
            this.finalizeWithdrawLog(blockchainWithdrawLog, finalLog),
            this.walletService.submitTransaction(transaction),
          ]);
          this.logger.debug('Withdrawal successful:', receipt);
        })
        .catch(async (err) => {
          this.logger.error('Failed to withdraw:', err);
          await Promise.all([
            this.finalizeWithdrawLog(blockchainWithdrawLog, finalLog, false),
            this.walletService.failTransaction(transaction),
          ]);
        });

      return {
        ok: true,
        message:
          'Transaction created and waiting to be mined... This may take a while ...',
      };
    } catch (error) {
      this.logger.error('Error processing withdrawal:', error);
      await this.walletService.revertTransaction(transaction);
      throw error; // Handle or log errors as needed
    }
  }

  async getBlock(blockData: BlockType) {
    const block = await this.prisma.block.findFirst({
      where: { chainId: blockData.chainId, number: blockData.number },
    });
    if (!block) {
      return this.prisma.block.create({ data: blockData });
    }
    return block;
  }

  async createDepositLog(
    log: BlockchainLogType,
    relatedTransactionId?: bigint,
    successful: boolean = true,
  ) {
    const { walletAddress, token, amount, block } = log;
    return this.prisma.blockchainLog.create({
      data: {
        from: walletAddress,
        to: this.walletService.businessWallet.address,
        token,
        blockId: (await this.getBlock(block)).id,
        amount,
        chainId: log.block.chainId,
        trxHash: log.hash,
        trxIndex: log.index,
        successful,
        ...(relatedTransactionId
          ? { transactionId: relatedTransactionId }
          : {}),
      },
    });
  }

  createInitialWithdrawLog(data: InitialWithdrawLog, transaction: Transaction) {
    return this.prisma.blockchainLog.create({
      data: {
        from: data.from,
        to: data.to,
        token: transaction.token,
        amount: transaction.amount,
        chainId: transaction.chainId,
        successful: false,
        transactionId: transaction.id,
        gasLimit: data.gas,
        gasPrice: data.gasPrice,
        trxNonce: data.nonce,
      },
    });
  }

  async finalizeWithdrawLog(
    log: BlockchainLog,
    { block, nonce, index, hash, gasUsed }: BlockchainLogType,
    successful: boolean = true,
  ) {
    return this.prisma.blockchainLog.update({
      where: { id: log.id },
      data: {
        blockId: (await this.getBlock(block)).id,
        trxNonce: nonce,
        trxIndex: index,
        trxHash: hash,
        gasPrice: gasUsed,
        successful,
      },
    });
  }

  async processLogsInRange(
    { provider, chainId }: ChainHistory,
    fromBlock: bigint,
    toBlock: bigint,
    contract: Contract,
    blockStatus: BlockStatus,
  ) {
    const businessWallet =
      this.walletService.businessWallet.address.toLowerCase();

    const logs = (await provider.eth.getPastLogs({
      fromBlock: provider.utils.toHex(fromBlock),
      toBlock: provider.utils.toHex(toBlock),
      address: contract.address,
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
      if (log.removed) {
        continue;
      }

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
      if (decodedLog.to.toString().toLowerCase() === businessWallet) {
        const blockchainLog = {
          walletAddress: decodedLog.from.toString(),
          token: contract.token,
          amount: Number(decodedLog.value) / 10 ** contract.decimals,
          hash: log.transactionHash,
          index: log.transactionIndex,
          block: {
            chainId,
            number: log.blockNumber,
            hash: log.blockHash,
            status: blockStatus,
          },
        };

        const trx = await this.walletService.deposit(blockchainLog);
        await this.createDepositLog(blockchainLog, trx?.id);
      }
    }
  }

  endBlock = (a: bigint, b: bigint) => (a <= b ? a : b);

  @Cron(CronExpression.EVERY_10_SECONDS)
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
          acceptedBlockStatus,
        } = this.chainHistory[chainId];

        const latestFinalizedBlock =
          await provider.eth.getBlock(acceptedBlockStatus);
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
                  acceptedBlockStatus,
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
