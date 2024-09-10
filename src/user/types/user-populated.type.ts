import { User, UserProfile, Wallet } from '@prisma/client';

export type UserPopulated = User & { wallet: Wallet; profile: UserProfile };

export const userPopulatedIncludeConfig = () => ({
  wallet: true,
  profile: true,
});
