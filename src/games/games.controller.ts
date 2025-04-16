import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { GameStatusFilterQuery } from './dtos/game-status-filter.query';
import { DreamMineService } from '../dream-mine/dream-mine.service';
import { PaginationOptionsDto } from '../common/dtos/pagination-options.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { UserPopulated } from 'src/user/types/user-populated.type';
import { PlinkoService } from 'src/plinko/plinko.service';
import { generalStatusToPlinkoStatus } from 'src/games/types/game.types';
import { WinmoreGamesEnum } from './enums/games.enum';

@Controller('games')
export class GamesController {
  constructor(
    private readonly dreamMineService: DreamMineService,
    private readonly plinkoService: PlinkoService,
  ) {}

  @ApiOperation({
    description: 'Returns the list of all games of all users.',
  })
  @Get()
  async findGames(@Query() filter?: GameStatusFilterQuery) {
    const [dreamMines, plinkos] = await Promise.all([
      this.dreamMineService.findGames({
        filter,
        include: {
          user: {
            select: {
              name: true,
              id: true,
            },
          },
        },
      }),
      this.plinkoService.findGames({
        filter: {
          ...filter,
          status: generalStatusToPlinkoStatus(filter.status),
        },
        include: {
          user: {
            select: {
              name: true,
              id: true,
            },
          },
          plinkoBalls: {
            select: {
              scoredMultiplier: true,
              bucketIndex: true,
            },
          },
        },
      }),
    ]);
    return {
      dreamMines,
      plinkos,
    };
  }

  @ApiOperation({
    description: 'Returns the list of all ongoing games by all users.',
  })
  @Get('ongoing')
  async getUsersOngoingGame(@Query() paginationOptions?: PaginationOptionsDto) {
    const [dreamMines, plinkos] = await Promise.all([
      this.dreamMineService.getOngoingGames(paginationOptions, {
        user: {
          select: {
            name: true,
            id: true,
          },
        },
      }),
      this.plinkoService.getOngoingGames(paginationOptions, {
        user: {
          select: {
            name: true,
            id: true,
          },
        },
      }),
    ]);

    return [
      ...dreamMines.map((game) => ({
        ...game,
        name: WinmoreGamesEnum.DREAM_MINE,
      })),
      ...plinkos.map((game) => ({ ...game, name: WinmoreGamesEnum.PLINKO })),
    ].sort((g1, g2) => g2.createdAt.getTime() - g1.createdAt.getTime()); //TODO: better to move sort logic to front.
  }

  @ApiOperation({
    description: "Returns user's ongoing games in both games.",
  })
  @UseGuards(JwtAuthGuard)
  @Get('me-playing')
  async getUsersCurrentlyPlaying(@CurrentUser() user: UserPopulated) {
    const [dreamMine, plinko] = await Promise.all([
      this.dreamMineService.getOnesLatestOngoingGame(user.id),
      this.plinkoService.getOnesLatestOngoingGame(user.id),
    ]);

    return { dreamMine, plinko };
  }

  @ApiOperation({
    description: "Returns the list of user's all games.",
  })
  @UseGuards(JwtAuthGuard)
  @Get('my-history')
  async getMyAllGames(
    @CurrentUser() user: UserPopulated,
    @Query() filter?: GameStatusFilterQuery,
  ) {
    const [dreamMines, plinkos] = await Promise.all([
      this.dreamMineService.findGames({
        userId: user.id,
        filter,
        include: {
          user: {
            select: {
              name: true,
              id: true,
            },
          },
        },
      }),
      this.plinkoService.findGames({
        userId: user.id,
        filter: {
          ...filter,
          status: generalStatusToPlinkoStatus(filter.status), // TODO: Maybe do sth else?
        },
        include: {
          user: {
            select: {
              name: true,
              id: true,
            },
          },
          plinkoBalls: {
            select: {
              scoredMultiplier: true,
              bucketIndex: true,
            },
          },
        },
      }),
    ]);
    return {
      dreamMines,
      plinkos,
    };
  }
}
