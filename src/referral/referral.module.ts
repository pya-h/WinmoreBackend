import { Module } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
