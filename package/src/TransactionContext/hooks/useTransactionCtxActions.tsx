import { Estimate, Token } from "../../web3/lifi";
import { useCallback, useContext } from "react";
import { TransactionContext } from "..";
import { ActionTypes } from "../reducers";
import { providers } from "ethers";

export const useTransactionCtxActions = () => {
  const { dispatch } = useContext(TransactionContext);

  const setTransactionRequest = useCallback(
    (transaction: providers.TransactionRequest) => {
      dispatch({
        type: ActionTypes.SetTransactionRequest,
        payload: transaction,
      });
    },
    [dispatch]
  );

  const setTokens = useCallback(
    (tokens: { [chainId: number]: Token[] }) => {
      dispatch({
        type: ActionTypes.SetTokens,
        payload: tokens,
      });
    },
    [dispatch]
  );

  const setQuote = useCallback(
    (quote: Estimate | null) => {
      dispatch({
        type: ActionTypes.SetQuote,
        payload: quote,
      });
    },
    [dispatch]
  );

  const updateSlippage = useCallback(
    (slippageTolerance: number) => {
      dispatch({
        type: ActionTypes.UpdateSlippageTolerance,
        payload: slippageTolerance,
      });
    },
    [dispatch]
  );

  const updateDeadline = useCallback(
    (deadline: number) => {
      dispatch({
        type: ActionTypes.UpdateDeadline,
        payload: deadline,
      });
    },
    [dispatch]
  );

  const updateTokenIn = useCallback(
    (token: Token) => {
      dispatch({
        type: ActionTypes.UpdateTokenIn,
        payload: token,
      });
    },
    [dispatch]
  );

  const updateTokenOut = useCallback(
    (token: Token) => {
      dispatch({
        type: ActionTypes.UpdateTokenOut,
        payload: token,
      });
    },
    [dispatch]
  );

  const updateFiatSymbol = useCallback(
    (faitSymbol: string) => {
      dispatch({
        type: ActionTypes.UpdateFiatSymbol,
        payload: faitSymbol,
      });
    },
    [dispatch]
  );

  const updateInAmount = useCallback(
    (inAmount: number) => {
      dispatch({
        type: ActionTypes.UpdateInAmount,
        payload: inAmount,
      });
    },
    [dispatch]
  );

  const setIsSupportedNetwork = useCallback(
    (isSupported: boolean) => {
      dispatch({
        type: ActionTypes.SetIsSupportedNetwork,
        payload: isSupported,
      });
    },
    [dispatch]
  );

  const initialiseTransactionContext = useCallback(
    (payload: {
      customerGateway: string;
      txId: string;
      userId: string;
      tokenIn: Token;
      tokenOut: Token;
      fiatSymbol: string;
      inAmount: number;
    }) => {
      dispatch({
        type: ActionTypes.Init,
        payload: payload,
      });
    },
    [dispatch]
  );

  return {
    initialiseTransactionContext,
    setQuote,
    updateSlippage,
    updateDeadline,
    updateTokenIn,
    updateTokenOut,
    updateFiatSymbol,
    updateInAmount,
    setTransactionRequest,
    setTokens,
    setIsSupportedNetwork,
  };
};
