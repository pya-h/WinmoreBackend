import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
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

  async getUserByWalletAddress(address: string) {
    console.log(address);
    return null;
  }

  get commonUserIncludeConfig() {
    // TODO: This needs updating based ion the user requesting: The user itself must receive more detailed data.
    return {
      settings: true,
      wallet: {
        select: { ownerId: true },
      },
    };
  }
  getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: this.commonUserIncludeConfig,
    });
  }

  getUserBy(identifier: { id?: number; email?: string }) {
    const { id, email } = identifier;

    if (id != null)
      return this.prisma.user.findUnique({
        where: { id },
        include: this.commonUserIncludeConfig,
      });

    if (email)
      return this.prisma.user.findUnique({
        where: { email },
        include: this.commonUserIncludeConfig,
      });

    throw new BadRequestException('Invalid arguments for finding a user');
  }

  createUser(walletAddress: string, userData?: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data: {
        wallet: {
          create: {
            address: walletAddress,
          },
        },
        email: userData?.email,
        name: userData?.name,
        admin: false,
        settings: { create: {} },
      },
    });
  }

  async updateUser(id: number, userData: Prisma.UserUpdateInput) {
    if (!userData.email && !userData.name)
      throw new BadRequestException(
        'Provide some new data to continue modifying user data.',
      );
    if (userData.email) {
      const user = await this.getUserBy({ email: userData.email.toString() });
      if (user) throw new ConflictException('This email is used before.');
    }
    return this.prisma.user.update({
      where: { id },
      data: { email: userData.email, name: userData.name },
    });
  }

  async completeUserData(userId: number, userData: CompleteRegistrationDto) {
    const { email, name } = userData;
    await this.updateUser(userId, { email, name });
    // TODO: Verify user verification code.

    // TODO: Update user data if everything is right on its place.
  }

  getUsers() {
    return this.prisma.user.findMany({
      where: { admin: false },
      include: this.commonUserIncludeConfig,
    });
  }
}
