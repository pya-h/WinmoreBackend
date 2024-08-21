import {
  BadRequestException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticationDto } from './dto/auth.dto';
import { ethers } from 'ethers';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  private validNonces: Map<string, string> = new Map();

  generateNonce(address: string): string {
    const nonce = `${Date.now()}-${uuidv4()}`;
    this.validNonces.set(address.toLowerCase(), nonce);
    return nonce;
  }

  getNonce(address: string): string | undefined {
    return this.validNonces.get(address.toLowerCase());
  }

  clearNonce(address: string): void {
    this.validNonces.delete(address.toLowerCase());
  }

  messageToSign(message: string, nonce: string) {
    return `${nonce};${message};`;
  }

  verifySignature(
    address: string,
    actualMessage: string,
    nonce: string,
    signedMessage: string,
  ): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(
        signedMessage,
        this.messageToSign(actualMessage, nonce),
      );

      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {}

    return false;
  }

  async verifyAndLogin({
    message,
    signature,
    address,
  }: AuthenticationDto): Promise<{ user: unknown; status: number }> {
    const nonce: string = this.getNonce(address);
    if (!nonce)
      throw new BadRequestException(
        'Please first request nonce from the server',
      );

    if (!this.verifySignature(address, message, nonce, signature))
      throw new UnauthorizedException('Invalid signature.');

    this.clearNonce(address);

    const user = await this.userService.getUserByWalletAddress(address);
    if (!user) {
      // TODO:
      // 1 create the user with no data,
      // 2 create the user wallet with this address.
      // 3 log in the user and return the jwt
      // 4 return 201, so that front goes to complete user data page, then makes a request to /user/register with jwt.
      const user = await this.userService.createUser();
      return {
        user,
        status: HttpStatus.CREATED,
      };
    }
    // TODO: if wallet address exists from before then login and return jwt and user data.
    return { user, status: HttpStatus.OK };
  }

  sendVerificationCode(email: string) {
    // TODO:
    // 1 Generate a 6 digit code.
    // 2 Add it to verification codes model
    // 3  sent to user email.
  }
}
