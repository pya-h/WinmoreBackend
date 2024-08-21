import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { WalletModule } from 'src/wallet/wallet.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [WalletModule, PrismaModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
