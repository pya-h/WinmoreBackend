import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  onModuleInit() {
    this.$connect()
      .then(() => console.log('Connected to database successfully.'))
      .catch((err) =>
        console.error('Database connection fucked up, since: ', err),
      );
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
