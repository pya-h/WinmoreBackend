import { Module } from '@nestjs/common';
import { PlinkoController } from './plinko.controller';
import { PlinkoService } from './plinko.service';
import { PlinkoPhysxService } from './physx.service';

@Module({
  controllers: [PlinkoController],
  providers: [PlinkoService, PlinkoPhysxService],
  exports: [PlinkoService],
})
export class PlinkoModule {}
