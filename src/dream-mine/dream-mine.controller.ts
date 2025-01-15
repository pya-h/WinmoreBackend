import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { UserPopulated } from '../user/types/user-populated.type';
import { DreamMineGamePreferencesDto } from './dtos/game-preferences.dto';
import { DreamMineService } from './dream-mine.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { DoMineDto } from './dtos/do-mine.dto';
import { GameStatusFilterQuery } from '../games/dtos/game-status-filter.query';
import { PaginationOptionsDto } from 'src/common/dtos/pagination-options.dto';

@ApiTags('Dream Mine Game')
@Controller('dream-mine')
export class DreamMineController {
  constructor(private readonly dreamMineService: DreamMineService) {}

  @ApiOperation({
    description:
      "Returns the list of user's dream mine [specific] games by all users.",
  })
  @Get()
  findGames(@Query() filter?: GameStatusFilterQuery) {
    return this.dreamMineService.findGames({
      filter,
      include: {
        user: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });
  }

  @ApiOperation({
    description: 'Returns the list of all ongoing games by all users.',
  })
  @Get('ongoing')
  async getUsersOngoingGame(@Query() paginationOptions?: PaginationOptionsDto) {
    return this.dreamMineService.getAllOngoingGames(paginationOptions, {
      user: {
        select: {
          name: true,
          id: true,
        },
      },
    });
  }

  @ApiOperation({
    description: 'Place bet and start a new dream mine game.',
  })
  @UseGuards(JwtAuthGuard)
  @Post('bet')
  startNewGame(
    @CurrentUser() user: UserPopulated,
    @Body() gamePreferences: DreamMineGamePreferencesDto,
  ) {
    return this.dreamMineService.newGame(user, gamePreferences);
  }

  @ApiOperation({
    description:
      'Mine current row, the row which user is currently on in the game.',
  })
  @UseGuards(JwtAuthGuard)
  @Post('mine/:id')
  mineNext(
    @CurrentUser() user: UserPopulated,
    @Param('id', ParseIntPipe) id: string,
    @Body() { choice }: DoMineDto,
  ) {
    return this.dreamMineService.goForCurrentRow(user, +id, choice);
  }

  @ApiOperation({
    description: 'Place bet and start a new dream mine game.',
  })
  @UseGuards(JwtAuthGuard)
  @Post('backoff/:id')
  backoff(
    @CurrentUser() user: UserPopulated,
    @Param('id', ParseIntPipe) id: string,
  ) {
    return this.dreamMineService.backoffTheGame(user, +id);
  }

  @ApiOperation({
    description: 'Get dream mine public game rules.',
  })
  @Get('rules')
  async getLatestRules() {
    return (await this.dreamMineService.getRules()).map((rule) => ({
      rows: rule.rows,
      minBetAmount: rule.minBetAmount,
      coefficients: this.dreamMineService.populateMultipliers(
        rule.multipliers,
        rule.difficultyMultipliers,
      ), // TODO: Rename this field to 'multipliers', after checking out its usage in front
    }));
  }
}
