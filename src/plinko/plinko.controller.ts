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
import { PlinkoService } from './plinko.service';
import { PlinkoGameStatusFilterQuery } from './dtos/plinko-game-status-filter-query.dto';
import { PaginationOptionsDto } from 'src/common/dtos/pagination-options.dto';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { UserPopulated } from 'src/user/types/user-populated.type';
import { PlinkoGamePreferences } from './dtos/plinko-game-preferences.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@ApiTags('Plinko Game')
@Controller('plinko')
export class PlinkoController {
  constructor(private readonly plinkoService: PlinkoService) {}

  @ApiOperation({
    description: 'Get plinko rules & design specs.',
  })
  @Get('rules')
  async getLatestRules() {
    return this.plinkoService.getRulesAndBoard();
  }

  @ApiOperation({
    description: "Returns user's plinko game history.",
  })
  @Get()
  findGames(@Query() filter?: PlinkoGameStatusFilterQuery) {
    return this.plinkoService.findGames({
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
    description: "Returns user's plinko game history.",
  })
  @UseGuards(JwtAuthGuard)
  @Get('my-history')
  getMyPlinkoHistory(
    @CurrentUser() user: UserPopulated,
    @Query() filter?: PlinkoGameStatusFilterQuery,
  ) {
    return this.plinkoService.findGames({ userId: user.id, filter });
  }

  @ApiOperation({
    description: 'Returns the list of all ongoing plinko games by all users.',
  })
  @Get('ongoing')
  async getUsersOngoingGame(@Query() paginationOptions?: PaginationOptionsDto) {
    return this.plinkoService.getOngoingGames(paginationOptions, {
      user: {
        select: {
          name: true,
          id: true,
        },
      },
      plinkoBalls: false,
    });
  }

  @ApiOperation({
    description:
      "Returns the last ongoing game (if there's any) of current user.",
  })
  @UseGuards(JwtAuthGuard)
  @Get('me-playing')
  async getCurrentOngoingGame(@CurrentUser() user: UserPopulated) {
    return this.plinkoService.getOnesLatestOngoingGame(user.id);
  }

  @ApiOperation({
    description: 'Place bet and start a new plinko game.',
  })
  @UseGuards(JwtAuthGuard)
  @Post('bet')
  startNewGame(
    @CurrentUser() user: UserPopulated,
    @Body() gamePreferences: PlinkoGamePreferences,
  ) {
    return this.plinkoService.newGame(user, gamePreferences);
  }

  @ApiOperation({
    description:
      'Drop user requested balls based on user chance (independent for each ball); Finally returns balls on their dropping state.',
  })
  @UseGuards(JwtAuthGuard)
  @Post('drop/:id')
  dropBalls(
    @CurrentUser() user: UserPopulated,
    @Param('id', ParseIntPipe) id: string,
  ) {
    return this.plinkoService.decide(user, +id);
  }
}
