import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TokensEnum,
  Transaction,
  TransactionStatusEnum,
  Wallet,
} from '@prisma/client';
import { ChainHistory } from 'src/block-analyzer/type/chain-history.type';
import { WinmoreGameTypes } from 'src/common/types/game.types';
import { BUSINESSMAN_ID } from 'src/configs/constants';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserPopulated } from 'src/user/types/user-populated.type';
import { WalletIdentifierType } from './types/wallet-identifier.type';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name); // TODO: Test this logger
  private mBusinessWallet: Wallet;
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.loadBusinessWallet().catch((err) => {
      console.log(
        'Can not load app business wallet, this may cause serious problems.',
        err,
      );
    });
  }

  get businessWallet() {
    if (!this.mBusinessWallet)
      this.loadBusinessWallet()
        .then(() =>
          console.warn(
            'Business wallet value was null in runtime, but re-loaded successfully.',
          ),
        )
        .catch((err) =>
          console.error(
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
    console.log('Business wallet loaded.');
  }

  async isChainSupported(chainId: number) {
    return Boolean(await this.prisma.chain.count({ where: { id: chainId } }));
  }

  findChains() {
    return this.prisma.chain.findMany();
  }

  findContracts(onlyTokenContract: boolean = false) {
    return this.prisma.contract.findMany({
      ...(onlyTokenContract ? { where: { isTokenContract: true } } : {}),
    });
  }

  syncChainsLastProcessedBlock(chainHistory: ChainHistory) {
    return this.prisma.chain.update({
      where: { id: chainHistory.chainId },
      data: { lastProcessedBlock: chainHistory.lastProcessedBlockNumber },
    });
  }

  async getBalance(walletId: number, token: TokensEnum, chainId: number) {
    // TODO: All Get balance methods must consider chinId
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

    if (!this.configService.get<boolean>('general.debug')) {
      const sourceBalance = await this.getBalance(
        trx.sourceId,
        trx.token,
        chainId,
      );
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

  async deposit(log: {
    from: string;
    token: TokensEnum;
    amount: number | bigint;
    chainId: number;
  }) {
    //TODO: Complete this

    this.logger.warn('New deposit trx, : ', log); // TODO: Remove this later

    return this.transact(
      { id: this.mBusinessWallet.id },
      { address: log.from },
      +log.amount.toString(), // FIXME: What to do whit bigint??
      log.token,
      log.chainId,
      { description: 'Deposit', wallet: log.from },
    );
  }
}
