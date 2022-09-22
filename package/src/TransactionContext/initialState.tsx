import { defaultChainId } from "../web3/constants";
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
    address: "0x0000000000000000000000000000000000000000",
    symbol: "ETH",
    decimals: 18,
    chainId: defaultChainId,
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
  },
  tokenOut: {
    name: "",
    address: "",
    symbol: "",
    decimals: 6,
    chainId: defaultChainId,
    logoURI: "",
  },
  tokens: {},
  wallets: [],
  customerGateway: "gateway_dex",
  fiatSymbol: "$",
  slippageTolerance: 0.5, //defaultSettings.slippageTolerance,
  deadline: 200, // defaultSettings.deadline,
  isSupportedNetwork: false,
};

export default initialState;
