import { useCallback, useContext } from "react";
import { useGTMDispatch } from ".";
import { APIContext } from "../../ApiContext";
import { useTransactionContext } from "../../TransactionContext/hooks";

interface GtmEvent {
  event: string;
  screen: string;
  trigger: string;
  label: string;
  action: string;
  value?: any;
}

export const useGaSwapEvents = () => {
  const sendDataToGTM = useGTMDispatch();
  const { tokenIn, tokenOut } = useTransactionContext();
  const {
    data: { country },
  } = useContext(APIContext);

  const setTxnContext = useCallback(() => {
    return {
      crypto: {
        inToken: tokenIn?.symbol,
        outToken: tokenOut?.symbol,
        dex: "lifi",
      },
      location: {
        country,
      },
    };
  }, [country, tokenIn?.symbol, tokenOut?.symbol]);

  const triggerWalletConnectEvent = useCallback(() => {
    const event: GtmEvent = {
      event: "swap",
      screen: "connect wallet screen",
      trigger: "the wallet is connected successfully",
      label: "walletConnected",
      action: "step 3",
    };
    sendDataToGTM(event);
  }, [sendDataToGTM]);

  const triggerSwapStartEvent = useCallback(() => {
    const event: GtmEvent = {
      event: "swap",
      screen: "confirm swap screen",
      trigger: "the swap successfully started and metamask is open",
      label: "swapStart",
      action: "step 4",
      value: setTxnContext(),
    };
    sendDataToGTM(event);
  }, [sendDataToGTM, setTxnContext]);

  const triggerConfirmSwapEvent = useCallback(() => {
    const event: GtmEvent = {
      event: "swap",
      screen: "confirm swap screen",
      trigger: "the swap successfully completed",
      label: "swapComplete",
      action: "step 5",
    };
    sendDataToGTM(event);
  }, [sendDataToGTM]);

  return {
    triggerWalletConnectEvent,
    triggerSwapStartEvent,
    triggerConfirmSwapEvent,
  };
};
