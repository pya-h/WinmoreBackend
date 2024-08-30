import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthenticationDto } from './dto/auth.dto';
import { WalletAddressDto } from './dto/wallet-address.dto';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    description:
      'Verifies the user input data and Registers/Logs in the user in the server. Returns 200 for login, and 201 for register.',
  })
  @Post()
  async authenticate(
    @Body() authData: AuthenticationDto,
    @Res() res: Response,
  ) {
    const { status, token } = await this.authService.verifyAndLogin(authData);

    res.status(status).json(token);
    // TODO: return the data as expected for StandardResponseInterceptor, and also set the status manually here.
  }

  @ApiOperation({
    description:
      'Generates a new nonce for given address that is valid until its not used, only by the wallet address provided. Call this right after user connects the wallet.',
  })
  @Post('nonce')
  generateNonce(@Body() walletAddressDto: WalletAddressDto) {
    return this.authService.generateNonce(walletAddressDto.address);
  }

  @ApiOperation({
    description: 'Test route for creating user as fast as possible.',
  })
  @Post('test')
  async devAuth() {
    return await this.authService.testAuth();
  }
}
