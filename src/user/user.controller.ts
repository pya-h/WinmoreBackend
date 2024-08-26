import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    description: 'Get the current user data.',
  })
  @Get()
  getMe() {
    // TODO: Implement the current user decorator and return its returned value.
    return null;
  }

  @ApiOperation({
    description: 'Get users',
  })
  // Requires JwtGuard
  @Get('all')
  getUsers() {
    return this.userService.getUsers();
  }

  // TODO: Implement the serialize user data INTERCEPTOR.
  @ApiOperation({
    description: 'Get the current user data.',
  })
  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: string) {
    // TODO: Implement the user data serialization for current user ad other users.
    // returns the full displayable data if the id === currentId, o.w. return the serialized data.

    const currentUser = { id: -1 }; // Convert this to decorator.
    if (+id == currentUser.id) return currentUser;

    const user = await this.userService.getUserById(+id);
    if (!user) throw new NotFoundException('User Not Found!');
    return user;
  }

  @ApiOperation({
    description: 'Returns the balance of a specific token for current user.',
  })
  @Get('balance/:token')
  getBalance(@Param('token') token: string) {
    // TODO: Define Token Enum
    return this.userService.getUserBalance(token);
  }

  @ApiOperation({
    description: 'Completed user registration.',
  })
  // Requires JwtGuard
  @Post('register')
  completeRegistration(@Body() completeUserData: CompleteRegistrationDto) {
    const userId = 0; // TODO: extract from jwt/provided by CurrentUser Decorator.
    return this.userService.completeUserData(userId, completeUserData);
  }

  @ApiOperation({
    description: 'Completed user registration.',
  })
  // Requires JwtGuard
  @Patch('modify')
  updateUserData(@Body() updateUserData: UpdateUserDto) {
    const userId = 0; // TODO: Current User
    return this.userService.updateUser(userId, updateUserData);
  }
}
