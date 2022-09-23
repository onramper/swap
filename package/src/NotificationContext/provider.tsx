import React, { ReactNode, useCallback, useEffect, useReducer } from "react";
import {
  AddNotificationPayload,
  Notifications,
  NotificationType,
} from "./notifications.models";
import { notificationReducer } from "./reducer";
import { NotificationContext } from "./context";
import { nanoid } from "nanoid";
import { useTransactionCtxActions } from "../TransactionContext/hooks";
import { useInterval, usePrevious } from "../hooks";
import { useLayer2 } from "../web3/config";
import { supportedChains } from "../web3/lifi";

interface Props {
  children: ReactNode;
}

export interface MetamaskError extends Error {
  code: number;
}

const checkInterval = 1000; //ms
const expirationPeriod = 5000; //ms

function getExpiredNotifications(
  notifications: Notifications,
  expirationPeriod: number
) {
  const timeFromCreation = (creationTime: number) => Date.now() - creationTime;

  return notifications.filter(
    (notification) =>
      notification.shouldExpire &&
      timeFromCreation(notification.submittedAt) >= expirationPeriod
  );
}

export function NotificationProvider({ children }: Props) {
  const [notifications, dispatch] = useReducer(notificationReducer, []);
  const { chainId, account, active } = useLayer2();
  const { setIsSupportedNetwork } = useTransactionCtxActions();

  const previousChainId = usePrevious<number | undefined>(chainId);
  const previouslyConnected = usePrevious<boolean>(active);

  const addNotification = useCallback(
    ({ message, type, shouldExpire, id }: AddNotificationPayload) => {
      dispatch({
        type: "ADD_NOTIFICATION",
        notification: {
          submittedAt: Date.now(),
          message,
          type,
          id: id ?? nanoid(),
          shouldExpire,
        },
      });
    },
    [dispatch]
  );

  const removeNotification = useCallback(
    (id: string) => {
      dispatch({
        type: "REMOVE_NOTIFICATION",
        id,
      });
    },
    [dispatch]
  );

  const removeAllNotifications = useCallback(() => {
    dispatch({
      type: "REMOVE_ALL_NOTIFICATIONS",
    });
  }, [dispatch]);

  useInterval(() => {
    const expiredNotification = getExpiredNotifications(
      notifications,
      expirationPeriod
    );
    for (const notification of expiredNotification) {
      removeNotification(notification.id);
    }
  }, checkInterval);

  useEffect(() => {
    if (active && account && chainId) {
      const isSupported = !!supportedChains.find(
        (chain) => chain.id === chainId
      );
      setIsSupportedNetwork(isSupported);
      if (!isSupported) {
        dispatch({
          type: "ADD_NOTIFICATION",
          notification: {
            submittedAt: Date.now(),
            type: NotificationType.Warning,
            id: nanoid(),
            message: "This network is currently not supported",
            shouldExpire: true,
          },
        });
        return;
      }
      if (!previouslyConnected) {
        dispatch({
          type: "ADD_NOTIFICATION",
          notification: {
            submittedAt: Date.now(),
            type: NotificationType.Success,
            id: nanoid(),
            message: "Wallet Connected",
            shouldExpire: true,
          },
        });
        return;
      }
      if (previousChainId !== undefined && chainId !== previousChainId) {
        dispatch({
          type: "ADD_NOTIFICATION",
          notification: {
            submittedAt: Date.now(),
            type: NotificationType.Info,
            id: nanoid(),
            message: `Network Changed. You are on ${
              supportedChains.find((chain) => chain.id === chainId)?.name ??
              "an unknown network"
            }`,
            shouldExpire: true,
          },
        });
      }
    } else {
      if (previouslyConnected) {
        dispatch({
          type: "ADD_NOTIFICATION",
          notification: {
            submittedAt: Date.now(),
            type: NotificationType.Info,
            id: nanoid(),
            message: "Disconnected",
            shouldExpire: true,
          },
        });
      }
    }
  }, [
    account,
    active,
    chainId,
    previousChainId,
    previouslyConnected,
    setIsSupportedNetwork,
  ]);

  useEffect(() => {
    if (chainId && account) {
      const tokenChain = supportedChains.find((c) => c.id === chainId);
      if (!tokenChain) {
        dispatch({
          type: "ADD_NOTIFICATION",
          notification: {
            submittedAt: Date.now(),
            type: NotificationType.Warning,
            id: nanoid(),
            message: "This network is currently not supported",
            shouldExpire: true,
          },
        });
      }
    }
  }, [chainId, account]);

  return (
    <NotificationContext.Provider
      value={{
        addNotification,
        notifications,
        removeNotification,
        removeAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
