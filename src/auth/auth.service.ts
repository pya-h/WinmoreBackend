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

    if (!(await this.verifySignature(address, message, nonce, signature))) {
      throw new UnauthorizedException('Invalid signature.');
    }

    this.clearNonce(address);

    // TODO: Generate a JWT token or return a success message
    // TODO: then login if the wallet address exists in db, register if not.
    const user = await this.userService.getByWalletAddress(address);
    if (!user) {
      // TODO: register the new user.
      return {
        user: this.userService.createUser(address),
        status: HttpStatus.CREATED,
      };
    }

    return { user, status: HttpStatus.OK };
  }
}
