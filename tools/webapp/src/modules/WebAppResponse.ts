class WebAppResponse {
  public status: string | undefined = "";
  public message: string | undefined = "";
}

class WebAppResponseData<T> extends WebAppResponse {
  public data?: T;

  constructor(status: string | undefined = undefined, message: string | undefined = undefined, data: T | undefined = undefined) {
    super();

    this.status = status;
    this.message = message;
    this.data = data;
  }
}
export default WebAppResponse;
export { WebAppResponseData };
