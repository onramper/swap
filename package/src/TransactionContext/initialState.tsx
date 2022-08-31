import { UNISWAP_DEFAULTS as defaultSettings } from "layer2";
import { StateType } from "./models";

const initialState: StateType = {
  key: 0,
  userId: "",
  inAmount: 0,
  txId: "---transaction--id---",
  quote: null,
  transactionRequest: null,
  selectedWalletAddress: undefined,
  tokenIn: {
    name: "ETH",
    address: "",
    symbol: "ETH",
    decimals: 18,
    chainId: 3,
    logoURI: "",
  },
  tokenOut: {
    name: "USDT",
    address: "",
    symbol: "USDT",
    decimals: 18,
    chainId: 3,
    logoURI: "",
  },
  tokens: {},
  wallets: [],
  customerGateway: "gateway_dex",
  fiatSymbol: "$",
  slippageTolerance: 0, //defaultSettings.slippageTolerance,
  deadline: defaultSettings.deadline,
};

export default initialState;
// key: number; **
// wallets: WalletItemData[];
// selectedWalletAddress?: string;
// slippageTolerance: number; **
// deadline: number; **
// quote?: QuoteDetails;
