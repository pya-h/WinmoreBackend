import { DreamMineGame, User } from '@prisma/client';
import { UserPopulated } from '../../user/types/user-populated.type';

export type DreamMineGameWithExtraData = DreamMineGame & {
  user: { name: string; id: number };
  time?: number;
  multiplier?: number;
};

export type DreamMineGamePopulated = DreamMineGame & { user: User };

export type DreamMineGamePopulatedNested = DreamMineGame & {
  user: UserPopulated;
};
