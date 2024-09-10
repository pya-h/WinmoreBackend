import { GameModesEnum, GameStatusEnum, TokensEnum } from '@prisma/client';

export type WinmoreGameTypes = {
  id: number;
  name: string;
  initialBet: number;
  betToken: TokensEnum;
  mode: GameModesEnum;
  status: GameStatusEnum;
  startedAt: Date;
  finishedAt: Date;
};
