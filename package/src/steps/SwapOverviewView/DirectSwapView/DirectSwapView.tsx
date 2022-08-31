import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { NavContext, useNav } from "../../../NavContext";
import { DirectSwapViewProps } from "./DirectSwapView.models";
import commonClasses from "../../../styles.module.css";
import inputClasses from "../../../common/InputDropdown/InputDropdown.module.css";
import ProgressHeader from "../../../common/Header/ProgressHeader/ProgressHeader";
import Footer from "../../../common/Footer";
import { ButtonAction } from "../../../common/Buttons";
import Heading from "../../../common/Heading/Heading";
import InputDropdown from "../../../common/InputDropdown/InputDropdown";
import {
  formatTokenAmount,
  onChangeFloat,
  trimLargeNumber,
} from "../../../utils";
import Breakdown from "../../../common/Breakdown/Breakdown";
import TransactionSettings from "../TransactionSettings/TransactionSettings";
import classes from "./DirectSwapView.module.css";
import { useEtherBalance, useTokenBalance } from "@usedapp/core";
import { useDebouncedCallback } from "use-debounce";
import {
  useTransactionContext,
  useTransactionCtxActions,
} from "../../../TransactionContext/hooks";
import { utils } from "ethers";
import { useLayer2 } from "../../../web3/config";
import { isMetamaskEnabled } from "layer2";
import { useUpdateQuote } from "../../../TransactionContext/hooks/useUpdateQuote";
import {
  SingleNotification,
  WidgetNotification,
} from "../../WidgetNotification/WidgetNotification";
import {
  NotificationType,
  useWidgetNotifications,
} from "../../../NotificationContext";
import { nanoid } from "nanoid";
import { useGetTokens } from "../../../TransactionContext/hooks/useGetTokens";
import { ItemType } from "../../../ApiContext";
import OverlayPicker from "../../../common/OverlayPicker/OverlayPicker";
import { useConnectWallet, useWalletSupportRedirect } from "../../../hooks";
import { useExecuteTransaction } from "../../../TransactionContext/hooks/useExecuteTransaction";

const insufficientFundsError =
  "You have insufficient funds to complete this transaction";

const DirectSwapView: React.FC<DirectSwapViewProps> = (props) => {
  const [swapErrorMessage, setSwapErrorMessage] = useState<string>();
  const { account } = useLayer2();
  const { addNotification, removeNotification } = useWidgetNotifications();
  const { inAmount, tokenIn, tokenOut, quote, tokens } =
    useTransactionContext();
  const [localInAmount, setLocalInAmount] = useState<string>(
    inAmount.toString()
  );
  const [localTokenIn, setLocalTokenIn] = useState<any>(tokenIn);
  const [localTokenOut, setLocalTokenOut] = useState<any>(tokenOut);
  const [inTokens, setInTokens] = useState<any>([]);
  const { updateInAmount } = useTransactionCtxActions();
  const { account: metaAddress, active } = useLayer2();
  const isActive = metaAddress && active;
  useWalletSupportRedirect(60); //TODO: check this
  const { connect, connectionPending } = useConnectWallet();

  const ethBalance = useEtherBalance(account);
  const tokenOutBalance = useTokenBalance(tokenOut.address, account);

  const { backScreen, nextScreen } = useNav();
  const { updateQuote, loading: quoteLoading } = useUpdateQuote();
  const { getTokens, loading: tokensLoading } = useGetTokens();
  const { executeTransaction, loading: transactionLoading } =
    useExecuteTransaction();
  const beforeUnLoadRef = useRef<AbortController>(new AbortController());
  const heading = `Swap ${tokenIn.symbol} for ${tokenOut.symbol}`;
  const [notificationId, setNotificationId] = useState<string | undefined>();
  const debouncedUpdateQuote = useDebouncedCallback(updateQuote, 600);

  const insufficientFunds =
    ethBalance !== undefined &&
    Number(utils.formatEther(ethBalance)) < Number(localInAmount);

  const chainIn = 3;

  useEffect(() => {
    getTokens([chainIn]);
  }, [getTokens]);

  useEffect(() => {
    setLocalTokenIn(tokens[chainIn]?.[0]);
    setLocalTokenOut(tokens[chainIn]?.[2]);
    setInTokens(tokens[chainIn]);
  }, [tokens]);

  useEffect(() => {
    if (Number(localInAmount) > 0 && !insufficientFunds) {
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
    insufficientFunds,
    localInAmount,
    localTokenIn,
    localTokenOut,
  ]);

  const onMaxClick = useCallback(async () => {
    if (ethBalance) {
      setLocalInAmount(utils.formatEther(ethBalance));
    }
  }, [ethBalance]);

  const onBackClick = () => {
    onBeforeUnload();
    updateQuote(inAmount);
  };

  console.log(!tokensLoading && tokens);

  const handleContinue = () => {
    updateInAmount(Number(localInAmount));
    backScreen();
  };

  // useEffect(() => {
  //   setBreakdown(
  //     generateBreakdown(
  //       localQuote,
  //       cryptoReceived.symbol,
  //       Number(slippageTolerance),
  //       priceImpact
  //     )
  //   );
  // }, [cryptoReceived.symbol, localQuote, priceImpact, slippageTolerance]);

  const handleErrorMessage = useCallback(() => {
    if (!notificationId) {
      if (
        ethBalance &&
        Number(utils.formatEther(ethBalance)) < Number(localInAmount)
      ) {
        setSwapErrorMessage(insufficientFundsError);
        const id = nanoid();
        setNotificationId(id);
        addNotification({
          type: NotificationType.Warning,
          message: insufficientFundsError,
          shouldExpire: false,
          id: id,
        });
      }
    }
  }, [addNotification, ethBalance, localInAmount, notificationId]);

  const handleRemoveErrorMessage = useCallback(() => {
    if (notificationId) {
      setSwapErrorMessage(undefined);
      removeNotification(notificationId);
    }
  }, [notificationId, removeNotification]);

  useEffect(() => {
    if (insufficientFunds) {
      handleErrorMessage();
    } else {
      handleRemoveErrorMessage();
    }
  }, [handleErrorMessage, handleRemoveErrorMessage, insufficientFunds]);

  const formattedOutputAmount = quote?.toAmountMin
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
      setLocalTokenIn(item);
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
          // indexSelected={data.availableCurrencies.findIndex(
          //   (m) => m.id === collected.selectedCurrency?.id
          // )}
          items={inTokens as any}
          onItemClick={handleItemClick}
          searchable
        />
      );
    }
  }, [inTokens, handleItemClick, nextScreen]);

  const openOutTokens = useCallback(() => {
    if (inTokens.length > 1) {
      nextScreen(
        <OverlayPicker
          name="outTokens"
          title={"Select a token"}
          // indexSelected={data.availableCurrencies.findIndex(
          //   (m) => m.id === collected.selectedCurrency?.id
          // )}
          items={inTokens as any}
          onItemClick={handleItemClick}
          searchable
        />
      );
    }
  }, [inTokens, handleItemClick, nextScreen]);

  const handleDropdown = useCallback(
    (item?: any) => {
      openInTokens();
      console.log(item);
    },
    [openInTokens]
  );

  return (
    <div className={commonClasses.view}>
      <ProgressHeader
        onBackClick={onBackClick}
        percentage={props.progress}
        useBackButton
      />
      <main className={`${commonClasses.body} ${classes["wrapper"]}`}>
        <div className={classes["top-section"]}>
          <Heading className={classes.heading} text={heading} />
          <TransactionSettings className={classes["settings"]} />
        </div>
        <WidgetNotification />
        {/* <ErrorIndication message={swapErrorMessage} /> */}

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
            ethBalance ? utils.formatEther(ethBalance).slice(0, 5) : "0.00"
          }`}
          onMaxClick={onMaxClick}
          suffix={`($${quote?.fromAmountUSD ?? "0.00"})`}
          handleProps={{
            icon: localTokenIn?.logoURI,
            value: localTokenIn?.symbol,
            disabled: false,
            onClick: () => handleDropdown(localTokenIn),
          }}
          markedError={!!swapErrorMessage}
          useEditIcon={true}
        />

        <InputDropdown
          label={"You receive"}
          value={formattedOutputAmount}
          className={inputClasses["swap-screen"]}
          hint={`Balance: ${
            tokenOutBalance
              ? trimLargeNumber(formatTokenAmount(tokenOut, tokenOutBalance), 6)
              : "0.00"
          }`}
          suffix={`($${quote?.toAmountUSD ?? "0.00"})`}
          handleProps={{
            icon: localTokenOut?.logoURI,
            value: localTokenOut?.symbol,
            disabled: false,
            onClick: () => handleDropdown(localTokenOut),
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
                  disabled={!isActive || transactionLoading || quoteLoading}
                  className={classes.buttonInGroup}
                  text={"Confirm Swap"}
                  // onClick={executeTransaction}
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

// const ErrorIndication: React.FC<{ message?: string }> = (props) => {
//   const [message, setMessage] = useState(props.message || "");
//   const ref = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (props.message) {
//       setMessage(props.message);
//     }
//   }, [props.message]);

//   return (
//     <CSSTransition
//       nodeRef={ref}
//       in={!!props.message}
//       timeout={200}
//       classNames={{
//         enter: commonClasses["collapse-enter"],
//         enterActive: commonClasses["collapse-enter-active"],
//         exit: commonClasses["collapse-exit"],
//         exitActive: commonClasses["collapse-exit-active"],
//       }}
//       mountOnEnter
//       unmountOnExit
//     >
//       <div className={classes["error-section"]} ref={ref}>
//         <IndicationItem error text={message} />
//       </div>
//     </CSSTransition>
//   );
// };
// const IndicationItem: React.FC<{ error?: boolean; text: string }> = (props) => {
//   return (
//     <div
//       className={`${classes["info-wrapper"]} ${
//         props.error ? classes["indication-error"] : ""
//       }`}
//     >
//       <HexExclamationIcon className={classes["exclamation-icon"]} />
//       <div className={classes["info-txt"]}>{props.text}</div>
//     </div>
//   );
// };

export default DirectSwapView;
