import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [WalletModule, PrismaModule],
  providers: [BlockchainService],
})
export class BlockchainModule {}
