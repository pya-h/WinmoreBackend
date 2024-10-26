import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserPopulated } from './types/user-populated.type';
import { TokensEnum } from '@prisma/client';
import { RequestWithdrawalDto } from './dto/request-withdraw.dto';
import { GameStatusFilterQuery } from 'src/games/dtos/game-status-filter.query';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    description: 'Get the current user data.',
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  getMe(@CurrentUser() user: UserPopulated) {
    return user;
  }

  @ApiOperation({
    description: 'Get users',
  })
  @UseGuards(JwtAuthGuard)
  @Get('all')
  getUsers() {
    return this.userService.getUsers();
  }

  @ApiOperation({
    description: 'Returns the balance of a specific token for current user.',
  })
  @UseGuards(JwtAuthGuard)
  @Get('balance/:token')
  getBalance(
    @CurrentUser() user: UserPopulated,
    @Param('token') token: string,
    @Query('chain', new ParseIntPipe()) chainId: string,
  ) {
    return this.userService.getTokenBalance(
      user,
      token as TokensEnum,
      +chainId,
    );
  }

  @ApiOperation({
    description: 'Completed user registration.',
  })
  @UseGuards(JwtAuthGuard)
  @Post('register')
  completeRegistration(
    @CurrentUser() user: UserPopulated,
    @Body() completeUserData: CompleteRegistrationDto,
  ) {
    return this.userService.completeUserData(user.id, completeUserData);
  }

  @ApiOperation({
    description: 'Update/Modify user profile data.',
  })
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateUserData(
    @CurrentUser() user: UserPopulated,
    @Body() updateUserData: UpdateUserDto,
  ) {
    return this.userService.updateUser(user.id, updateUserData);
  }

  @ApiOperation({
    description: 'Request a withdraw',
  })
  @UseGuards(JwtAuthGuard)
  @Post('withdraw')
  requestWithdraw(
    @CurrentUser() user: UserPopulated,
    @Body() updateUserData: RequestWithdrawalDto,
  ) {
    // TODO: discuss the verification method & implementation
    return this.userService.requestWithdrawal(user, updateUserData);
  }

  @ApiOperation({
    description: "Returns user's ongoing games in both games.",
  })
  @UseGuards(JwtAuthGuard)
  @Get('is-playing')
  async getUsersOngoingGame(@CurrentUser() user: UserPopulated) {
    return this.userService.getMyOngoingGames(user.id);
  }

  @ApiOperation({
    description: "Returns the list of user's all games.",
  })
  @UseGuards(JwtAuthGuard)
  @Get('games')
  getMyAllGames(
    @CurrentUser() user: UserPopulated,
    @Query() filter?: GameStatusFilterQuery,
  ) {
    return this.userService.getMyDreamMineGames(user.id, filter); // FIXME: For now there is only dream mine game; This should change after adding the second game, and must use the GamesService
  }

  @ApiOperation({
    description: "Returns the list of user's dream mine games.",
  })
  @UseGuards(JwtAuthGuard)
  @Get('games/dream-mine')
  getMyDreamMines(
    @CurrentUser() user: UserPopulated,
    @Query() filter?: GameStatusFilterQuery,
  ) {
    return this.userService.getMyDreamMineGames(user.id, filter);
  }

  // TODO: Implement the serialize user data INTERCEPTOR.
  @ApiOperation({
    description: 'Get the current user data.',
  })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(
    @CurrentUser() currentUser,
    @Param('id', ParseIntPipe) id: string,
  ) {
    // TODO: Implement the user data serialization for current user ad other users.
    // returns the full displayable data if the id === currentId, o.w. return the serialized data.

    if (+id == currentUser.id) return currentUser;

    const user = await this.userService.getById(+id);
    if (!user) throw new NotFoundException('User Not Found!');
    return user;
  }
}
