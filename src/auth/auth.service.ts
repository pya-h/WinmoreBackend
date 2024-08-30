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
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

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

  getMessageToSign(message: string, nonce: string) {
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
        this.getMessageToSign(actualMessage, nonce),
      );

      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {}

    return false;
  }

  getJwtToken(user: { id: number; wallet: { address: string } }) {
    return this.jwtService.sign({
      sub: user.id,
      address: user.wallet.address,
    });
  }

  async verifyAndLogin({ message, signature, address }: AuthenticationDto) {
    const nonce: string = this.getNonce(address);
    if (!nonce)
      throw new BadRequestException(
        'Please first request nonce from the server',
      );

    if (!this.verifySignature(address, message, nonce, signature))
      throw new UnauthorizedException('Invalid signature.');

    this.clearNonce(address);

    const user = await this.userService.getByWalletAddress(address);
    if (!user) {
      // TODO: 1 create the user with no data,
      // 2 create the user wallet with this address.
      const user = await this.userService.createUser(address);
      return {
        token: this.getJwtToken(user),
        status: HttpStatus.CREATED,
      };
    }
    await this.userService.updateLastLoginDate(user.id);
    return { token: this.getJwtToken(user), status: HttpStatus.OK };
  }

  async testAuth() {
    const user = await this.userService.createUser(uuidv4());
    return {
      token: this.getJwtToken(user),
      status: HttpStatus.CREATED,
    };
  }
}
