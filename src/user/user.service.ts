import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { Prisma } from '@prisma/client';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  get commonUserIncludeConfig() {
    return {
      profile: {
        select: {
          id: true,
          userId: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      wallet: {
        select: {
          id: true,
          ownerId: true,
          address: true,
          updatedAt: true,
          createdAt: true,
        },
      },
    };
  }

  getUserBalance(userId: number, token: string) {
    return this.walletService.getBalance(token);
  }

  async getByWalletAddress(address: string) {
    return this.prisma.user.findFirst({
      where: { wallet: { address } },
      include: this.commonUserIncludeConfig,
    });
  }

  updateLastLoginDate(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  getById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: this.commonUserIncludeConfig,
    });
  }

  getBy(identifier: { id?: number; email?: string }) {
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
        profile: {
          create: {
            avatar: null,
          },
        },
      },
      include: this.commonUserIncludeConfig,
    });
  }

  async updateUser(id: number, updateUserData: UpdateUserDto) {
    if (!updateUserData.email && !updateUserData.name)
      throw new BadRequestException(
        'Provide some new data to continue modifying user data.',
      );
    if (updateUserData.email) {
      const user = await this.getBy({ email: updateUserData.email.toString() });
      if (user) throw new ConflictException('This email is used before.');
    }

    const { avatar, ...userData } = updateUserData;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        profile: { update: { ...(avatar ? { avatar } : {}) } },
      },
    });
  }

  async completeUserData(userId: number, userData: CompleteRegistrationDto) {
    const { email, name } = userData;
    await this.updateUser(userId, { email, name });
    // TODO: Update user data if everything is right on its place.
  }

  getUsers() {
    return this.prisma.user.findMany({
      where: { admin: false },
      include: this.commonUserIncludeConfig,
    });
  }

  async updateUserSettings(
    userId: number,
    data: Prisma.UserProfileUpdateInput,
  ) {
    // TODO: Update this when some profile are added.
    const user = await this.getById(userId);
    if (!user) throw new NotFoundException('User not found!');

    if (!user.profile) {
      data['userId'] = userId;
      user.profile = await this.prisma.userProfile.create({
        data: data as Prisma.UserProfileCreateInput,
      });
    }
    return this.prisma.userProfile.update({ where: { userId }, data: data });
  }
}
