import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BlockAnalyzerService {
  private readonly logger = new Logger(BlockAnalyzerService.name);

  constructor(private readonly prisma: PrismaService) {}
}
