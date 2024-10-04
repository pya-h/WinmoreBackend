import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { DreamMineModule } from './dream-mine/dream-mine.module';
import { BlockAnalyzerModule } from './block-analyzer/block-analyzer.module';

import appGeneralConfigs from './configs/general';
import authConfigs from './configs/auth';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [appGeneralConfigs, authConfigs] }),
    UserModule,
    AuthModule,
    WalletModule,
    PrismaModule,
    DreamMineModule,
    BlockAnalyzerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
