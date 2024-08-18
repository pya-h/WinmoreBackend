import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

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

    return this.userService.getSingleUser(+id);
  }

  @ApiOperation({
    description: 'Returns the balance of a specific token for current user.',
  })
  @Get('balance/:token')
  getBalance(@Param('token') token: string) {
    return this.userService.getUserBalance(token);
  }
}
