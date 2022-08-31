import LIFI, {
  ChainId,
  ConfigUpdate,
  QuoteRequest,
  Token,
} from "@lifinance/sdk";
import { utils } from "ethers";

// if ?prod=true
const isProd = (): boolean => {
  const url = new URL(window.location.href);
  const prodValue = url.searchParams.get("prod");
  if (prodValue) return true;
  return false;
};

const lifiUrl = isProd()
  ? "https://li.quest/v1/"
  : "https://staging.li.quest/v1/";

const lifiConfig: ConfigUpdate = {
  apiUrl: lifiUrl,
};

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
    .parseUnits(inputAmount.toString(), tokenIn.decimals)
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
