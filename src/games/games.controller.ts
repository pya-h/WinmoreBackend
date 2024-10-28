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
  findGames(@Query() filter?: GameStatusFilterQuery) {
    return this.dreamMineService.findGames({ filter });
  }

  @ApiOperation({
    description: 'Returns the list of all ongoing games by all users.',
  })
  @Get('ongoing')
  async getUsersOngoingGame(@Query() paginationOptions?: PaginationOptionsDto) {
    return this.dreamMineService.getAllOngoingGames(paginationOptions);
  }
}
