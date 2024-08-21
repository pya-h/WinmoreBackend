import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  onModuleInit() {
    this.$connect()
      .then(() => console.log('Connected to database successfully.'))
      .catch((err) =>
        console.error('Database connection fucked up, since: ', err),
      );
  }
}
