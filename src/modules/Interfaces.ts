interface IProtocolType {
  normalize?: () => void;
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
