import { DataFormat, DEFAULT_RETURN_FORMAT } from 'web3-types';

export type Web3BlockType<
  ReturnFormat extends DataFormat = typeof DEFAULT_RETURN_FORMAT,
> = {
  transactions: {
    readonly blockHash?:
      | import('web3-types').ByteTypes[ReturnFormat['bytes']]
      | undefined;
    readonly blockNumber?:
      | import('web3-types').NumberTypes[ReturnFormat['number']]
      | undefined;
    readonly from: string;
    readonly hash: import('web3-types').ByteTypes[ReturnFormat['bytes']];
    readonly transactionIndex?:
      | import('web3-types').NumberTypes[ReturnFormat['number']]
      | undefined;
    to?: string | null | undefined;
    value?:
      | import('web3-types').NumberTypes[ReturnFormat['number']]
      | undefined;
    accessList?:
      | {
          readonly address?: string | undefined;
          readonly storageKeys?: string[] | undefined;
        }[]
      | undefined;
    common?:
      | {
          customChain: {
            name?: string | undefined;
            networkId: import('web3-types').NumberTypes[ReturnFormat['number']];
            chainId: import('web3-types').NumberTypes[ReturnFormat['number']];
          };
          baseChain?: import('web3-types').ValidChains | undefined;
          hardfork?:
            | 'chainstart'
            | 'frontier'
            | 'homestead'
            | 'dao'
            | 'tangerineWhistle'
            | 'spuriousDragon'
            | 'byzantium'
            | 'constantinople'
            | 'petersburg'
            | 'istanbul'
            | 'muirGlacier'
            | 'berlin'
            | 'london'
            | 'altair'
            | 'arrowGlacier'
            | 'grayGlacier'
            | 'bellatrix'
            | 'merge'
            | 'capella'
            | 'shanghai'
            | undefined;
        }
      | undefined;
    gas?: import('web3-types').NumberTypes[ReturnFormat['number']] | undefined;
    gasPrice?:
      | import('web3-types').NumberTypes[ReturnFormat['number']]
      | undefined;
    type?: import('web3-types').NumberTypes[ReturnFormat['number']] | undefined;
    maxFeePerGas?:
      | import('web3-types').NumberTypes[ReturnFormat['number']]
      | undefined;
    maxPriorityFeePerGas?:
      | import('web3-types').NumberTypes[ReturnFormat['number']]
      | undefined;
    data?: import('web3-types').ByteTypes[ReturnFormat['bytes']] | undefined;
    input?: import('web3-types').ByteTypes[ReturnFormat['bytes']] | undefined;
    nonce?:
      | import('web3-types').NumberTypes[ReturnFormat['number']]
      | undefined;
    chain?: import('web3-types').ValidChains | undefined;
    hardfork?:
      | 'chainstart'
      | 'frontier'
      | 'homestead'
      | 'dao'
      | 'tangerineWhistle'
      | 'spuriousDragon'
      | 'byzantium'
      | 'constantinople'
      | 'petersburg'
      | 'istanbul'
      | 'muirGlacier'
      | 'berlin'
      | 'london'
      | 'altair'
      | 'arrowGlacier'
      | 'grayGlacier'
      | 'bellatrix'
      | 'merge'
      | 'capella'
      | 'shanghai'
      | undefined;
    chainId?:
      | import('web3-types').NumberTypes[ReturnFormat['number']]
      | undefined;
    networkId?:
      | import('web3-types').NumberTypes[ReturnFormat['number']]
      | undefined;
    gasLimit?:
      | import('web3-types').NumberTypes[ReturnFormat['number']]
      | undefined;
    yParity?: string | undefined;
    v?: import('web3-types').NumberTypes[ReturnFormat['number']] | undefined;
    r?: import('web3-types').ByteTypes[ReturnFormat['bytes']] | undefined;
    s?: import('web3-types').ByteTypes[ReturnFormat['bytes']] | undefined;
  }[];
  parentHash: import('web3-types').ByteTypes[ReturnFormat['bytes']];
  sha3Uncles: import('web3-types').ByteTypes[ReturnFormat['bytes']];
  miner: import('web3-types').ByteTypes[ReturnFormat['bytes']];
  stateRoot: import('web3-types').ByteTypes[ReturnFormat['bytes']];
  transactionsRoot: import('web3-types').ByteTypes[ReturnFormat['bytes']];
  receiptsRoot: import('web3-types').ByteTypes[ReturnFormat['bytes']];
  logsBloom?: import('web3-types').ByteTypes[ReturnFormat['bytes']] | undefined;
  difficulty?:
    | import('web3-types').NumberTypes[ReturnFormat['number']]
    | undefined;
  number: import('web3-types').NumberTypes[ReturnFormat['number']];
  gasLimit: import('web3-types').NumberTypes[ReturnFormat['number']];
  gasUsed: import('web3-types').NumberTypes[ReturnFormat['number']];
  timestamp: import('web3-types').NumberTypes[ReturnFormat['number']];
  extraData: import('web3-types').ByteTypes[ReturnFormat['bytes']];
  mixHash: import('web3-types').ByteTypes[ReturnFormat['bytes']];
  nonce: import('web3-types').NumberTypes[ReturnFormat['number']];
  totalDifficulty: import('web3-types').NumberTypes[ReturnFormat['number']];
  baseFeePerGas?:
    | import('web3-types').NumberTypes[ReturnFormat['number']]
    | undefined;
  size: import('web3-types').NumberTypes[ReturnFormat['number']];
  uncles: string[];
  hash?: import('web3-types').ByteTypes[ReturnFormat['bytes']] | undefined;
};
