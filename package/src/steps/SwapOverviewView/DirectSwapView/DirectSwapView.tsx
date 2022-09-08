import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEtherBalance, useTokenBalance } from "@usedapp/core";
import { isMetamaskEnabled } from "layer2";
import { nanoid } from "nanoid";
import { useDebouncedCallback } from "use-debounce";
import { ItemType } from "../../../ApiContext";
import Breakdown from "../../../common/Breakdown/Breakdown";
import { ButtonAction } from "../../../common/Buttons";
import Footer from "../../../common/Footer";
import ProgressHeader from "../../../common/Header/ProgressHeader/ProgressHeader";
import Heading from "../../../common/Heading/Heading";
import InputDropdown from "../../../common/InputDropdown/InputDropdown";
import inputClasses from "../../../common/InputDropdown/InputDropdown.module.css";
import OverlayPicker from "../../../common/OverlayPicker/OverlayPicker";
import { useConnectWallet, useWalletSupportRedirect } from "../../../hooks";
import { useNav } from "../../../NavContext";
import {
  NotificationType,
  useWidgetNotifications,
} from "../../../NotificationContext";
import commonClasses from "../../../styles.module.css";
import {
  useTransactionContext,
  useTransactionCtxActions,
} from "../../../TransactionContext/hooks";
import { useExecuteTransaction } from "../../../TransactionContext/hooks/useExecuteTransaction";
import { useGetTokens } from "../../../TransactionContext/hooks/useGetTokens";
import { useUpdateQuote } from "../../../TransactionContext/hooks/useUpdateQuote";
import {
  formatTokenAmount,
  onChangeFloat,
  trimLargeNumber,
} from "../../../utils";
import { useLayer2 } from "../../../web3/config";
import {
  SingleNotification,
  WidgetNotification,
} from "../../WidgetNotification/WidgetNotification";
import TransactionSettings from "../TransactionSettings/TransactionSettings";
import { DirectSwapViewProps } from "./DirectSwapView.models";
import classes from "./DirectSwapView.module.css";
import { Token } from "../../../web3/lifi";
import { defaultChainId } from "../../../web3/constants";

const insufficientFundsError =
  "You have insufficient funds to complete this transaction";

const DirectSwapView: React.FC<DirectSwapViewProps> = (props) => {
  const [swapErrorMessage, setSwapErrorMessage] = useState<string>();
  const { addNotification, removeNotification } = useWidgetNotifications();
  const {
    inAmount,
    tokenIn,
    tokenOut,
    quote,
    tokens,
    slippageTolerance,
    isSupportedNetwork,
  } = useTransactionContext();
  const [localInAmount, setLocalInAmount] = useState<string>(
    inAmount.toString()
  );
  const [localTokenIn, setLocalTokenIn] = useState<any>();
  const [localTokenOut, setLocalTokenOut] = useState<any>();
  const [inTokens, setInTokens] = useState<Token[]>([]);
  const [outTokens, setOutTokens] = useState<Token[]>([]);
  const { updateInAmount, updateTokenIn, updateTokenOut } =
    useTransactionCtxActions();
  const { account, account: metaAddress, active, chainId } = useLayer2();
  const isActive = metaAddress && active;
  useWalletSupportRedirect();
  const { connect, connectionPending } = useConnectWallet();

  const ethBalance = useEtherBalance(account) ?? 0;
  let tokenInBalance = useTokenBalance(localTokenIn?.address, account) ?? 0;
  if (localTokenIn?.symbol === "ETH") tokenInBalance = ethBalance;
  let tokenOutBalance = useTokenBalance(localTokenOut?.address, account) ?? 0;
  if (localTokenOut?.symbol === "ETH") tokenOutBalance = ethBalance;

  const { backScreen, nextScreen } = useNav();
  const { updateQuote, loading: quoteLoading } = useUpdateQuote();
  const { getTokens } = useGetTokens();
  const { executeTransaction, loading: transactionLoading } =
    useExecuteTransaction();
  const beforeUnLoadRef = useRef<AbortController>(new AbortController());
  const heading =
    localTokenIn?.symbol && localTokenOut?.symbol
      ? `Swap ${localTokenIn?.symbol} for ${localTokenOut?.symbol}`
      : `Swap`;
  const [notificationId, setNotificationId] = useState<string | undefined>();
  const debouncedUpdateQuote = useDebouncedCallback(updateQuote, 600);
  const [isInsufficientFunds, setIsInsufficientFunds] = useState(false);

  useEffect(() => {
    account &&
      localTokenIn &&
      setIsInsufficientFunds(
        Number(formatTokenAmount(localTokenIn, tokenInBalance)) <
          Number(localInAmount)
      );
  }, [tokenInBalance, localInAmount, localTokenIn, account]);

  useEffect(() => {
    getTokens([chainId ?? defaultChainId]);
  }, [getTokens, chainId]);

  useEffect(() => {
    if (tokens) {
      setLocalTokenIn(tokens[chainId ?? defaultChainId]?.[0]);
      setInTokens(tokens[chainId ?? defaultChainId]);
      setOutTokens(tokens[chainId ?? defaultChainId]);
    }
  }, [tokens, chainId]);

  useEffect(() => {
    if (Number(localInAmount) > 0) {
      updateInAmount(Number(localInAmount));
      updateTokenIn(localTokenIn);
      updateTokenOut(localTokenOut);
      debouncedUpdateQuote(
        Number(localInAmount),
        localTokenIn,
        localTokenOut,
        beforeUnLoadRef.current.signal
      );
    }
  }, [
    debouncedUpdateQuote,
    getTokens,
    isInsufficientFunds,
    localInAmount,
    localTokenIn,
    localTokenOut,
    updateInAmount,
    updateTokenIn,
    updateTokenOut,
    slippageTolerance,
    isSupportedNetwork,
  ]);

  const onMaxClick = useCallback(async () => {
    if (tokenInBalance) {
      setLocalInAmount(formatTokenAmount(localTokenIn, tokenInBalance));
    }
  }, [localTokenIn, tokenInBalance]);

  const onBackClick = () => {
    onBeforeUnload();
    updateQuote(inAmount);
  };

  const handleErrorMessage = useCallback(() => {
    if (!notificationId) {
      setSwapErrorMessage(insufficientFundsError);
      const id = nanoid();
      setNotificationId(id);
      addNotification({
        type: NotificationType.Warning,
        message: insufficientFundsError,
        shouldExpire: true,
        id: id,
      });
    }
  }, [addNotification, notificationId]);

  const handleRemoveErrorMessage = useCallback(() => {
    if (notificationId) {
      setSwapErrorMessage(undefined);
      removeNotification(notificationId);
    }
  }, [notificationId, removeNotification]);

  useEffect(() => {
    if (isSupportedNetwork && isInsufficientFunds) {
      handleErrorMessage();
    } else {
      handleRemoveErrorMessage();
    }
  }, [
    handleErrorMessage,
    handleRemoveErrorMessage,
    isInsufficientFunds,
    isSupportedNetwork,
  ]);

  const formattedOutputAmount =
    tokenOut && quote?.toAmountMin
      ? formatTokenAmount(tokenOut, quote?.toAmountMin)
      : "0.000";

  const onBeforeUnload = () => {
    beforeUnLoadRef.current.abort();
  };

  useEffect(() => {
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      onBeforeUnload();
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  const handleItemClick = useCallback(
    (name: string, index: number, item: ItemType) => {
      console.log(item);
      if (name === "inTokens") setLocalTokenIn(item);
      else setLocalTokenOut(item);
      backScreen();
    },
    [backScreen]
  );

  const openInTokens = useCallback(() => {
    if (inTokens.length > 1) {
      nextScreen(
        <OverlayPicker
          name="inTokens"
          title={"Select a token"}
          indexSelected={inTokens.findIndex(
            (t: Token) => t.name === tokenIn?.name
          )}
          items={inTokens.map((t) => {
            return {
              ...t,
              id: t.name,
              name: t.name,
              icon: t.logoURI,
              info: t.symbol,
            };
          })}
          onItemClick={handleItemClick}
          searchable
        />
      );
    }
  }, [inTokens, nextScreen, handleItemClick, tokenIn?.name]);

  const openOutTokens = useCallback(() => {
    if (outTokens.length > 1) {
      nextScreen(
        <OverlayPicker
          name="outTokens"
          title={"Select a token"}
          indexSelected={outTokens.findIndex(
            (t: Token) => t.name === tokenOut?.name
          )}
          items={outTokens.map((t) => {
            return {
              ...t,
              id: t.name,
              name: t.name,
              icon: t.logoURI,
              info: t.symbol,
            };
          })}
          onItemClick={handleItemClick}
          searchable
        />
      );
    }
  }, [outTokens, nextScreen, handleItemClick, tokenOut?.name]);

  const handleDropdown = useCallback(
    (item?: any, type?: "in" | "out") => {
      if (type === "in") {
        openInTokens();
      } else {
        openOutTokens();
      }
    },
    [openInTokens, openOutTokens]
  );

  const isDisabled = () => {
    return (
      !isActive ||
      !inAmount ||
      transactionLoading ||
      quoteLoading ||
      isInsufficientFunds ||
      !isSupportedNetwork
    );
  };
  return (
    <div className={commonClasses.view}>
      <ProgressHeader onBackClick={onBackClick} percentage={props.progress} />
      <main className={`${commonClasses.body} ${classes["wrapper"]}`}>
        <div className={classes["top-section"]}>
          <Heading className={classes.heading} text={heading} />
          <TransactionSettings className={classes["settings"]} />
        </div>
        <WidgetNotification />

        <InputDropdown
          label={"You spend"}
          value={localInAmount}
          onChange={(e) =>
            onChangeFloat(e, (value) => {
              setLocalInAmount(value);
            })
          }
          className={inputClasses["swap-screen"]}
          hint={`Balance: ${
            tokenInBalance
              ? trimLargeNumber(
                  formatTokenAmount(localTokenIn, tokenInBalance),
                  4
                )
              : "0.00"
          }`}
          onMaxClick={onMaxClick}
          suffix={`($${quote?.fromAmountUSD ?? "0.00"})`}
          handleProps={{
            icon: localTokenIn?.logoURI,
            value: localTokenIn ? localTokenIn.symbol : "Select a token",
            disabled: false,
            onClick: () => handleDropdown(localTokenIn, "in"),
          }}
          markedError={!!swapErrorMessage}
          readonly={!localTokenOut}
        />

        <InputDropdown
          label={"You receive"}
          value={formattedOutputAmount}
          className={inputClasses["swap-screen"]}
          hint={`Balance: ${
            tokenOutBalance
              ? trimLargeNumber(
                  formatTokenAmount(localTokenOut, tokenOutBalance),
                  4
                )
              : "0.00"
          }`}
          suffix={`($${quote?.toAmountUSD ?? "0.00"})`}
          handleProps={{
            icon: localTokenOut?.logoURI,
            value: localTokenOut ? localTokenOut.symbol : "Select a token",
            disabled: false,
            onClick: () => handleDropdown(localTokenOut, "out"),
          }}
          readonly
        />

        <div className={classes["bottom-fields"]}>
          <Breakdown />
          <SingleNotification
            className={classes.notification}
            notification={{
              type: NotificationType.Info,
              message:
                "Above mentioned figures are valid for 1 minute based upon current market rates.",
            }}
          />
        </div>

        <div
          className={`${commonClasses["body-form-child"]} ${commonClasses["grow-col"]}`}
        >
          <div className={classes.buttonContainer}>
            {isActive ? (
              <>
                <ButtonAction
                  disabled={isDisabled()}
                  className={classes.buttonInGroup}
                  text={
                    isInsufficientFunds
                      ? `Insufficient ${tokenIn?.symbol} balance`
                      : "Swap Now"
                  }
                  onClick={executeTransaction}
                  pending={transactionLoading || quoteLoading}
                />
              </>
            ) : (
              <ButtonAction
                text="Connect Wallet"
                pending={connectionPending}
                onClick={connect}
                disabled={!isMetamaskEnabled() || connectionPending}
              />
            )}
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default DirectSwapView;
