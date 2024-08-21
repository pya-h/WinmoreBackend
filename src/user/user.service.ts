import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { Prisma } from '@prisma/client';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  getUserBalance(token: string) {
    return this.walletService.getBalance(token);
  }

  async getUserByWalletAddress(walletAddress: string) {
    return null;
  }

  async getUserByWalletId(walletId: number) {}

  getUserById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  createUser(userData?: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data: userData
        ? {
            name: userData.name,
            email: userData.email,
          }
        : null,
    });
  }

  completeUserData(userId: number, userData: CompleteRegistrationDto) {
    const { email, name, verificationCode } = userData;

    // TODO: Verify user verification code.

    // TODO: Update user data if everything is right on its place.
  }

  getUsers() {
    return this.prisma.user.findMany({ where: { admin: false } });
  }
}
