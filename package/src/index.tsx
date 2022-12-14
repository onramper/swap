import React from "react";
import ReactDOM from "react-dom";
import styles from "./styles.module.css";
// import BuyCryptoView from "./BuyCryptoView";
import ErrorView from "./common/ErrorView";
import { NavProvider, NavContainer } from "./NavContext";
import { APIProvider } from "./ApiContext";
import type { APIProviderType } from "./ApiContext";
import "./polyfills/composedpath.polyfill";
import { ErrorBoundary } from "@sentry/react";
import { on, EVENTS } from "./Onramper";
import "./i18n/config";
import "./isolateinheritance.css";
import "./normalize.min.css";
import { TransactionContextProvider } from "./TransactionContext";
import { NotificationProvider } from "./NotificationContext";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PaymentProgressView } from "./steps/PaymentProgressView";
import { L2Provider } from "./web3/config";
import { GTM_ID } from "./ApiContext/api/constants";
import { GTMProvider } from "./hooks/gtm";
import DirectSwapView from "./steps/SwapOverviewView/DirectSwapView/DirectSwapView";

type OnramperSwapProps = Omit<APIProviderType, "themeColor"> & {
  color?: string;
  fontFamily?: string;
  className?: string;
  displayChatBubble?: boolean;
};

const OnramperSwap: React.FC<OnramperSwapProps> = (props) => {
  const [flagRestart, setFlagRestart] = React.useState(0);

  const {
    color = "#0316C1",
    fontFamily = props.fontFamily,
    className = "",
  } = props;

  const style = {
    "--primary-color": color,
    "--font-family": fontFamily,
  } as React.CSSProperties;

  const gtmParams = {
    gtmId: GTM_ID,
    dataLayer: { apiKey: props.API_KEY },
  };

  return (
    <BrowserRouter>
      <div
        key={flagRestart}
        id="main"
        style={style}
        className={`isolate-inheritance ${styles.theme} ${className} ${
          props.darkMode ? styles.dark : ""
        }`}
      >
        <ErrorBoundary
          fallback={({ resetError }) => (
            <ErrorView type="CRASH" callback={resetError} />
          )}
          onReset={() => {
            // reset the state of your app so the error doesn't happen again
            setFlagRestart((old) => ++old);
          }}
        >
          <GTMProvider state={gtmParams}>
            <NavProvider>
              <APIProvider //TODO: clean api context
                API_KEY={props.API_KEY}
                defaultAmount={props.defaultAmount}
                defaultAddrs={props.defaultAddrs}
                defaultCrypto={props.defaultCrypto}
                defaultFiat={props.defaultFiat}
                defaultFiatSoft={props.defaultFiatSoft}
                defaultPaymentMethod={props.defaultPaymentMethod}
                filters={props.filters}
                country={props.country}
                language={props.language}
                isAddressEditable={props.isAddressEditable}
                themeColor={color.slice(1)}
                displayChatBubble={props.displayChatBubble}
                amountInCrypto={props.amountInCrypto}
                partnerContext={props.partnerContext}
                redirectURL={props.redirectURL}
                minAmountEur={props.minAmountEur}
                supportSell={props.supportSell}
                supportBuy={props.supportBuy}
                isAmountEditable={props.isAmountEditable}
                recommendedCryptoCurrencies={props.recommendedCryptoCurrencies}
                selectGatewayBy={props.selectGatewayBy}
                referrer={document.referrer}
                queryParams={window.location.search}
              >
                <L2Provider>
                  <TransactionContextProvider>
                    <NotificationProvider>
                      <Routes>
                        <Route
                          path="/"
                          element={
                            <div style={{ flexGrow: 1, display: "flex" }}>
                              <NavContainer home={<DirectSwapView />} />
                            </div>
                          }
                        />
                        <Route
                          path="/:txId"
                          element={
                            <div style={{ flexGrow: 1, display: "flex" }}>
                              <NavContainer home={<PaymentProgressView />} />
                            </div>
                          }
                        />
                      </Routes>
                    </NotificationProvider>
                  </TransactionContextProvider>
                </L2Provider>
              </APIProvider>
            </NavProvider>
          </GTMProvider>
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  );
};

const initialize = (selector: string, props: OnramperSwapProps) => {
  const domContainer = document.querySelector(selector);
  ReactDOM.render(<OnramperSwap {...props} />, domContainer);
};

export interface EventContext {
  type: string;
  gateway: string;
  trackingUrl?: string;
}

const ev = { ...EVENTS };
const Onramper = {
  on,
  EVENTS: ev,
} as {
  on: (event_type: string, cb: (ctx: EventContext) => void) => void;
  EVENTS: typeof ev;
};

export default (props: OnramperSwapProps) => <OnramperSwap {...props} />;
export { initialize, Onramper };
