// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient, TokensEnum } = require('@prisma/client');

const BUSINESSMAN_ID = 0; // must be matched with /src/configs/constants.ts, field: BUSINESSMAN_ID

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
          acceptedBlockStatus: 'safe',
        },
        {
          id: 137,
          name: 'Polygon Mainnet',
          providerUrl: 'https://polygon-rpc.com',
          blockProcessRange: 50,
          acceptedBlockStatus: 'finalized',
        },
        {
          id: 11155111,
          name: 'Sepolia',
          providerUrl: 'https://rpc.sepolia.org',
          blockProcessRange: 50,
          acceptedBlockStatus: 'safe',
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
          probabilities: [75.0, 65.0, 45.0, 25.0, 9.0, 3.0, 1.0, 0.0],
          difficultyMultipliers: [1.3, 2.6],
        },
        {
          rows: 9,
          multipliers: [
            0.684, 1.2445, 1.8525, 2.641, 3.629, 4.845, 6.327, 7.98, 9.8325,
          ],
          probabilities: [75, 55, 38, 17, 8, 2.5, 0.5, 0, 0],
          difficultyMultipliers: [1.3, 2.6],
        },
        {
          rows: 10,
          multipliers: [
            0.72, 1.31, 1.95, 2.78, 3.82, 5.1, 6.66, 8.4, 10.35, 12.7,
          ],
          probabilities: [75, 50, 33, 15, 7, 1.8, 0.1, 0, 0, 0],
          difficultyMultipliers: [1.3, 2.6],
        },
        {
          rows: 11,
          multipliers: [
            0.792, 1.441, 2.145, 3.058, 4.202, 5.61, 7.326, 9.24, 11.385, 13.97,
            16.368,
          ],
          probabilities: [60, 40, 20, 10, 5, 2, 0, 0, 0, 0, 0],
          difficultyMultipliers: [1.3, 2.6],
        },
        {
          rows: 12,
          multipliers: [
            0.864, 1.572, 2.34, 3.336, 4.584, 6.12, 7.992, 10.08, 12.42, 15.24,
            17.856, 20.52,
          ],
          probabilities: [50, 25, 8, 4, 2, 0, 0, 0, 0, 0, 0, 0],
          difficultyMultipliers: [1.3, 2.6],
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
            companyShare: 5,
          },
        });
      }),
    );
    console.info('Game rules inserted.');
  } catch (ex) {
    console.error('Failed importing game rules', ex);
  }

  // 3 CREATE BUSINESS MAN USER
  try {
    await prisma.user.create({
      data: {
        admin: true,
        id: BUSINESSMAN_ID,
        name: 'Winmore',
        email: 'winmore@mail.com',
        profile: {
          create: {
            avatar: null,
          },
        },
        wallet: {
          create: {
            id: BUSINESSMAN_ID,
            address: '0xbB1A38B2556BFE672c718D7Bf9c8a3c25AFEE311',
          },
        },
      },
    });
    console.info('Business man user & wallet created.');
  } catch (ex) {
    console.error('Failed importing business wallet:', ex);
  }

  // 4 INSERT SPECIAL CONTRACTS
  try {
    await Promise.all(
      [
        {
          title: 'USDT Contract on Ethereum Mainnet',
          token: TokensEnum.USDT,
          address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          chainId: 1,
        },
        {
          title: 'USDT Contract on Polygon',
          token: TokensEnum.USDT,
          address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          chainId: 137,
        },
        {
          title: 'USDT Contract on Sepolia',
          token: TokensEnum.USDT,
          address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
          chainId: 11155111,
        },
        {
          title: 'WUSDC Contract on Sepolia',
          token: TokensEnum.WUSDC,
          address: '0x9dfb350c3253386de5e2fec4dcb959b18f6ee2a1',
          chainId: 11155111,
        },
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
