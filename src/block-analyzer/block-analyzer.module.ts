import { Module } from '@nestjs/common';
import { BlockAnalyzerService } from './block-analyzer.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  providers: [BlockAnalyzerService],
})
export class BlockAnalyzerModule {}
