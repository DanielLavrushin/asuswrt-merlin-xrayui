interface IProtocolType {
  normalize?: () => void;
}

interface ITransportNetwork {
  normalize?: () => void;
}

interface IClient {
  normalize?: () => void;
}

interface IXrayServer<TClient> {
  users?: TClient[] | undefined;
}

export { IXrayServer, IProtocolType, ITransportNetwork, IClient };
