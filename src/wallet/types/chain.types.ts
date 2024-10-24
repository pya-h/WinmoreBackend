import { Chain, Contract } from '@prisma/client';

export type ChainMayContractsPopulated = Chain & { contracts?: Contract[] };
