import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
