import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { DreamMineModule } from './dream-mine/dream-mine.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import appGeneralConfigs from './configs/general';
import authConfigs from './configs/auth';
import credentialsConfigs from './configs/credentials';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appGeneralConfigs, authConfigs, credentialsConfigs],
    }),
    UserModule,
    AuthModule,
    WalletModule,
    PrismaModule,
    DreamMineModule,
    BlockchainModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
