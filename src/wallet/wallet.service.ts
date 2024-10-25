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
} from '@prisma/client';
import { ChainHistory } from '../block-analyzer/type/chain-history.type';
import { WinmoreGameTypes } from '../common/types/game.types';
import { BUSINESSMAN_ID } from '../configs/constants';
import { PrismaService } from '../prisma/prisma.service';
import { UserPopulated } from '../user/types/user-populated.type';
import { WalletIdentifierType, WalletPopulated } from './types/wallet.types';
import { BlockchainLogType, BlockType } from './types/blockchain-log.type';
import { ChainMayContractsPopulated } from './types/chain.types';

// ********     MAIN TODOS    *****
// FIXME: Add GENERAL get balance method, which sends the whole wallet balances of user to front.
// TODO: add Mint & burn methods
// FIXME: Transactions from admin, must never throw insufficient balance error; Write a method to always mint to admin wallet the sufficient amount,
// when the balance of admin on specific chain & token is lower than a trx amount
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private mBusinessWallet: WalletPopulated;
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
    console.log('Business wallet loaded.');
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
      WHERE w.ownerId=${userId} AND t."token" = ${token}:"TokensEnum" AND "chainId"=${chainId} AND t."status"=${TransactionStatusEnum.SUCCESSFUL}::"TransactionStatusEnum" `;

    return result[0]?.balance ?? 0;
  }

  failTransaction(trx: Transaction, include?: { [field: string]: unknown }) {
    trx.status = TransactionStatusEnum.FAILED;
    return this.prisma.transaction.update({
      data: { status: trx.status },
      where: { id: trx.id },
      ...(include ? { include } : {}),
    });
  }

  revertTransaction(trx: Transaction, include?: { [field: string]: unknown }) {
    if (trx.status !== TransactionStatusEnum.SUCCESSFUL)
      throw new ConflictException(
        'This transaction was not successful and could not be reverted.',
      );
    trx.status = TransactionStatusEnum.FAILED;
    return this.prisma.transaction.update({
      data: { status: trx.status },
      where: { id: trx.id },
      ...(include ? { include } : {}),
    });
  }

  submitTransaction(trx: Transaction, include?: { [field: string]: unknown }) {
    if (trx.status === TransactionStatusEnum.FAILED)
      throw new ConflictException(
        'Transaction is failed, could not submit such transaction.',
      );
    trx.status = TransactionStatusEnum.SUCCESSFUL;
    return this.prisma.transaction.update({
      data: { status: trx.status },
      where: { id: trx.id },
      ...(include ? { include } : {}),
    });
  }

  addRemarks(
    trx: Transaction,
    newRemarks: object,
    include?: { [field: string]: unknown },
  ) {
    for (const [key, value] of Object.entries(trx.remarks))
      newRemarks[key] = value;
    return this.prisma.transaction.update({
      data: {
        remarks: newRemarks,
      },
      where: { id: trx.id },
      ...(include ? { include } : {}),
    });
  }

  async transact(
    source: WalletIdentifierType,
    destination: WalletIdentifierType,
    amount: number,
    token: TokensEnum,
    chainId: number,
    remarks?: object,
    include?: { [field: string]: unknown },
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

    const trx = await this.prisma.transaction.create({
      data: {
        sourceId: sourceWallet.id,
        destinationId: destinationWallet.id,
        status: TransactionStatusEnum.PENDING,
        amount,
        token,
        chainId,
        remarks,
      },
    });

    if (
      !this.configService.get<boolean>('general.debug') &&
      source.id !== this.businessWallet.id // TODO: Remove this after the admin recharge mechanism implemented.
    ) {
      const sourceBalance = await this.getBalance(
        trx.sourceId,
        trx.token,
        chainId,
      ); // TODO/ask: Is admin wallet required to balance check?
      if (sourceBalance < trx.amount) {
        await this.failTransaction(trx);
        throw new ForbiddenException(`Not enough ${trx.token} balance.`);
      }
    }
    // if everything falls into the place:
    return this.submitTransaction(trx, include);
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
      { description: 'Place Bet Transaction' },
      include,
    );
  }

  async rewardTheWinner(
    winnerId: number,
    prize: number,
    game: WinmoreGameTypes,
    include?: { [field: string]: unknown },
  ) {
    const winnerWallet = await this.getWallet({ ownerId: winnerId }, 'Winner'); // TODO: If the user does not have wallet [wallet data cleaned], this transaction must wait(?)

    return this.transact(
      { id: this.mBusinessWallet.id },
      { id: winnerWallet.id },
      prize,
      game.token,
      game.chainId,
      {
        description: `Win Game Reward Transaction`,
        winnerId: winnerWallet.owner.id,
        winnerName: winnerWallet.owner.name,
        game,
      },
      include,
    );
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
  ) {
    const { walletAddress, token, amount, block } = log;
    return this.prisma.blockchainLog.create({
      data: {
        from: walletAddress,
        to: this.businessWallet.address,
        token,
        blockId: (await this.getBlock(block)).id,
        amount,
        ...(relatedTransactionId
          ? { transactionId: relatedTransactionId }
          : {}),
      },
    });
  }

  async deposit(log: BlockchainLogType) {
    this.logger.debug(`New deposit trx from ${log.walletAddress}`); // TODO: Remove this later
    let trx: Transaction;
    try {
      trx = await this.transact(
        { id: this.mBusinessWallet.id },
        { address: log.walletAddress },
        log.amount,
        log.token,
        log.block.chainId,
        { description: 'Deposit', wallet: log.walletAddress },
      );
    } catch (ex) {
      if (ex instanceof NotFoundException)
        this.logger.warn(
          `A deposit happened from ${log.walletAddress}, which isn't a user. so it was skipped.`,
        );
      else this.logger.error(ex.toString(), ex, JSON.stringify(log));
    }
    await this.createDepositLog(log, trx.id);
  }
}
