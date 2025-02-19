interface IProtocolType {
  normalize?: () => void;
  //eslint-disable-next-line
  isTargetAddress?: (address: string) => boolean;
  getUserNames?: () => string[];
}

interface ITransportNetwork {
  normalize?: () => void;
}
interface ISecurityProtocol {
  normalize?: () => void;
}

interface IClient {
  normalize?: () => void;
}

interface IXrayServer<TClient> {
  users?: TClient[] | undefined;
}

interface XrayRouterDeviceOnline {
  name: string;
  ip: string;
  mac: string;
}

export { IXrayServer, XrayRouterDeviceOnline, ISecurityProtocol, IProtocolType, ITransportNetwork, IClient };
