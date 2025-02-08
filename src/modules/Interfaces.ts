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

export { IXrayServer, ISecurityProtocol, IProtocolType, ITransportNetwork, IClient };
