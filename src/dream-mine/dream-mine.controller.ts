import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { UserPopulated } from '../user/types/user-populated.type';
import { DreamMineGamePreferencesDto } from './dtos/game-preferences.dto';
import { DreamMineService } from './dream-mine.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('dream-mine')
export class DreamMineController {
  constructor(private readonly dreamMineService: DreamMineService) {}

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
    description: 'Place bet and start a new dream mine game.',
  })
  @UseGuards(JwtAuthGuard)
  @Post('mine/:id')
  mineNext(
    @CurrentUser() user: UserPopulated,
    @Param('id', ParseIntPipe) id: string,
  ) {
    return this.dreamMineService.goForCurrentRow(user, +id);
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
  @UseGuards(JwtAuthGuard)
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
