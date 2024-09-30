import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DreamMineGame,
  GameModesEnum,
  GameStatusEnum,
  TransactionStatusEnum,
} from '@prisma/client';
import { DreamMineGamePreferencesDto } from './dtos/game-preferences.dto';
import { WalletService } from '../wallet/wallet.service';
import { UserPopulated } from '../user/types/user-populated.type';
import { WinmoreGameTypes } from '../common/types/game.types';

@Injectable()
export class DreamMineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async newGame(
    user: UserPopulated,
    { betAmount, mode, rows }: DreamMineGamePreferencesDto,
  ) {
    const placeBetTrx = await this.walletService.placeBet(user, betAmount);
    if (placeBetTrx.status !== TransactionStatusEnum.SUCCESSFUL)
      // for caution:
      throw new BadRequestException(
        'Could not place bet due to some reason! Please try again.',
      );
    const rules = await this.getLatestRules();
    const rowsCount = rows || rules.minRows;
    if (rowsCount < rules.minRows || rowsCount > rules.maxRows)
      throw new BadRequestException(
        `Number of rows must an integer between ${rules.minRows} & ${rules.maxRows}`,
      );

    const game = await this.prisma.dreamMineGame.create({
      data: {
        userId: user.id,
        initialBet: betAmount,
        mode,
        rowsCount,
        status: GameStatusEnum.ONGOING,
        stake: betAmount,
        currentRow: 0,
      },
    });

    await this.walletService.addRemarks(placeBetTrx, {
      gameId: game.id,
      type: 'Dream Mine',
    });

    return game;
  }

  /**
   * Method for paying the amount at stake to the user, wether by backing off the game or dream won.
   * @param game - DreamWonGame: No need for being populated.
   * @param withdrawn: This specifies wether the user has backed off or not. The true value mens user is requesting the stake withdraw in the game.
   * @returns the reward transaction.
   */
  async payReward(game: DreamMineGame, withdrawn: boolean = true) {
    game.status = withdrawn
      ? GameStatusEnum.WITHDRAWN
      : GameStatusEnum.DREAM_WON;
    game.finishedAt = new Date();
    game = await this.prisma.dreamMineGame.update({
      data: game, // TODO: Check if this works ok
      where: { id: game.id },
      include: { user: true },
    });
    return this.walletService.rewardTheWinner(game.userId, game.stake, {
      ...game,
      id: Number(game.id),
      name: 'Dream Mine',
    } as WinmoreGameTypes);
  }

  async lose(game: DreamMineGame) {
    // TODO: Complete this
    // Also pay attention to the type
    return game;
  }

  matchGameModeWithDifficultyCoefficient(
    mode: GameModesEnum,
    difficultyCoefficients: number[],
  ) {
    switch (mode) {
      case GameModesEnum.EASY:
        return 1;
      case GameModesEnum.HARD:
        return difficultyCoefficients[0] || 1;
      case GameModesEnum.MEDIUM:
        return difficultyCoefficients[1] || difficultyCoefficients[0] || 1;
      default:
        throw new ConflictException(
          'Unfortunately your game is misconfigured! This is a rare issue that needs evaluating, so please contact the support.',
        );
    }
  }

  async mine(game: DreamMineGame) {
    const rule = await this.getLatestRules();
    if (!rule)
      throw new MethodNotAllowedException(
        'It seems that site is not ready for your next mine; wait a little bit.',
      );

    const difficultyValue = this.matchGameModeWithDifficultyCoefficient(
      game.mode,
      rule.difficultyCoefficients,
    );

    const probability =
        (rule.rowProbabilities[game.currentRow] || 0) / difficultyValue,
      rowIncome =
        game.stake *
        (rule.rowCoefficients[game.currentRow] || 1) *
        difficultyValue;
    const playerChance = Math.random() * 100.0;
    if (playerChance > 100 - probability) {
      game.stake += rowIncome;
      if (game.currentRow === game.rowsCount) {
        await this.payReward(game, false);
      }
      return { success: true, ...game };
    }
    game = await this.lose(game);
    return { success: false, ...game };
  }

  async goForCurrentRow(user: UserPopulated, gameId: number) {
    const game = await this.prisma.dreamMineGame.findUnique({
      where: { id: gameId, userId: user.id },
    });
    if (!game) throw new NotFoundException('You are not playing such game.');
    if (game.status === GameStatusEnum.NOT_STARTED)
      throw new ForbiddenException(
        'This game has not started yet! First place your bet.',
      );
    if (game.status !== GameStatusEnum.ONGOING)
      throw new ForbiddenException(
        'This game seems not playable. It may have finished before. Try a new game.',
      );
    if (game.finishedAt && game.finishedAt <= new Date()) {
      // await this.finishTheGame(game); // FIXME: Add method to handle situations like this.
      throw new ForbiddenException('This game is finished.');
    }
    return this.mine(game);
  }

  async getLatestRules() {
    const gameRules = await this.prisma.dreamMineRules.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!gameRules)
      throw new InternalServerErrorException(
        'For some reason dream mine game rules are not available. Can not play Dream Mine right now.',
      );
    return gameRules;
  }

  populateRowCoefficients(
    rowCoefficients: number[],
    difficultyCoefficients: number[],
  ): { easy: number[]; medium?: number[]; hard: number[] } {
    const [hardCoef, mediumCoef] = difficultyCoefficients;

    if (!mediumCoef) {
      const [easy, hard] = [1, hardCoef].map((diffCoef: number) =>
        rowCoefficients.map((rowCoef: number) => rowCoef * diffCoef),
      );

      return { easy, hard };
    }

    const [easy, medium, hard] = [1, mediumCoef, hardCoef].map(
      (diffCoef: number) =>
        rowCoefficients.map((rowCoef: number) => rowCoef * diffCoef),
    );

    return { easy, medium, hard };
  }

  async backoffTheGame(user: UserPopulated, gameId: number) {
    const game = await this.prisma.dreamMineGame.findUnique({
      where: { id: gameId, userId: user.id },
    });
    await this.payReward(game, true);
    return game;
  }
}
