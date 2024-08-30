import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    description: 'Get the current user data.',
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  getMe(@CurrentUser() user: User) {
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

  @ApiOperation({
    description: 'Returns the balance of a specific token for current user.',
  })
  @UseGuards(JwtAuthGuard)
  @Get('balance/:token')
  getBalance(@CurrentUser() user: User, @Param('token') token: string) {
    return this.userService.getUserBalance(user.id, token);
  }

  @ApiOperation({
    description: 'Completed user registration.',
  })
  @UseGuards(JwtAuthGuard)
  @Post('register')
  completeRegistration(
    @CurrentUser() user: User,
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
    @CurrentUser() user: User,
    @Body() updateUserData: UpdateUserDto,
  ) {
    return this.userService.updateUser(user.id, updateUserData);
  }
}
