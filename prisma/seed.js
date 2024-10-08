// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client');
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
    ].map(async ({ id, name, providerUrl }) =>
      prisma.chain.create({ data: { id, name, providerUrl } }),
    ),
  );
  console.info('Chain data inserted.');

  // 2 INSERT GAME RULES
  await prisma.dreamMineRules.create({
    data: {
      rowCoefficients: [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233],
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
