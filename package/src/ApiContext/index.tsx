import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";

import { initialState, ItemCategory, StateType } from "./initialState";
import { CollectedActionsType, DataActionsType, mainReducer } from "./reducers";

import { arrayUnique } from "../utils";

import * as API from "./api";
import type {
  FileStep,
  InfoDepositBankAccount,
  NextStep,
  PickOneOption,
  StepDataItems,
} from "./api/types/nextStep";
import type {
  CollectedStateType,
  CryptoAddrType,
  GatewayRateOption,
  GatewayRateOptionSimple,
  ItemType,
} from "./initialState";

import type { Filters } from "./api";
import { NextStepError } from "./api";

export const DEFAULT_COUNTRY = "US";
export const DEFAULT_US_STATE = "AL";
export const DEFAULT_CA_STATE = "AB";

//Creating context
const APIContext = createContext<StateType>(initialState);

export const useAPI = () => useContext(APIContext);

interface APIProviderType {
  API_KEY?: string;
  defaultAmount?: number;
  defaultAddrs?: { [denom: string]: CryptoAddrType };
  defaultCrypto?: string;
  defaultFiat?: string;
  defaultFiatSoft?: string;
  defaultPaymentMethod?: string[];
  filters?: Filters;
  country?: string;
  language?: string;
  isAddressEditable?: boolean;
  themeColor: string;
  displayChatBubble?: boolean;
  amountInCrypto?: boolean;
  partnerContext?: { [key: string]: any };
  redirectURL?: string;
  minAmountEur?: number;
  supportSell: boolean;
  supportBuy: boolean;
  isAmountEditable?: boolean;
  recommendedCryptoCurrencies?: string[];
  darkMode?: boolean;
  selectGatewayBy?: string | "price" | "performance";
}

const APIProvider: React.FC<APIProviderType> = (props) => {
  const {
    defaultAmount = 100,
    defaultAddrs = {},
    API_KEY,
    isAddressEditable = true,
  } = props;

  const generateInitialCollectedState = useCallback((): CollectedStateType => {
    return {
      ...initialState.collected,
      amount: defaultAmount < 0 ? initialState.collected.amount : defaultAmount,
      defaultAddrs: Object.entries(defaultAddrs).reduce(
        (acc, [key, value]) => ({ ...acc, [key.toUpperCase()]: value }),
        {}
      ),
      isAddressEditable,
      themeColor: props.themeColor,
      amountInCrypto:
        props.amountInCrypto ?? initialState.collected.amountInCrypto,
      partnerContext: props.partnerContext,
      redirectURL: props.redirectURL,
      minAmountEur: props.minAmountEur,
      supportSell: props.supportSell,
      supportBuy: props.supportBuy,
      isAmountEditable:
        props.isAmountEditable ?? initialState.collected.isAmountEditable,
      recommendedCryptoCurrencies: props.recommendedCryptoCurrencies
        ? arrayUnique(props.recommendedCryptoCurrencies)
        : undefined,
      selectGatewayBy: props.selectGatewayBy,
    };
  }, [
    defaultAddrs,
    isAddressEditable,
    defaultAmount,
    props.themeColor,
    props.amountInCrypto,
    props.partnerContext,
    props.redirectURL,
    props.minAmountEur,
    props.supportSell,
    props.supportBuy,
    props.isAmountEditable,
    props.recommendedCryptoCurrencies,
    props.selectGatewayBy,
  ]);

  const iniState: StateType = {
    ...initialState,
    collected: generateInitialCollectedState(),
  };
  const [state, dispatch] = useReducer(mainReducer, iniState);

  // INITIALIZING AUTHENTICATION
  useEffect(() => {
    if (!API_KEY) throw new Error("API KEY NOT PROVIDED");
    API.authenticate(API_KEY);
  }, [API_KEY]);

  const addData = useCallback(
    (data: any) =>
      dispatch({ type: DataActionsType.AddData, payload: { value: data } }),
    []
  );

  const clearErrors = useCallback(() => {
    dispatch({
      type: CollectedActionsType.AddError,
      payload: { value: undefined },
    });
  }, []);

  const restartWidget = useCallback(() => {
    dispatch({
      type: CollectedActionsType.ResetCollected,
      payload: { value: generateInitialCollectedState() },
    });
  }, [generateInitialCollectedState]);

  const executeStep = useCallback(
    async (step: NextStep, data: { [key: string]: any }): Promise<NextStep> => {
      if (step.type !== "file" && props.partnerContext !== data.partnerContext)
        throw new Error("Partner context not set properly");
      return await API.executeStep(step, data, {
        country: state.collected.selectedCountry,
      });
    },
    [state.collected.selectedCountry, props.partnerContext]
  );

  const getCountry = useCallback(async () => {
    const country = await API.getCountry();
    console.log(country);
    addData({ country });
  }, [addData]);

  useEffect(() => {
    getCountry();
  }, [getCountry]);

  return (
    <APIContext.Provider
      value={{
        ...state,
        data: {
          ...state.data,
          restartWidget,
        },
        apiInterface: { executeStep, clearErrors },
      }}
    >
      {props.children}
    </APIContext.Provider>
  );
};

export { APIProvider, APIContext };
export { ItemCategory, NextStepError };
export type {
  ItemType,
  GatewayRateOption,
  NextStep,
  StepDataItems,
  FileStep,
  InfoDepositBankAccount,
  Filters,
  APIProviderType,
  CollectedStateType,
  GatewayRateOptionSimple,
  PickOneOption,
};
