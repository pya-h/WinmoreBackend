import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticationDto } from './dto/auth.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { SiweMessage, generateNonce } from 'siwe';
import { ValidNonceType } from './types/valid-nonce.type';
import { ConfigService } from '@nestjs/config';
import { generateRandomString } from 'src/common/tools';

@Injectable()
export class AuthService {
  private nonceExpiry: number;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.nonceExpiry = this.configService.get<number>('auth.nonceExpiry');
  }

  private validNonces: Map<string, ValidNonceType> = new Map();

  generateNonce(address: string): string {
    const nonce = generateNonce();
    this.validNonces.set(address.toLowerCase(), {
      nonce,
      timestamp: Date.now() / 60,
    });
    return nonce;
  }

  getNonce(address: string): ValidNonceType | undefined | null {
    return this.validNonces.get(address.toLowerCase());
  }

  clearNonce(address: string): void {
    this.validNonces.delete(address.toLowerCase());
  }

  validateMessageNonce(message: SiweMessage): boolean {
    const expectation = this.getNonce(message.address.toLowerCase());

    if (!expectation)
      throw new UnauthorizedException(
        'Please first request nonce from the server',
      );
    return (
      message.nonce === expectation.nonce &&
      Date.now() <= expectation.timestamp + this.nonceExpiry
    );
  }

  async verifySignature(
    message: string,
    signature: string,
  ): Promise<{ ok: boolean; address?: string }> {
    const siweMessage = new SiweMessage(message);

    if (this.validateMessageNonce(siweMessage)) {
      const verificationResult = await siweMessage.verify({
        signature,
      });

      if (verificationResult?.success) {
        this.clearNonce(siweMessage.address);
        return { ok: true, address: siweMessage.address };
      }
    }
    return { ok: false };
  }

  getJwtToken(user: { id: number; wallet: { address: string } }) {
    return this.jwtService.sign({
      sub: user.id,
      address: user.wallet.address,
    });
  }

  async verifyAndLogin({ message, signature }: AuthenticationDto) {
    const { ok, address } = await this.verifySignature(message, signature);

    if (!ok) throw new UnauthorizedException('Invalid signature!');

    const user = await this.userService.getByWalletAddress(address);
    if (!user) {
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
    if (!this.configService.get<boolean>('general.debug'))
      throw new NotFoundException('No such route.');

    let randomWalletAddress: string = null;
    while (
      !randomWalletAddress ||
      (await this.userService.getByWalletAddress(randomWalletAddress))
    )
      randomWalletAddress = generateRandomString({
        prefix: '-0X',
        length: 39,
      }); // - is for not conflicting with real addresses

    const user = await this.userService.createUser(randomWalletAddress);
    return {
      token: this.getJwtToken(user),
      status: HttpStatus.CREATED,
      randomWalletAddress,
    };
  }
}
