import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Contract,
  TokensEnum,
  Transaction,
  TransactionStatusEnum,
  TransactionTypeEnum,
  Wallet,
} from '@prisma/client';
import { ChainHistory } from '../blockchain/types/chain-history.type';
import { WinmoreGameTypes } from '../common/types/game.types';
import { BUSINESSMAN_ID } from '../configs/constants';
import { PrismaService } from '../prisma/prisma.service';
import { UserPopulated } from '../user/types/user-populated.type';
import { BusinessWalletType, WalletIdentifierType } from './types/wallet.types';
import { BlockchainLogType } from '../blockchain/types/blockchain-log.type';
import { ChainMayContractsPopulated } from './types/chain.types';
import {
  ExtraTransactionTypesEnum,
  GeneralTransactionTypes,
} from 'src/user/types/extra-transaction-types.enum';

// ********     MAIN TODOS    *****
// TODO: add Mint & burn methods
// TODO: Transactions from admin, must never throw insufficient balance error; Write a method to always mint to admin wallet the sufficient amount,
// when the balance of admin on specific chain & token is lower than a transaction amount
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private mBusinessWallet: BusinessWalletType;
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.loadBusinessWallet().catch((err) => {
      this.logger.error(
        'Can not load app business wallet, this may cause serious problems.',
        err,
      );
    });
  }

  get businessWallet() {
    if (!this.mBusinessWallet)
      this.loadBusinessWallet()
        .then(() =>
          this.logger.warn(
            'Business wallet value was null in runtime, but re-loaded successfully.',
          ),
        )
        .catch((err) =>
          this.logger.error(
            'Tried to reload business wallet, but failed again!',
            err,
          ),
        );
    return this.mBusinessWallet;
  }

  async loadBusinessWallet() {
    this.mBusinessWallet = await this.prisma.wallet.findUnique({
      where: { ownerId: BUSINESSMAN_ID },
      include: { owner: true },
    });
    if (!this.mBusinessWallet.owner.admin)
      throw new InternalServerErrorException(
        'Business account mismatch! Checkout database for conflicts on business account.',
      );
    this.mBusinessWallet.private = this.configService.get<string>(
      'credentials.privateKey',
    );
    if (!this.mBusinessWallet.private)
      this.logger.error(
        'Business wallet private key not loaded successfully, this means all user withdrawals will encounter error.',
      );
    this.logger.debug('Business wallet loaded.');
  }

  async isChainSupported(chainId: number) {
    return Boolean(await this.prisma.chain.count({ where: { id: chainId } }));
  }

  findChains(
    loadContracts: boolean = false,
  ): Promise<ChainMayContractsPopulated[]> {
    return this.prisma.chain.findMany({
      ...(loadContracts ? { include: { contracts: true } } : {}),
    });
  }

  saveContract(contract: Contract) {
    return this.prisma.contract.update({
      where: { id: contract.id },
      data: contract,
    });
  }
  getChainById(id: number) {
    return this.prisma.chain.findFirst({ where: { id } });
  }

  findContracts(onlyTokenContract: boolean = false) {
    return this.prisma.contract.findMany({
      ...(onlyTokenContract ? { where: { token: { not: null } } } : {}),
    });
  }

  syncChainsLastProcessedBlock(chainHistory: ChainHistory) {
    return this.prisma.chain.update({
      where: { id: chainHistory.chainId },
      data: { lastProcessedBlock: chainHistory.lastProcessedBlockNumber },
    });
  }

  async getBalance(walletId: number, token: TokensEnum, chainId: number) {
    const result = await this.prisma.$queryRaw<{ balance: number }[]>`SELECT (
            COALESCE(SUM(CASE WHEN "destinationId"=${walletId} THEN "amount" ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN "sourceId"=${walletId} THEN "amount" ELSE 0 END), 0)
          ) AS balance
        FROM public."Transaction" WHERE "token" = ${token}::"TokensEnum" AND "chainId"=${chainId} AND "status"=${TransactionStatusEnum.SUCCESSFUL}::"TransactionStatusEnum" `;
    return result[0]?.balance ?? 0;
  }

  async getBalanceByUserId(userId: number, token: TokensEnum, chainId: number) {
    const result = await this.prisma.$queryRaw<{ balance: number }[]>`SELECT (
          COALESCE(SUM(CASE WHEN t."destinationId" = w."id" THEN t."amount" ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN t."sourceId" = w."id" THEN t."amount" ELSE 0 END), 0)
        ) AS balance
      FROM public."Transaction" t JOIN wallet w ON t."destinationId" = w."id" OR t."sourceId" = w."id"
      WHERE w."ownerId"=${userId} AND t."token" = ${token}:"TokensEnum" AND "chainId"=${chainId} AND t."status"=${TransactionStatusEnum.SUCCESSFUL}::"TransactionStatusEnum" `;

    return result[0]?.balance ?? 0;
  }

  async getUserWallet(userId: number) {
    const result = await this.prisma.$queryRaw<
      { chainId: number; token: TokensEnum; balance: number }[]
    >`SELECT t."chainId", t."token", (
          COALESCE(SUM(CASE WHEN t."destinationId" = w."id" THEN t."amount" ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN t."sourceId" = w."id" THEN t."amount" ELSE 0 END), 0)
        ) AS balance
      FROM public."Transaction" t 
        JOIN public."Wallet" w ON t."destinationId" = w."id" OR t."sourceId" = w."id"
        WHERE w."ownerId" = ${userId} 
          AND t."status" = ${TransactionStatusEnum.SUCCESSFUL}::"TransactionStatusEnum"
        GROUP BY t."chainId", t."token"`;

    return result.reduce(
      (acc, { chainId, token, balance }) => {
        if (!acc[chainId]) acc[chainId] = {};
        acc[chainId][token.toString()] = balance;
        return acc;
      },
      {} as Record<number, Record<string, number>>,
    );
  }

  failTransaction(
    transaction: Transaction,
    include?: { [field: string]: unknown },
  ) {
    transaction.status = TransactionStatusEnum.FAILED;
    return this.prisma.transaction.update({
      data: { status: transaction.status },
      where: { id: transaction.id },
      ...(include ? { include } : {}),
    });
  }

  revertTransaction(
    transaction: Transaction,
    include?: { [field: string]: unknown },
  ) {
    if (transaction.status !== TransactionStatusEnum.SUCCESSFUL)
      throw new ConflictException(
        'This transaction was not successful and could not be reverted.',
      );
    transaction.status = TransactionStatusEnum.REVERTED;
    return this.prisma.transaction.update({
      data: { status: transaction.status },
      where: { id: transaction.id },
      ...(include ? { include } : {}),
    });
  }

  submitTransaction(
    transaction: Transaction,
    include?: { [field: string]: unknown },
  ) {
    if (transaction.status === TransactionStatusEnum.FAILED)
      throw new ConflictException(
        'Transaction is failed, could not submit such transaction.',
      );
    transaction.status = TransactionStatusEnum.SUCCESSFUL;
    return this.prisma.transaction.update({
      data: { status: transaction.status },
      where: { id: transaction.id },
      ...(include ? { include } : {}),
    });
  }

  addRemarks(
    transaction: Transaction,
    newRemarks: object,
    include?: { [field: string]: unknown },
  ) {
    for (const [key, value] of Object.entries(transaction.remarks))
      newRemarks[key] = value;
    return this.prisma.transaction.update({
      data: {
        remarks: newRemarks,
      },
      where: { id: transaction.id },
      ...(include ? { include } : {}),
    });
  }

  async transact(
    source: WalletIdentifierType,
    destination: WalletIdentifierType,
    amount: number,
    token: TokensEnum,
    chainId: number,
    {
      type = TransactionTypeEnum.INGAME,
      remarks,
      holdStatusPending = false,
      include,
    }: {
      type?: TransactionTypeEnum;
      remarks?: object;
      holdStatusPending?: boolean;
      include?: { [field: string]: unknown };
    },
  ) {
    if (!(await this.isChainSupported(chainId)))
      throw new BadRequestException(
        "Unfortunately we don't support this chain for now.",
      );
    const sourceWallet = await this.getWallet(source, 'Transaction Payer');

    const destinationWallet = await this.getWallet(
      destination,
      'Transaction receiver',
    );

    remarks['fromUser'] = sourceWallet.ownerId;
    remarks['toUser'] = destinationWallet.ownerId;

    const transaction = await this.prisma.transaction.create({
      data: {
        sourceId: sourceWallet.id,
        destinationId: destinationWallet.id,
        status: TransactionStatusEnum.PENDING,
        amount,
        token,
        chainId,
        remarks,
        type,
      },
    });

    if (
      !this.configService.get<boolean>('general.debug') && // FIXME: This is for test purpose, remove it as soon as possible
      source.id !== this.businessWallet.id // TODO: Remove this after the admin recharge mechanism implemented.
    ) {
      const sourceBalance = await this.getBalance(
        transaction.sourceId,
        transaction.token,
        chainId,
      );
      if (sourceBalance < transaction.amount) {
        await this.failTransaction(transaction);
        throw new ForbiddenException(
          `Not enough ${transaction.token} balance.`,
        );
      }
    }
    if (holdStatusPending) {
      return transaction;
    }
    return this.submitTransaction(transaction, include);
  }

  async getWallet(identifier: WalletIdentifierType, ownerTag: string = 'User') {
    const where =
      identifier?.id != null
        ? { id: identifier.id }
        : identifier?.ownerId != null
          ? { ownerId: identifier.ownerId }
          : identifier?.address
            ? { address: identifier.address }
            : null;

    if (!where)
      throw new BadRequestException(
        'Specify at least one identifier to find a wallet',
      );
    const wallet = await this.prisma.wallet.findUnique({
      where,
      include: { owner: true },
    });

    if (!wallet?.owner) {
      throw new NotFoundException(`${ownerTag} not found!`);
    }
    return wallet;
  }

  placeBet(
    user: UserPopulated,
    amount: number,
    token: TokensEnum,
    chainId: number,
    include?: { [field: string]: unknown },
  ) {
    return this.transact(
      { id: user.wallet.id },
      { id: this.mBusinessWallet.id },
      amount,
      token,
      chainId,
      { remarks: { description: 'Place Bet Transaction' }, include },
    );
  }

  async rewardTheWinner(
    winnerId: number,
    prize: number,
    game: WinmoreGameTypes,
    include?: { [field: string]: unknown },
  ) {
    const winnerWallet = await this.getWallet({ ownerId: winnerId }, 'Winner');

    return this.transact(
      { id: this.mBusinessWallet.id },
      { id: winnerWallet.id },
      prize,
      game.token,
      game.chainId,
      {
        remarks: {
          description: `Win Game Reward Transaction`,
          winnerId: winnerWallet.owner.id,
          winnerName: winnerWallet.owner.name,
          game,
        },
        include,
      },
    );
  }

  async deposit(log: BlockchainLogType) {
    try {
      return this.transact(
        { id: this.mBusinessWallet.id },
        { address: log.walletAddress },
        log.amount,
        log.token,
        log.block.chainId,
        {
          type: TransactionTypeEnum.DEPOSIT,
          remarks: {
            description: 'Deposit',
            wallet: log.walletAddress,
            trxIndex: log.index,
          },
        },
      );
    } catch (ex) {
      if (ex instanceof NotFoundException)
        this.logger.warn(
          `A deposit happened from ${log.walletAddress}, which isn't a user. so it was skipped.`,
        );
      else this.logger.error(ex.toString(), ex, JSON.stringify(log));
    }
    return null;
  }

  async withdraw(
    wallet: Wallet,
    chainId: number,
    token: TokensEnum,
    amount: number,
  ) {
    try {
      return this.transact(
        { address: wallet.address },
        { id: this.mBusinessWallet.id },
        amount,
        token,
        chainId,
        {
          type: TransactionTypeEnum.WITHDRAWAL,
          holdStatusPending: true,
          remarks: { description: 'Withdraw', wallet: wallet.address },
        },
      );
    } catch (ex) {
      this.logger.error(
        ex.toString(),
        ex,
        JSON.stringify({ address: wallet.address, amount, chainId, token }),
      );
    }
    return null;
  }

  getTransactionTypeCondition(typeFilter: GeneralTransactionTypes) {
    if (typeFilter && typeFilter !== ExtraTransactionTypesEnum.ALL) {
      switch (typeFilter) {
        case ExtraTransactionTypesEnum.BLOCKCHAIN:
          return {
            type: { notIn: [TransactionTypeEnum.INGAME] }, // NOTICE: If there where new types added to Types enum, this must be updated.
          };
        default:
          return { type: typeFilter };
      }
    }
    return {};
  }

  getUserTransactions(
    userId: number,
    typeFilter: GeneralTransactionTypes,
    take: number,
    skip: number,
  ) {
    return this.prisma.transaction.findMany({
      where: {
        OR: [
          { source: { ownerId: userId } },
          { destination: { ownerId: userId } },
        ],
        ...this.getTransactionTypeCondition(typeFilter),
      },
      ...(take ? { take } : {}),
      ...(skip ? { skip } : {}),
    });
  }

  async getUserTransactionsHistory(
    userId: number,
    typeFilter: GeneralTransactionTypes,
    take: number,
    skip: number,
  ) {
    const walletDisplayFilter = {
      select: {
        id: true,
        address: true,
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    };

    return (
      await this.prisma.transaction.findMany({
        where: {
          OR: [
            { source: { ownerId: userId } },
            { destination: { ownerId: userId } },
          ],

          ...this.getTransactionTypeCondition(typeFilter),
        },
        select: {
          id: true,
          source: walletDisplayFilter,
          destination: walletDisplayFilter,
          amount: true,
          chain: {
            select: {
              name: true,
              id: true,
            },
          },
          createdAt: true,
          updatedAt: true,
          status: true,
          token: true,
          type: true,
          log: {
            select: {
              from: true,
              to: true,
              trxHash: true,
              trxIndex: true,
              gasPrice: true,
              successful: true,
              block: {
                select: {
                  number: true,
                  hash: true,
                  status: true,
                },
              },
            },
          },
          // trxHash: true, // FIXME: Get trx data from log
        },
        ...(take ? { take } : {}),
        ...(skip ? { skip } : {}),
      })
    ).map((trx) => ({
      ...trx,
      id: trx.id.toString(),
      ...(trx.log
        ? {
            log: {
              ...trx.log,
              trxIndex: trx.log.trxIndex?.toString(),
              gasPrice: trx.log.gasPrice?.toString(),
              ...(trx.log?.block
                ? {
                    block: {
                      ...trx.log.block,
                      number: trx.log.block?.number?.toString(),
                    },
                  }
                : {}),
            },
          }
        : {}),
    }));
  }
}
