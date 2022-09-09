import { useCallback } from "react";
import { useGTMDispatch } from ".";

interface GtmEvent {
  event: string;
  screen: string;
  trigger: string;
  label: string;
  action: string;
}

export const useGaSwapEvents = () => {
  const sendDataToGTM = useGTMDispatch();

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
    };
    sendDataToGTM(event);
  }, [sendDataToGTM]);

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
