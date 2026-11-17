export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message = `Request failed with HTTP status ${status}.`) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}
