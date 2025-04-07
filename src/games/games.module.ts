import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { DreamMineModule } from '../dream-mine/dream-mine.module';
import { PlinkoModule } from '../plinko/plinko.module';

@Module({
  imports: [DreamMineModule, PlinkoModule],
  controllers: [GamesController],
})
export class GamesModule {}
