import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { DreamMineModule } from 'src/dream-mine/dream-mine.module';

@Module({
  imports: [DreamMineModule],
  controllers: [GamesController],
})
export class GamesModule {}
