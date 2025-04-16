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
import { TransactionHistoryFilterDto } from '../wallet/dtos/transaction-history-dto';
import { PaginationOptionsDto } from 'src/common/dtos/pagination-options.dto';

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
    description:
      'Returns the wallet balance of users, containing all their available tokens on each available chain, based on their transaction activity.',
  })
  @UseGuards(JwtAuthGuard)
  @Get('wallet')
  getWallet(@CurrentUser() user: UserPopulated) {
    return this.userService.getWallet(user);
  }

  @ApiOperation({
    description: 'Returns all user transactions.',
  })
  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  getTransactions(
    @CurrentUser() user: UserPopulated,
    @Query() transactionHistoryFilter: TransactionHistoryFilterDto,
  ) {
    return this.userService.getMyTransactions(
      user.id,
      transactionHistoryFilter,
    );
  }

  @ApiOperation({
    description: 'Returns all user transactions.',
  })
  @UseGuards(JwtAuthGuard)
  @Get('referral-report')
  getMyReferralsReport(
    @CurrentUser() user: UserPopulated,
    @Query() paginationOptionsDto: PaginationOptionsDto,
  ) {
    return this.userService.getMyReferralsReport(
      user.id,
      paginationOptionsDto,
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

  // TODO: Implement the serialize user data INTERCEPTOR.
  @ApiOperation({
    description: 'Get the current user data.',
  })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(
    @CurrentUser() currentUser: UserPopulated,
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
