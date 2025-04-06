import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  MethodNotAllowedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GameModesEnum,
  PlinkoGame,
  PlinkoGameStatus,
  PlinkoRules,
  TransactionStatusEnum,
} from '@prisma/client';
import { PlinkoGamePreferences } from './dtos/plinko-game-preferences.dto';
import { WalletService } from '../wallet/wallet.service';
import { UserPopulated } from '../user/types/user-populated.type';
import {
  WinmoreGameTypes,
  ExtraGameStatusEnum,
} from '../common/types/game.types';
import { GameStatusFilterQuery } from '../games/dtos/game-status-filter.query';
import { SortModeEnum } from '../games/types/sort-enum.dto';
import { PaginationOptionsDto } from '../common/dtos/pagination-options.dto';
import { SortOrderEnum } from '../common/types/sort-orders.enum';

@Injectable()
export class PlinkoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async newGame(
    user: UserPopulated,
    {
      betAmount,
      token,
      chainId,
      mode,
      rows,
      ballsCount,
    }: PlinkoGamePreferences,
  ) {
    const placeBetTrx = await this.walletService.placeBet(
      user,
      betAmount * ballsCount,
      token,
      chainId,
    );
    if (placeBetTrx.status !== TransactionStatusEnum.SUCCESSFUL)
      // for caution:
      throw new BadRequestException(
        'Could not place bet due to some reason! Please try again.',
      );
    const rules = await this.getRulesByRows(rows);
    if (!rules)
      throw new BadRequestException(
        `Winmore doesn't support ${rows} rows plinko game.`,
      );

    if (betAmount > rules.maxBetAmount)
      throw new BadRequestException(
        `Bet must not exceed ${rules.maxBetAmount}$ for now!`,
      );
    const game = await this.prisma.plinkoGame.create({
      data: {
        userId: user.id,
        initialBet: betAmount,
        token,
        chainId,
        mode,
        rowsCount: rows,
        status: PlinkoGameStatus.NOT_DROPPED_YET,
        ballsCount,
      },
    });

    await this.walletService.addRemarks(placeBetTrx, {
      gameId: game.id,
      type: 'Plinko',
    });
    return game;
  }

  matchDifficultyWithMultiplier(
    mode: GameModesEnum,
    difficultyMultipliers: number[],
  ) {
    switch (mode) {
      case GameModesEnum.EASY:
        return 1;
      case GameModesEnum.HARD:
        return difficultyMultipliers[difficultyMultipliers.length - 1] || 1;
      case GameModesEnum.MEDIUM:
        return difficultyMultipliers[0] || 1;
      default:
        throw new ConflictException(
          'Unfortunately your game is misconfigured! This is a rare issue that needs evaluating, so please contact the support.',
        );
    }
  }

  getActualMultipliersAndPossibilities(
    rule: PlinkoRules,
    gameMode: GameModesEnum,
  ) {
    const difficulty = this.matchDifficultyWithMultiplier(
      gameMode,
      rule.difficultyMultipliers,
    );

    return {
      multipliers: rule.multipliers.map((x) => difficulty * x),
      possibilities: rule.probabilities.map((x) => x / difficulty),
    };
  }

  async finalizeGame(user: UserPopulated, gameId: number) {
    let game = await this.prisma.plinkoGame.findUnique({
      where: { id: gameId },
    });
    if (user.id !== game.userId)
      throw new ForbiddenException(
        'Not allowed to play this game since its not yours!',
      );

    const rule = await this.getRulesByRows(game.rowsCount);
    const { multipliers, possibilities } =
      this.getActualMultipliersAndPossibilities(rule, game.mode);

    game.status = PlinkoGameStatus.FINISHED;
    game.finishedAt = new Date();

    // FIXME: Plinko ending logic

    game = await this.prisma.plinkoGame.update({
      data: game,
      where: { id: game.id },
    });

    return this.walletService.rewardTheWinner(game.userId, game.prize, {
      ...game, // TODO: Modify this maybe
      rule,
      name: 'Plinko',
    } as WinmoreGameTypes);
  }

  async decide(game: PlinkoGame) {
    const rule = await this.getRulesByRows(game.rowsCount);
    if (!rule)
      throw new MethodNotAllowedException(
        'It seems that site is not ready for your next mine; wait a little bit.',
      );

    // FIXME: Implement logic
    game.status = PlinkoGameStatus.DROPPING;
    await this.prisma.plinkoGame.update({ where: { id: game.id }, data: game });
    // TODO:
  }

  async getRules() {
    const gameRules = await this.prisma.plinkoRules.findMany({
      orderBy: { rows: 'asc' },
    });

    if (!gameRules?.length)
      throw new InternalServerErrorException(
        'For some reason dream mine game rules are not available. Can not play Dream Mine right now.',
      );
    return gameRules;
  }

  async getRulesMapped() {
    return Object.fromEntries(
      (await this.getRules()).map((rule) => [rule.rows, rule]),
    );
  }

  getRulesByRows(rows: number) {
    return this.prisma.plinkoRules.findFirst({ where: { rows } });
  }

  populateMultipliers(
    multipliers: number[],
    difficultyMultipliers: number[],
  ): { easy: number[]; medium?: number[]; hard?: number[] } {
    if (!difficultyMultipliers?.length) {
      return { easy: multipliers };
    }
    // TODO: Check this out for conflicts
    if (difficultyMultipliers.length === 1) {
      const [easy, hard] = [1, difficultyMultipliers[0]].map(
        (diffCoef: number) =>
          multipliers.map((rowCoef: number) => rowCoef * diffCoef),
      );

      return { easy, hard };
    }

    const [mediumCoef, hardCoef] = difficultyMultipliers;
    const [easy, medium, hard] = [1, mediumCoef, hardCoef].map(
      (diffCoef: number) =>
        multipliers.map((rowCoef: number) => rowCoef * diffCoef),
    );

    return { easy, medium, hard };
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
    // TODO: Check this out for conflicts
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
        case ExtraGameStatusEnum.GAINED:
          // TODO: Games with prize > initialBet
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

    const games: PlinkoGame[] = await this.prisma.plinkoGame.findMany({
      where: { ...filters },
      ...sortParams,
      include,
    });

    return games.map((game) => {
      game['time'] = Math.ceil(
        ((game.finishedAt?.getTime() || Date.now()) -
          game.createdAt.getTime()) /
          6000,
      );
      return game;
    });
  }

  getOnesOngoingGame(userId: number) {
    return this.prisma.plinkoGame.findFirst({
      where: { userId, status: PlinkoGameStatus.DROPPING },
      orderBy: { createdAt: 'desc' },
    });
  }

  getAllOngoingGames(
    { take, skip }: PaginationOptionsDto,
    include?: Record<string, object>,
  ) {
    return this.prisma.plinkoGame.findMany({
      where: { status: PlinkoGameStatus.DROPPING },
      orderBy: { createdAt: 'desc' },
      ...(take ? { take } : {}),
      ...(skip != null ? { skip } : {}),
      ...(include ? { include } : {}),
    });
  }
}
