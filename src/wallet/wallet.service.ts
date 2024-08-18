import { Injectable } from '@nestjs/common';

@Injectable()
export class WalletService {
  constructor() {}

  async getBalance(token: string) {
    // FIXME: token must be enum
    return 0;
  }
}
