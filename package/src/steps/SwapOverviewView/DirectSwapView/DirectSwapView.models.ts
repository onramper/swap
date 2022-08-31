import { TokenInfo } from "layer2";

export interface DirectSwapViewInput extends TokenInfo {
  label: string;
  value: string;
  fiatSymbol: string;
  currencyShortName: string;
  currencyLongName: string;
  icon?: string;
}

export type DirectSwapViewProps = {
  progress?: number;
};
