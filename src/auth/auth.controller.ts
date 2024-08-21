import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthenticationDto } from './dto/auth.dto';
import { WalletAddressDto } from './dto/wallet-address.dto';
import { VerificationCodeDto } from './dto/verification-code.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    description:
      'Verifies the user input data and Registers/Logs in the user in the server. Returns 200 for login, and 201 for register.',
  })
  @Post()
  async authenticate(@Body() authData: AuthenticationDto) {
    const { user, status } = await this.authService.verifyAndLogin(authData);
    // return the data as expected for StandardResponseInterceptor, and also set the status manually here.
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
    description:
      'Generates and sends the verification code for the email user has entered, that then can use it in complete user data endpoint.',
  })
  @Post('verification-code')
  // TODO: add JwtAuthGuard Here?
  sendVerificationCode(@Body() verificationCodeDto: VerificationCodeDto) {
    console.log(verificationCodeDto)
    return this.authService.sendVerificationCode(verificationCodeDto.email);
  }
}
