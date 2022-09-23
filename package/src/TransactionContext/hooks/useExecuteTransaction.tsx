import { useSendTransaction } from "@usedapp/core";
import { nanoid } from "nanoid";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGaSwapEvents } from "../../hooks/gtm/useGaSwapEvents";
import { useNav } from "../../NavContext";
import {
  NotificationType,
  useWidgetNotifications,
} from "../../NotificationContext";
import OrderCompleteView from "../../steps/OrderCompleteView/OrderCompleteView";
import TransactionErrorOverlay from "../../steps/SwapOverviewView/TransactionErrorOverlay/TransactionErrorOverlay";
import { useLayer2 } from "../../web3/config";
import { getLifiQuote, supportedChains } from "../../web3/lifi";
import { useTransactionContext } from "./useTransactionContext";

export const useExecuteTransaction = () => {
  const { account, chainId } = useLayer2();
  const {
    tokenIn,
    inAmount,
    tokenOut,
    transactionRequest,
    selectedWalletAddress,
    slippageTolerance,
  } = useTransactionContext();
  const { addNotification, removeNotification } = useWidgetNotifications();
  const [loading, setLoading] = useState<boolean>(false);
  const { sendTransaction, state, resetState } = useSendTransaction();
  const { nextScreen } = useNav();
  const beforeUnLoadRef = useRef<AbortController>(new AbortController());
  const { triggerSwapStartEvent, triggerConfirmSwapEvent } = useGaSwapEvents();

  const executeTransaction = useCallback(async () => {
    const destinationAddress = selectedWalletAddress ?? account;
    if (!account) {
      addNotification({
        type: NotificationType.Info,
        message: "Please connect wallet",
        shouldExpire: true,
      });
      return;
    }
    if (chainId !== tokenIn.chainId) {
      const tokenInChainName = supportedChains.find(
        (c) => c.id === tokenIn.chainId
      )?.name;
      if (!tokenInChainName) {
        addNotification({
          type: NotificationType.Error,
          message: "This network is currently not supported",
          shouldExpire: true,
        });
        return;
      }
      addNotification({
        type: NotificationType.Warning,
        message: `You are on the incorrect network. Please switch to ${tokenInChainName}`,
        shouldExpire: true,
      });
      return;
    }

    try {
      if (transactionRequest) {
        setLoading(true);
        const id = nanoid();
        addNotification({
          type: NotificationType.Info,
          message: "Please sign transaction",
          shouldExpire: false,
          id,
        });
        triggerSwapStartEvent();
        await sendTransaction({
          data: transactionRequest.data,
          from: selectedWalletAddress ?? account,
          to: transactionRequest.to,
          value: transactionRequest.value,
          // gasLimit: transactionRequest.gasLimit,
          gasPrice: transactionRequest.gasPrice,
        });
        removeNotification(id);
      } else {
        setLoading(true);
        addNotification({
          type: NotificationType.Info,
          message: "Getting ready to swap...",
          shouldExpire: true,
        });
        //update quote before tx
        const res = await getLifiQuote(
          tokenIn,
          tokenOut,
          inAmount,
          account,
          destinationAddress,
          beforeUnLoadRef.current.signal,
          slippageTolerance
        );

        if (res?.transactionRequest) {
          triggerSwapStartEvent();
          addNotification({
            type: NotificationType.Info,
            message: "Please sign transaction",
            shouldExpire: true,
          });
          const receipt = await sendTransaction({
            data: res.transactionRequest.data,
            from: selectedWalletAddress ?? account,
            to: res.transactionRequest.to,
            value: res.transactionRequest.value,
            gasLimit: res.transactionRequest.gasLimit,
            gasPrice: res.transactionRequest.gasPrice,
          });
          if (receipt && receipt.blockHash) {
            addNotification({
              type: NotificationType.Success,
              message: "Transaction Successful!",
              shouldExpire: true,
            });
          }
        } else {
          setLoading(false);
          addNotification({
            type: NotificationType.Error,
            message: "Could not find a route for your requested trade",
            shouldExpire: true,
          });
        }
      }
    } catch (error) {
      addNotification({
        type: NotificationType.Error,
        message: (error as Error)?.message ?? "something went wrong",
        shouldExpire: true,
      });
    } finally {
      setLoading(false);
    }
  }, [
    account,
    addNotification,
    chainId,
    inAmount,
    removeNotification,
    selectedWalletAddress,
    sendTransaction,
    slippageTolerance,
    tokenIn,
    tokenOut,
    transactionRequest,
    triggerSwapStartEvent,
  ]);

  const handleException = useCallback(
    (status, errorMessage) => {
      if (errorMessage) {
        if (errorMessage?.includes("INSUFFICIENT_OUTPUT_AMOUNT")) {
          nextScreen(
            <TransactionErrorOverlay
              {...{
                textAlert: "Slippage set too low",
                description:
                  " Insufficient output amount. To avoid a failed transaction try setting the slippage higher.",
              }}
            />
          );
        } else if (errorMessage?.includes("EXPIRED")) {
          nextScreen(
            <TransactionErrorOverlay
              {...{
                textAlert: "Deadline set too low",
                description:
                  "Transaction timed out. To avoid a failed transaction try increasing the deadline time.",
              }}
            />
          );
        } else if (errorMessage?.includes("insufficient funds")) {
          nextScreen(
            <TransactionErrorOverlay
              textAlert="Insufficient funds"
              description="You have insufficient funds to complete this transaction"
            />
          );
        } else if (
          errorMessage
            ?.toLocaleLowerCase()
            .includes("denied transaction signature")
        ) {
          nextScreen(
            <TransactionErrorOverlay
              textAlert="Rejected transaction"
              description="You rejected this transaction."
            />
          );
        } else if (errorMessage?.includes("Insufficient allowance")) {
          nextScreen(
            <TransactionErrorOverlay
              textAlert="Insufficient allowance"
              description="Cannot estimate gas; transaction may fail or may require manual gas limit."
            />
          );
        } else {
          nextScreen(
            <TransactionErrorOverlay
              textAlert=""
              description="Unable to process transaction."
            />
          );
        }
      }
      resetState();
    },
    [nextScreen, resetState]
  );

  const handleMining = useCallback(async () => {
    if (state.transaction && account) {
      // console.log(state.transaction);
      try {
        // storeTransactionData({
        //   address: account,
        //   fromAmount: inAmount,
        //   toAmount: 0,
        //   fromChain: 3,
        //   toChain: 3,
        //   txHash: state.transaction.hash,
        //   fromCurrency: tokenIn.symbol,
        //   toCurrency: tokenOut.symbol,
        //   status: "pending",
        //   bridge: "hop",
        //   country: "LK",
        //   partnerKey: "",
        //   txData: state.transaction,
        // });
      } catch (error) {
        console.log(error);
      }
    }
    nextScreen(
      <OrderCompleteView
        title="Success! Your Swap has been executed."
        description="You will receive an email when the swap is complete and the crypto has arrived in your wallet. "
        tokenOut={tokenOut}
      />
    );
  }, [account, nextScreen, state.transaction, tokenOut]);

  useEffect(() => {
    if (state.status === "Mining") {
      triggerConfirmSwapEvent();
      handleMining();
    }
    if (state.status === "Exception") {
      handleException(state.errorCode, state.errorMessage);
    }
  }, [
    handleException,
    state.errorMessage,
    state.errorCode,
    handleMining,
    state.status,
    triggerConfirmSwapEvent,
  ]);

  useEffect(() => {
    const onBeforeUnload = () => {
      beforeUnLoadRef.current.abort();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return { loading, state, executeTransaction };
};
