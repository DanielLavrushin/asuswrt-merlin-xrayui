interface IProtocolType {}
interface ITransportNetwork {}
interface IClient {}

interface IXrayServer<TClient> {
  users: TClient[];
}

export { IXrayServer, IProtocolType, ITransportNetwork, IClient };
