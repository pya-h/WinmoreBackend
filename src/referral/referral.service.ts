import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationOptionsDto } from 'src/common/dtos/pagination-options.dto';
import { ConfigService } from '@nestjs/config';
import { UserPopulated } from 'src/user/types/user-populated.type';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findUserByReferralCode(code: string, loadUser = true) {
    return this.prisma.userProfile.findFirst({
      where: { referralCode: code },
      include: { user: loadUser },
    });
  }

  async validateUserAllowanceToSetReferrerCode(
    user: UserPopulated,
    checkDate: boolean = false,
  ) {
    if (checkDate) {
      // In case this is called from some endpoint other than register!
      const deadlineInMinutes =
        this.configService.get<number>('referral.inputDeadline') ?? 60;

      if (
        Date.now() - new Date(user.createdAt).getTime() >=
        deadlineInMinutes * 60000
      ) {
        throw new ForbiddenException(
          'Specifying Referral code is only allowed for new users!',
        );
      }
    }
    if (
      await this.prisma.referral.findFirst({
        where: { OR: [{ userId: user.id }, { referrerId: user.id }] },
      })
    ) {
      throw new ForbiddenException(
        "You're not allowed to set referrer code, since you already have referral hierarchy!",
      );
    }
    return user;
  }

  async findDirectReferralRelations(options?: {
    relations?: Record<string, boolean | object>;
    onlyForUserId?: number;
  }) {
    if (options?.onlyForUserId != null) {
      return this.prisma.referral.findMany({
        where: { layer: 0, userId: options.onlyForUserId },
        take: 1,
        ...(options.relations ? { include: options?.relations } : {}),
      });
    }

    return this.prisma.referral.findMany({
      where: { layer: 0 },
      ...(options.relations ? { include: options?.relations } : {}),
    });
  }

  async findRefereesHierarchy(userId: number) {
    return this.prisma.referral.findMany({
      where: { userId },
    });
  }

  async findReferrer(userId: number, shouldThrow: boolean = false) {
    const referral = await this.prisma.referral.findFirst({
      where: { userId, layer: 0 },
      include: { referrer: true },
    });
    if (!referral) {
      if (shouldThrow) {
        throw new NotFoundException('User is not referred by anyone.');
      }
      return null;
    }
    return referral.referrer;
  }

  async findReferees(
    referrerId: number,
    referralType?: {
      layer?: number | Record<string, number>;
      direct?: boolean;
    },
    paginationOptions?: PaginationOptionsDto,
  ) {
    if (
      referralType &&
      referralType.layer == null &&
      referralType.direct != null
    ) {
      referralType.layer = referralType.direct ? 0 : { not: 0 };
    }

    if (!paginationOptions?.take && !paginationOptions?.skip) {
      const referrals = await this.prisma.referral.findMany({
        where: {
          referrerId,
          ...(referralType.layer != null ? { layer: referralType.layer } : {}),
        },
        include: { user: true },
      });
      return {
        users: referrals.map((ref) => ref.user),
        count: referrals.length,
      };
    }

    const [referrals, count] = await Promise.all([
      this.prisma.referral.findMany({
        where: {
          referrerId,
          ...(referralType.layer ? { layer: referralType.layer } : {}),
        },
        include: { user: true },
        ...(paginationOptions?.take ? { take: +paginationOptions.take } : {}),
        ...(paginationOptions?.skip ? { skip: +paginationOptions.skip } : {}),
      }),
      this.prisma.referral.count({
        where: {
          referrerId,
          ...(referralType.layer ? { layer: referralType.layer } : {}),
        },
      }),
    ]);

    return { users: referrals.map((referral) => referral.user), count };
  }

  async generateNewCode() {
    const codeLength = +(
        this.configService.get<string>('referral.codeLength') ?? 8
      ),
      containsAlpha = this.configService.get<boolean>('referral.containsAlpha');

    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const characters = (containsAlpha ? alpha : '') + '01234567890123456789';

    let code: string;
    do {
      code = containsAlpha ? alpha[(Math.random() * alpha.length) | 0] : '';
      for (let i = code.length; i < codeLength; i++) {
        code += characters[(Math.random() * characters.length) | 0];
      }
    } while (await this.findUserByReferralCode(code, false));
    return code;
  }

  async getUserReferralsReport(
    userId: number,
    paginationOptions?: PaginationOptionsDto,
  ) {
    const referrer = await this.findReferrer(userId);

    const directReferralReports = await this.findReferees(
        userId,
        { direct: true },
        paginationOptions,
      ),
      indirectReferralReports = await this.findReferees(
        userId,
        { direct: false },
        paginationOptions,
      );

    return {
      referrer,
      directs: directReferralReports.users,
      totalDirects: directReferralReports.count,
      indirects: indirectReferralReports.users,
      totalIndirects: indirectReferralReports.count,
    };
  }

  async linkUserToReferrers(
    user: UserPopulated,
    referrerCode: string,
    shouldThrow: boolean = true,
  ) {
    referrerCode = referrerCode.toUpperCase();

    const referrerProfile = await this.findUserByReferralCode(referrerCode);

    if (!referrerProfile || referrerCode === user.profile.referralCode) {
      if (shouldThrow) {
        throw new BadRequestException('Invalid referral code!');
      }
      return null;
    }

    try {
      const referrerRelations = await this.findRefereesHierarchy(
        referrerProfile.userId,
      );
      return this.prisma.referral.createMany({
        data: [
          { referrerId: referrerProfile.userId, userId: user.id, layer: 0 },
          ...referrerRelations.map((parentRef) => ({
            referrerId: parentRef.referrerId,
            userId: user.id,
            layer: parentRef.layer + 1,
          })),
        ],
      });
    } catch (ex) {
      this.logger.error('Linking user to referrers interrupted!', ex as Error, {
        data: {
          userId: user.id,
          ...(referrerProfile
            ? {
                referrer: {
                  name: referrerProfile.user.name,
                  id: referrerProfile.userId,
                  code: referrerProfile.referralCode,
                },
              }
            : {}),
        },
      });
      if (shouldThrow) {
        throw new ServiceUnavailableException(
          'It seems that our referral service is not available.',
        );
      }
    }
    return null;
  }
}
