import "abort-controller/polyfill";
import { GatewaysResponse } from "./types/gateways";
import { FieldError } from "./types/nextStep";
import { NextStep } from "..";
import { BrowserClient, Hub } from "@sentry/browser";
import i18next from "i18next";
import i18n from "../../i18n/config";
import { BASE_API } from "./constants";
import { RawData, Transaction, TransactionData } from "./types/transaction";
import { isTransactionHash } from "../../utils";

// Note: custom headers most be allowed by the preflight checks, make sure to add them to `access-control-allow-headers` corsPreflight on the server
const headers = new Headers();

// The language that will be appended to every request as a query parameter. This will indicate the language we want the
// content of the backend to be in.
let currentAcceptLanguage = i18next.language;

const getAcceptLanguageParameter = () => {
  return currentAcceptLanguage;
};

// Language parameter is set here for i18n. The backend will use this to set the language of the responses.
const updateAcceptLanguageParameter = () => {
  const currentI18nLanguage = i18n.language;
  if (currentAcceptLanguage !== currentI18nLanguage)
    currentAcceptLanguage = currentI18nLanguage;
};
updateAcceptLanguageParameter();

// See https://github.com/getsentry/sentry-javascript/issues/1656#issuecomment-430295616
const sentryClient = new BrowserClient({
  dsn: "https://283a138678d94cc295852f634d4cdd1c@o506512.ingest.sentry.io/5638949",
  environment: process.env.STAGE,
});
const sentryHub = new Hub(sentryClient);

const authenticate = (pk: string) => {
  headers.set("Authorization", `Basic ${pk}`);
  const referrer =
    document.referrer ||
    window.parent.location.origin ||
    window.location.origin;
  if (referrer) {
    headers.set("X-Widget-Referer", referrer);
  }
  sentryHub.addBreadcrumb({
    message: `Authenticated with API key '${pk}'`,
    category: "auth",
  });
};

export function logRequest(url: string) {
  sentryHub.addBreadcrumb({ message: `Sent a request to '${url}'` });
}

/**
 * API calls
 */
interface GatewaysParams {
  country?: string;
  includeIcons?: boolean;
  includeDefaultAmounts?: boolean;
  [key: string]: any;
}

const gateways = async (params: GatewaysParams): Promise<GatewaysResponse> => {
  const urlParams = createUrlParamsFromObject(params);
  const gatewaysUrl = `${BASE_API}/v2/gateways?${urlParams}`;
  logRequest(gatewaysUrl);
  const gatewaysRes = await fetch(gatewaysUrl, {
    headers,
    credentials:
      process.env.STAGE === "local" || process.env.STAGE === "l2"
        ? "omit"
        : "include",
  });
  const gateways: GatewaysResponse = await processResponse(gatewaysRes);
  return gateways;
};

/**
 * Exectue step
 */
interface ExecuteStepParams {
  country?: string;
  amountInCrypto?: boolean;
  [key: string]: any;
}

interface FetchResponse {
  //should be replaced by a complete fetch type
  ok: boolean;
  json: () => Promise<any>;
  text: () => Promise<string>;
}

const tob64 = async (file: File): Promise<string | ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
};

const executeStep = async (
  step: NextStep,
  data: { [key: string]: any } | File,
  params?: ExecuteStepParams
): Promise<NextStep> => {
  if (!("url" in step)) throw new Error("Invalid step.");
  if (step.url === undefined)
    throw new Error("Unexpected error: Invalid step end.");

  const isMoonpay = false; //isMoonpayStep(step.url);
  const isFile = step.type === "file";
  const isMoonpayFile = isFile && isMoonpay;
  const method = isMoonpayFile ? "PUT" : "POST";
  let body;
  if (isMoonpayFile) body = data as File;
  else if (isFile) body = (await tob64(data as File)) as unknown as string;
  else body = JSON.stringify({ ...data });

  const urlParams = createUrlParamsFromObject(params ?? {});

  logRequest(step.url);
  // const nextStepType = step.url.split("/")[5];
  // let nextStep: FetchResponse;
  // if (isMoonpay && nextStepType !== "redirect") {
  // nextStep = await processMoonpayStep(step.url, { method, headers, body });
  // } else {
  const nextStep = await fetch(`${step.url}?${urlParams}`, {
    method,
    headers,
    body,
  });
  // }
  return processResponse(nextStep);
};

// const isMoonpayStep = (stepUrl: string) => {
//   if (process.env.STAGE === "demo")
//     //only for demo purposes
//     return false;
//   return moonpayUrlRegex.test(stepUrl);
// };

/**
 * Utils
 */
export const processResponse = async (
  response: FetchResponse
): Promise<any> => {
  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    let errorResponse;
    try {
      errorResponse = await response.json();
    } catch (error) {
      try {
        errorResponse = { message: await response.text() };
      } catch (error) {
        errorResponse = { message: "Error parsing the response" };
      }
    }
    sentryHub.addBreadcrumb({
      message: "Error received from request",
      data: errorResponse,
    });
    sentryHub.captureException(new ApiError(errorResponse.message));
    throw new NextStepError(errorResponse);
  }
};

type ErrorWithMessage = {
  message: string;
};

type ErrorWithName = {
  name: string;
};

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

function isErrorWithName(error: unknown): error is ErrorWithName {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof (error as Record<string, unknown>).name === "string"
  );
}

function isNextStepError(error: unknown): error is NextStepError {
  return (
    error !== null &&
    (error as Record<string, unknown>).message === "NextStepError"
  );
}

class ApiError extends Error {
  data?: any;
  constructor(message: string, name?: string) {
    super(message);
    if (!name) {
      name = message;
    }
    this.name = name;
  }
}

class NextStepError extends Error {
  fields?: FieldError[] = undefined;
  field?: string = undefined;
  fatal?: boolean = undefined;
  constructor(error: any) {
    super("NextStep error");
    this.name = "NextStepError";
    this.fatal = error.fatal;
    if (Array.isArray(error)) this.fields = error;
    else if (error.field) {
      this.field = error.field;
      this.message = error.message;
    } else this.message = error.message ?? error;
  }
}

const createUrlParamsFromObject = (paramsObj: { [key: string]: any }): string =>
  Object.keys(paramsObj).reduce((acc, current, i, arr) => {
    if (paramsObj[current] !== undefined) {
      acc += `${current}=${paramsObj[current]}`;
      if (i < arr.length - 1) acc += "&";
      return acc;
    }
    return acc;
  }, "");

export interface Filters {
  onlyCryptos?: string[];
  excludeCryptos?: string[];
  onlyPaymentMethods?: string[];
  excludePaymentMethods?: string[];
  excludeFiat?: string[];
  onlyGateways?: string[];
  onlyFiat?: string[];
}

const pollTransaction = async (
  txId: string
): Promise<Transaction | undefined> => {
  const res = await fetch(`${BASE_API}/v2/getTransaction/${txId}`, {
    method: "GET",
    headers,
  });
  if (res.status !== 200) {
    throw new Error("Transaction not found");
  }
  if (res.status === 200) {
    const json = await res.json();
    return json as Transaction;
  }
};

// type casting here, we know these values are not null, but the type from the conte3xt will always be nullable
function formatData(data: RawData): TransactionData {
  const { nonce, hash } = data.txData;
  return {
    transactionId: data?.transactionId!,
    txHash: hash,
    userAddress: data.address as string,
    nonce: nonce,
  };
}

async function getCountry() {
  const res = await fetch(`https://ipapi.co/json/`, {
    method: "GET",
  });

  const geoData = await res.json();
  return geoData.country;
}

function storeTransactionData(data: RawData) {
  if (data.address && data.txData) {
    if (!isTransactionHash(data.txHash)) {
      throw new Error("Invalid transaction hash");
    }
    console.log(JSON.stringify(data));
    return fetch(`https://ppe.onramper.tech/swap-dev`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  }
}

export {
  authenticate,
  gateways,
  executeStep,
  getAcceptLanguageParameter,
  updateAcceptLanguageParameter,
  NextStepError,
  sentryHub,
  ApiError,
  pollTransaction,
  isErrorWithMessage,
  isErrorWithName,
  isNextStepError,
  formatData,
  storeTransactionData,
  getCountry,
};
