import type { FhevmInstance, FhevmInstanceConfig } from "../fhevmTypes";

export type FhevmInitSDKOptions = {
  tfheParams?: any;
  kmsParams?: any;
  thread?: number;
};

export type FhevmCreateInstanceType = () => Promise<FhevmInstance>;
export type FhevmInitSDKType = (
  options?: FhevmInitSDKOptions
) => Promise<boolean>;
export type FhevmLoadSDKType = () => Promise<void>;
export type IsFhevmSupportedType = (chainId: number) => boolean;

export type FhevmRelayerSDKType = {
  initSDK: FhevmInitSDKType;
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>;
  // v0.9 uses ZamaEthereumConfig, but keep SepoliaConfig for backward compatibility
  ZamaEthereumConfig?: FhevmInstanceConfig;
  SepoliaConfig?: FhevmInstanceConfig;
  __initialized__?: boolean;
};

export type FhevmWindowType = {
  relayerSDK: FhevmRelayerSDKType;
};

