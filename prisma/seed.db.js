// eslint-disable-next-line @typescript-eslint/no-var-requires
// const { PrismaClient, TokensEnum } = require('@prisma/client');
// const { generateRandomString } = require('../utils/strings');
// const { config } = require('dotenv');

import { PrismaClient, TokensEnum } from '@prisma/client';
import { generateRandomString } from '../utils/strings.js';
import { config } from 'dotenv';

config();

const BUSINESSMAN_ID = 0,
  SHARE_MANAGER_ID = -1; // must be matched with /src/configs/constants.ts, field: BUSINESSMAN_ID

const prisma = new PrismaClient();

async function main() {
  // 1 INSERT CHAIN DATA
  try {
    await Promise.all(
      [
        {
          id: 1,
          name: 'Ethereum Mainnet',
          providerUrl:
            'https://ultra-black-tab.quiknode.pro/82ccb7a304990b72b78bbce8890c9ae0a033c67b', //'https://rpc.ankr.com/eth', //https://cloudflare-eth.com
          blockProcessRange: 5,
          maxBlockProcessRange: 90,
          acceptedBlockStatus: 'latest',
        },
        {
          id: 137,
          name: 'Polygon Mainnet',
          providerUrl:
            'https://ultra-black-tab.matic.quiknode.pro/82ccb7a304990b72b78bbce8890c9ae0a033c67b', //'https://polygon-rpc.com',
          blockProcessRange: 5,
          maxBlockProcessRange: 90,
          acceptedBlockStatus: 'latest',
        },
        {
          id: 8453,
          name: 'Base Mainnet',
          // providerUrl: 'https://rpc.ankr.com/base',
          providerUrl:
            'https://ultra-black-tab.base-mainnet.quiknode.pro/82ccb7a304990b72b78bbce8890c9ae0a033c67b', //'https://mainnet.base.org',
          blockProcessRange: 5,
          maxBlockProcessRange: 5,
          acceptedBlockStatus: 'latest',
        },
        {
          id: 11155111,
          name: 'Sepolia Testnet',
          providerUrl:
            'https://ultra-black-tab.ethereum-sepolia.quiknode.pro/82ccb7a304990b72b78bbce8890c9ae0a033c67b', //'https://rpc2.sepolia.org',
          // providerUrl: 'https://rpc.ankr.com/eth_sepolia',
          blockProcessRange: 5,
          maxBlockProcessRange: 5,
          acceptedBlockStatus: 'latest',
        },
        {
          id: 10143,
          name: 'Monad Testnet',
          providerUrl:
            'https://ultra-black-tab.monad-testnet.quiknode.pro/82ccb7a304990b72b78bbce8890c9ae0a033c67b', // 'https://testnet-rpc.monad.xyz',
          blockProcessRange: 5,
          maxBlockProcessRange: 5,
          acceptedBlockStatus: 'latest',
        },
        // MAYBE LATER CHAINS:
        // {
        //   id: 10,
        //   name: 'Optimism Mainnet',
        //   providerUrl: 'https://mainnet.optimism.io',
        //   blockProcessRange: 50,
        //   acceptedBlockStatus: 'latest',
        // },
        // {
        //   id: 42161,
        //   name: 'Arbitrum One',
        //   providerUrl: 'https://arb1.arbitrum.io/rpc',
        //   blockProcessRange: 50,
        //   acceptedBlockStatus: 'latest',
        // },
        // {
        //   id: 143,
        //   name: 'Monad Mainnet',
        //   providerUrl: 'https://rpc.monad.xyz',
        //   blockProcessRange: 5,
        //    maxBlockProcessRange: 100,
        //   acceptedBlockStatus: 'latest',
        // },
        // {
        //   id: 20143,
        //   name: 'Monad Devnet',
        //   providerUrl: 'https://devnet-rpc.monad.xyz',
        //   blockProcessRange: 5,
        //   maxBlockProcessRange: 100,
        //   acceptedBlockStatus: 'latest',
        // },
      ].map(
        async ({
          id,
          name,
          providerUrl,
          blockProcessRange,
          acceptedBlockStatus,
        }) =>
          prisma.chain.create({
            data: {
              id,
              name,
              providerUrl,
              blockProcessRange,
              acceptedBlockStatus,
            },
          }),
      ),
    );
    console.info('Chain data inserted.');
  } catch (ex) {
    console.error('Failed importing chain data:', ex);
  }

  // 2 INSERT GAME RULES
  // 2-1: Dream Mine:
  try {
    await Promise.all(
      [
        {
          rows: 8,
          multipliers: [
            0.612, 1.1135, 1.6575, 2.363, 3.247, 4.335, 5.661, 7.14,
          ],
          probabilities: [75.0, 65.0, 45.0, 25.0, 9.0, 3.0, 1.0, 0.1],
          difficultyMultipliers: [3, 8],
        },
        {
          rows: 9,
          multipliers: [
            0.684, 1.2445, 1.8525, 2.641, 3.629, 4.845, 6.327, 7.98, 9.8325,
          ],
          probabilities: [75, 55, 38, 17, 8, 2.5, 0.5, 0.1, 0.1],
          difficultyMultipliers: [3, 7],
        },
        {
          rows: 10,
          multipliers: [
            0.72, 1.31, 1.95, 2.78, 3.82, 5.1, 6.66, 8.4, 10.35, 12.7,
          ],
          probabilities: [75, 50, 33, 15, 7, 1.8, 0.1, 0.1, 0.1, 0.1],
          difficultyMultipliers: [3, 7],
        },
        {
          rows: 11,
          multipliers: [
            0.792, 1.441, 2.145, 3.058, 4.202, 5.61, 7.326, 9.24, 11.385, 13.97,
            16.368,
          ],
          probabilities: [60, 40, 20, 10, 5, 2, 0.1, 0.1, 0.1, 0.1, 0.1],
          difficultyMultipliers: [3, 7],
        },
        {
          rows: 12,
          multipliers: [
            0.864, 1.572, 2.34, 3.336, 4.584, 6.12, 7.992, 10.08, 12.42, 15.24,
            17.856, 20.52,
          ],
          probabilities: [50, 25, 8, 4, 2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
          difficultyMultipliers: [2, 6],
        },
      ].map(({ rows, multipliers, probabilities, difficultyMultipliers }) => {
        if (rows !== multipliers?.length || rows !== probabilities?.length) {
          console.warn(
            `Rules for ${rows} rows game failed insertion: rows value differs from provided values counts.`,
          );
          return null;
        }
        if (difficultyMultipliers.length !== 2) {
          console.warn(
            `Rules for ${rows} rows game failed insertion: difficultyMultipliers must have 2 items indicating medium and hard difficulties.`,
          );
          return null;
        }
        return prisma.dreamMineRules.create({
          data: {
            rows,
            multipliers,
            probabilities,
            difficultyMultipliers,
            minBetAmount: 1,
            companyShare: 0.04,
            maxBetAmount: 2,
          },
        });
      }),
    );
    console.info('Game rules inserted.');
  } catch (ex) {
    console.error('Failed importing game rules', ex);
  }

  // 2-2 Plinko:
  try {
    await Promise.all(
      [
        {
          rows: 8,
          multipliers: [2.5, 1.2, 0.7, 0.5, 0.7, 1.2, 2.5],
          probabilities: [5, 10, 40, 100, 40, 10, 5],
          difficultyMultipliers: [2, 4],
        },
        {
          rows: 9,
          multipliers: [1.7, 1.2, 0.9, 0.6, 0.6, 0.9, 1.2, 1.7],
          probabilities: [4, 10, 70, 100, 100, 70, 10, 4],
          difficultyMultipliers: [2, 5],
        },
        {
          rows: 10,
          multipliers: [2.8, 1.7, 1.6, 1.3, 1.0, 1.3, 1.6, 1.7, 2.8],
          probabilities: [4, 15, 45, 75, 100, 75, 45, 15, 4],
          difficultyMultipliers: [2.5, 5],
        },
        {
          rows: 11,
          multipliers: [3, 1.9, 1.75, 1.4, 1.0, 1.75, 1.6, 1.9, 3],
          probabilities: [3, 10, 40, 65, 100, 65, 40, 10, 3],
          difficultyMultipliers: [2.5, 6],
        },
        {
          rows: 12,
          multipliers: [3.5, 2.25, 1.85, 1.45, 1.0, 1.0, 1.45, 1.85, 2.25, 3.5],
          probabilities: [3, 9, 30, 65, 100, 100, 65, 30, 9, 3],
          difficultyMultipliers: [3, 6],
        },
      ].map(({ rows, multipliers, probabilities, difficultyMultipliers }) => {
        if (multipliers?.length !== probabilities?.length) {
          console.warn(
            `Rules for Rows:${rows} have different probability and multipliers length.`,
          );
          return null;
        }
        if (difficultyMultipliers.length !== 2) {
          console.warn(
            `Rules for ${rows} rows game failed insertion: difficultyMultipliers must have 2 items indicating medium and hard difficulties.`,
          );
          return null;
        }
        return prisma.plinkoRules.create({
          data: {
            rows,
            multipliers,
            probabilities,
            difficultyMultipliers,
            minBetAmount: 1,
            companyShare: 0.04,
            maxBetAmount: 2,
            verticalSpeedFactor: 2.5,
            horizontalSpeedFactor: 1.25,
            gravity: 0.1,
            friction: 0.9,
          },
        });
      }),
    );
    console.info('Plinko Game rules inserted.');
  } catch (ex) {
    console.error('Failed importing game rules', ex);
  }

  // 3 CREATE BUSINESS MAN USER
  if (!process.env.WMA_ADDRESS?.length)
    throw new Error('Admin wallet address not specified!');
  const adminReferralCode = generateRandomString(
    +(process.env.REFERRAL_CODE_LENGTH ?? 8),
    process.env.REFERRAL_CONTAINS_ALPHA?.toLowerCase() === 'true',
  );
  try {
    await prisma.user.create({
      data: {
        admin: true,
        id: BUSINESSMAN_ID,
        name: 'WinmoreAdmin',
        email: 'winmore@mail.com',
        profile: {
          create: {
            avatar: null,
            referralCode: adminReferralCode,
          },
        },
        wallet: {
          create: {
            id: BUSINESSMAN_ID,
            address: process.env.WMA_ADDRESS,
          },
        },
      },
    });
    console.info('Business man user & wallet created.');

    if (!process.env.SHAREMAN_ADDRESS?.length)
      throw new Error('ShareManager wallet address not specified!');

    await prisma.user.create({
      data: {
        admin: false,
        id: SHARE_MANAGER_ID,
        name: 'WinmoreShareMan',
        email: 'winmore-shareman@mail.com',
        profile: {
          create: {
            avatar: null,
            referralCode: generateRandomString(
              +(process.env.REFERRAL_CODE_LENGTH ?? 8),
              process.env.REFERRAL_CONTAINS_ALPHA?.toLowerCase() === 'true',
              [adminReferralCode],
            ),
          },
        },
        wallet: {
          create: {
            id: SHARE_MANAGER_ID,
            address: process.env.SHAREMAN_ADDRESS,
          },
        },
      },
    });
    console.info('Share manager user & wallet created.');
  } catch (ex) {
    console.error('Failed creating & importing business users & wallets:', ex);
  }

  // 4 INSERT SPECIAL CONTRACTS
  try {
    await Promise.all(
      [
        // ETHEREUM
        {
          title: 'Tether USD',
          token: TokensEnum.USDT,
          address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          chainId: 1,
        },
        {
          title: 'USD Coin',
          token: TokensEnum.USDC,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          chainId: 1,
        },
        // POLYGON:
        {
          title: 'Tether USD',
          token: TokensEnum.USDT,
          address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
          chainId: 137,
        },
        {
          title: 'USD Coin',
          token: TokensEnum.USDC,
          address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          chainId: 137,
        },
        // BASE:
        {
          title: 'USD Tether',
          token: TokensEnum.USDT,
          address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
          chainId: 8453,
        },
        {
          title: 'USD Coin',
          token: TokensEnum.USDC,
          address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          chainId: 8453,
        },
        // SEPOLIA:
        {
          title: 'USD Tether',
          token: TokensEnum.USDT,
          address: '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0',
          chainId: 11155111,
        },
        {
          title: 'USD Coin',
          token: TokensEnum.USDC,
          address: '0xf08a50178dfcde18524640ea6618a1f965821715',
          chainId: 11155111,
        },
        {
          title: 'WUSDC Contract on Sepolia',
          token: TokensEnum.WUSDC,
          address: '0x9dfb350c3253386de5e2fec4dcb959b18f6ee2a1',
          chainId: 11155111,
        },
        // MONAD TESTNET:
        {
          title: 'USD Tether',
          token: TokensEnum.USDT,
          address: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
          chainId: 10143,
        },
        {
          title: 'USD Coin',
          token: TokensEnum.USDC,
          address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
          chainId: 10143,
        },
        // MAYBE LATER CHAINS:
        // OPTIMISM
        // {
        //   title: 'Tether USD',
        //   token: TokensEnum.USDT,
        //   address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
        //   chainId: 10,
        // },
        // {
        //   title: 'USD Coin',
        //   token: TokensEnum.USDC,
        //   address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
        //   chainId: 10,
        // },
        // // ARBITRUM:
        // {
        //   title: 'USD Tether',
        //   token: TokensEnum.USDT,
        //   address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        //   chainId: 42161,
        // },
        // {
        //   title: 'USD Coin',
        //   token: TokensEnum.USDC,
        //   address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        //   chainId: 42161,
        // },
      ].map(async ({ title, token, address, chainId }) =>
        prisma.contract.create({
          data: { title, token, address, chainId },
        }),
      ),
    );
    console.info('Supported tokens contracts data inserted.');
  } catch (ex) {
    console.error('Failed importing contracts:', ex);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
