import { Injectable, Logger } from '@nestjs/common';
import Web3 from 'web3';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EthereumChainsEnum } from '../wallet/types/chains.enum';
import { UserService } from '../user/user.service';

@Injectable()
export class BlockAnalyzerService {
  private readonly logger = new Logger(BlockAnalyzerService.name);

  private web3Providers: Map<EthereumChainsEnum, Web3>; // Stores Web3 instances for each network
  private chains = [
    EthereumChainsEnum.ETHEREUM_MAINNET,
    EthereumChainsEnum.POLYGON_MAINNET,
  ]; // our supported chains, till now

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {
    // Initialize Web3 for each chain
    this.initializeWeb3();

    // Start listening for incoming transactions on each chain
    this.chains.forEach((chain) => {
      this.listenForIncomingTransactions(chain);
    });
  }

  // Initialize Web3 instances for different chains
  private initializeWeb3() {
    const ethereumProvider = this.configService.get<string>(
      'ETHEREUM_PROVIDER_URL',
    );
    const bscProvider = this.configService.get<string>('BSC_PROVIDER_URL');
    const polygonProvider = this.configService.get<string>(
      'POLYGON_PROVIDER_URL',
    );

    // FIXME: This must change to use chains in the database (The database has not been migrated and generated yet.)
    this.web3Providers.set(
      EthereumChainsEnum.ETHEREUM_MAINNET,
      new Web3(new Web3.providers.HttpProvider(ethereumProvider)),
    );
    this.web3Providers.set(
      EthereumChainsEnum.BINANCE_SMART_CHAIN_MAINNET,
      new Web3(new Web3.providers.HttpProvider(bscProvider)),
    );
    this.web3Providers.set(
      EthereumChainsEnum.POLYGON_MAINNET,
      new Web3(new Web3.providers.HttpProvider(polygonProvider)),
    );
  }

  // Listen for incoming transactions on the specified chain
  async listenForIncomingTransactions(chain: EthereumChainsEnum) {
    const web3 = this.web3Providers.get(chain);
    const serverWalletAddress = this.configService.get<string>(
      'SERVER_WALLET_ADDRESS',
    );

    this.logger.log(`Starting wallet listener for ${chain} network...`);

    const subscription = web3.eth.subscribe(
      'pendingTransactions',
      (err, res) => {
        if (err) {
          this.logger.error(`Error subscribing to ${chain} transactions:`, err);
        }
      },
    );

    subscription.on('data', async (txHash) => {
      try {
        const tx = await web3.eth.getTransaction(txHash);
        if (
          tx &&
          tx.to &&
          tx.to.toLowerCase() === serverWalletAddress.toLowerCase()
        ) {
          this.logger.log(
            `Incoming transaction detected on ${chain} from ${tx.from}`,
          );
          // Find the user by wallet address and charge the user
          await this.chargeUser(
            tx.from,
            web3.utils.fromWei(tx.value, 'ether'),
            chain,
          );
        }
      } catch (error) {
        this.logger.error(`Error processing transaction on ${chain}:`, error);
      }
    });
  }

  // Charge the user based on their wallet address and update the balance in your system
  async chargeUser(fromAddress: string, amount: string, chain: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress: fromAddress.toLowerCase(),
      },
    });

    if (!user) {
      this.logger.warn(
        `A deposit happened by a wallet address not registered in server: ${fromAddress} on ${chain}`,
      );
      return;
    }
    const newBalance = parseFloat(user.balance.toString()) + parseFloat(amount);

    // Update user's balance in the database
    await this.prisma.user.update({
      where: {
        walletAddress: fromAddress.toLowerCase(),
      },
      data: {
        balance: newBalance,
      },
    });

    this.logger.log(
      `User ${user.id} charged ${amount} ETH from ${chain}. New balance: ${newBalance}`,
    );
  }
}
