export interface IProtocolType {
  normalize?: () => void;
  //eslint-disable-next-line
  isTargetAddress?: (address: string) => boolean;
  getUserNames?: () => string[];
}

export interface ITransportNetwork {
  normalize?: () => void;
}
export interface ISecurityProtocol {
  normalize?: () => void;
}

export interface IClient {
  normalize?: () => void;
}

export interface IXrayServer<TClient> {
  users?: TClient[] | undefined;
}

export interface XrayRouterDeviceOnline {
  name: string;
  ip: string;
  mac: string;
}
