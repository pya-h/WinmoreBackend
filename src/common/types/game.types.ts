import { GameModesEnum, GameStatusEnum, TokensEnum } from '@prisma/client';

export type WinmoreGameTypes = {
  id: number;
  name: string;
  initialBet: number;
  token: TokensEnum;
  chainId: number;
  mode: GameModesEnum;
  status: GameStatusEnum;
  startedAt: Date;
  finishedAt: Date;
};

export enum ExtraGameStatusEnum {
  FINISHED = 'FINISHED',
  GAINED = 'GAINED',
  ALL = 'ALL',
}

export type GeneralGameStatus = GameStatusEnum | ExtraGameStatusEnum;
