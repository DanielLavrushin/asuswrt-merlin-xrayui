interface IProtocolType {
  normalize: () => void;
}

interface ITransportNetwork {}

interface IClient {}

interface IXrayServer<TClient> {
  users?: TClient[] | undefined;
}

export { IXrayServer, IProtocolType, ITransportNetwork, IClient };
