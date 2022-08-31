import { Estimate, Token } from "../web3/lifi";
import { WalletItemData } from "../ApiContext/api/types/nextStep";
import { providers } from "ethers";

export interface StateType {
  tokenIn: Token;
  tokenOut: Token;
  inAmount: number;
  fiatSymbol: string;
  txId: string;
  key: number;
  userId: string;
  wallets: WalletItemData[];
  slippageTolerance: number;
  deadline: number;
  quote: Estimate | null;
  tokens: {
    [chainId: number]: Token[];
  };
  transactionRequest: providers.TransactionRequest | null;
  customerGateway: string;
  selectedWalletAddress?: string;
}
