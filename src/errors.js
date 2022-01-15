export class HTTPError extends Error {
  constructor({ message = "HTTP Error", status }) {
    super(message);
    this.status = status;
  }
}
