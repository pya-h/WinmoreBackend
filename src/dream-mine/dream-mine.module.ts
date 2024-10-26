import { Module } from '@nestjs/common';
import { DreamMineService } from './dream-mine.service';
import { DreamMineController } from './dream-mine.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  providers: [DreamMineService],
  controllers: [DreamMineController],
  exports: [DreamMineService],
})
export class DreamMineModule {}
