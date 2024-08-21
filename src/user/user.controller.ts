import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';

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

  // TODO: Implement the serialize user data INTERCEPTOR.
  @ApiOperation({
    description: 'Get the current user data.',
  })
  @Get(':id')
  getUser(@Param('id') id: string) {
    // TODO: Implement the Id param validator.
    // TODO: Implement the user data serialization for current user ad other users.
    // returns the full displayable data if the id === currentId, o.w. return the serialized data.

    const currentUser = { id: -1 }; // Convert this to decorator.
    if (+id == currentUser.id) return currentUser;

    return this.userService.getUserById(+id);
  }

  @ApiOperation({
    description: 'Returns the balance of a specific token for current user.',
  })
  @Get('balance/:token')
  getBalance(@Param('token') token: string) {
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
}
