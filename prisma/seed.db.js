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
          providerUrl: 'https://cloudflare-eth.com', // https://rpc.ankr.com/eth
          blockProcessRange: 50,
          acceptedBlockStatus: 'safe',
        },
        {
          id: 137,
          name: 'Polygon Mainnet',
          providerUrl: 'https://polygon-rpc.com',
          blockProcessRange: 50,
          acceptedBlockStatus: 'safe',
        },
        {
          id: 11155111,
          name: 'Sepolia',
          providerUrl: 'https://rpc.sepolia.org',
          blockProcessRange: 50,
          acceptedBlockStatus: 'safe',
        },
      ].map(async ({ id, name, providerUrl }) =>
        prisma.chain.create({ data: { id, name, providerUrl } }),
      ),
    );
    console.info('Chain data inserted.');
  } catch (ex) {
    console.error('Failed importing chain data:', ex);
  }

  // 2 INSERT GAME RULES
  try {
    await prisma.dreamMineRules.create({
      data: {
        rowCoefficients: [2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377],
        rowProbabilities: [
          0.8, 0.7, 0.6, 0.3, 0.1, 0.09, 0.05, 0.01, 0.009, 0.005, 0.001,
          0.0001,
        ],
        difficultyCoefficients: [5, 10],
        minRows: 8,
        maxRows: 12,
        minBetAmount: 1,
      },
    });
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
            address: '0xa3fdCBaCd38F97598a71637aEB441adCD6e2C817',
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
