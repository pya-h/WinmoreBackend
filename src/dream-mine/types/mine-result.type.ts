import { DreamMineGame } from '@prisma/client';

export type DreamMineGameResultType = DreamMineGame & { success: boolean };
