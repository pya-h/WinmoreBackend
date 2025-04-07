import {
  DreamMineRules,
  GameModesEnum,
  GameStatusEnum,
  PlinkoGameStatus,
  PlinkoRules,
  TokensEnum,
} from '@prisma/client';
import { WinmoreGamesEnum } from 'src/games/enums/games.enum';

export type WinmoreGameTypes = {
  // TODO: Check this out for possible conflicts
  id: number;
  name: WinmoreGamesEnum | string;
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

export function generalStatusToPlinkoStatus(status: GeneralGameStatus) {
  switch (status) {
    case GameStatusEnum.NOT_STARTED:
      return PlinkoGameStatus.NOT_DROPPED_YET;
    case GameStatusEnum.ONGOING:
      return PlinkoGameStatus.DROPPING;
    case GameStatusEnum.LOST:
    case GameStatusEnum.FLAWLESS_WIN:
    case GameStatusEnum.WON:
      return PlinkoGameStatus.FINISHED;
  }
  return status as GeneralPlinkoGameStatus;
}
