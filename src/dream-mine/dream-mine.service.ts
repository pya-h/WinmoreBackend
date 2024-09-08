import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { DreamMineGamePreferences } from './dtos/game-preferences.dto';
import { DM_MIN_ROWS } from 'src/configs/constants';

@Injectable()
export class DreamMineService {
  constructor(private readonly prisma: PrismaService) {}

  async newGame(
    user: User,
    { betAmount, mode, rows }: DreamMineGamePreferences,
  ) {
    const game = await this.prisma.dreamMineGame.create({
      data: {
        userId: user.id,
        initialBet: betAmount,
        mode,
        rowsCount: rows || DM_MIN_ROWS,
      },
    });
  }
}
