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
} from '../games/types/game.types';
import { SortModeEnum } from '../games/types/sort-enum.dto';
import { PaginationOptionsDto } from '../common/dtos/pagination-options.dto';
import { SortOrderEnum } from '../common/types/sort-orders.enum';
import { approximate } from '../common/tools';
import { PlinkoPhysxService } from './physx.service';
import {
  DeterministicPlinkoBallType,
  PlinkoBallType,
} from './types/physx.types';
import { PlinkoGameStatusFilterQuery } from './dtos/plinko-game-status-filter-query.dto';

@Injectable()
export class PlinkoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly plinkoPhysxService: PlinkoPhysxService,
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

  async finalizeGame(game: PlinkoGame, rule: PlinkoRules) {
    if (!rule) {
      rule = await this.getRulesByRows(game.rowsCount);
    }

    const { multipliers, possibilities } =
      this.getActualMultipliersAndPossibilities(rule, game.mode);
    let totalPrize = 0;
    const balls: DeterministicPlinkoBallType[] = [];
    const pegs = this.plinkoPhysxService.getPegs(
        rule.rows,
        PlinkoPhysxService.bucketSpecs.width,
      ),
      buckets = this.plinkoPhysxService.getBuckets(rule, pegs.borders);

    for (let i = 0; i < game.ballsCount; i++) {
      // TODO/Decide: This way no game will remain undetermined; But we could implement this to determine on user drop click too
      const userChance = approximate(Math.random() * 100, 'ceil', 0);
      let targetBucket = (multipliers.length / 2) | 0;
      for (let i = 0; i < possibilities.length; i++) {
        if (userChance <= possibilities[i] && i !== targetBucket) {
          if (possibilities[i] < possibilities[targetBucket]) {
            targetBucket = i;
          } else if (
            possibilities[i] === possibilities[targetBucket] &&
            Math.random() > 0.5
          ) {
            // If two buckets have the same possibility, then select randomly.
            targetBucket = i;
          }
        }
      }

      balls.push(
        this.plinkoPhysxService.findDroppingBall(
          rule,
          buckets,
          pegs,
          targetBucket,
          { y0: 50, radius: 7.5 },
        ),
      ); // TODO: Revise this
      totalPrize += multipliers[targetBucket] * game.initialBet;
    }

    await Promise.all(
      balls.map(
        (
          { bucketIndex, ...ball }, // TODO/Check: Is it possible for a ball to not fell in any bucket?
        ) =>
          this.prisma.plinkoBalls.create({
            data: {
              bucketIndex,
              scoredMultiplier: multipliers[bucketIndex],
              gameId: game.id,
              userId: game.userId,
              dropSpecs: ball,
            },
          }),
      ),
    );

    game.prize = totalPrize;
    game.status = PlinkoGameStatus.FINISHED;
    game.finishedAt = new Date(); // TODO: Find a way to obtain this date from front; (without any misleading info.)

    game = await this.prisma.plinkoGame.update({
      data: game,
      where: { id: game.id },
    });

    await this.walletService.rewardTheWinner(game.userId, game.prize, {
      ...game,
      rule,
      name: 'Plinko',
    } as WinmoreGameTypes);
    return balls;
  }

  async decide(user: UserPopulated, gameId: number) {
    let game = await this.prisma.plinkoGame.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('No such game!');
    }

    if (user.id !== game.userId)
      throw new ForbiddenException(
        'Not allowed to play this game since its not yours!',
      );

    const rule = await this.getRulesByRows(game.rowsCount);
    if (!rule)
      throw new MethodNotAllowedException(
        'It seems that site is not ready for your next mine; wait a little bit.',
      );

    game.status = PlinkoGameStatus.DROPPING;
    game = await this.prisma.plinkoGame.update({
      where: { id: game.id },
      data: game,
    });

    return (await this.finalizeGame(game, rule)).map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ bucketIndex, ...ball }) => ball as PlinkoBallType,
    );
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
  ): {
    [GameModesEnum.EASY]: number[];
    [GameModesEnum.MEDIUM]?: number[];
    [GameModesEnum.HARD]?: number[];
  } {
    if (!difficultyMultipliers?.length) {
      return { [GameModesEnum.EASY]: multipliers };
    }
    if (difficultyMultipliers.length === 1) {
      const [easy, hard] = [1, difficultyMultipliers[0]].map(
        (diffCoef: number) =>
          multipliers.map((rowCoef: number) => rowCoef * diffCoef),
      );

      return { [GameModesEnum.EASY]: easy, [GameModesEnum.HARD]: hard };
    }

    const [mediumCoef, hardCoef] = difficultyMultipliers;
    const [easy, medium, hard] = [1, mediumCoef, hardCoef].map(
      (diffCoef: number) =>
        multipliers.map((rowCoef: number) => rowCoef * diffCoef),
    );

    return {
      [GameModesEnum.EASY]: easy,
      [GameModesEnum.MEDIUM]: medium,
      [GameModesEnum.HARD]: hard,
    };
  }

  async findGames({
    userId,
    filter,
    include = {},
  }: {
    userId?: number;
    filter?: PlinkoGameStatusFilterQuery;
    include?: Record<string, object>;
  }) {
    const sortParams: Record<string, Record<string, string> | number> = {};
    let useRawQuery = false;

    switch (filter?.sort) {
      case SortModeEnum.LUCKY:
        if (filter.status)
          throw new ConflictException(
            "Lucky-bets sort doesn't accept any status filter",
          );
        sortParams.orderBy = {
          prize: (filter?.order || SortOrderEnum.DESC).toString(),
        };
        break;
    }

    if (sortParams?.orderBy) {
      filter.status = ExtraGameStatusEnum.GAINED;
    } else {
      sortParams.orderBy = { createdAt: SortOrderEnum.DESC.toString() };
    }

    const filters: Record<string, object | string | number> = {};

    if (filter?.status && filter.status !== ExtraGameStatusEnum.ALL) {
      switch (filter?.status) {
        case ExtraGameStatusEnum.GAINED:
          useRawQuery = true;
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

    let games: PlinkoGame[];

    if (useRawQuery) {
      const orderEntries = Object.entries(sortParams.orderBy ?? {})?.[0];
      const limit = filter.take != null ? `LIMIT ${+filter.take}` : '';
      const offset = filter.skip != null ? `OFFSET ${+filter.skip}` : '';

      const query = `SELECT * FROM "PlinkoGame"
        WHERE "prize" > "initialBet" ${userId != null ? `AND "userId" = ${userId}` : ''}
        ORDER BY ${orderEntries?.length ? `"${orderEntries[0]}" ${orderEntries[1].toUpperCase()}` : 'createdAt DESC'} ${limit} ${offset}`;

      games = await this.prisma.$queryRawUnsafe<PlinkoGame[]>(query); // TODO: Check this options output...
    } else {
      games = await this.prisma.plinkoGame.findMany({
        where: { ...filters },
        ...sortParams,
        include,
      });
    }

    return games.map((game) => {
      // FIXME: Remove this code and do this in frontend instead.
      game['time'] = Math.ceil(
        ((game.finishedAt?.getTime() || Date.now()) -
          game.createdAt.getTime()) /
          6000,
      );
      return game;
    });
  }

  getOnesLatestOngoingGame(userId: number) {
    return this.prisma.plinkoGame.findFirst({
      where: { userId, status: { not: PlinkoGameStatus.FINISHED } },
      orderBy: { createdAt: 'desc' },
      include: {
        plinkoBalls: {
          select: { dropSpecs: true, id: true },
        },
      },
    });
  }

  getOngoingGames(
    { take, skip }: PaginationOptionsDto,
    include?: Record<string, object | boolean>,
  ) {
    return this.prisma.plinkoGame.findMany({
      where: { status: { not: PlinkoGameStatus.FINISHED } },
      orderBy: { createdAt: 'desc' },
      ...(take ? { take } : {}),
      ...(skip != null ? { skip } : {}),
      ...(include ? { include } : {}),
    });
  }

  async getRulesAndBoard() {
    return (await this.getRules()).map((rule) => {
      const pegs = this.plinkoPhysxService.getPegs(
        rule.rows,
        PlinkoPhysxService.bucketSpecs.width,
      );
      return {
        rows: rule.rows,
        multipliers: this.populateMultipliers(
          rule.multipliers,
          rule.difficultyMultipliers,
        ),
        minBetAmount: rule.minBetAmount,
        maxBetAmount: rule.maxBetAmount,
        board: this.plinkoPhysxService.getBoardSpecs(rule.rows),
        pegs,
        buckets: this.plinkoPhysxService.getBuckets(rule, pegs.borders),
      };
    });
  }
}
