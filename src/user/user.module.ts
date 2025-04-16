import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ReferralModule } from 'src/referral/referral.module';

@Module({
  imports: [WalletModule, PrismaModule, BlockchainModule, ReferralModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
