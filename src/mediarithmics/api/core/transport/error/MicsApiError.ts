import { HTTPError, RequestError } from 'got';
import { Logger } from 'winston';

export interface MicsApiErrorBody {
  error: string;
  error_code: string;
  error_id: string;
  status: number;
}

export class MicsApiError extends Error {
  public error: string;
  public error_code: string;
  public error_id: string;
  public status: number;
  public statusCode: number;
  public statusMessage?: string;

  constructor(
    error: HTTPError | RequestError | string,
    private logger?: Logger,
  ) {
    super(typeof error === 'string' ? error : error.message);

    this.error = '';
    this.error_code = '';
    this.error_id = '';
    this.status = 0;
    this.statusCode = 0;

    if (error instanceof HTTPError) {
      this.statusCode = error.response.statusCode;
      this.statusMessage = error.response.statusMessage;
    }

    if (error instanceof RequestError && error.response?.body) {
      this.parseResponseBody(error.response.body as string);
    }
  }

  private parseResponseBody(body: string): void {
    try {
      const parsedBody = JSON.parse(body) as MicsApiErrorBody;
      this.error = parsedBody.error;
      this.error_code = parsedBody.error_code;
      this.error_id = parsedBody.error_id;
      this.status = parsedBody.status;
    } catch (parseError) {
      this.logger?.warn(`Unparsable JSON response error body: ${body}`, parseError);
      this.error = body.toString();
    }
  }
}
