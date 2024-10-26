import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { GameStatusFilterQuery } from './dtos/game-status-filter.query';
import { DreamMineService } from '../dream-mine/dream-mine.service';
import { PaginationOptionsDto } from '../common/dtos/pagination-options.dto';

@Controller('games')
export class GamesController {
  constructor(private readonly dreamMineService: DreamMineService) {}

  // TODO: This implementation is temp; for now there is only the dream mine game; so im using dream mine service;
  // After adding the second game, this module will have its own service
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
