import { Injectable } from '@nestjs/common';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class UserService {
  constructor(private readonly walletService: WalletService) {}

  getUserBalance(token: string) {
    return this.walletService.getBalance(token);
  }

  getSingleUser(userId: number) {
    return null;
  }

  async getByWalletAddress(walletAddress: string) {
    // TODO: Implement the user table and entity
    // TODO: Then return the user if the user with this wallet address exists o.w. return null;
    return null;
  }

  async createUser(walletAddress: string) {
    // TODO: Implement the user table and entity
    // TODO: Then return the user if the user with this wallet address exists o.w. return null;
    return null;
  }
}
