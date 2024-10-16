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
import { GameStatusFilterQuery } from './dtos/game-status-filter.query';

@ApiTags('Dream Mine Game')
@Controller('dream-mine')
export class DreamMineController {
  constructor(private readonly dreamMineService: DreamMineService) {}

  @ApiOperation({
    description: "Returns the list of user's dream mine [specific] games.",
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  getMyGames(
    @CurrentUser() user: UserPopulated,
    @Query() filter?: GameStatusFilterQuery,
  ) {
    return this.dreamMineService.getUserGames(user.id, filter);
  }

  @ApiOperation({
    description: 'Returns the balance of a specific token for current user.',
  })
  @UseGuards(JwtAuthGuard)
  @Get('is-playing')
  async getUsersOngoingGame(@CurrentUser() user: UserPopulated) {
    return this.dreamMineService.getOnesOngoingGame(user.id);
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
    const {
      minBetAmount,
      minRows,
      maxBetAmount,
      maxRows,
      rowCoefficients,
      difficultyCoefficients,
    } = await this.dreamMineService.getLatestRules();
    return {
      minBetAmount,
      maxBetAmount,
      minRows,
      maxRows,
      coefficients: this.dreamMineService.populateRowCoefficients(
        rowCoefficients,
        difficultyCoefficients,
      ),
    };
  }
}
