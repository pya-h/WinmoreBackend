import { Module } from '@nestjs/common';
import { PlinkoController } from './plinko.controller';
import { PlinkoService } from './plinko.service';
import { PlinkoPhysxService } from './physx.service';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [PlinkoController],
  providers: [PlinkoService, PlinkoPhysxService],
  exports: [PlinkoService],
})
export class PlinkoModule {}
