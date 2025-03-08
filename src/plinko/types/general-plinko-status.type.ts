import { PlinkoGameStatus } from '@prisma/client';
import { ExtraGameStatusEnum } from '../../common/types/game.types';

export type GeneralPlinkoGameStatus = PlinkoGameStatus | ExtraGameStatusEnum;
