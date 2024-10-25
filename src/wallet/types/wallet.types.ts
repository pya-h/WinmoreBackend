import { Transaction, User, UserProfile, Wallet } from '@prisma/client';

export type WalletPopulated = Wallet & { owner: User };

export type WalletPopulatedWithUserProfile = Wallet & {
  owner: User & { profile: UserProfile };
};

export type WalletPopulatedWithDeposits = Wallet & {
  owner: User;
  depositTransactions: Transaction[];
};

export type WalletPopulatedWithDepositsNested = Wallet & {
  owner: User;
  depositTransactions: (Transaction & { source: Wallet })[];
};

export type WalletPopulatedWithWithdraws = Wallet & {
  owner: User;
  withdrawTransactions: Transaction[];
};

export type WalletPopulatedWithWithdrawsNested = Wallet & {
  owner: User;
  withdrawTransactions: (Transaction & { destination: Wallet })[];
};

export type WalletPopulatedWithTransactions = Wallet & {
  owner: User;
  depositTransactions: Transaction[];
  withdrawTransactions: Transaction[];
};

export type WalletPopulatedWithTransactionsNested = Wallet & {
  owner: User;
  depositTransactions: (Transaction & { source: Wallet })[];
  withdrawTransactions: (Transaction & { destination: Wallet })[];
};

export type WalletPopulatedNested = Wallet & {
  owner: User & { profile: UserProfile };
  depositTransactions: (Transaction & { source: Wallet })[];
  withdrawTransactions: (Transaction & { destination: Wallet })[];
};

export type WalletIdentifierType = {
  id?: number;
  address?: string;
  ownerId?: number;
};

export type BusinessWalletType = WalletPopulated & { private?: string };
