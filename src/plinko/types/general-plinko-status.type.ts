import { PlinkoGameStatus } from '@prisma/client';
import { ExtraGameStatusEnum } from '../../games/types/game.types';

export type GeneralPlinkoGameStatus = PlinkoGameStatus | ExtraGameStatusEnum;
