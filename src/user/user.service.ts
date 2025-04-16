import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { Prisma, TokensEnum } from '@prisma/client';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPopulated } from './types/user-populated.type';
import { RequestWithdrawalDto } from './dto/request-withdraw.dto';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TransactionHistoryFilterDto } from '../wallet/dtos/transaction-history-dto';
import { ReferralService } from '../referral/referral.service';
import { PaginationOptionsDto } from 'src/common/dtos/pagination-options.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly blockchainService: BlockchainService,
    private readonly referralService: ReferralService,
  ) {}

  get userPopulatedIncludeConfig() {
    return {
      profile: true,
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

  getTokenBalance(user: UserPopulated, token: TokensEnum, chainId: number) {
    return this.walletService.getBalance(user.wallet.id, token, chainId);
  }

  getWallet(user: UserPopulated) {
    return this.walletService.getUserWallet(user.id);
  }

  getByWalletAddress(address: string) {
    return this.prisma.user.findFirst({
      where: { wallet: { address } },
      include: this.userPopulatedIncludeConfig,
    });
  }

  async getMyTransactions(
    userId: number,
    {
      type,
      take,
      skip,
      status,
      token,
      chain,
      sort,
      order,
    }: TransactionHistoryFilterDto,
  ) {
    return this.walletService.getUserTransactionsHistory(
      userId,
      type,
      +take,
      +skip,
      { by: sort, order },
      { status, token, chain: +chain },
    );
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
      include: this.userPopulatedIncludeConfig,
    });
  }

  getBy(identifier: { id?: number; email?: string }) {
    const { id, email } = identifier;

    if (id != null)
      return this.prisma.user.findUnique({
        where: { id },
        include: this.userPopulatedIncludeConfig,
      });

    if (email)
      return this.prisma.user.findUnique({
        where: { email },
        include: this.userPopulatedIncludeConfig,
      });

    throw new BadRequestException('Invalid arguments for finding a user');
  }

  async createUser(
    walletAddress: string,
    userData?: Prisma.UserCreateInput,
    referrerCode?: string,
  ) {
    const user = await this.prisma.user.create({
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
            referralCode: await this.referralService.generateNewCode(),
          },
        },
      },
      include: this.userPopulatedIncludeConfig,
    });

    if (referrerCode?.length) {
      await this.referralService.linkUserToReferrers(user.id, referrerCode);
    }
    return user;
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

    const { avatar, referrerCode, ...userData } = updateUserData;

    if (referrerCode?.length) {
      if (!(await this.referralService.isUserAllowedToSetReferrerCode(id))) {
        throw new ForbiddenException(
          'Specifying Referral code is only allowed for new users!',
        );
      }
      await this.referralService.linkUserToReferrers(id, referrerCode, true);
    }
    if (!avatar?.length && !Object.keys(userData)?.length) {
      return;
    }
    await this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        ...(avatar?.length ? { profile: { update: { avatar } } } : {}),
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
      include: this.userPopulatedIncludeConfig,
    });
  }

  getMyReferralsReport(userId: number, paginationDto?: PaginationOptionsDto) {
    return this.referralService.getUserReferralsReport(userId, paginationDto);
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

  requestWithdrawal(
    user: UserPopulated,
    { chain, amount, token }: RequestWithdrawalDto,
  ) {
    return this.blockchainService.withdraw(user.wallet, chain, token, amount);
  }
}
