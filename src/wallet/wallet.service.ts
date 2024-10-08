import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TokensEnum,
  Transaction,
  TransactionStatusEnum,
  Wallet,
} from '@prisma/client';
import { WinmoreGameTypes } from 'src/common/types/game.types';
import { BUSINESSMAN_ID } from 'src/configs/constants';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserPopulated } from 'src/user/types/user-populated.type';

@Injectable()
export class WalletService {
  private businessWallet: Wallet;
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

  async loadBusinessWallet() {
    this.businessWallet = await this.prisma.wallet.findUnique({
      where: { ownerId: BUSINESSMAN_ID },
      include: { owner: true },
    });
    console.log('Business wallet loaded.');
  }

  async isChainSupported(chainId: number) {
    return Boolean(await this.prisma.chain.count({ where: { id: chainId } }));
  }

  async getBalance(walletId: number, token: TokensEnum) {
    // TODO: All Get balance methods must consider chinId
    const result = await this.prisma.$queryRaw<{ balance: number }[]>`SELECT (
            COALESCE(SUM(CASE WHEN destination_id=${walletId} THEN amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN source_id=${walletId} THEN amount ELSE 0 END), 0)
          ) AS balance
        FROM transaction WHERE token=${token} AND status=${TransactionStatusEnum.SUCCESSFUL}`;
    return result[0]?.balance ?? 0;
  }

  async getBalanceByUserId(userId: number, token: TokensEnum) {
    const result = await this.prisma.$queryRaw<{ balance: number }[]>`SELECT (
          COALESCE(SUM(CASE WHEN t.destination_id = w.id THEN t.amount ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN t.source_id = w.id THEN t.amount ELSE 0 END), 0)
        ) AS balance
      FROM transaction t JOIN wallet w ON t.destination_id = w.id OR t.source_id = w.id
      WHERE w.ownerId=${userId} AND t.token=${token} AND t.status=${TransactionStatusEnum.SUCCESSFUL}`;

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
    source: number | string,
    destination: number | string,
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
      const sourceBalance = await this.getBalance(trx.sourceId, trx.token);
      if (sourceBalance < trx.amount) {
        await this.failTransaction(trx);
        throw new ForbiddenException(`Not enough ${trx.token} balance.`);
      }
    }
    // if everything falls into the place:
    return this.submitTransaction(trx, include);
  }

  async getWallet(identifier: number | string, ownerTag: string = 'User') {
    const wallet = await this.prisma.wallet.findUnique({
      where: {
        ...(typeof identifier === 'string'
          ? { address: identifier }
          : { id: identifier }),
      },
      include: { owner: true },
    });

    if (!wallet)
      throw new UnauthorizedException(`${ownerTag} does not have any wallet!`);
    if (!wallet.owner) throw new NotFoundException(`${ownerTag} not found!`);
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
      user.wallet.id,
      this.businessWallet.id,
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
    const winnerWallet = await this.getWallet(winnerId, 'Winner'); // TODO: If the user does not have wallet [wallet data cleaned], this transaction must wait(?)

    return this.transact(
      this.businessWallet.id,
      winnerWallet.id,
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
}
