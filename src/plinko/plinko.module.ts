import { Module } from '@nestjs/common';
import { PlinkoController } from './plinko.controller';
import { PlinkoService } from './plinko.service';

@Module({
  controllers: [PlinkoController],
  providers: [PlinkoService],
  exports: [PlinkoService],
})
export class PlinkoModule {}
