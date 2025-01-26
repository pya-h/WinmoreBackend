// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient, TokensEnum } = require('@prisma/client');
import { config } from 'dotenv';

config();

const BUSINESSMAN_ID = 0,
  SHARE_MANAGER_ID = 1; // must be matched with /src/configs/constants.ts, field: BUSINESSMAN_ID

const prisma = new PrismaClient();

async function main() {
  // 1 INSERT CHAIN DATA
  try {
    await Promise.all(
      [
        {
          id: 1,
          name: 'Ethereum Mainnet',
          providerUrl: 'https://rpc.ankr.com/eth', //https://cloudflare-eth.com
          blockProcessRange: 50,
          acceptedBlockStatus: 'latest',
        },
        {
          id: 10,
          name: 'Optimism Mainnet',
          providerUrl: 'https://mainnet.optimism.io',
          blockProcessRange: 50,
          acceptedBlockStatus: 'latest',
        },
        {
          id: 137,
          name: 'Polygon Mainnet',
          providerUrl: 'https://polygon-rpc.com',
          blockProcessRange: 50,
          acceptedBlockStatus: 'latest',
        },
        {
          id: 8453,
          name: 'Base Mainnet',
          // providerUrl: 'https://rpc.ankr.com/base',
          providerUrl: 'https://mainnet.base.org',
          blockProcessRange: 50,
          acceptedBlockStatus: 'latest',
        },
        {
          id: 42161,
          name: 'Arbitrum One',
          providerUrl: 'https://arb1.arbitrum.io/rpc',
          blockProcessRange: 50,
          acceptedBlockStatus: 'latest',
        },
        {
          id: 11155111,
          name: 'Sepolia',
          providerUrl: 'https://rpc.sepolia.org',
          // providerUrl: 'https://rpc.ankr.com/eth_sepolia',
          blockProcessRange: 50,
          acceptedBlockStatus: 'latest',
        },
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

  // 3 CREATE BUSINESS MAN USER
  if (!env.process.WMA_ADDRESS?.length)
    throw new Error('Admin wallet address not specified!');
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
          },
        },
        wallet: {
          create: {
            id: BUSINESSMAN_ID,
            address: env.process.WMA_ADDRESS,
          },
        },
      },
    });
    console.info('Business man user & wallet created.');

    if (!env.process.SHAREMAN_ADDRESS?.length)
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
          },
        },
        wallet: {
          create: {
            id: SHARE_MANAGER_ID,
            address: env.process.SHAREMAN_ADDRESS,
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
