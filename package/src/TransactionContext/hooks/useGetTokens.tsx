import { nanoid } from "nanoid";
import { useCallback, useState } from "react";
import { isErrorWithName } from "../../ApiContext/api";
import {
  NotificationType,
  useWidgetNotifications,
} from "../../NotificationContext";
import { ChainId, getLifiTokens } from "../../web3/lifi";
import { useTransactionCtxActions } from "./useTransactionCtxActions";

export const useGetTokens = () => {
  const [loading, setLoading] = useState(false);
  const { addNotification, removeNotification } = useWidgetNotifications();
  const { setTokens } = useTransactionCtxActions();

  const getTokens = useCallback(
    async (chains: ChainId[], signal?: AbortSignal) => {
      setLoading(true);
      try {
        const id = nanoid();
        addNotification({
          type: NotificationType.Info,
          message: "Fething tokens...",
          shouldExpire: true,
          id,
        });
        const res = await getLifiTokens(chains, signal);
        removeNotification(id);
        if (signal?.aborted) {
          setLoading(false);
          return;
        }
        if (res) {
          setTokens(res.tokens);
        }
      } catch (error) {
        addNotification({
          type: NotificationType.Error,
          message: "Unable to fetch tokens",
          shouldExpire: true,
        });
        if (isErrorWithName(error) && error.name === "AbortError") {
          return;
        }
      } finally {
        setLoading(false);
      }
    },
    [addNotification, removeNotification, setTokens]
  );

  return {
    loading,
    getTokens,
  };
};
