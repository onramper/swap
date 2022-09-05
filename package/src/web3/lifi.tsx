import LIFI, {
  ChainId,
  ConfigUpdate,
  QuoteRequest,
  Token,
} from "@lifinance/sdk";
import { utils } from "ethers";

// if ?prod=true
const isProd = (): boolean => {
  return process.env.STAGE === "prod";
};

const lifiUrl = isProd()
  ? "https://li.quest/v1/"
  : "https://staging.li.quest/v1/";

const lifiConfig: ConfigUpdate = {
  apiUrl: lifiUrl,
};

export const supportedChains = [
  { name: "Mainnet", coin: "ETH", id: 1 },
  {
    name: "Ropsten",
    coin: "ETH",
    id: 3,
  },
  {
    name: "Rinkeby",
    coin: "ETH",
    id: 4,
  },
];

export const lifi = new LIFI(lifiConfig);

export const getLifiQuote = async (
  tokenIn: Token,
  tokenOut: Token,
  inputAmount: number, // not formatted
  userAccount: string,
  destinationAddress?: string,
  signal?: AbortSignal,
  slippage: number = 0.05
) => {
  const formattedAmount = utils
    .parseUnits(inputAmount.toString(), tokenIn?.decimals)
    .toString();
  const request: QuoteRequest = {
    fromChain: tokenIn.chainId,
    fromToken: tokenIn.address || tokenIn.symbol,
    fromAddress: userAccount,
    fromAmount: formattedAmount,
    toChain: tokenOut.chainId,
    toToken: tokenOut.address || tokenOut.symbol,
    toAddress: destinationAddress,
    slippage: slippage,
  };
  return lifi.getQuote(request, { signal });
};

export const getLifiTokens = async (
  chains: ChainId[],
  signal?: AbortSignal
) => {
  return lifi.getTokens({ chains }, { signal });
};

export * from "@lifinance/sdk/dist/types";
