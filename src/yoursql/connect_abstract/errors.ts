export class QueryNotCompletedError extends Error {
  constructor() {
    super("The previous query was not completed and cannot be executed");
  }
}
export class ConnectionNotAvailableError extends Error {
  constructor(message: string) {
    super(message);
  }
}
