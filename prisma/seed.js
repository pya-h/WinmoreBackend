// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient, TokensEnum } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1 INSERT CHAIN DATA
  await Promise.all(
    [
      {
        id: 1,
        name: 'Ethereum Mainnet',
        providerUrl: 'https://cloudflare-eth.com',
      },
      {
        id: 137,
        name: 'Polygon Mainnet',
        providerUrl: 'https://polygon-rpc.com',
      },
      {
        id: 11155111,
        name: 'Sepolia',
        providerUrl: 'https://rpc2.sepolia.org',
      },
    ].map(async ({ id, name, providerUrl }) =>
      prisma.chain.create({ data: { id, name, providerUrl } }),
    ),
  );
  console.info('Chain data inserted.');

  // 2 INSERT GAME RULES
  await prisma.dreamMineRules.create({
    data: {
      rowCoefficients: [2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377],
      rowProbabilities: [
        0.8, 0.7, 0.6, 0.3, 0.1, 0.09, 0.05, 0.01, 0.009, 0.005, 0.001, 0.0001,
      ],
      difficultyCoefficients: [5, 10],
      minRows: 8,
      maxRows: 12,
      minBetAmount: 1,
    },
  });
  console.info('Game rules inserted.');

  // 3 CREATE BUSINESS MAN USER
  await prisma.user.create({
    data: {
      admin: true,
      id: 0,
      name: 'Winmore',
      email: 'winmore@mail.com',
      profile: {
        create: {
          avatar: null,
        },
      },
      wallet: {
        create: {
          id: 0,
          address: '0x32Be343B94f860124dC4fEe278FDCBD38C102D88',
        },
      },
    },
  });
  console.info('Business man user & wallet created.');

  // 4 INSERT SPECIAL CONTRACTS
  await Promise.all(
    [
      {
        title: 'USDT Contract address',
        identifier: TokensEnum.USDT,
        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      },
    ].map(async ({ title, identifier, address }) =>
      prisma.contract.create({
        data: { title, identifier, address },
      }),
    ),
  );
  console.info('Supported tokens contracts data inserted.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
