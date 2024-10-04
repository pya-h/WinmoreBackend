import { Module } from '@nestjs/common';
import { BlockAnalyzerService } from './block-analyzer.service';
import { UserService } from '../user/user.service';

@Module({
  providers: [BlockAnalyzerService, UserService],
})
export class BlockAnalyzerModule {}
