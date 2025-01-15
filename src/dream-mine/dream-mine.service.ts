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
  DreamMineRules,
  GameModesEnum,
  GameStatusEnum,
  TransactionStatusEnum,
} from '@prisma/client';
import { DreamMineGamePreferencesDto } from './dtos/game-preferences.dto';
import { WalletService } from '../wallet/wallet.service';
import { UserPopulated } from '../user/types/user-populated.type';
import {
  WinmoreGameTypes,
  ExtraGameStatusEnum,
} from '../common/types/game.types';
import { DM_COLUMNS_COUNT } from '../configs/constants';
import { GameStatusFilterQuery } from '../games/dtos/game-status-filter.query';
import { SortModeEnum } from '../games/types/sort-enum.dto';
import { PaginationOptionsDto } from '../common/dtos/pagination-options.dto';
import { SortOrderEnum } from '../common/types/sort-orders.enum';

@Injectable()
export class DreamMineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async newGame(
    user: UserPopulated,
    { betAmount, token, chainId, mode, rows }: DreamMineGamePreferencesDto,
  ) {
    const placeBetTrx = await this.walletService.placeBet(
      user,
      betAmount,
      token,
      chainId,
    );
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
        token,
        chainId,
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
   * @param backedOff: This specifies wether the user has backed off or not. The true value mens user is requesting the stake withdraw in the game.
   * @returns the reward transaction.
   */
  async finalizeGame(game: DreamMineGame, backedOff: boolean = true) {
    game.status = backedOff ? GameStatusEnum.WON : GameStatusEnum.FLAWLESS_WIN;
    game.finishedAt = new Date();
    game = await this.prisma.dreamMineGame.update({
      data: game,
      where: { id: game.id },
    });

    return this.walletService.rewardTheWinner(game.userId, game.stake, {
      ...game,
      name: 'Dream Mine',
    } as WinmoreGameTypes);
  }

  matchGameModeWithDifficultyCoefficient(
    mode: GameModesEnum,
    difficultyMultipliers: number[],
  ) {
    switch (mode) {
      case GameModesEnum.EASY:
        return { difficultyValue: 1, columnsCount: DM_COLUMNS_COUNT };
      case GameModesEnum.HARD:
        return {
          difficultyValue: difficultyMultipliers[0] || 1,
          columnsCount: DM_COLUMNS_COUNT - 2,
        };
      case GameModesEnum.MEDIUM:
        return {
          difficultyValue:
            difficultyMultipliers[1] || difficultyMultipliers[0] || 1,
          columnsCount: DM_COLUMNS_COUNT - 1,
        };
      default:
        throw new ConflictException(
          'Unfortunately your game is misconfigured! This is a rare issue that needs evaluating, so please contact the support.',
        );
    }
  }

  getRowCharacteristics(rule: DreamMineRules, game: DreamMineGame) {
    const { difficultyValue, columnsCount } =
      this.matchGameModeWithDifficultyCoefficient(
        game.mode,
        rule.difficultyMultipliers,
      );
    if (!difficultyValue) throw new ConflictException('Invalid game state.');
    return {
      columnsCount,
      multiplier: rule.multipliers[game.currentRow] * difficultyValue,
      probability:
        (100 * (rule.probabilities[game.currentRow] || 0)) / difficultyValue,
    };
  }

  async mine(game: DreamMineGame, choice: number) {
    const rule = await this.getLatestRules();
    if (!rule)
      throw new MethodNotAllowedException(
        'It seems that site is not ready for your next mine; wait a little bit.',
      );

    const { probability, multiplier, columnsCount } =
      this.getRowCharacteristics(rule, game);
    if (choice > columnsCount)
      throw new BadRequestException(
        `Invalid selection! There are only ${columnsCount} stones.`,
      );
    const playerChance = Math.random() * 100.0;
    let result: Record<string, unknown>;
    game.lastChoice = choice;
    if (playerChance <= probability) {
      if (rule.multipliers[game.currentRow])
        game.stake = game.initialBet * multiplier;

      game.golds.push(choice);
      game.currentRow++;
      if (game.currentRow === game.rowsCount) {
        await this.finalizeGame(game, false);
        result = { success: true, ...game };
      } else {
        result = { success: true, ...game };
      }
    } else {
      game.status = GameStatusEnum.LOST;
      game.finishedAt = new Date();
      let goldIndex: number = 0;
      while (!goldIndex || goldIndex === choice)
        goldIndex = ((Math.random() * columnsCount) | 0) + 1;
      game.golds.push(goldIndex);
      result = { success: false, ...game };
    }
    await this.prisma.dreamMineGame.update({
      data: game,
      where: { id: game.id },
    });
    return result;
  }

  async goForCurrentRow(
    user: UserPopulated,
    gameId: number,
    userChoice: number,
  ) {
    const game = await this.prisma.dreamMineGame.findUnique({
      where: { id: gameId, userId: user.id },
    });
    if (!game) throw new NotFoundException('Game not found.');
    if (game.status === GameStatusEnum.NOT_STARTED)
      throw new ForbiddenException(
        'This game has not started yet! First place your bet.',
      );
    if (game.finishedAt && game.finishedAt <= new Date()) {
      // await this.finishTheGame(game); // TODO: What to do in this rare occasion?
      throw new ForbiddenException('This game is finished.');
    }
    if (game.status !== GameStatusEnum.ONGOING)
      throw new ForbiddenException(
        'Mining not allowed here. Game is not open.',
      );
    return this.mine(game, userChoice);
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

  populatemultipliers(
    multipliers: number[],
    difficultyMultipliers: number[],
  ): { easy: number[]; medium?: number[]; hard: number[] } {
    const [hardCoef, mediumCoef] = difficultyMultipliers;

    if (!mediumCoef) {
      const [easy, hard] = [1, hardCoef].map((diffCoef: number) =>
        multipliers.map((rowCoef: number) => rowCoef * diffCoef),
      );

      return { easy, hard };
    }

    const [easy, medium, hard] = [1, mediumCoef, hardCoef].map(
      (diffCoef: number) =>
        multipliers.map((rowCoef: number) => rowCoef * diffCoef),
    );

    return { easy, medium, hard };
  }

  async backoffTheGame(user: UserPopulated, gameId: number) {
    const game = await this.prisma.dreamMineGame.findUnique({
      where: { id: gameId, userId: user.id },
    });
    if (!game) throw new NotFoundException('Game not found.');
    if (game.status !== GameStatusEnum.ONGOING)
      throw new ForbiddenException('Backing off not allowed here.');
    if (!game.currentRow)
      throw new ForbiddenException(
        'You can not withdraw at the start of the game.',
      );
    await this.finalizeGame(game, true);
    return game;
  }

  async findGames({
    userId,
    filter,
    include = {},
  }: {
    userId?: number;
    filter?: GameStatusFilterQuery;
    include?: Record<string, object>;
  }) {
    const sortParams: Record<string, Record<string, string> | number> = {};
    switch (filter?.sort) {
      case SortModeEnum.LUCKY:
        if (filter.status)
          throw new ConflictException(
            "Lucky-bets sort doesn't accept any status filter",
          );
        sortParams.orderBy = {
          stake: (filter?.order || SortOrderEnum.DESC).toString(),
        };
        break;
    }

    if (sortParams?.orderBy) {
      filter.status = ExtraGameStatusEnum.GAINED;
    } else {
      sortParams.orderBy = { createdAt: SortOrderEnum.DESC.toString() };
    }

    const filters: Record<string, object | string | number> = {};

    if (filter && filter.status !== ExtraGameStatusEnum.ALL) {
      switch (filter?.status) {
        case ExtraGameStatusEnum.FINISHED:
          filters.status = {
            notIn: [
              GameStatusEnum.NOT_STARTED,
              GameStatusEnum.ONGOING, // If any other status added, it must be considered here.
            ],
          };
          break;
        case ExtraGameStatusEnum.GAINED:
          filters.status = {
            in: [GameStatusEnum.WON, GameStatusEnum.FLAWLESS_WIN],
          };
          break;
        default:
          filters.status = filter.status;
          break;
      }
    }

    if (userId != null) {
      filters.userId = userId;
    }

    if (filter.take != null) sortParams.take = +filter.take;

    if (filter.skip != null) sortParams.skip = +filter.skip;

    const games: DreamMineGame[] = await this.prisma.dreamMineGame.findMany({
      where: { ...filters },
      ...sortParams,
      include,
    });

    const rules = await this.getLatestRules();
    return games.map((game) => {
      const { multiplier } = this.getRowCharacteristics(rules, game);
      game['multiplier'] = multiplier;
      game['time'] = Math.ceil(
        ((game.finishedAt?.getTime() || Date.now()) -
          game.createdAt.getTime()) /
          6000,
      );
      return game;
    });
  }

  getOnesOngoingGame(userId: number) {
    return this.prisma.dreamMineGame.findFirst({
      where: { userId, status: GameStatusEnum.ONGOING },
      orderBy: { createdAt: 'desc' },
    });
  }

  getAllOngoingGames(
    { take, skip }: PaginationOptionsDto,
    include?: Record<string, object>,
  ) {
    return this.prisma.dreamMineGame.findMany({
      where: { status: GameStatusEnum.ONGOING },
      orderBy: { createdAt: 'desc' },
      ...(take ? { take } : {}),
      ...(skip != null ? { skip } : {}),
      ...(include ? { include } : {}),
    });
  }
}
