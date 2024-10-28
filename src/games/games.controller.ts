import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { GameStatusFilterQuery } from './dtos/game-status-filter.query';
import { DreamMineService } from '../dream-mine/dream-mine.service';
import { PaginationOptionsDto } from '../common/dtos/pagination-options.dto';

@Controller('games')
export class GamesController {
  constructor(private readonly dreamMineService: DreamMineService) {}

  @ApiOperation({
    description: 'Returns the list of all games of all users.',
  })
  @Get()
  async findGames(@Query() filter?: GameStatusFilterQuery) {
    return (
      await this.dreamMineService.findGames({
        filter,
        include: {
          user: {
            select: {
              name: true,
              id: true,
            },
          },
        },
      })
    ).map((game) => ({
      ...game,
      name: 'Dream Mine',
    }));
  }

  @ApiOperation({
    description: 'Returns the list of all ongoing games by all users.',
  })
  @Get('ongoing')
  async getUsersOngoingGame(@Query() paginationOptions?: PaginationOptionsDto) {
    return (
      await this.dreamMineService.getAllOngoingGames(paginationOptions, {
        user: {
          select: {
            name: true,
            id: true,
          },
        },
      })
    ).map((game) => ({ ...game, name: 'Dream Mine' }));
  }
}
