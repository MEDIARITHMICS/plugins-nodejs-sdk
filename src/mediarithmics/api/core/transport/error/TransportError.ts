import { RequestError } from 'got';

export interface TransportError {
  errorCode: number;
  errorContent: string;
  message: string;
}

export class TransportErrorHandler {
  public transportError: TransportError;

  constructor(error: RequestError, fnName: string) {
    this.transportError = this.createTransportError(error, fnName);
  }

  private createTransportError(error: RequestError, fnName: string): TransportError {
    const errorCode = error.response?.statusCode || 500;
    const errorContent = this.buildErrorContent(error);
    const message = `${fnName} - An error occurred - code: ${errorCode} / ${errorContent}`;

    return {
      errorCode,
      errorContent,
      message,
    };
  }

  private buildErrorContent(error: RequestError): string {
    if (error.response?.body && typeof error.response?.body === 'object') {
      return JSON.stringify(error.response.body);
    } else if (error.response?.body && typeof error.response?.body === 'string') {
      return error.response.body;
    } else {
      return error.message;
    }
  }
}
