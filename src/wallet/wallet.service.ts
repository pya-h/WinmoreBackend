import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  TokensEnum,
  Transaction,
  TransactionStatusEnum,
  Wallet,
} from '@prisma/client';
import { BUSINESSMAN_ID } from 'src/configs/constants';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserPopulated } from 'src/user/types/user-populated.type';

@Injectable()
export class WalletService {
  private businessWallet: Wallet;

  constructor(private readonly prisma: PrismaService) {
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

  async getBalance(walletId: number, token: TokensEnum) {
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

  failTransaction(trx: Transaction) {
    trx.status = TransactionStatusEnum.FAILED;
    return this.prisma.transaction.update({
      data: { status: trx.status },
      where: { id: trx.id },
    });
  }

  revertTransaction(trx: Transaction) {
    if (trx.status !== TransactionStatusEnum.SUCCESSFUL)
      throw new ConflictException(
        'This transaction was not successful and could not be reverted.',
      );
    trx.status = TransactionStatusEnum.FAILED;
    return this.prisma.transaction.update({
      data: { status: trx.status },
      where: { id: trx.id },
    });
  }

  submitTransaction(trx: Transaction) {
    if (trx.status === TransactionStatusEnum.FAILED)
      throw new ConflictException(
        'Transaction is failed, could not submit such transaction.',
      );
    trx.status = TransactionStatusEnum.SUCCESSFUL;
    return this.prisma.transaction.update({
      data: { status: trx.status },
      where: { id: trx.id },
    });
  }

  addRemarks(trx: Transaction, newRemarks: object) {
    const oldRemarks = trx.remarks ? JSON.parse(trx.remarks.toString()) : {};
    trx.remarks = { ...oldRemarks, ...newRemarks };
    return this.prisma.transaction.update({
      data: { remarks: newRemarks },
      where: { id: trx.id },
    });
  }

  async transact(
    source: number | string,
    destination: number | string,
    amount: number,
    token: TokensEnum,
    remarks?: object,
  ) {
    const sourceWallet = await this.prisma.wallet.findUnique({
      where: {
        ...(typeof source === 'string' ? { address: source } : { id: source }),
      },
      include: { owner: true },
    });

    if (!sourceWallet?.owner)
      throw new BadRequestException(
        'Can not make transaction because of source data mismatch.',
      );

    const destinationWallet = await this.prisma.wallet.findUnique({
      where: {
        ...(typeof destination === 'string'
          ? { address: destination }
          : { id: destination }),
      },
      include: { owner: true },
    });

    if (!destinationWallet?.owner)
      throw new BadRequestException(
        `Can not transfer ${token}, because of destination data mismatch.`,
      );

    const trx = await this.prisma.transaction.create({
      data: {
        sourceId: sourceWallet.id,
        destinationId: destinationWallet.id,
        status: TransactionStatusEnum.PENDING,
        amount,
        token,
        remarks,
      },
    });

    const sourceBalance = await this.getBalance(trx.sourceId, trx.token);
    if (sourceBalance < trx.amount) {
      await this.failTransaction(trx);
      throw new ForbiddenException(`Not enough ${trx.token} balance.`);
    }

    // if everything falls into the place:
    return this.submitTransaction(trx);
  }

  placeBet(user: UserPopulated, amount: number, token: TokensEnum) {
    return this.transact(
      user.wallet.id,
      this.businessWallet.id,
      amount,
      token,
      { description: `Place Bet Transaction` },
    );
  }
}
