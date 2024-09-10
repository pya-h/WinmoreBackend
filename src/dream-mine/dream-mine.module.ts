import { Module } from '@nestjs/common';
import { DreamMineService } from './dream-mine.service';
import { DreamMineController } from './dream-mine.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from 'src/user/user.module';

@Module({
  providers: [DreamMineService, PrismaModule, UserModule],
  controllers: [DreamMineController],
})
export class DreamMineModule {}
