import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DreamMineGame,
  GameStatusEnum,
  TransactionStatusEnum,
} from '@prisma/client';
import { DreamMineGamePreferencesDto } from './dtos/game-preferences.dto';
import { DM_MIN_ROWS } from 'src/configs/constants';
import { WalletService } from 'src/wallet/wallet.service';
import { UserPopulated } from 'src/user/types/user-populated.type';
import { WinmoreGameTypes } from 'src/common/types/game.types';

@Injectable()
export class DreamMineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async newGame(
    user: UserPopulated,
    { betAmount, betToken, mode, rows }: DreamMineGamePreferencesDto,
  ) {
    const placeBetTrx = await this.walletService.placeBet(
      user,
      betAmount,
      betToken,
    );
    if (placeBetTrx.status !== TransactionStatusEnum.SUCCESSFUL)
      // for caution:
      throw new BadRequestException(
        'Could not place bet due to some reason! Please try again.',
      );

    const game = await this.prisma.dreamMineGame.create({
      data: {
        userId: user.id,
        initialBet: betAmount,
        mode,
        rowsCount: rows || DM_MIN_ROWS,
        status: GameStatusEnum.ONGOING,
        stake: betAmount,
      },
      include: {
        user: true,
      },
    });

    return this.walletService.addRemarks(placeBetTrx, {
      gameId: game.id,
      type: 'Dream Mine',
    });
  }

  async payReward(game: DreamMineGame, withdrawn: boolean = true) {
    game = await this.prisma.dreamMineGame.update({
      data: {
        status: withdrawn ? GameStatusEnum.WITHDRAWN : GameStatusEnum.DREAM_WON,
      },
      where: { id: game.id },
      include: { user: true },
    });
    return this.walletService.rewardTheWinner(game.userId, game.stake, {
      ...game,
      id: Number(game.id),
      name: 'Dream Mine',
    } as WinmoreGameTypes);
  }

  mineNext(user: UserPopulated, gameId: number) {
    // this calls payReward or lose.
  }
}
