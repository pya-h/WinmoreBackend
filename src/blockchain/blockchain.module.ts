import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  providers: [BlockchainService],
})
export class BlockchainModule {}
