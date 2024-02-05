import { HTTPError, RequestError } from 'got';
import { Logger } from 'winston';

export interface ApiErrorBody {
  error: string;
  error_code: string;
  error_id: string;
  status: number;
}

export class ApiError extends Error {
  public readonly error: string;
  public readonly error_code: string;
  public readonly error_id: string;
  public readonly status: number;
  public readonly statusCode: number;
  public readonly statusMessage?: string;

  constructor(err?: HTTPError | string, logger?: Logger) {
    super(err instanceof HTTPError ? err.message : err);

    if (err instanceof HTTPError) {
      this.statusCode = err.response.statusCode;
      this.statusMessage = err.response.statusMessage;
    }

    if (err instanceof RequestError) {
      const responseBody = err.response?.body;
      if (responseBody) {
        try {
          const parsedBody = JSON.parse(responseBody as string) as ApiErrorBody;
          if (responseBody) {
            this.error = parsedBody.error;
            this.error_code = parsedBody.error_code;
            this.error_id = parsedBody.error_id;
            this.status = parsedBody.status;
          }
        } catch (error) {
          logger?.warn(`Unparsable JSON response error body: ${JSON.stringify(responseBody)}`, error);
          if (responseBody) {
            this.error = responseBody as string;
          }
        }
      }
    }
  }
}
