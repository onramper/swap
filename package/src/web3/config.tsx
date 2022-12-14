import {
  Config,
  useEthers,
  DAppProvider,
  Mainnet,
  Goerli,
  Avalanche,
  Polygon,
  BSC,
} from "@usedapp/core";
import React, { createContext, ReactNode, useContext } from "react";
// import { useConnectEnsName, useEnsAvatar } from "./hooks/ens";

const infuraProjectId = "bb5c9b186fcf4139865a530801c160f9";

export const config: Config = {
  autoConnect: false,
  readOnlyUrls: {
    [Mainnet.chainId]: `https://mainnet.infura.io/v3/${infuraProjectId}`,
    [Goerli.chainId]: `https://goerli.infura.io/v3/${infuraProjectId}`,
    [Avalanche.chainId]: `https://api.avax.network/ext/bc/C/rpc`,
    [Polygon.chainId]: `https://polygon-rpc.com/`,
    [BSC.chainId]: `https://bsc-dataseed1.ninicoin.io/`,
  },
  notifications: {
    expirationPeriod: 30000,
    checkInterval: 2000,
  },
};

interface EnsState {
  ensName: string | null;
  ensAvatar: string | null;
}

export interface ProviderProps {
  children?: ReactNode;
}

const EnsContext = createContext({} as EnsState);

// const EnsProvider = ({ children }: ProviderProps) => {
//   const { account } = useEthers();
//   const ensName = useConnectEnsName();
//   const ensAvatar = useEnsAvatar([ensName, account]);
//   const ensPayload = {
//     ensName: ensName,
//     ensAvatar: ensAvatar,
//   };

//   return (
//     <EnsContext.Provider value={ensPayload}>{children}</EnsContext.Provider>
//   );
// };

export const L2Provider = ({ children }: ProviderProps) => {
  return (
    <DAppProvider config={config}>
      {/* <EnsProvider>{children}</EnsProvider> */}
      {children}
    </DAppProvider>
  );
};

export const useLayer2 = () => {
  return useEthers();
};

export const useEns = () => {
  return useContext(EnsContext);
};
