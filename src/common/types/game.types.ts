import {
  DreamMineRules,
  GameModesEnum,
  GameStatusEnum,
  PlinkoGameStatus,
  PlinkoRules,
  TokensEnum,
} from '@prisma/client';

export type WinmoreGameTypes = {
  // TODO: Check this out for possible conflicts
  id: number;
  name: string;
  initialBet: number;
  token: TokensEnum;
  chainId: number;
  mode: GameModesEnum;
  status: GameStatusEnum | PlinkoGameStatus;
  finishedAt: Date;
  rule: DreamMineRules | PlinkoRules;
};

export enum ExtraGameStatusEnum {
  FINISHED = 'FINISHED',
  GAINED = 'GAINED',
  ALL = 'ALL',
}

export type GeneralGameStatus = GameStatusEnum | ExtraGameStatusEnum;

export type GeneralPlinkoGameStatus = PlinkoGameStatus | ExtraGameStatusEnum;
